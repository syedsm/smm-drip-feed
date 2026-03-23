# SMM Drip-Feed System (Lightweight)

A MERN-based SMM Drip-Feed system using **Agenda.js** for background jobs (No Redis/BullMQ) and **Socket.io** for real-time progress updates.

## Features
- **Lightweight Jobs**: Agenda.js uses MongoDB to manage background tasks.
- **Real-time Progress**: Socket.io emits events to the frontend as drips are processed.
- **Drip Control**: Orders automically transition from `active` and schedule drips based on `dripInterval`.
- **PM2 Ready**: Pre-configured for process management.

## Local Test Steps

1.  **Install Dependencies**:
    ```bash
    # Backend
    cd backend
    npm install

    # Frontend
    cd ../frontend
    npm install
    ```

2.  **Environment Setup**:
    - Copy `backend/.env.example` to `backend/.env` and set your `MONGODB_URI`.

3.  **Start Services**:
    ```bash
    # Option A: Local Dev
    # Terminal 1 (Backend)
    cd backend
    npm run dev

    # Terminal 2 (Frontend)
    cd frontend
    npm run dev
    ```

    ```bash
    # Option B: PM2 (Production/Background)
    cd backend
    pm2 start ecosystem.config.js
    ```

4.  **Test Like a Real User**:
    - Open browser to `http://localhost:5173/orders`.
    - Place a "Drip Order" (ensure `status` is set to `active` and `nextDripAt` is set or default).
    - Close the tab or browser.
    - Reopen after 1 minute; you should see the `delivered` count incremented via the real-time table.

## Deployment (Render.com)

1.  **Backend**:
    - Connect your repo.
    - Build Command: `npm install`
    - Start Command: `node src/index.js`
    - Add Env Vars: `MONGODB_URI`, `PORT`, `NODE_ENV`.

2.  **Frontend**:
    - Build Command: `npm run build`
    - Publish Directory: `dist`
