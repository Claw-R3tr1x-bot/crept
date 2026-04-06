import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { db } from './db/db.js';
import { adminRequired, authRequired } from './middleware.js';

const sign = (payload: object, refresh = false) => jwt.sign(payload, refresh ? (process.env.JWT_REFRESH_SECRET || 'refresh') : (process.env.JWT_SECRET || 'dev'), { expiresIn: refresh ? '30d' : '1d' });

export const apiRouter = express.Router();

const RegisterSchema = z.object({ username: z.string().min(3), email: z.string().email(), password: z.string().min(8) });
const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(1), rememberMe: z.boolean().optional() });

apiRouter.post('/auth/register', (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', code: 'VALIDATION_ERROR' });
  const { username, email, password } = parsed.data;
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'Email exists', code: 'EMAIL_EXISTS' });
  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (username,email,password_hash,role) VALUES (?,?,?,?)').run(username, email, hash, 'user');
  const user = { id: Number(info.lastInsertRowid), role: 'user', email, username };
  const accessToken = sign(user);
  const refreshToken = sign(user, true);
  db.prepare('INSERT INTO referral_codes (user_id,code) VALUES (?,?)').run(user.id, `CRPTREF${user.id}${nanoid(4).toUpperCase()}`);
  res.cookie('accessToken', accessToken, { httpOnly: true, sameSite: 'lax' });
  res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax' });
  return res.status(201).json({ user });
});

apiRouter.post('/auth/login', (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', code: 'VALIDATION_ERROR' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(parsed.data.email) as any;
  if (!user || !bcrypt.compareSync(parsed.data.password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials', code: 'AUTH_FAILED' });
  if (user.banned_at) return res.status(403).json({ error: 'Account banned', code: 'ACCOUNT_BANNED' });
  const payload = { id: user.id, role: user.role, email: user.email, username: user.username };
  res.cookie('accessToken', sign(payload), { httpOnly: true, sameSite: 'lax' });
  res.cookie('refreshToken', sign(payload, true), { httpOnly: true, sameSite: 'lax' });
  return res.json({ user: payload });
});

apiRouter.post('/auth/logout', (_req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  return res.json({ success: true });
});

apiRouter.get('/auth/me', authRequired, (req, res) => res.json({ user: req.user }));

apiRouter.get('/users', authRequired, adminRequired, (_req, res) => {
  const users = db.prepare('SELECT id, username, email, role, created_at, banned_at FROM users ORDER BY id DESC').all();
  res.json({ users });
});
apiRouter.get('/users/:id', authRequired, (req, res) => {
  const id = Number(req.params.id);
  if (req.user!.role !== 'admin' && req.user!.id !== id) return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
  const user = db.prepare('SELECT id, username, email, role, created_at, banned_at FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
  res.json({ user });
});
apiRouter.patch('/users/:id', authRequired, (req, res) => {
  const id = Number(req.params.id);
  if (req.user!.role !== 'admin' && req.user!.id !== id) return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
  const body = z.object({ username: z.string().min(3).optional(), email: z.string().email().optional(), currentPassword: z.string().optional(), newPassword: z.string().min(8).optional() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'Invalid input', code: 'VALIDATION_ERROR' });
  const cur = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!cur) return res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
  const username = body.data.username || cur.username;
  const email = body.data.email || cur.email;
  let hash = cur.password_hash;
  if (body.data.newPassword) {
    if (req.user!.role !== 'admin' && (!body.data.currentPassword || !bcrypt.compareSync(body.data.currentPassword, cur.password_hash))) return res.status(400).json({ error: 'Current password invalid', code: 'PASSWORD_INVALID' });
    hash = bcrypt.hashSync(body.data.newPassword, 10);
  }
  db.prepare('UPDATE users SET username=?, email=?, password_hash=? WHERE id=?').run(username, email, hash, id);
  res.json({ success: true });
});
apiRouter.delete('/users/:id', authRequired, adminRequired, (req, res) => { db.prepare('DELETE FROM users WHERE id = ?').run(Number(req.params.id)); res.json({ success: true }); });
apiRouter.patch('/users/:id/ban', authRequired, adminRequired, (req, res) => {
  const parsed = z.object({ banned: z.boolean() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', code: 'VALIDATION_ERROR' });
  db.prepare('UPDATE users SET banned_at = ? WHERE id = ?').run(parsed.data.banned ? new Date().toISOString() : null, Number(req.params.id));
  res.json({ success: true });
});

apiRouter.get('/licenses', authRequired, adminRequired, (_req, res) => res.json({ licenses: db.prepare('SELECT * FROM licenses ORDER BY id DESC').all() }));
apiRouter.get('/licenses/mine', authRequired, (req, res) => res.json({ licenses: db.prepare('SELECT * FROM licenses WHERE user_id=?').all(req.user!.id) }));
apiRouter.post('/licenses', authRequired, adminRequired, (req, res) => {
  const parsed = z.object({ user_id: z.number(), plan: z.enum(['Basic','Pro','Elite']), days: z.number().int().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', code: 'VALIDATION_ERROR' });
  const key = `CRPT-${nanoid(20).toUpperCase()}`;
  const exp = new Date(Date.now() + parsed.data.days * 86400000).toISOString();
  db.prepare('INSERT INTO licenses (user_id, plan, license_key, expiry_date, status) VALUES (?,?,?,?,?)').run(parsed.data.user_id, parsed.data.plan, key, exp, 'active');
  res.status(201).json({ license_key: key, expiry_date: exp });
});
apiRouter.patch('/licenses/:id', authRequired, adminRequired, (req, res) => {
  const parsed = z.object({ status: z.string().optional(), hwid: z.string().nullable().optional(), expiry_date: z.string().optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', code: 'VALIDATION_ERROR' });
  const row = db.prepare('SELECT * FROM licenses WHERE id=?').get(Number(req.params.id)) as any;
  if (!row) return res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
  db.prepare('UPDATE licenses SET status=?, hwid=?, expiry_date=? WHERE id=?').run(parsed.data.status || row.status, parsed.data.hwid === undefined ? row.hwid : parsed.data.hwid, parsed.data.expiry_date || row.expiry_date, row.id);
  res.json({ success: true });
});
apiRouter.delete('/licenses/:id', authRequired, adminRequired, (req, res) => { db.prepare('DELETE FROM licenses WHERE id=?').run(Number(req.params.id)); res.json({ success: true }); });

apiRouter.get('/hwid/mine', authRequired, (req, res) => {
  const license = db.prepare('SELECT * FROM licenses WHERE user_id=? ORDER BY id DESC LIMIT 1').get(req.user!.id);
  const resets = db.prepare('SELECT * FROM hwid_reset_log WHERE user_id=? ORDER BY reset_at DESC LIMIT 3').all(req.user!.id);
  res.json({ license, resets });
});
apiRouter.post('/hwid/reset-request', authRequired, (req, res) => {
  const reason = String(req.body.reason || 'No reason provided');
  const last = db.prepare('SELECT requested_at FROM hwid_reset_requests WHERE user_id=? ORDER BY requested_at DESC LIMIT 1').get(req.user!.id) as any;
  if (last) {
    const diff = Date.now() - new Date(last.requested_at).getTime();
    if (diff < 30 * 86400000) return res.status(429).json({ error: 'Reset cooldown active', code: 'HWID_RESET_COOLDOWN' });
  }
  db.prepare('INSERT INTO hwid_reset_requests (user_id, reason, status) VALUES (?,?,?)').run(req.user!.id, reason, 'pending');
  res.status(201).json({ success: true });
});
apiRouter.get('/hwid/requests', authRequired, adminRequired, (_req, res) => res.json({ requests: db.prepare('SELECT * FROM hwid_reset_requests ORDER BY requested_at DESC').all() }));
apiRouter.post('/hwid/requests/:id/approve', authRequired, adminRequired, (req, res) => {
  const id = Number(req.params.id);
  const request = db.prepare('SELECT * FROM hwid_reset_requests WHERE id=?').get(id) as any;
  if (!request) return res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
  const license = db.prepare('SELECT * FROM licenses WHERE user_id=? ORDER BY id DESC LIMIT 1').get(request.user_id) as any;
  if (license) {
    db.prepare('UPDATE licenses SET hwid = NULL WHERE id=?').run(license.id);
    db.prepare('INSERT INTO hwid_reset_log (user_id, license_id, admin_id) VALUES (?,?,?)').run(request.user_id, license.id, req.user!.id);
  }
  db.prepare('UPDATE hwid_reset_requests SET status=?, resolved_at=?, resolved_by=? WHERE id=?').run('approved', new Date().toISOString(), req.user!.id, id);
  res.json({ success: true });
});
apiRouter.post('/hwid/requests/:id/deny', authRequired, adminRequired, (req, res) => {
  db.prepare('UPDATE hwid_reset_requests SET status=?, resolved_at=?, resolved_by=? WHERE id=?').run('denied', new Date().toISOString(), req.user!.id, Number(req.params.id));
  res.json({ success: true });
});

apiRouter.get('/tickets', authRequired, (req, res) => {
  const tickets = req.user!.role === 'admin'
    ? db.prepare('SELECT * FROM tickets ORDER BY updated_at DESC').all()
    : db.prepare('SELECT * FROM tickets WHERE user_id=? ORDER BY updated_at DESC').all(req.user!.id);
  res.json({ tickets });
});
apiRouter.post('/tickets', authRequired, (req, res) => {
  const parsed = z.object({ subject: z.string().min(3), category: z.string(), priority: z.enum(['Low', 'Medium', 'High']), description: z.string().min(5), attachment_url: z.string().optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', code: 'VALIDATION_ERROR' });
  const info = db.prepare('INSERT INTO tickets (user_id, subject, category, priority, status) VALUES (?,?,?,?,?)').run(req.user!.id, parsed.data.subject, parsed.data.category, parsed.data.priority, 'Open');
  db.prepare('INSERT INTO ticket_messages (ticket_id, sender_id, body, attachment_url) VALUES (?,?,?,?)').run(info.lastInsertRowid, req.user!.id, parsed.data.description, parsed.data.attachment_url || null);
  res.status(201).json({ ticket_id: info.lastInsertRowid });
});
apiRouter.get('/tickets/:id', authRequired, (req, res) => {
  const t = db.prepare('SELECT * FROM tickets WHERE id=?').get(Number(req.params.id)) as any;
  if (!t) return res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
  if (req.user!.role !== 'admin' && req.user!.id !== t.user_id) return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
  const messages = db.prepare('SELECT * FROM ticket_messages WHERE ticket_id=? ORDER BY sent_at ASC').all(t.id);
  res.json({ ticket: t, messages });
});
apiRouter.post('/tickets/:id/reply', authRequired, (req, res) => {
  const t = db.prepare('SELECT * FROM tickets WHERE id=?').get(Number(req.params.id)) as any;
  if (!t) return res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
  if (req.user!.role !== 'admin' && req.user!.id !== t.user_id) return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
  const body = String(req.body.body || '').trim();
  if (!body) return res.status(400).json({ error: 'Reply required', code: 'VALIDATION_ERROR' });
  db.prepare('INSERT INTO ticket_messages (ticket_id,sender_id,body) VALUES (?,?,?)').run(t.id, req.user!.id, body);
  db.prepare('UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id=?').run(t.id);
  res.status(201).json({ success: true });
});
apiRouter.patch('/tickets/:id/status', authRequired, adminRequired, (req, res) => {
  const status = String(req.body.status || 'Open');
  db.prepare('UPDATE tickets SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(status, Number(req.params.id));
  res.json({ success: true });
});

apiRouter.get('/announcements', (_req, res) => res.json({ announcements: db.prepare('SELECT * FROM announcements ORDER BY pinned DESC, published_at DESC').all() }));
apiRouter.post('/announcements', authRequired, adminRequired, (req, res) => {
  const parsed = z.object({ title: z.string().min(3), category: z.enum(['Update','Maintenance','Alert']), body: z.string().min(5), pinned: z.boolean().default(false), published_at: z.string().optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', code: 'VALIDATION_ERROR' });
  db.prepare('INSERT INTO announcements (title,category,body,pinned,published_at,created_by) VALUES (?,?,?,?,?,?)').run(parsed.data.title, parsed.data.category, parsed.data.body, parsed.data.pinned ? 1 : 0, parsed.data.published_at || new Date().toISOString(), req.user!.id);
  res.status(201).json({ success: true });
});
apiRouter.patch('/announcements/:id', authRequired, adminRequired, (req, res) => {
  const row = db.prepare('SELECT * FROM announcements WHERE id=?').get(Number(req.params.id)) as any;
  if (!row) return res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
  db.prepare('UPDATE announcements SET title=?, category=?, body=?, pinned=? WHERE id=?').run(req.body.title || row.title, req.body.category || row.category, req.body.body || row.body, req.body.pinned === undefined ? row.pinned : (req.body.pinned ? 1 : 0), row.id);
  res.json({ success: true });
});
apiRouter.delete('/announcements/:id', authRequired, adminRequired, (req, res) => { db.prepare('DELETE FROM announcements WHERE id=?').run(Number(req.params.id)); res.json({ success: true }); });

apiRouter.get('/status', (_req, res) => {
  const statuses = db.prepare('SELECT * FROM service_statuses').all();
  const incidents = db.prepare('SELECT * FROM incidents ORDER BY created_at DESC LIMIT 20').all();
  res.json({ statuses, incidents });
});
apiRouter.post('/status', authRequired, adminRequired, (req, res) => {
  const parsed = z.object({ service_name: z.string(), status: z.enum(['Online','Degraded','Offline']) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', code: 'VALIDATION_ERROR' });
  db.prepare('INSERT INTO service_statuses (service_name,status,updated_by) VALUES (?,?,?) ON CONFLICT(service_name) DO UPDATE SET status=excluded.status, updated_by=excluded.updated_by, updated_at=CURRENT_TIMESTAMP').run(parsed.data.service_name, parsed.data.status, req.user!.id);
  res.json({ success: true });
});
apiRouter.post('/incidents', authRequired, adminRequired, (req, res) => {
  const parsed = z.object({ title: z.string().min(3), severity: z.enum(['Low','Medium','High','Critical']), affected_services: z.array(z.string()), description: z.string().min(5), resolution: z.string().optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input', code: 'VALIDATION_ERROR' });
  db.prepare('INSERT INTO incidents (title,severity,affected_services,description,resolution) VALUES (?,?,?,?,?)').run(parsed.data.title, parsed.data.severity, JSON.stringify(parsed.data.affected_services), parsed.data.description, parsed.data.resolution || null);
  res.status(201).json({ success: true });
});

apiRouter.get('/stats', (_req, res) => {
  const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  const activeLicenses = (db.prepare("SELECT COUNT(*) as c FROM licenses WHERE status='active'").get() as any).c;
  const requestsToday = Math.floor(Math.random() * 5000) + 1000;
  res.json({ totalUsers, activeLicenses, requestsToday, uptime: '99.98%' });
});
apiRouter.get('/stats/admin', authRequired, adminRequired, (_req, res) => {
  const users = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
  const ticketsOpen = (db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status IN ('Open','In Progress')").get() as any).c;
  const mrr = 12940;
  res.json({ users, ticketsOpen, mrr, generatedAt: new Date().toISOString() });
});

apiRouter.get('/settings', authRequired, adminRequired, (_req, res) => {
  const settings = db.prepare('SELECT * FROM site_settings').all();
  res.json({ settings });
});
apiRouter.patch('/settings', authRequired, adminRequired, (req, res) => {
  const items: Record<string, string> = req.body || {};
  const stmt = db.prepare('INSERT INTO site_settings (key,value,updated_at) VALUES (?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP');
  const tx = db.transaction((entries: [string, string][]) => entries.forEach(([k, v]) => stmt.run(k, String(v))));
  tx(Object.entries(items));
  db.prepare('INSERT INTO audit_log (admin_id, action, target_type, target_id, metadata) VALUES (?,?,?,?,?)').run(1, 'settings:update', 'settings', 'site', JSON.stringify(items));
  res.json({ success: true });
});

apiRouter.get('/audit-log', authRequired, adminRequired, (_req, res) => {
  const rows = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 50').all();
  res.json({ rows });
});
