# HealthTracker

A small personal health tracking desktop app built with Vite + TypeScript frontend, Tauri (Rust) backend wrapper, and an optional Python sidecar for data persistence.

It supports logging calories, sleep, and workouts, displays a calendar with entries per day, and computes weekly/monthly averages.

---

## Features
- Log nutrition (food + calories), sleep (hours), and workouts (type, duration).
- Calendar UI that marks days with entries. Click a date to view day entries.
- Weekly and monthly averages for calories, sleep and workouts.
- Local JSON-based persistence by default (stored in the user Documents -> `HealthTracker/data` folder).
- Supports running in a `web` context with localStorage fallback if native sidecar backend is not available.

---

## Architecture & Data Flow
- Frontend: `src/` - TypeScript + Vite UI. Uses Tauri `invoke` to call native commands or falls back to localStorage.
- Tauri (Rust): `src-tauri/src/lib.rs` - registers commands that run Python sidecar.
- Python sidecar: `src-tauri/backend/sidecar.py` - listens on stdin for command JSON, calls `functions.py`, and writes JSON responses to stdout.
- Persistence: `src-tauri/backend/functions.py` reads/writes JSON files into the `DATA_PATH` directory (default is `~/Documents/HealthTracker/data`). Files:
	- `calories.json`
	- `sleep.json`
	- `workouts.json`

---

## Requirements
- Node.js + npm (for dev build / vite): node >= 18 recommended
- Rust toolchain (for Tauri): stable, installed via `rustup` (Windows users should install MSVC toolchain)
- Python 3.x (sidecar): `python` (or `py` on Windows) on PATH. Used by the native wrapper to spawn the sidecar.

Optional (for packaging)
- Tauri prerequisites from the Tauri docs (platform-specific).

---

## Setup & Development
1. Clone and install dependencies:

```powershell
npm install
```

2. Run the development app:

```powershell
npm run tauri dev
```

- The app will display the main UI. Use DevTools (F12) in the app to inspect console logs and errors.
- The Python sidecar will print `DATA_PATH` to stderr on start. Check the terminal running `npm run tauri dev` for sidecar stderr messages.

Notes:
- By default the app stores JSON under: `%USERPROFILE%\\Documents\\HealthTracker\\data` on Windows. You can override this by setting the `HEALTHTRACKER_DATA_DIR` environment variable to a custom directory.

```powershell
$env:HEALTHTRACKER_DATA_DIR = "C:\\Temp\\MyHealthData\\"
npm run tauri dev
```

---

## Commands / Invokes
The frontend uses Tauri `invoke(...)` to call the following native commands (Rust wrappers which call the Python sidecar):
- `log_calories` (payload: `{ food, calories, date? }`)
- `get_calories` -> returns array of calorie entries
- `log_sleep` (payload: `{ hours, quality? , date? }`)
- `get_sleep` -> returns array of sleep entries
- `log_workout` (payload: `{ type, duration, intensity?, date? }`)
- `get_workouts` -> returns array of workout entries
- `get_calorie_averages` -> returns { weekly: {...}, monthly: {...} }
- `get_sleep_averages`
- `get_workout_averages`

---

## Data Format
Each file contains an array of objects with `timestamp` values. Example `calories.json` entry:

```json
[
	{
		"food": "banana",
		"calories": 105,
		"timestamp": "2025-11-28T12:00:00"
	}
]
```

---

## Troubleshooting
- Python spawn errors (e.g. `python: can't open file`) -> ensure Python is installed and `python`, `py`, or `python3` is on PATH.
- Sidecar spawn failure -> check `src-tauri/src/lib.rs` spawn path. It uses the sidecar at `src-tauri/backend/sidecar.py` relative to `CARGO_MANIFEST_DIR`.
- Calendar/Averages not updating:
	- Confirm `invoke('log_*')` succeeded. Check app devtools (console) for `log_* result:` messages.
	- Confirm files are written under Documents: `%USERPROFILE%\\Documents\\HealthTracker\\data`.
	- If `invoke` throws, the app falls back to localStorage, check devtools `Application -> Local Storage` for entries and consider migrating them.
	- Use `renderCalendar()` and `updateAverages()` to re-pull data programmatically (refresh button suggested).

---

## Packaging/Build
- Build frontend: `npm run build`
- Build + package Tauri app: `npm run tauri build`
	- Ensure required platform-specific dependencies are configured (see Tauri packaging docs).

---

## Contributing
- Please open PRs for improvements, and add unit/integration tests when possible.
- If adding features that change the JSON schema, provide a migration script or handle backward compatibility.
- For development, run `npm run tauri dev` for developer server.

---

## Privacy & Data
- User data is stored locally under the Documents folder by default.
- The app does not transmit data externally by default.

---

## Acknowledgements
- Built with Tauri, Vite, TypeScript, and Python for data persistence.

---
