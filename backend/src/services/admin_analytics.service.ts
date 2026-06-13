import { query } from "../config/database";
import { SuiService } from "./sui.service";

export const AdminAnalyticsService = {
  async getDashboardStats() {
    // 1. Get Platform Treasury Balance (Real blockchain source)
    // Using the configured admin address as the platform treasury for the live demo.
    const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || "0x015303f47abbda5d91a2f7e83f03e3e4217a20e051d5b01979bc8dfa6bff8f88";
    
    const [stats, treasuryBalance] = await Promise.all([
      Promise.all([
        // Financial Metrics
        query<{ total_revenue: string }>(
          "SELECT SUM(amount_paid) as total_revenue FROM payments WHERE payment_status = 'completed'"
        ),
        query<{ pending_revenue: string }>(
          "SELECT SUM(amount_paid) as pending_revenue FROM payments WHERE payment_status = 'pending'"
        ),
        query<{ total_transactions: string }>(
          "SELECT COUNT(*) as total_transactions FROM payments"
        ),
        
        // Order Metrics
        query<{ total_orders: string }>("SELECT COUNT(*) as total_orders FROM orders"),
        query<{ pending_orders: string }>("SELECT COUNT(*) as pending_orders FROM orders WHERE status = 'pending'"),
        query<{ successful_payments: string }>("SELECT COUNT(*) as successful_payments FROM payments WHERE payment_status = 'completed'"),
        query<{ failed_payments: string }>("SELECT COUNT(*) as failed_payments FROM payments WHERE payment_status = 'failed'"),
        query<{ total_refunds: string }>("SELECT COUNT(*) as total_refunds FROM payments WHERE payment_status = 'refunded'"),

        // User Metrics
        query<{ total_users: string }>("SELECT COUNT(*) as total_users FROM users WHERE role = 'user'"),
        query<{ active_users_24h: string }>(
          "SELECT COUNT(DISTINCT user_id) as active_users_24h FROM orders WHERE created_at > NOW() - INTERVAL '24 hours'"
        ),

        // Repair Metrics
        query<{ active_repairs: string }>("SELECT COUNT(*) as active_repairs FROM repair_requests WHERE status IN ('pending', 'diagnosed', 'in_progress', 'awaiting_parts')"),

        // Inventory Health
        query<{ low_stock_items: string }>(
          "SELECT COUNT(*) as low_stock_items FROM inventory WHERE quantity_in_stock <= restock_threshold"
        )
      ]),
      SuiService.getUsdcBalance(TREASURY_ADDRESS).catch(() => ({ totalBalance: "0", symbol: "USDC", decimals: 6 }))
    ]);

    const dbStats = stats;

    return {
      financials: {
        totalRevenue: dbStats[0][0].total_revenue || "0",
        pendingRevenue: dbStats[1][0].pending_revenue || "0",
        totalTransactions: parseInt(dbStats[2][0].total_transactions),
        successfulPayments: parseInt(dbStats[5][0].successful_payments),
        failedPayments: parseInt(dbStats[6][0].failed_payments),
        totalRefunds: parseInt(dbStats[7][0].total_refunds),
        treasuryBalance: (parseInt(treasuryBalance.totalBalance) / Math.pow(10, treasuryBalance.decimals)).toString(),
      },
      orders: {
        total: parseInt(stats[3][0].total_orders),
        pending: parseInt(stats[4][0].pending_orders),
      },
      users: {
        total: parseInt(stats[8][0].total_users),
        active24h: parseInt(stats[9][0].active_users_24h),
      },
      operations: {
        activeRepairs: parseInt(stats[10][0].active_repairs),
        lowStockItems: parseInt(stats[11][0].low_stock_items),
      }
    };
  },

  async getRecentActivity() {
    const [recentOrders, recentPayments, recentAuditLogs] = await Promise.all([
      query<any>(
        `SELECT o.*, u.full_name as user_name 
         FROM orders o 
         JOIN users u ON o.user_id = u.id 
         ORDER BY o.created_at DESC LIMIT 5`
      ),
      query<any>(
        `SELECT p.*, u.full_name as user_name 
         FROM payments p 
         JOIN orders o ON p.order_id = o.id 
         JOIN users u ON o.user_id = u.id 
         ORDER BY p.paid_at DESC LIMIT 5`
      ),
      query<any>(
        `SELECT l.*, u.full_name as admin_name 
         FROM admin_audit_logs l
         LEFT JOIN users u ON l.admin_id = u.id
         ORDER BY l.created_at DESC LIMIT 5`
      )
    ]);

    return {
      orders: recentOrders.map(o => ({
        id: o.id,
        userName: o.user_name,
        status: o.status,
        totalAmount: o.total_amount,
        createdAt: o.created_at
      })),
      payments: recentPayments.map(p => ({
        id: p.id,
        userName: p.user_name,
        amount: p.amount_paid,
        status: p.payment_status,
        method: p.payment_method,
        createdAt: p.paid_at
      })),
      auditLogs: recentAuditLogs.map(l => ({
        id: l.id,
        adminName: l.admin_name,
        action: l.action,
        targetType: l.target_type,
        createdAt: l.created_at
      }))
    };
  },

  async getRevenueChart() {
    // Last 7 days revenue
    const data = await query<any>(
      `SELECT 
         DATE_TRUNC('day', paid_at) as date,
         SUM(amount_paid) as revenue
       FROM payments 
       WHERE payment_status = 'completed' 
         AND paid_at > NOW() - INTERVAL '7 days'
       GROUP BY 1 ORDER BY 1 ASC`
    );

    if (data.length === 0) {
      return [];
    }

    return data.map(d => ({
      date: d.date,
      revenue: parseFloat(d.revenue)
    }));
  }
};
