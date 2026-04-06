import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { db, initDb } from './db.js';
initDb();
function upsertUser(username, email, password, role) {
    const password_hash = bcrypt.hashSync(password, 10);
    db.prepare(`INSERT INTO users (username,email,password_hash,role) VALUES (?,?,?,?)
    ON CONFLICT(email) DO UPDATE SET username=excluded.username, password_hash=excluded.password_hash, role=excluded.role`)
        .run(username, email, password_hash, role);
}
upsertUser('admin', 'admin@crept.com', 'Admin1234!', 'admin');
upsertUser('alice', 'alice@crept.com', 'Password123!', 'user');
upsertUser('bob', 'bob@crept.com', 'Password123!', 'user');
upsertUser('charlie', 'charlie@crept.com', 'Password123!', 'user');
const users = db.prepare('SELECT id FROM users WHERE role = ?').all('user');
for (const [i, u] of users.entries()) {
    const key = `CRPT-${nanoid(20).toUpperCase()}`;
    db.prepare('INSERT OR IGNORE INTO licenses (user_id,plan,license_key,hwid,expiry_date,status) VALUES (?,?,?,?,?,?)')
        .run(u.id, ['Basic', 'Pro', 'Elite'][i % 3], key, `HWID-XXXX-${u.id}`, new Date(Date.now() + 86400000 * (30 + i * 15)).toISOString(), 'active');
    db.prepare('INSERT OR IGNORE INTO referral_codes (user_id,code,uses) VALUES (?,?,?)')
        .run(u.id, `CRPTREF${u.id}X`, i);
}
db.prepare('INSERT INTO announcements (title,category,body,pinned,created_by) VALUES (?,?,?,?,?)')
    .run('Welcome to Crept', 'Update', 'Crept platform is now live with account dashboard and support workflows.', 1, 1);
db.prepare('INSERT INTO announcements (title,category,body,pinned,created_by) VALUES (?,?,?,?,?)')
    .run('Scheduled Maintenance', 'Maintenance', 'Routine maintenance window this weekend. Some services may be degraded.', 0, 1);
db.prepare('INSERT OR REPLACE INTO service_statuses (service_name,status,updated_by) VALUES (?,?,?)').run('Auth Server', 'Online', 1);
db.prepare('INSERT OR REPLACE INTO service_statuses (service_name,status,updated_by) VALUES (?,?,?)').run('License Server', 'Online', 1);
db.prepare('INSERT OR REPLACE INTO service_statuses (service_name,status,updated_by) VALUES (?,?,?)').run('Download CDN', 'Online', 1);
db.prepare('INSERT OR REPLACE INTO service_statuses (service_name,status,updated_by) VALUES (?,?,?)').run('API Gateway', 'Degraded', 1);
db.prepare('INSERT INTO tickets (user_id,subject,category,priority,status) VALUES (?,?,?,?,?)').run(2, 'Cannot access dashboard', 'Technical', 'High', 'open');
db.prepare('INSERT INTO ticket_messages (ticket_id,sender_id,body) VALUES (?,?,?)').run(1, 2, 'I receive an expired token error.');
db.prepare('INSERT INTO audit_log (admin_id,action,target_type,target_id,metadata) VALUES (?,?,?,?,?)')
    .run(1, 'seed:init', 'system', 'bootstrap', JSON.stringify({ at: new Date().toISOString() }));
console.log('Seed complete');
