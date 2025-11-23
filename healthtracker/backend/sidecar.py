import json
import sys
import os

#add backend to path to be able to import functions and config
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from functions import (
    log_calories,
    log_sleep,
    log_workout,
    load_data,
    get_calorie_averages,
    get_sleep_averages,
    get_workout_averages,
)
from config import CALORIE_FILE, SLEEP_FILE, WORKOUT_FILE

def get_calories():
    return load_data(CALORIE_FILE)

def get_sleep():
    return load_data(SLEEP_FILE)

def get_workouts():
    return load_data(WORKOUT_FILE)

def handle_command(cmd_dict):
    command = cmd_dict.get("command")

    if command == "log_calories":
        food = cmd_dict.get("food")
        calories = cmd_dict.get("calories")
        if food is None or calories is None:
            return {"status":"error","message":"Missing 'food' or 'calories' parameter"}
        return {"success":True,"data":log_calories(food,int(calories))}

    elif command == "get_calories":
        return {"success":True,"data":get_calories()}

    elif command == "log_sleep":
        hours = cmd_dict.get("hours")
        quality = cmd_dict.get("quality","ok")
        if hours is None:
            return {"status":"error","message":"Missing 'hours' parameter"}
        return {"success":True,"data":log_sleep(float(hours),quality)}

    elif command == "get_sleep":
        return {"success":True,"data":get_sleep()}

    elif command == "log_workout":
        wtype = cmd_dict.get("type")  # matches main.ts payload
        duration = cmd_dict.get("duration")
        intensity = cmd_dict.get("intensity","medium")
        if wtype is None or duration is None:
            return {"status":"error","message":"Missing 'type' or 'duration' parameter"}
        return {"success":True,"data":log_workout(wtype,float(duration),intensity)}

    elif command == "get_workouts":
        return {"success":True,"data":get_workouts()}

    # average commands
    elif command == "get_calorie_averages":
        return {"success":True,"data":get_calorie_averages()}

    elif command == "get_sleep_averages":
        return {"success":True,"data":get_sleep_averages()}

    elif command == "get_workout_averages":
        return {"success":True,"data":get_workout_averages()}

    else:
        return {"status":"error","message":"Unknown command"}

def main():
    for line in sys.stdin:
        try:
            cmd_dict = json.loads(line.strip())
            result = handle_command(cmd_dict)
            print(json.dumps(result))
            sys.stdout.flush()
        except json.JSONDecodeError as e:
            error_response = {"status":"error","message":f"Invalid JSON: {str(e)}"}
            print(json.dumps(error_response))
            sys.stdout.flush()
        except Exception as e:
            error_response = {"status":"error","message":f"An error occurred: {str(e)}"}
            print(json.dumps(error_response))
            sys.stdout.flush()

if __name__ == "__main__":
    main()
