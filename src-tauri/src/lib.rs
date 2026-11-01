#[cfg(target_os = "macos")]
use tauri::Manager;

#[tauri::command]
fn ping() {
    println!("pong");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 외부 링크(target="_blank")는 opener 플러그인이 기본 브라우저로 연다.
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![ping]);

    // macOS: 창을 닫아도 앱은 종료하지 않고 창만 숨긴다. 종료는 Cmd+Q로 한다.
    #[cfg(target_os = "macos")]
    let builder = builder.on_window_event(|window, event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            let _ = window.hide();
        }
    });

    builder
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app, _event| {
            // macOS: 독 아이콘을 클릭했을 때 보이는 창이 없으면 숨긴 창을 다시 띄운다.
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen {
                has_visible_windows: false,
                ..
            } = _event
            {
                if let Some(window) = _app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        });
}
