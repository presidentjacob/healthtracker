#!/usr/bin/env python3
"""
Tauri Python Sidecar for health tracker.
Reads commands from stdin as JSON, executes them, and writes JSON results to stdout.
"""

import json
import sys
import os

# Add backend to path so we can import functions and config
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from functions import log_calories, log_sleep, log_workout, load_data
from functions import (
    log_calories,
    log_sleep,
    log_workout,
    load_data,
    get_calorie_averages,
    get_sleep_averages,
    get_workout_averages,
)
from config import CALORIE_FILE, SLEEP_FILE, WORKOUT_FILE, DATA_PATH

# print where files are being stored (stderr) to avoid contaminating stdout JSON
try:
    sys.stderr.write(f"[sidecar] DATA_PATH={DATA_PATH}\n")
    sys.stderr.flush()
except Exception:
    pass


def get_calories():
    """Read and return all calorie entries."""
    return load_data(CALORIE_FILE)


def get_sleep():
    """Read and return all sleep entries."""
    return load_data(SLEEP_FILE)


def get_workouts():
    """Read and return all workout entries."""
    return load_data(WORKOUT_FILE)


def handle_command(cmd_dict):
    """Execute a command and return the result."""
    cmd = cmd_dict.get("command")
    
    if cmd == "log_calories":
        food = cmd_dict.get("food")
        calories = cmd_dict.get("calories")
        date = cmd_dict.get("date")
        if food is None or calories is None:
            return {"error": "Missing food or calories"}
        return {"success": True, "data": log_calories(food, int(calories), date)}
    
    elif cmd == "get_calories":
        return {"success": True, "data": get_calories()}
    
    elif cmd == "log_sleep":
        hours = cmd_dict.get("hours")
        quality = cmd_dict.get("quality")
        date = cmd_dict.get("date")
        if hours is None:
            return {"error": "Missing hours"}
        # quality is optional and will default in the functions layer
        try:
            return {"success": True, "data": log_sleep(float(hours), quality, date)}
        except Exception as e:
            return {"error": f"Failed to log sleep: {e}"}
    
    elif cmd == "get_sleep":
        return {"success": True, "data": get_sleep()}
    
    elif cmd == "log_workout":
        # accept `exercise` or `type` from frontend
        exercise = cmd_dict.get("exercise") or cmd_dict.get("type")
        duration = cmd_dict.get("duration")
        intensity = cmd_dict.get("intensity")
        date = cmd_dict.get("date")
        if exercise is None or duration is None:
            return {"error": "Missing exercise or duration"}
        try:
            return {"success": True, "data": log_workout(exercise, float(duration), intensity, date)}
        except Exception as e:
            return {"error": f"Failed to log workout: {e}"}
    
    elif cmd == "get_workouts":
        return {"success": True, "data": get_workouts()}

    elif cmd == "get_calorie_averages":
        return {"success": True, "data": get_calorie_averages()}

    elif cmd == "get_sleep_averages":
        return {"success": True, "data": get_sleep_averages()}

    elif cmd == "get_workout_averages":
        return {"success": True, "data": get_workout_averages()}
    
    else:
        return {"error": f"Unknown command: {cmd}"}


def main():
    """Main loop: read JSON commands from stdin, write JSON responses to stdout."""
    for line in sys.stdin:
        try:
            cmd_dict = json.loads(line.strip())
            result = handle_command(cmd_dict)
            print(json.dumps(result))
            sys.stdout.flush()
        except json.JSONDecodeError as e:
            error_response = {"error": f"Invalid JSON: {e}"}
            print(json.dumps(error_response))
            sys.stdout.flush()
        except Exception as e:
            error_response = {"error": str(e)}
            print(json.dumps(error_response))
            sys.stdout.flush()


if __name__ == "__main__":
    main()
