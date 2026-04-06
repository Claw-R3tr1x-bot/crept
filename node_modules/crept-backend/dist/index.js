import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import morgan from 'morgan';
import { apiRouter } from './routes.js';
import { errorHandler } from './middleware.js';
import { initDb } from './db/db.js';
initDb();
const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: false }
}));
app.use(morgan('dev'));
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'crept-backend' }));
app.use('/api', apiRouter);
app.use(errorHandler);
const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`Crept backend listening on ${port}`));
