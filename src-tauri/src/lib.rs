use tauri::Manager;

#[tauri::command]
async fn fetch_url(url: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent("Reckon/1.0 (Entity Tracking Dashboard)")
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("HTTP {}: {}", response.status(), url));
    }

    response.text().await.map_err(|e| format!("Read error: {}", e))
}

#[tauri::command]
async fn fetch_opensky(bounds: Option<[f64; 4]>) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent("Reckon/1.0")
        .timeout(std::time::Duration::from_secs(20))
        .build()
        .map_err(|e| e.to_string())?;

    let mut url = "https://opensky-network.org/api/states/all".to_string();
    if let Some(b) = bounds {
        url = format!(
            "{}?lamin={}&lomin={}&lamax={}&lomax={}",
            url, b[0], b[1], b[2], b[3]
        );
    }

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("OpenSky error: {}", e))?;

    response.text().await.map_err(|e| format!("Read error: {}", e))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![fetch_url, fetch_opensky])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
