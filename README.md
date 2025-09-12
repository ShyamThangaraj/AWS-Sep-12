# Startup Voice Agent

A full-stack application with Next.js frontend and FastAPI backend.

## Project Structure

```
├── frontend/          # Next.js application
├── backend/           # FastAPI application
└── README.md
```

## Getting Started

### Backend (FastAPI)

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Activate the virtual environment:

   ```bash
   source venv/bin/activate  # On macOS/Linux
   # or
   venv\Scripts\activate     # On Windows
   ```

3. Install dependencies (if not already installed):

   ```bash
   pip install -r requirements.txt
   ```

4. Run the FastAPI server:
   ```bash
   python main.py
   # or
   uvicorn main:app --reload
   ```

The API will be available at `http://localhost:8000`

### Frontend (Next.js)

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies (if not already installed):

   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /docs` - Interactive API documentation (Swagger UI)

## Development

- Backend runs on port 8000
- Frontend runs on port 3000
- CORS is configured to allow communication between frontend and backend
