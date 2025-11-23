#backend/functions.py

import json, os
from datetime import datetime, date
from config import CALORIE_FILE, SLEEP_FILE, WORKOUT_FILE, DATA_PATH

#create data folder if missing
if not os.path.exists(DATA_PATH):
    os.makedirs(DATA_PATH)

def save_data(filename, data):
    with open(filename, "w") as f:
        json.dump(data, f, indent=4)

def load_data(filename):
    if not os.path.exists(filename):
        return []
    with open(filename, "r") as f:
        return json.load(f)

#log functions
def log_calories(food, calories):
    entries = load_data(CALORIE_FILE)
    entries.append({
        "food": food,
        "calories": calories,
        "timestamp": datetime.now().isoformat()
    })
    save_data(CALORIE_FILE, entries)
    return entries

def log_sleep(hours, quality):
    entries = load_data(SLEEP_FILE)
    entries.append({
        "hours": hours,
        "quality": quality,
        "timestamp": datetime.now().isoformat()
    })
    save_data(SLEEP_FILE, entries)
    return entries

def log_workout(exercise, duration, intensity):
    entries = load_data(WORKOUT_FILE)
    entries.append({
        "exercise": exercise,
        "duration": duration,
        "intensity": intensity,
        "timestamp": datetime.now().isoformat()
    })
    save_data(WORKOUT_FILE, entries)
    return entries

#helper to compute weekly/monthly averages
def _calculate_averages(entries, value_key):
    daily_totals = {}
    for e in entries:
        ts_str = e.get("timestamp")
        if not ts_str:
            continue
        try:
            ts = datetime.fromisoformat(ts_str)
        except Exception:
            continue
        d = ts.date()
        daily_totals[d] = daily_totals.get(d, 0.0) + float(e.get(value_key, 0.0))

    weekly_raw = {}
    monthly_raw = {}

    for d, total in daily_totals.items():
        iso_year, iso_week, _ = d.isocalendar()
        week_key = f"{iso_year}-W{iso_week:02d}"
        if week_key not in weekly_raw:
            weekly_raw[week_key] = {"sum": 0.0, "days": 0}
        weekly_raw[week_key]["sum"] += total
        weekly_raw[week_key]["days"] += 1

        month_key = f"{d.year}-{d.month:02d}"
        if month_key not in monthly_raw:
            monthly_raw[month_key] = {"sum": 0.0, "days": 0}
        monthly_raw[month_key]["sum"] += total
        monthly_raw[month_key]["days"] += 1

    weekly = {k: v["sum"] / v["days"] for k, v in weekly_raw.items() if v["days"] > 0}
    monthly = {k: v["sum"] / v["days"] for k, v in monthly_raw.items() if v["days"] > 0}

    return {
        "weekly": weekly,
        "monthly": monthly
    }

def get_calorie_averages():
    entries = load_data(CALORIE_FILE)
    return _calculate_averages(entries, "calories")

def get_sleep_averages():
    entries = load_data(SLEEP_FILE)
    return _calculate_averages(entries, "hours")

def get_workout_averages():
    entries = load_data(WORKOUT_FILE)
    return _calculate_averages(entries, "duration")
