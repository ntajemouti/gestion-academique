# MyISTA Services — Laravel 11 API Backend

Full REST API backend for the **MyISTA Services** academic management platform.  
Built with Laravel 11, Sanctum token authentication, MySQL, and role-based access control.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Laravel 11 |
| Auth | Laravel Sanctum (Bearer tokens) |
| Database | MySQL 8+ |
| PHP | 8.2+ |
| CORS | fruitcake/laravel-cors (built-in) |

---

## Roles

| Role | Access |
|---|---|
| `Administrateur` | Full CRUD on all resources |
| `Formateur` | Own modules, absences & notes for their students |
| `Stagiaire` | Read own data, submit demandes, join clubs |

---

## Quick Start

### 1. Install dependencies

```bash
composer install
```

### 2. Environment setup

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` and set your MySQL credentials:

```env
DB_DATABASE=myista_db
DB_USERNAME=root
DB_PASSWORD=your_password
```

### 3. Create the database

```sql
CREATE DATABASE myista_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Run migrations + seed

```bash
php artisan migrate --seed
```

This creates all tables and populates them with:
- 1 Admin, 3 Formateurs, 3 Stagiaires
- 3 Filières, 6 Modules, 2 Groupes
- 2 Clubs, sample Notes, Absences, Demandes, and Emplois du Temps

**Default credentials:**

| Role | Email | Password |
|---|---|---|
| Admin | admin@myista.ma | password |
| Formateur | k.benali@myista.ma | password |
| Stagiaire | a.ouali@myista.ma | password |

### 5. Create storage symlink

```bash
php artisan storage:link
```

### 6. Start the server

```bash
php artisan serve
# → http://localhost:8000
```

---

## Project Structure

```
app/
├── Http/
│   ├── Controllers/Api/
│   │   ├── AuthController.php
│   │   ├── DashboardController.php
│   │   ├── UserController.php
│   │   ├── FiliereController.php
│   │   ├── ModuleController.php
│   │   ├── GroupeController.php
│   │   ├── ClubController.php
│   │   ├── DemandeController.php
│   │   ├── AbsenceController.php
│   │   ├── NoteController.php
│   │   └── EmploiDuTempsController.php
│   └── Middleware/
│       └── RoleMiddleware.php
├── Models/
│   ├── User.php
│   ├── Filiere.php
│   ├── Module.php
│   ├── Groupe.php
│   ├── Club.php
│   ├── Demande.php
│   ├── Absence.php
│   ├── Note.php
│   └── EmploiDuTemps.php
database/
├── migrations/          # 9 migration files
└── seeders/
    └── DatabaseSeeder.php
routes/
└── api.php              # All API routes
config/
├── cors.php             # CORS for localhost:5173
└── sanctum.php
```

---

## API Reference

### Authentication

All protected routes require the header:
```
Authorization: Bearer {token}
```

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login → returns Bearer token |
| POST | `/api/auth/logout` | Auth | Revoke current token |
| GET | `/api/auth/me` | Auth | Get authenticated user |
| PUT | `/api/auth/password` | Auth | Change password |

---

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Role-aware stats (counts, averages) |

---

### Filières

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/filieres` | All |
| GET | `/api/filieres/{id}` | All |
| POST | `/api/filieres` | Admin |
| PUT | `/api/filieres/{id}` | Admin |
| DELETE | `/api/filieres/{id}` | Admin |

**Query params:** `?statut=Actif`, `?search=dev`

---

### Modules

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/modules` | All (Formateur: own only) |
| GET | `/api/modules/{id}` | All |
| POST | `/api/modules` | Admin |
| PUT | `/api/modules/{id}` | Admin |
| DELETE | `/api/modules/{id}` | Admin |

**Query params:** `?filiere_id=1`, `?formateur_id=2`, `?search=web`

---

### Groupes

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/groupes` | All |
| GET | `/api/groupes/{id}` | All (includes timetable + students) |
| POST | `/api/groupes` | Admin |
| PUT | `/api/groupes/{id}` | Admin |
| DELETE | `/api/groupes/{id}` | Admin |

---

### Users

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/users` | Admin |
| POST | `/api/users` | Admin |
| GET | `/api/users/{id}` | Admin |
| PUT | `/api/users/{id}` | Admin |
| DELETE | `/api/users/{id}` | Admin (deactivates) |
| PATCH | `/api/users/{id}/statut` | Admin |
| GET | `/api/users/formateurs` | All (for dropdowns) |
| GET | `/api/users/stagiaires` | Admin + Formateur |

---

### Clubs

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/clubs` | All |
| GET | `/api/clubs/{id}` | All |
| POST | `/api/clubs` | Admin |
| PUT | `/api/clubs/{id}` | Admin |
| DELETE | `/api/clubs/{id}` | Admin |
| POST | `/api/clubs/{id}/join` | All |
| DELETE | `/api/clubs/{id}/leave` | All |
| DELETE | `/api/clubs/{id}/members/{userId}` | Admin |

---

### Demandes

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/demandes` | Admin: all; Stagiaire: own |
| GET | `/api/demandes/{id}` | Owner or Admin |
| POST | `/api/demandes` | All (multipart for file upload) |
| DELETE | `/api/demandes/{id}` | Owner (only if En attente) |
| PATCH | `/api/demandes/{id}/approve` | Admin |
| PATCH | `/api/demandes/{id}/reject` | Admin |

**POST body:** `type`, `description`, `fichier` (optional PDF/image ≤5MB)

---

### Absences

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/absences` | Admin: all; Formateur: own; Stagiaire: own |
| GET | `/api/absences/{id}` | Scoped |
| POST | `/api/absences` | Admin + Formateur |
| PUT | `/api/absences/{id}` | Admin + Formateur (own) |
| DELETE | `/api/absences/{id}` | Admin + Formateur (own) |
| GET | `/api/absences/stats?stagiaire_id=X` | Scoped |

---

### Notes

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/notes` | Scoped by role |
| GET | `/api/notes/{id}` | Scoped |
| POST | `/api/notes` | Admin + Formateur |
| PUT | `/api/notes/{id}` | Admin + Formateur (own) |
| DELETE | `/api/notes/{id}` | Admin + Formateur (own) |
| GET | `/api/notes/bulletin?stagiaire_id=X` | Admin + Formateur + own Stagiaire |

---

### Emplois du Temps

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/emplois-du-temps` | Scoped by role (returns grouped by day) |
| GET | `/api/emplois-du-temps/{id}` | All |
| POST | `/api/emplois-du-temps` | Admin (conflict-checked) |
| PUT | `/api/emplois-du-temps/{id}` | Admin |
| DELETE | `/api/emplois-du-temps/{id}` | Admin |

---

## Connecting to React

In your React frontend, set the base URL and send the token:

```typescript
// src/api/client.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('myista_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 → redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('myista_token');
      window.location.href = '/#/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

### Login example

```typescript
const { data } = await api.post('/auth/login', { email, password });
localStorage.setItem('myista_token', data.token);
// data.user contains the full authenticated user object
```

---

## Response Format

All endpoints return JSON. Errors follow this shape:

```json
{
  "message": "Description lisible",
  "errors": {              // only on 422 validation errors
    "field": ["rule error message"]
  }
}
```

HTTP status codes used: `200`, `201`, `401`, `403`, `404`, `422`.

---

## Notes

- **Passwords** are never returned in API responses (hidden on the User model).
- **Deletion is soft** for Users (sets `statut = Inactif`) to preserve historical data.
- **Conflict detection** on EmploiDuTemps prevents double-booking a room, formateur, or groupe at the same time slot.
- **File uploads** (demandes, absences) are stored under `storage/app/public/` and served via `/storage/` after `php artisan storage:link`.
