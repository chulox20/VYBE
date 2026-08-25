# 🌐 VYBE — Red Social Moderna

<div align="center">
  <h3><strong>Comparte. Conecta. Descubre.</strong></h3>
  <p>Una red social tecnológica de alto rendimiento enfocada en publicaciones, comunidades especializadas, perfiles interactivos, comentarios anidados, mensajería en tiempo real y panel de moderación.</p>
</div>

---

## 🎨 Identidad Visual & Paleta de Colores

| Elemento | Color Hex | Muestra |
| :--- | :--- | :--- |
| **Background** | `#F8FAFC` | Slate Neutro Claro |
| **Primary** | `#7C3AED` | Púrpura Eléctrico |
| **Primary Dark** | `#5B21B6` | Púrpura Profundo |
| **Accent** | `#EC4899` | Magenta Neón |
| **Text** | `#111827` | Gris Oscuro |
| **Muted** | `#6B7280` | Gris Medio |
| **Border** | `#E5E7EB` | Borde Sutil |
| **Success** | `#22C55E` | Verde Éxito |
| **Danger** | `#EF4444` | Rojo Peligro |

---

## 🚀 Arquitectura Técnica

```
┌────────────────────────────────────────────────────────────────────────┐
│             Frontend: React 18 + Vite + Tailwind CSS                   │
│        Context API + Framer Motion + Lucide Icons + Socket.IO          │
└───────────────────▲────────────────────────────────┬───────────────────┘
                    │                                │
             REST   │                                │  WebSockets
             API    │                                │  (Socket.IO)
                    │                                │
┌───────────────────┴────────────────────────────────▼───────────────────┐
│              Backend: Node.js + Express (ES Modules)                   │
│       JWT + bcryptjs + Zod + Multer + Helmet + Rate Limiting           │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│           PostgreSQL Database (Dual Engine with Fallback)              │
│       15 Tablas Relacionales + Índices de Búsqueda + Migrations        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Características Principales

1. **Feed Personalizado & Algorítmico**:
   - Pestañas *Para ti*, *Siguiendo* y *Populares*.
   - Paginación basada en cursor (`cursor` / `limit`).
   - Like animado con confeti y contador en tiempo real.
   - Marcadores / Publicaciones guardadas.
   - Compartir enlace rápido con feedback de copiado.
2. **Comunidades Tecnológicas**:
   - Directorio categorizado (Frontend, Backend & Cloud, AI, Diseño).
   - Crear comunidades públicas con slug único y portada.
   - Unirse/abandonar comunidades y publicar dentro de ellas.
3. **Mensajería Directa en Tiempo Real**:
   - Chat bidireccional mediante WebSockets (Socket.IO).
   - Indicadores de escritura en vivo (*"María está escribiendo..."*).
   - Confirmación de lectura y envío de imágenes/emojis.
4. **Notificaciones Push en Vivo**:
   - Notificaciones instantáneas para likes, comentarios, menciones (@username) y nuevos seguidores.
   - Toast flotante interactivo y centro de notificaciones con filtros.
5. **Comentarios Anidados Jerárquicos**:
   - Hilos de respuestas ilimitadas (`parent_comment_id`).
   - Menciones clickeables a usuarios.
6. **Explorar & Búsqueda Global**:
   - Detección de hashtags en tendencia (`#React`, `#Design`, `#AI`).
   - Buscador unificado para usuarios, posts y comunidades con *debounce*.
7. **Panel de Administración & Moderación**:
   - Métricas y KPIs de la red (Usuarios, Posts, Comunidades, Reportes).
   - Gestión de usuarios (Activar, Suspender, Bloquear).
   - Cola de resolución de reportes con acciones disciplinarias automáticas.

---

## 👥 Cuentas Demo de Prueba (1 Clic)

| Usuario | Rol | Email | Contraseña |
| :--- | :--- | :--- | :--- |
| **Jesús Pérez** (`@chulox`) | `user` | `chulox@vybe.app` | `Password123!` |
| **Maya Lin** (`@maya.design`) | `user` | `maya@vybe.app` | `Password123!` |
| **Alex Rivera** (`@alex.ai`) | `user` | `alex@vybe.app` | `Password123!` |
| **Sarah Jenkins** (`@sarah_code`) | `user` | `sarah@vybe.app` | `Password123!` |
| **Equipo VYBE** (`@admin`) | `admin` | `admin@vybe.app` | `Password123!` |

---

## 🛠️ Instalación y Puesta en Marcha

### Prerrequisitos
- **Node.js**: v18 o superior
- **npm** o **pnpm**
- **PostgreSQL** *(opcional: si no está disponible, el sistema activa automáticamente su motor in-memory para desarrollo autónomo sin configuración previa)*.

### 1. Clonar el repositorio
```bash
git clone https://github.com/chulox20/VYBE.git
cd VYBE
```

### 2. Instalar dependencias
```bash
# Instalar en backend y frontend simultáneamente
npm run install:all
```

### 3. Configurar variables de entorno
```bash
# En la carpeta backend/
cp backend/.env.example backend/.env
```

### 4. Ejecutar el proyecto
```bash
# Terminal 1 — Backend (Puerto 5000)
npm run dev:backend

# Terminal 2 — Frontend (Puerto 5173)
npm run dev:frontend
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## 🧪 Pruebas Automatizadas

```bash
# Ejecutar suite de pruebas de endpoints y persistencia
npm run test:backend
```

---

## 📄 Estructura del Monorepo

```
VYBE/
├── backend/
│   ├── src/
│   │   ├── config/          # Variables de entorno y configuración
│   │   ├── controllers/     # Controladores REST
│   │   ├── db/              # Pool PostgreSQL, schema.sql, seeds y memoryStore
│   │   ├── middleware/      # Auth JWT, Roles, Rate Limiter, Upload Multer
│   │   ├── routes/          # Rutas RESTful
│   │   ├── services/        # Lógica de negocio relacional
│   │   ├── sockets/         # Handlers Socket.IO para chat y notificaciones
│   │   ├── utils/           # Helpers y sanitización
│   │   ├── validators/      # Esquemas de validación Zod
│   │   └── server.js        # Servidor Express + HTTP + Socket.IO
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # UI, Feed, Chat, Comments, Profile, Admin
│   │   ├── contexts/        # Auth, Socket, Notification contexts
│   │   ├── pages/           # Landing, Feed, Explore, Search, Communities, Messages, Admin...
│   │   ├── services/        # Cliente API
│   │   └── styles/          # Tailwind CSS y directivas
│   ├── vite.config.js
│   └── package.json
│
└── package.json             # Scripts raíz del monorepo
```

---

## ⚖️ Licencia

Distribuido bajo la Licencia MIT. Desarrollado por **Jesús Pérez** (@chulox).
