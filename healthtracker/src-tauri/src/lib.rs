// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::io::Write;
use std::process::{Command, Stdio};
use serde_json::json;
use serde_json::Value as JsonValue;

fn run_python_sidecar(cmd: &JsonValue) -> Result<JsonValue, String> {
    // spawn `python backend/sidecar.py` (requires python available in PATH)
    let mut child = Command::new("python")
        .arg("backend/sidecar.py")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .map_err(|e| format!("failed to spawn sidecar: {}", e))?;

    // write command JSON + newline
    if let Some(mut stdin) = child.stdin.take() {
        let s = cmd.to_string() + "\n";
        stdin.write_all(s.as_bytes()).map_err(|e| format!("failed to write to sidecar stdin: {}", e))?;
    }

    // read stdout until EOF
    let output = child
        .wait_with_output()
        .map_err(|e| format!("failed to read sidecar output: {}", e))?;
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    if stdout.trim().is_empty() {
        return Err("sidecar returned empty output".into());
    }
    serde_json::from_str(&stdout).map_err(|e| format!("failed to parse sidecar json: {} (raw: {})", e, stdout))
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn log_calories(food: String, calories: f64, date: Option<String>) -> Result<JsonValue, String> {
    let mut cmd = json!({"command":"log_calories","food": food, "calories": calories});
    if let Some(d) = date { cmd["date"] = json!(d); }
    let res = run_python_sidecar(&cmd)?;
    Ok(res)
}

#[tauri::command]
fn get_calories() -> Result<JsonValue, String> {
    let cmd = json!({"command":"get_calories"});
    run_python_sidecar(&cmd)
}

#[tauri::command]
fn log_sleep(hours: f64, quality: Option<String>, date: Option<String>) -> Result<JsonValue, String> {
    let mut cmd = json!({"command":"log_sleep","hours": hours});
    if let Some(q) = quality { cmd["quality"] = json!(q); }
    if let Some(d) = date { cmd["date"] = json!(d); }
    run_python_sidecar(&cmd)
}

#[tauri::command]
fn get_sleep() -> Result<JsonValue, String> {
    let cmd = json!({"command":"get_sleep"});
    run_python_sidecar(&cmd)
}

#[tauri::command]
fn log_workout(r#type: String, duration: f64, intensity: Option<String>, date: Option<String>) -> Result<JsonValue, String> {
    let mut cmd = json!({"command":"log_workout","type": r#type, "duration": duration});
    if let Some(int) = intensity { cmd["intensity"] = json!(int); }
    if let Some(d) = date { cmd["date"] = json!(d); }
    run_python_sidecar(&cmd)
}

#[tauri::command]
fn get_workouts() -> Result<JsonValue, String> {
    let cmd = json!({"command":"get_workouts"});
    run_python_sidecar(&cmd)
}

#[tauri::command]
fn get_calorie_averages() -> Result<JsonValue, String> {
    let cmd = json!({"command":"get_calorie_averages"});
    run_python_sidecar(&cmd)
}

#[tauri::command]
fn get_sleep_averages() -> Result<JsonValue, String> {
    let cmd = json!({"command":"get_sleep_averages"});
    run_python_sidecar(&cmd)
}

#[tauri::command]
fn get_workout_averages() -> Result<JsonValue, String> {
    let cmd = json!({"command":"get_workout_averages"});
    run_python_sidecar(&cmd)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            log_calories,
            get_calories,
            log_sleep,
            get_sleep,
            log_workout,
            get_workouts,
            get_calorie_averages,
            get_sleep_averages,
            get_workout_averages
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
