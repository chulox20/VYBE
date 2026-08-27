import { z } from 'zod';

export const registerSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  username: z.string()
    .min(3, 'El username debe tener al menos 3 caracteres')
    .max(30)
    .regex(/^[a-zA-Z0-9_.]+$/, 'El username solo puede contener letras, números, puntos y guiones bajos'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  bio: z.string().max(300).optional(),
  avatar_url: z.string().url().or(z.literal('')).optional(),
  cover_url: z.string().url().or(z.literal('')).optional(),
  website: z.string().url().or(z.literal('')).optional(),
  location: z.string().max(100).optional(),
});

export const createPostSchema = z.object({
  content: z.string().min(1, 'El contenido no puede estar vacío').max(2000),
  image_url: z.string().url().or(z.literal('')).nullable().optional(),
  visibility: z.enum(['public', 'followers', 'private']).default('public'),
  community_id: z.string().optional().nullable(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'El comentario no puede estar vacío').max(1000),
  parent_comment_id: z.string().nullable().optional(),
});

export const createCommunitySchema = z.object({
  name: z.string().min(3, 'El nombre de la comunidad debe tener al menos 3 caracteres').max(60),
  slug: z.string().min(3).max(60).regex(/^[a-zA-Z0-9-]+$/, 'Slug inválido').optional(),
  description: z.string().max(500).optional(),
  category: z.string().max(60).default('General'),
  image_url: z.string().url().or(z.literal('')).optional(),
  cover_url: z.string().url().or(z.literal('')).optional(),
});

export const sendMessageSchema = z.object({
  conversation_id: z.string().optional(),
  recipient_id: z.string().optional(),
  content: z.string().min(1, 'El mensaje no puede estar vacío').max(2000),
  image_url: z.string().url().or(z.literal('')).nullable().optional(),
});

export const createReportSchema = z.object({
  target_type: z.enum(['post', 'comment', 'user']),
  target_id: z.string().min(1),
  reason: z.string().min(3, 'Debe especificar el motivo del reporte').max(255),
  details: z.string().max(500).optional().default(''),
});

export const updateReportStatusSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'resolved', 'dismissed']).default('resolved'),
  action: z.enum(['none', 'delete_content', 'suspend_user', 'ban_user']).default('none'),
  details: z.string().max(500).optional().default(''),
});

