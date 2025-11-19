import json
import sys
import os

# Add backend to path so we can importn functions and config
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from functions import log_calories, log_sleep, log_workout, load_data
from config import CALORIE_FILE, SLEEP_FILE, WORKOUT_FILE

def get_calories():
    # Load and return calorie data
    return load_data(CALORIE_FILE)

def get_sleep():
    # Load and return sleep data
    return load_data(SLEEP_FILE)

def get_workouts():
    # Load and return workout data
    return load_data(WORKOUT_FILE)

def handle_command(cmd_dict):
    # Handle commands based on the 'command' key in cmd_dict
    command = cmd_dict.get("command")

    if command == "log_calories":
        food = cmd_dict.get("food")
        calories = cmd_dict.get("calories")
        if food is None or calories is None:
            return {"status": "error", "message": "Missing 'food' or 'calories' parameter"}
        return {"success": True, "data": log_calories(food, int(calories))}
    elif command == "get_calories":
        return {"success": True, "data": get_calories()}
    elif command == "log_sleep":
        hours = cmd_dict.get("hours")
        if hours is None:
            return {"status": "error", "message": "Missing 'hours' parameter"}
        return {"success": True, "data": log_sleep(float(hours))}
    elif command == "get_sleep":
        return {"success": True, "data": get_sleep()}
    elif command == "log_workout":
        exercise = cmd_dict.get("exercise")
        duration = cmd_dict.get("duration")
        if exercise is None or duration is None:
            return {"status": "error", "message": "Missing 'exercise' or 'duration' parameter"}
        return {"success": True, "data": log_workout(exercise, float(duration))}
    elif command == "get_workouts":
        return {"success": True, "data": get_workouts()}
    else:
        return {"status": "error", "message": "Unknown command"}
    
def main(): 
    # main function will read JSON commands from stdin and write JSON responses to stdout
    for line in sys.stdin:
        try:
            cmd_dict = json.loads(line.strip())
            result = handle_command(cmd_dict)
            print(json.dumps(result))
            sys.stdout.flush()
        except json.JSONDecodeError as e:
            error_response = {"status": "error", "message": f"Invalid JSON: {str(e)}"}
            print(json.dumps(error_response))
            sys.stdout.flush()
        except Exception as e:
            error_response = {"status": "error", "message": f"An error occurred: {str(e)}"}
            print(json.dumps(error_response))
            sys.stdout.flush()

if __name__ == "__main__":
    main()