# ImpactLens

Full-stack business impact analysis tool with a React/Vite frontend, an Express backend, and a FastAPI ML service. The frontend now calls the backend `/predict` API, which in turn delegates to the ML service.

## Stack

- Frontend: React 18 + Vite (located in `frontend/`, source in `/src`)
- Backend: Express (port 8000) in `backend/`
- ML service: FastAPI (port 9000) in `ml/prediction_service`

## Quick Start (Docker Compose)

```bash
docker-compose up --build
```

Services and ports:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- ML service: http://localhost:9000

Volumes keep source code mounted for hot reload:
- Frontend mounts the repo to `/app` so `/src` is available to Vite
- Backend mounts `backend/public` and `backend/datasets`

## Manual Development (no Docker)

1) ML service
```bash
cd ml/prediction_service
python -m venv .venv && .venv/Scripts/activate  # Windows
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 9000
```

2) Backend
```bash
cd backend
npm install
set ML_SERVICE_URL=http://localhost:9000
npm start
```

3) Frontend
```bash
cd frontend
npm install
set VITE_API_URL=http://localhost:8000
npm run dev -- --host --port 5173
```

## API Reference

- `POST /predict`
    - Body: `{ businessType, scale, locationKey, locationLabel?, contextSignals?, query? }`
    - Returns prediction payload + AI explanation
- `GET /predict/locations` – available location profiles
- `POST /simulate` – simulation endpoint
- `GET /health` – service health check

## Configuration

- Frontend: `VITE_API_URL` (defaults to `http://localhost:8000`)
- Backend: `ML_SERVICE_URL` (defaults to `http://localhost:9000`)

## Data Flow

1. User adds a business and places it on the map
2. Frontend sends a request to backend `/predict`
3. Backend calls ML service `/predict` and generates an AI explanation
4. Frontend merges ML results with local analytics for display and exports

## Testing / Validation

- Hit `http://localhost:8000/health` to confirm backend is running
- From the frontend, ensure predictions render after placing a business on the map
