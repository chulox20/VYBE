import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { memoryStore } from '../db/memoryStore.js';
import { pool, checkPgConnection } from '../db/pool.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No autorizado. Token no proporcionado.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const isConnected = await checkPgConnection();
    let user = null;

    if (isConnected) {
      const result = await pool.query(
        `SELECT u.id, u.email, u.role, u.status, p.full_name, p.username, p.avatar_url, p.cover_url, p.bio, p.website, p.location
         FROM users u
         LEFT JOIN user_profiles p ON u.id = p.user_id
         WHERE u.id = $1`,
        [decoded.id]
      );
      if (result.rows.length > 0) {
        user = result.rows[0];
      }
    } else {
      user = memoryStore.getPopulatedUser(decoded.id);
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Usuario no encontrado o sesión inválida.' });
    }

    if (user.status === 'banned') {
      return res.status(403).json({ success: false, error: 'Esta cuenta ha sido suspendida permanentemente por infringir las normas de VYBE.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, error: 'Esta cuenta se encuentra suspendida temporalmente.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expirado. Por favor inicia sesión nuevamente.' });
    }
    return res.status(401).json({ success: false, error: 'Token inválido o corrupto.' });
  }
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }
  return authenticate(req, res, (err) => {
    if (err) {
      req.user = null;
    }
    next();
  });
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Acceso denegado. Se requieren privilegios de administrador.' });
  }
  next();
}
