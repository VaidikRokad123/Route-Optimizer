# 🛣️ RouteAI — Smart Route Optimizer

AI-powered garbage truck route optimization system that clusters delivery points and computes the shortest possible route for each truck using classical optimization algorithms.

---

## 🚀 Overview

RouteAI helps municipalities and logistics teams optimize garbage collection routes by:
- Reducing total travel distance
- Balancing workload across trucks
- Visualizing routes interactively on a real-world map

The system combines **AI techniques and graph algorithms** with a modern web interface to deliver efficient and interpretable routing solutions.

---

## 🧠 How It Works

1. Upload an Excel file containing house locations and depot coordinates
2. **K-Means Clustering** groups houses into clusters (one cluster per truck)
3. **TSP Solver (Nearest Neighbor + 2-Opt)** finds the shortest route for each cluster
4. Routes and statistics are displayed on an **interactive dashboard and map**

---

## 📸 Application Screenshots

> 📂 Place all screenshots inside the `/screenshots` directory

### 🔹 Upload & Optimization Setup
Excel upload interface with truck count selection.

<img width="1919" height="914" alt="Screenshot 2026-02-19 133044" src="https://github.com/user-attachments/assets/4e7a249f-3f06-412c-bb61-3827e2953172" />


---

### 🔹 Route Optimization Dashboard
Dashboard showing optimization summary and performance metrics.

<img width="1919" height="914" alt="Screenshot 2026-02-19 133112" src="https://github.com/user-attachments/assets/f70d10ca-9083-403c-ba62-5aaaddccff33" />

<img width="1339" height="465" alt="Screenshot 2026-02-19 133138" src="https://github.com/user-attachments/assets/f10055cb-67d3-41c8-94c5-56140a4661df" />


---

### 🔹 Interactive Map Visualization
Color-coded optimized routes for each truck on a real city map.

<img width="1919" height="876" alt="image" src="https://github.com/user-attachments/assets/5ec1a767-997f-48e6-9f15-a52ac36ba680" />


---

## 🛠️ Tech Stack

| Layer | Technology |
|-----|-----------|
| Frontend | React, Vite, Leaflet.js |
| Backend | Python, Flask |
| Algorithms | K-Means, Nearest Neighbor TSP, 2-Opt |
| Data | Excel (.xlsx) |

---

## 📁 Project Structure


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
