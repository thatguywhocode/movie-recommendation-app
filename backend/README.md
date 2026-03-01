# Movie Recommendation App

A simple movie recommendation app with separate `backend` and `frontend` folders.

**Prerequisites**
- Node.js (v16+ recommended) and `npm` or `pnpm`

**Quick Start (Windows PowerShell)**

Backend

```powershell
cd backend
npm install
# initialize the SQLite DB (if needed)
node db/initDb.js
# start the backend server
node server.js
```

Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open the frontend URL shown by Vite (usually http://localhost:5173) in your browser.

**Notes**
- The backend has dependencies listed in `backend/package.json`; there is no `start` script, so `node server.js` is used to run the server.
- The frontend uses Vite; use `npm run build` to build for production and `npm run preview` to preview the production build.
- If the backend relies on environment variables, add a `.env` file in `backend/` before starting.

If you want, I can add an `npm start` script to the backend `package.json` and a simple dev script for running both services concurrently.

