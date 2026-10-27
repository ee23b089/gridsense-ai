# GridSense AI

A placement portfolio starter combining electrical engineering fundamentals, backend API development, data visualization, and rule-based anomaly detection.

## Current scope (Milestone 1)
- Deterministic synthetic single-phase electrical readings
- FastAPI backend
- Electrical calculations: apparent power, active power, and estimated interval energy
- Rule-based abnormal-reading flags (explicitly not a trained AI model)
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
3. Add ML anomaly detection and evaluate precision/recall on labeled test data.
4. Add time-series forecasting with a proper temporal train/test split.
5. Add optional hardware/Modbus ingestion only after validating the electrical and communication setup.

Do not describe the current rules as machine learning or predictive failure detection. The first version flags threshold-based anomalies only.
