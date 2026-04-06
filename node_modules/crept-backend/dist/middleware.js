import jwt from 'jsonwebtoken';
export function authRequired(req, res, next) {
    const token = req.cookies?.accessToken || req.headers.authorization?.replace('Bearer ', '');
    if (!token)
        return res.status(401).json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev');
        return next();
    }
    catch {
        return res.status(401).json({ error: 'Invalid token', code: 'AUTH_INVALID' });
    }
}
export function adminRequired(req, res, next) {
    if (!req.user)
        return res.status(401).json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' });
    if (req.user.role !== 'admin')
        return res.status(403).json({ error: 'Forbidden', code: 'ADMIN_ONLY' });
    return next();
}
export function errorHandler(err, _req, res, _next) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error', code: 'INTERNAL_ERROR' });
}
