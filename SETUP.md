# 🎉 AmigoPlan — Guía de instalación

## Requisitos previos
- Python 3.13
- Node.js 20
- pipenv (`pip install pipenv`)

---

## 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPO>
cd <nombre-del-repo>
```

---

## 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Abre el `.env` y asegúrate de que tiene esto:

```env
DATABASE_URL=postgres://gitpod:postgres@localhost:5432/example
FLASK_APP_KEY="amigoplan-secret-key"
FLASK_APP=src/app.py
FLASK_DEBUG=1

TICKETMASTER_API_KEY=LM5stswWO5tR4FyRNGjBGDfxLgmc2uR2
```

> ⚠️ La API key de Ticketmaster está incluida pero **puede requerir una URL de callback** configurada en el panel de Ticketmaster para funcionar. Si los eventos no cargan, la app usa datos de demo automáticamente.

---

## 3. Instalar dependencias del backend

```bash
pipenv install
```

---

## 4. Inicializar la base de datos

```bash
pipenv run migrate
pipenv run upgrade
```

---

## 5. Cargar datos de prueba

```bash
pipenv shell
flask insert-test-data
exit
```

Usuarios de demo creados:
| Email | Contraseña |
|-------|-----------|
| marta@test.com | 1234 |
| dani@test.com | 1234 |
| lola@test.com | 1234 |
| juan@test.com | 1234 |

---

## 6. Arrancar el backend

```bash
pipenv run start
```

El backend corre en el puerto **3001**.

---

## 7. Instalar dependencias del frontend

Abre una **nueva terminal**:

```bash
npm install
```

---

## 8. Arrancar el frontend

```bash
npm run start
```

El frontend corre en el puerto **3000**.

---

## Resumen rápido

```bash
# Terminal 1 — Backend
pipenv install
pipenv run migrate
pipenv run upgrade
pipenv shell && flask insert-test-data && exit
pipenv run start

# Terminal 2 — Frontend
npm install
npm run start
```

---

## Estructura del proyecto

```
src/
├── app.py               # Entrada Flask
├── api/
│   ├── models.py        # Modelos de base de datos
│   ├── routes.py        # Endpoints de la API
│   ├── commands.py      # Comandos CLI (insert-test-data)
│   └── admin.py         # Panel de administración
└── front/
    ├── pages/           # Páginas React
    ├── components/      # Componentes reutilizables
    ├── hooks/           # useGlobalReducer
    ├── store.js         # Estado global + helpers API
    └── routes.jsx       # Rutas de la app
```

---

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/register | Registro |
| POST | /api/auth/login | Login |
| GET | /api/groups | Mis grupos |
| POST | /api/groups | Crear grupo |
| POST | /api/groups/:id/spin | Sortear Plan Master |
| GET | /api/plans | Mis planes |
| POST | /api/plans | Crear plan |
| POST | /api/plans/:id/vote | Votar |
| GET | /api/plans/:id/expenses | Gastos |
| GET | /api/events/ticketmaster | Buscar eventos |
