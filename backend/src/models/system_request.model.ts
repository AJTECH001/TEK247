import { query } from "../config/database";
import {
  SystemRequestRow,
  SystemRequestRecommendationRow,
  SystemRequestStatus,
  SafeSystemRequest,
  SafeRecommendation,
  LaptopSpec,
} from "../types";

function toSafe(
  row: SystemRequestRow & { user_full_name?: string; user_email?: string }
): SafeSystemRequest {
  const base: SafeSystemRequest = {
    id: row.id,
    userId: row.user_id,
    description: row.description,
    budgetMin: row.budget_min !== null ? parseFloat(row.budget_min) : null,
    budgetMax: row.budget_max !== null ? parseFloat(row.budget_max) : null,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.user_full_name) {
    base.user = {
      id: row.user_id,
      fullName: row.user_full_name,
      email: row.user_email ?? "",
    };
  }
  return base;
}

export const SystemRequestModel = {
  async create(
    userId: number,
    description: string,
    budgetMin: number | null,
    budgetMax: number | null
  ): Promise<SafeSystemRequest> {
    const rows = await query<SystemRequestRow>(
      `INSERT INTO system_requests (user_id, description, budget_min, budget_max)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, description, budgetMin, budgetMax]
    );
    return toSafe(rows[0]);
  },

  async findById(id: number): Promise<SystemRequestRow | null> {
    const rows = await query<SystemRequestRow>(
      "SELECT * FROM system_requests WHERE id = $1 LIMIT 1",
      [id]
    );
    return rows[0] ?? null;
  },

  // User sees own requests; admin sees all (with user info joined)
  async findAll(
    page: number,
    limit: number,
    userId?: number
  ): Promise<{ requests: SafeSystemRequest[]; total: number }> {
    const offset = (page - 1) * limit;

    if (userId) {
      const [rows, count] = await Promise.all([
        query<SystemRequestRow>(
          "SELECT * FROM system_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
          [userId, limit, offset]
        ),
        query<{ count: string }>(
          "SELECT COUNT(*)::text FROM system_requests WHERE user_id = $1",
          [userId]
        ),
      ]);
      return { requests: rows.map(toSafe), total: parseInt(count[0].count, 10) };
    }

    // Admin: join with users
    type AdminRow = SystemRequestRow & { user_full_name: string; user_email: string };
    const [rows, count] = await Promise.all([
      query<AdminRow>(
        `SELECT sr.*, u.full_name AS user_full_name, u.email AS user_email
         FROM system_requests sr
         JOIN users u ON u.id = sr.user_id
         ORDER BY sr.created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      query<{ count: string }>("SELECT COUNT(*)::text FROM system_requests"),
    ]);
    return { requests: rows.map(toSafe), total: parseInt(count[0].count, 10) };
  },

  async updateStatus(id: number, status: SystemRequestStatus): Promise<SafeSystemRequest | null> {
    const rows = await query<SystemRequestRow>(
      "UPDATE system_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [status, id]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },

  async addRecommendation(
    systemRequestId: number,
    configurationId: number,
    rank: number,
    reason: string | null
  ): Promise<SystemRequestRecommendationRow> {
    const rows = await query<SystemRequestRecommendationRow>(
      `INSERT INTO system_request_recommendations (system_request_id, configuration_id, rank, reason)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [systemRequestId, configurationId, rank, reason]
    );
    return rows[0];
  },

  // Returns true if deleted, false if not found / wrong request
  async removeRecommendation(recommendationId: number, systemRequestId: number): Promise<boolean> {
    const rows = await query<{ id: number }>(
      "DELETE FROM system_request_recommendations WHERE id = $1 AND system_request_id = $2 RETURNING id",
      [recommendationId, systemRequestId]
    );
    return rows.length > 0;
  },

  async countRecommendations(systemRequestId: number): Promise<number> {
    const rows = await query<{ count: string }>(
      "SELECT COUNT(*)::text FROM system_request_recommendations WHERE system_request_id = $1",
      [systemRequestId]
    );
    return parseInt(rows[0].count, 10);
  },

  // Fetches recommendations joined with full laptop + specs in 2 queries
  async getRecommendationsWithLaptops(systemRequestId: number): Promise<SafeRecommendation[]> {
    type RecRow = {
      id: number;
      rank: number;
      reason: string | null;
      created_at: Date;
      config_id: number;
      config_name: string;
      config_summary: string | null;
      config_price: string;
      config_active: boolean;
      config_created: Date;
    };

    const recRows = await query<RecRow>(
      `SELECT srr.id, srr.rank, srr.reason, srr.created_at,
              lc.id          AS config_id,
              lc.name        AS config_name,
              lc.short_summary AS config_summary,
              lc.base_price  AS config_price,
              lc.is_active   AS config_active,
              lc.created_at  AS config_created
       FROM system_request_recommendations srr
       JOIN laptop_configurations lc ON lc.id = srr.configuration_id
       WHERE srr.system_request_id = $1
       ORDER BY srr.rank ASC`,
      [systemRequestId]
    );

    if (recRows.length === 0) return [];

    // Fetch specs for all relevant laptops in a single query
    const configIds = recRows.map((r) => r.config_id);
    type SpecRow = {
      configuration_id: number;
      spec_option_id: number;
      spec_name: string;
      category_id: number;
      category_name: string;
    };
    const specRows = await query<SpecRow>(
      `SELECT lcs.configuration_id,
              so.id   AS spec_option_id,
              so.name AS spec_name,
              sc.id   AS category_id,
              sc.name AS category_name
       FROM laptop_configuration_specs lcs
       JOIN spec_options so ON so.id = lcs.spec_option_id
       JOIN spec_categories sc ON sc.id = so.category_id
       WHERE lcs.configuration_id = ANY($1::bigint[])
       ORDER BY sc.name, so.name`,
      [configIds]
    );

    // Group specs by configuration_id
    const specsByConfig: Record<number, LaptopSpec[]> = {};
    for (const s of specRows) {
      if (!specsByConfig[s.configuration_id]) specsByConfig[s.configuration_id] = [];
      specsByConfig[s.configuration_id].push({
        specOptionId: s.spec_option_id,
        specName: s.spec_name,
        categoryId: s.category_id,
        categoryName: s.category_name,
      });
    }

    return recRows.map((r) => ({
      id: r.id,
      rank: r.rank,
      reason: r.reason,
      createdAt: r.created_at,
      laptop: {
        id: r.config_id,
        name: r.config_name,
        shortSummary: r.config_summary,
        basePrice: parseFloat(r.config_price),
        isActive: r.config_active,
        createdAt: r.config_created,
        specs: specsByConfig[r.config_id] ?? [],
      },
    }));
  },
};
