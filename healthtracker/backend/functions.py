#backend/functions.py

import json, os
from datetime import datetime
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
    entries.append({"food": food, "calories": calories, "timestamp": datetime.now().isoformat()})
    save_data(CALORIE_FILE, entries)
    return entries

def log_sleep(hours, quality):
    entries = load_data(SLEEP_FILE)
    entries.append({"hours": hours, "quality": quality, "timestamp": datetime.now().isoformat()})
    save_data(SLEEP_FILE, entries)
    return entries

def log_workout(exercise, duration, intensity):
    entries = load_data(WORKOUT_FILE)
    entries.append({"exercise": exercise, "duration": duration, "intensity": intensity, "timestamp": datetime.now().isoformat()})
    save_data(WORKOUT_FILE, entries)
    return entries

