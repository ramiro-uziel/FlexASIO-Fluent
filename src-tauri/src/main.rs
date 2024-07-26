#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use portaudio as pa;
use tauri::command;
use tauri::Manager;
use tauri::WindowEvent;
use window_vibrancy::apply_mica;
use windows::Win32::Foundation::BOOL;
use windows::Win32::Graphics::Dwm::DwmGetColorizationColor;
use windows_version::OsVersion;

#[command]
fn list_audio_devices(backend: String) -> Result<(Vec<String>, Vec<String>), String> {
    let pa = match pa::PortAudio::new() {
        Ok(pa) => pa,
        Err(_) => return Ok((Vec::new(), Vec::new())),
    };

    let host_apis: Vec<(pa::HostApiIndex, pa::HostApiInfo)> = match pa
        .host_apis()
        .map(|api| Ok::<(pa::HostApiIndex, pa::HostApiInfo), pa::Error>(api))
        .collect::<Result<Vec<_>, _>>()
    {
        Ok(host_apis) => host_apis,
        Err(_) => return Ok((Vec::new(), Vec::new())),
    };

    let target_api = match backend.as_str() {
        "MME" => "MME",
        "DirectSound" => "Windows DirectSound",
        "WASAPI" => "Windows WASAPI",
        "WDM-KS" => "Windows WDM-KS",
        _ => return Ok((Vec::new(), Vec::new())),
    };

    let mut input_devices = Vec::new();
    let mut output_devices = Vec::new();

    for (host_api_index, host_api_info) in host_apis {
        if host_api_info.name == target_api {
            let devices = match pa.devices() {
                Ok(devices) => devices,
                Err(_) => return Ok((Vec::new(), Vec::new())),
            };
            for device in devices {
                let (_index, info) = match device {
                    Ok(device) => device,
                    Err(_) => return Ok((Vec::new(), Vec::new())),
                };
                if info.host_api == host_api_index {
                    if info.max_output_channels > 0 {
                        output_devices.push(info.name.to_string());
                    }
                    if info.max_input_channels > 0 {
                        input_devices.push(info.name.to_string());
                    }
                }
            }
        }
    }

    Ok((input_devices, output_devices))
}

#[command]
fn get_accent_color() -> Result<String, String> {
    let mut colorization: u32 = 0;
    let mut opaqueblend = BOOL(0);
    unsafe {
        match DwmGetColorizationColor(&mut colorization, &mut opaqueblend).ok() {
            Some(_) => {
                let r = (colorization >> 16) & 0xFF;
                let g = (colorization >> 8) & 0xFF;
                let b = colorization & 0xFF;

                let rgb = format!("#{:02X}{:02X}{:02X}", r, g, b);
                Ok(rgb)
            }
            None => Err("Failed to get colorization color".to_string()),
        }
    }
}

#[command]
fn get_windows_version() -> (u32, u32, u32) {
    let version = OsVersion::current();
    (version.major, version.minor, version.build)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            list_audio_devices,
            get_accent_color,
            get_windows_version
        ])
        .setup(|app: &mut tauri::App| {
            let window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "windows")]
            {
                let version = OsVersion::current();

                if version.major > 10 || (version.major == 10 && version.build >= 22000) {
                    apply_mica(&window, None).expect("Failed to apply mica effect");
                }
                window.on_window_event(|event| match event {
                    WindowEvent::Resized(..) => {
                        std::thread::sleep(std::time::Duration::from_millis(1))
                    }
                    _ => {}
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
