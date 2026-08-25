import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { pool, checkPgConnection } from '../db/pool.js';
import { memoryStore } from '../db/memoryStore.js';
import { generateId } from '../utils/helpers.js';

export class AuthService {
  static generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );
  }

  static async register({ full_name, username, email, password }) {
    const isConnected = await checkPgConnection();
    const cleanUsername = username.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    if (isConnected) {
      // Check duplicate email
      const emailCheck = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
      if (emailCheck.rows.length > 0) {
        const err = new Error('El correo electrónico ya está registrado.');
        err.statusCode = 400;
        throw err;
      }

      // Check duplicate username
      const usernameCheck = await pool.query('SELECT user_id FROM user_profiles WHERE LOWER(username) = $1', [cleanUsername]);
      if (usernameCheck.rows.length > 0) {
        const err = new Error('El nombre de usuario ya está en uso.');
        err.statusCode = 400;
        throw err;
      }

      const userId = generateId('usr');
      const passwordHash = await bcrypt.hash(password, 10);
      const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`;
      const defaultCover = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80';

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO users (id, email, password_hash, role, status) VALUES ($1, $2, $3, 'user', 'active')`,
          [userId, cleanEmail, passwordHash]
        );
        await client.query(
          `INSERT INTO user_profiles (user_id, full_name, username, avatar_url, cover_url) VALUES ($1, $2, $3, $4, $5)`,
          [userId, full_name.trim(), cleanUsername, defaultAvatar, defaultCover]
        );
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }

      const newUser = {
        id: userId,
        email: cleanEmail,
        role: 'user',
        status: 'active',
        full_name: full_name.trim(),
        username: cleanUsername,
        avatar_url: defaultAvatar,
        cover_url: defaultCover,
        bio: '',
        website: '',
        location: '',
        follower_count: 0,
        following_count: 0,
        post_count: 0,
      };

      const token = this.generateToken(newUser);
      return { user: newUser, token };
    } else {
      // Memory Store fallback
      await memoryStore.init();
      const existingEmail = memoryStore.tables.users.find(u => u.email.toLowerCase() === cleanEmail);
      if (existingEmail) {
        const err = new Error('El correo electrónico ya está registrado.');
        err.statusCode = 400;
        throw err;
      }

      const existingUsername = memoryStore.tables.user_profiles.find(p => p.username.toLowerCase() === cleanUsername);
      if (existingUsername) {
        const err = new Error('El nombre de usuario ya está en uso.');
        err.statusCode = 400;
        throw err;
      }

      const userId = generateId('usr');
      const passwordHash = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();
      const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`;
      const defaultCover = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80';

      memoryStore.tables.users.push({
        id: userId,
        email: cleanEmail,
        password_hash: passwordHash,
        role: 'user',
        status: 'active',
        created_at: now,
        updated_at: now,
      });

      memoryStore.tables.user_profiles.push({
        user_id: userId,
        full_name: full_name.trim(),
        username: cleanUsername,
        bio: '',
        avatar_url: defaultAvatar,
        cover_url: defaultCover,
        website: '',
        location: '',
        follower_count: 0,
        following_count: 0,
        post_count: 0,
        created_at: now,
        updated_at: now,
      });

      const user = memoryStore.getPopulatedUser(userId);
      const token = this.generateToken(user);
      return { user, token };
    }
  }

  static async login({ email, password }) {
    const isConnected = await checkPgConnection();
    const cleanEmail = email.toLowerCase().trim();

    if (isConnected) {
      const result = await pool.query(
        `SELECT u.id, u.email, u.password_hash, u.role, u.status, p.full_name, p.username, p.avatar_url, p.cover_url, p.bio, p.website, p.location, p.follower_count, p.following_count, p.post_count
         FROM users u
         LEFT JOIN user_profiles p ON u.id = p.user_id
         WHERE LOWER(u.email) = $1`,
        [cleanEmail]
      );

      if (result.rows.length === 0) {
        const err = new Error('Credenciales inválidas.');
        err.statusCode = 401;
        throw err;
      }

      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        const err = new Error('Credenciales inválidas.');
        err.statusCode = 401;
        throw err;
      }

      if (user.status === 'banned') {
        const err = new Error('Tu cuenta ha sido bloqueada permanentemente.');
        err.statusCode = 403;
        throw err;
      }

      delete user.password_hash;
      const token = this.generateToken(user);
      return { user, token };
    } else {
      await memoryStore.init();
      const user = memoryStore.tables.users.find(u => u.email.toLowerCase() === cleanEmail);
      if (!user) {
        const err = new Error('Credenciales inválidas.');
        err.statusCode = 401;
        throw err;
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        const err = new Error('Credenciales inválidas.');
        err.statusCode = 401;
        throw err;
      }

      if (user.status === 'banned') {
        const err = new Error('Tu cuenta ha sido bloqueada permanentemente.');
        err.statusCode = 403;
        throw err;
      }

      const populated = memoryStore.getPopulatedUser(user.id);
      const token = this.generateToken(populated);
      return { user: populated, token };
    }
  }

  static async getMe(userId) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      const result = await pool.query(
        `SELECT u.id, u.email, u.role, u.status, p.full_name, p.username, p.avatar_url, p.cover_url, p.bio, p.website, p.location, p.follower_count, p.following_count, p.post_count
         FROM users u
         LEFT JOIN user_profiles p ON u.id = p.user_id
         WHERE u.id = $1`,
        [userId]
      );
      if (result.rows.length === 0) {
        const err = new Error('Usuario no encontrado.');
        err.statusCode = 404;
        throw err;
      }
      return result.rows[0];
    } else {
      await memoryStore.init();
      const user = memoryStore.getPopulatedUser(userId);
      if (!user) {
        const err = new Error('Usuario no encontrado.');
        err.statusCode = 404;
        throw err;
      }
      return user;
    }
  }

  static async updateProfile(userId, data) {
    const isConnected = await checkPgConnection();
    if (isConnected) {
      const fields = [];
      const values = [];
      let idx = 1;

      for (const [key, val] of Object.entries(data)) {
        if (['full_name', 'bio', 'avatar_url', 'cover_url', 'website', 'location'].includes(key)) {
          fields.push(`${key} = $${idx++}`);
          values.push(val);
        }
      }

      if (fields.length > 0) {
        values.push(userId);
        await pool.query(
          `UPDATE user_profiles SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $${idx}`,
          values
        );
      }
      return this.getMe(userId);
    } else {
      await memoryStore.init();
      const profile = memoryStore.tables.user_profiles.find(p => p.user_id === userId);
      if (profile) {
        Object.assign(profile, data, { updated_at: new Date().toISOString() });
      }
      return memoryStore.getPopulatedUser(userId);
    }
  }
}
