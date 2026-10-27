# GridSense AI

A full-stack energy monitoring demo with a FastAPI backend, React dashboard, rule-based alerts, and Isolation Forest anomaly detection.

## Current scope (Milestone 1)
- Deterministic synthetic single-phase electrical readings
- FastAPI backend
- Electrical calculations: apparent power, active power, and estimated interval energy
- Rule-based abnormal-reading flags and an Isolation Forest anomaly detector
- React + TypeScript dashboard
- Automated backend tests

> Safety and validity: all readings are synthetic. This is not connected to electrical equipment and is not suitable for protection, control, or safety decisions. The power calculation assumes a single-phase system: `P(kW) = V × I × PF / 1000`. Real three-phase systems need an appropriate three-phase calculation and validated measurements.

## Requirements
- Python 3.11 or 3.12 recommended
- Node.js 20+ (npm included)
- Git (optional, for version control)

## 1. Start the backend (Windows PowerShell)
Open PowerShell in the extracted `gridsense-ai` folder:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r backend\requirements.txt
uvicorn backend.app.main:app --reload
```

If PowerShell blocks activation, run this for the current terminal only:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```
If `py -3.12` is unavailable, try `py -3.11`; use the same version in the first command.

Backend endpoints:
- http://127.0.0.1:8000/health
- http://127.0.0.1:8000/docs
- http://127.0.0.1:8000/api/summary
- http://127.0.0.1:8000/api/readings
- http://127.0.0.1:8000/api/anomalies

## 2. Start the frontend
Keep the backend terminal running. Open a second PowerShell terminal in the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL Vite prints, usually http://localhost:5173.

## 3. Run tests
From the project root, with the virtual environment activated:

```powershell
python -m pytest
```

## 4. Suggested first GitHub commit
Create a GitHub repository named `gridsense-ai`, then from this folder:

```powershell
git init
git add .
git commit -m "Build GridSense AI monitoring MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gridsense-ai.git
git push -u origin main
```
Replace `YOUR_USERNAME` with your GitHub username.

## Architecture
```text
React + TypeScript (browser)
        |
        | HTTP / JSON
        v
FastAPI backend
   |             |
   v             v
Synthetic data   Engineering rules
generator        + summary calculations
```

## Next milestones
1. Persist readings in PostgreSQL.
2. Add a documented CSV import path for real or public datasets.
3. Evaluate the Isolation Forest on labeled real or public readings, then report precision and recall.
4. Add time-series forecasting with a proper temporal train/test split.
5. Add optional hardware/Modbus ingestion only after validating the electrical and communication setup.

Keep rule-based flags and Isolation Forest predictions clearly distinguished. All current readings are synthetic and are not suitable for safety-critical decisions.

## Deploy to Render

This repository includes a Render Blueprint for the FastAPI backend and React static site. Push the project to GitHub, then in Render choose New → Blueprint, connect the repository, and deploy the Blueprint. The frontend gets the backend URL from the backend service automatically.

The free backend may sleep after inactivity and take about a minute to wake. This setup is for a demo; readings are synthetic and are not suitable for safety-critical use.

