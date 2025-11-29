#backend/functions.py

import json
import os
import tempfile
from datetime import datetime
from config import CALORIE_FILE, SLEEP_FILE, WORKOUT_FILE, DATA_PATH

#create data folder if missing
if not os.path.exists(DATA_PATH):
    os.makedirs(DATA_PATH)

def save_data(filename, data):
    # Write atomically: write to temp file then move
    dir_name = os.path.dirname(filename)
    fd, tmp_path = tempfile.mkstemp(dir=dir_name)
    try:
        with os.fdopen(fd, 'w') as f:
            json.dump(data, f, indent=4)
        os.replace(tmp_path, filename)
    except Exception:
        # cleanup tmp file on error
        try:
            os.remove(tmp_path)
        except Exception:
            pass
        raise

def load_data(filename):
    # ensure directory exists
    dir_name = os.path.dirname(filename)
    if not os.path.exists(dir_name):
        os.makedirs(dir_name, exist_ok=True)

    # if file doesn't exist, create empty json array and return []
    if not os.path.exists(filename):
        try:
            save_data(filename, [])
        except Exception:
            # if the save fails, still behave reasonably
            pass
        return []

    try:
        with open(filename, "r") as f:
            return json.load(f)
    except json.JSONDecodeError:
        # If JSON is corrupt, return empty list to avoid crashes
        return []
    except Exception:
        return []

#log functions
def log_calories(food, calories, date=None):
    entries = load_data(CALORIE_FILE)
    ts = _normalize_timestamp(date)
    entries.append({"food": food, "calories": calories, "timestamp": ts})
    save_data(CALORIE_FILE, entries)
    return entries

def log_sleep(hours, quality=None, date=None):
    entries = load_data(SLEEP_FILE)
    ts = _normalize_timestamp(date)
    entries.append({"hours": hours, "quality": (quality or "ok"), "timestamp": ts})
    save_data(SLEEP_FILE, entries)
    return entries

def log_workout(exercise, duration, intensity=None, date=None):
    entries = load_data(WORKOUT_FILE)
    ts = _normalize_timestamp(date)
    entries.append({"exercise": exercise, "duration": duration, "intensity": (intensity or "medium"), "timestamp": ts})
    save_data(WORKOUT_FILE, entries)
    return entries


def _normalize_timestamp(date_val=None):
    if not date_val:
        return datetime.now().isoformat()
    try:
        if "T" in date_val:
            return datetime.fromisoformat(date_val).isoformat()
        return datetime.fromisoformat(date_val + "T12:00:00").isoformat()
    except Exception:
        return datetime.now().isoformat()


# Helper: calculate weekly/monthly averages by date and numeric key
def _calculate_averages(entries, value_key):
    daily_totals = {}
    for e in entries:
        ts = e.get("timestamp")
        if not ts:
            continue
        try:
            d = datetime.fromisoformat(ts).date()
        except Exception:
            continue
        daily_totals[d] = daily_totals.get(d, 0.0) + float(e.get(value_key, 0.0))

    weekly_raw = {}
    monthly_raw = {}
    for d, total in daily_totals.items():
        iso_year, iso_week, _ = d.isocalendar()
        week_key = f"{iso_year}-W{iso_week:02d}"
        weekly_raw.setdefault(week_key, {"sum": 0.0, "days": 0})
        weekly_raw[week_key]["sum"] += total
        weekly_raw[week_key]["days"] += 1

        month_key = f"{d.year}-{d.month:02d}"
        monthly_raw.setdefault(month_key, {"sum": 0.0, "days": 0})
        monthly_raw[month_key]["sum"] += total
        monthly_raw[month_key]["days"] += 1

    weekly = {k: v["sum"]/v["days"] for k, v in weekly_raw.items() if v["days"]>0}
    monthly = {k: v["sum"]/v["days"] for k, v in monthly_raw.items() if v["days"]>0}
    return {"weekly": weekly, "monthly": monthly}


def get_calorie_averages():
    entries = load_data(CALORIE_FILE)
    return _calculate_averages(entries, "calories")


def get_sleep_averages():
    entries = load_data(SLEEP_FILE)
    return _calculate_averages(entries, "hours")


def get_workout_averages():
    entries = load_data(WORKOUT_FILE)
    return _calculate_averages(entries, "duration")

