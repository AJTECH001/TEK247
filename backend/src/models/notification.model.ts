import { query } from "../config/database";
import { NotificationRow, NotificationType, SafeNotification } from "../types";
import EmailService from "../services/email.service";
import { logger } from "../utils/logger";

function toSafe(row: NotificationRow): SafeNotification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    notificationType: row.notification_type,
    relatedEntityType: row.related_entity_type,
    relatedEntityId: row.related_entity_id,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export const NotificationModel = {
  async create(
    userId: number,
    title: string,
    message: string,
    type: NotificationType,
    relatedEntityType?: string,
    relatedEntityId?: number
  ): Promise<SafeNotification> {
    const rows = await query<NotificationRow>(
      `INSERT INTO notifications (user_id, title, message, notification_type, related_entity_type, related_entity_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, title, message, type, relatedEntityType ?? null, relatedEntityId ?? null]
    );

    // Fire email in background — don't block or fail the request if email fails
    query<{ email: string }>("SELECT email FROM users WHERE id = $1", [userId])
      .then(([user]) => {
        if (user?.email) {
          return EmailService.sendNotificationEmail(user.email, title, message);
        }
      })
      .catch((err) => logger.error("Notification email error:", err));

    return toSafe(rows[0]);
  },

  async findByUser(
    userId: number,
    page: number,
    limit: number
  ): Promise<{ notifications: SafeNotification[]; total: number }> {
    const offset = (page - 1) * limit;
    const [rows, count] = await Promise.all([
      query<NotificationRow>(
        `SELECT * FROM notifications WHERE user_id = $1 ORDER BY is_read ASC, created_at DESC LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      ),
      query<{ count: string }>(
        "SELECT COUNT(*)::text FROM notifications WHERE user_id = $1",
        [userId]
      ),
    ]);
    return { notifications: rows.map(toSafe), total: parseInt(count[0].count, 10) };
  },

  async unreadCount(userId: number): Promise<number> {
    const rows = await query<{ count: string }>(
      "SELECT COUNT(*)::text FROM notifications WHERE user_id = $1 AND is_read = FALSE",
      [userId]
    );
    return parseInt(rows[0].count, 10);
  },

  async markRead(id: number, userId: number): Promise<boolean> {
    const rows = await query<{ id: number }>(
      "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId]
    );
    return rows.length > 0;
  },

  async markAllRead(userId: number): Promise<void> {
    await query(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE",
      [userId]
    );
  },
};
