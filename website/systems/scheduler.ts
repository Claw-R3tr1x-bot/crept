import cron from 'node-cron';
import Database from 'better-sqlite3';

export function startSchedulers(db: Database.Database, notify: (email: string, type: string, payload: string) => Promise<void>) {
  cron.schedule('0 9 * * *', async () => {
    const rows = db.prepare(`SELECT u.email, l.expiry_date
      FROM licenses l JOIN users u ON u.id = l.user_id
      WHERE l.status='active'`).all() as { email: string; expiry_date: string }[];
    for (const row of rows) {
      const days = Math.floor((new Date(row.expiry_date).getTime() - Date.now()) / 86400000);
      if (days === 3) await notify(row.email, 'expiry_warning', row.expiry_date);
    }
  });

  cron.schedule('30 2 * * *', () => {
    db.prepare(`UPDATE tickets
      SET status='Closed', updated_at=CURRENT_TIMESTAMP
      WHERE status IN ('Open','In Progress')
      AND julianday('now') - julianday(updated_at) > 7`).run();
  });
}
