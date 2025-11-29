# backend/config.py
import os
import shutil

# Default: ~/Documents/HealthTracker/data
home_dir = os.path.expanduser("~")
documents_dir = os.path.join(home_dir, "Documents")
default_app_dir = os.path.join(documents_dir, "HealthTracker", "data")

# Allow override via environment variable
DATA_PATH = os.environ.get("HEALTHTRACKER_DATA_DIR", default_app_dir)
DATA_PATH = os.path.normpath(DATA_PATH)

# Ensure trailing separator is consistent
if not DATA_PATH.endswith(os.path.sep):
	DATA_PATH = DATA_PATH + os.path.sep

# Ensure the folder exists
os.makedirs(DATA_PATH, exist_ok=True)

CALORIE_FILE = os.path.join(DATA_PATH, "calories.json")
SLEEP_FILE = os.path.join(DATA_PATH, "sleep.json")
WORKOUT_FILE = os.path.join(DATA_PATH, "workouts.json")