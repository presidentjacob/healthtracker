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
from config import CALORIE_FILE, SLEEP_FILE, WORKOUT_FILE


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
        if food is None or calories is None:
            return {"error": "Missing food or calories"}
        return {"success": True, "data": log_calories(food, int(calories))}
    
    elif cmd == "get_calories":
        return {"success": True, "data": get_calories()}
    
    elif cmd == "log_sleep":
        hours = cmd_dict.get("hours")
        quality = cmd_dict.get("quality")
        if hours is None or quality is None:
            return {"error": "Missing hours or quality"}
        return {"success": True, "data": log_sleep(int(hours), quality)}
    
    elif cmd == "get_sleep":
        return {"success": True, "data": get_sleep()}
    
    elif cmd == "log_workout":
        exercise = cmd_dict.get("exercise")
        duration = cmd_dict.get("duration")
        intensity = cmd_dict.get("intensity")
        if any(x is None for x in [exercise, duration, intensity]):
            return {"error": "Missing exercise, duration, or intensity"}
        return {"success": True, "data": log_workout(exercise, int(duration), intensity)}
    
    elif cmd == "get_workouts":
        return {"success": True, "data": get_workouts()}
    
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
