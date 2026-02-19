# 🛣️ RouteAI — Smart Route Optimizer

AI-powered garbage truck route optimization system that clusters delivery points and finds the shortest path for each truck.

## How It Works

1. **Upload** an Excel file with house locations and depot coordinates
2. **K-Means Clustering** groups houses into clusters (one per truck)
3. **TSP Solver** (Nearest Neighbor + 2-Opt) finds the optimal route within each cluster
4. **Interactive Map** displays all routes with color-coded paths

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Leaflet.js |
| Backend | Python, Flask |
| Algorithm | K-Means, Nearest Neighbor TSP, 2-Opt |

## Project Structure

```
├── backend/
│   ├── app.py              # Flask API server
│   ├── optimizer.py         # Route optimization logic
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/           # Upload & Dashboard pages
│   │   └── components/      # Navbar, MapView, RouteSummary
│   └── package.json
├── main.py                  # Original standalone script
└── smart_route_optimization.xlsx  # Demo data
```

## Setup & Run

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Runs on `http://localhost:8000`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/optimize?clusters=20` | Upload Excel & optimize |
| GET | `/api/optimize/demo` | Run with demo data |

## Features

- Drag-and-drop Excel file upload
- Configurable number of trucks
- Interactive map with color-coded routes
- Click any truck to view its individual route and stats
- Per-truck summary table with distance and efficiency