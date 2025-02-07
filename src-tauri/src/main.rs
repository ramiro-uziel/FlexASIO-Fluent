#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use portaudio as pa;
use rust_decimal::prelude::*;
use rust_decimal::Decimal;
use serde::de::Error as DeError;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::collections::HashMap;
use std::ffi::OsStr;
use std::fs;
use std::os::windows::ffi::OsStrExt;
use std::thread;
use tauri::command;
use tauri::Emitter;
use tauri::Manager;
use tauri::WebviewWindow;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_window_state::StateFlags;
use windows::core::{w, PCWSTR};
use windows::Foundation::TypedEventHandler;
use windows::Win32::Storage::FileSystem::{
    GetFileVersionInfoSizeW, GetFileVersionInfoW, VerQueryValueW,
};
use windows::UI::Color;
use windows::UI::ViewManagement::{UIColorType, UISettings};
use windows_version::OsVersion;

const FLEXASIO_DLL_PATH: &str = "C:\\Program Files\\FlexASIO\\x64\\flexasio.dll";

#[allow(non_snake_case)]
#[derive(Serialize, Deserialize, Debug, Clone)]
struct Config {
    backend: Option<String>,
    bufferSizeSamples: Option<u32>,
    input: Option<InputOutput>,
    output: Option<InputOutput>,
}

#[allow(non_snake_case)]
#[derive(Serialize, Deserialize, Debug, Clone)]
struct InputOutput {
    device: Option<String>,
    #[serde(
        default,
        serialize_with = "serialize_option_decimal",
        deserialize_with = "deserialize_option_decimal"
    )]
    suggestedLatencySeconds: Option<Decimal>,
    wasapiExclusiveMode: Option<bool>,
    wasapiAutoConvert: Option<bool>,
    channels: Option<u8>,
}

fn serialize_option_decimal<S>(decimal: &Option<Decimal>, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    match decimal {
        Some(d) => serializer.serialize_some(&d.to_f64().unwrap()),
        None => serializer.serialize_none(),
    }
}

fn deserialize_option_decimal<'de, D>(deserializer: D) -> Result<Option<Decimal>, D::Error>
where
    D: Deserializer<'de>,
{
    match Option::<f64>::deserialize(deserializer) {
        Ok(Some(f)) => Ok(Some(
            Decimal::from_f64(f).ok_or_else(|| DeError::custom("Invalid decimal value"))?,
        )),
        Ok(None) => Ok(None),
        Err(_) => Ok(None),
    }
}

fn setup_accent_change_listener(window: WebviewWindow) {
    thread::spawn(move || {
        // Create UISettings (this may fail so handle error in production)
        let ui_settings = UISettings::new().expect("UISettings::new failed");
        let window_clone = window.clone();
        let handler: TypedEventHandler<UISettings, windows::core::IInspectable> =
            TypedEventHandler::new(move |_, _| {
                if let Ok(colors) = get_accent_colors() {
                    if let Err(e) = window_clone.emit("accent_color_changed", colors) {
                        eprintln!("Error emitting accent_color_changed: {:?}", e);
                    }
                }
                Ok(())
            });
        if let Err(e) = ui_settings.ColorValuesChanged(&handler) {
            eprintln!("Failed to register ColorValuesChanged: {:?}", e);
        }
        // Keep the thread alive.
        loop {
            std::thread::sleep(std::time::Duration::from_secs(60));
        }
    });
}

fn get_color(color_type: UIColorType) -> windows::core::Result<Color> {
    let ui_settings = UISettings::new()?;
    let color = ui_settings.GetColorValue(color_type)?;
    Ok(color)
}

fn get_accent_colors() -> windows::core::Result<HashMap<String, String>> {
    let colors = [
        ("accent", UIColorType::Accent),
        ("accentDark1", UIColorType::AccentDark1),
        ("accentDark2", UIColorType::AccentDark2),
        ("accentDark3", UIColorType::AccentDark3),
        ("accentLight1", UIColorType::AccentLight1),
        ("accentLight2", UIColorType::AccentLight2),
        ("accentLight3", UIColorType::AccentLight3),
        ("background", UIColorType::Background),
        ("foreground", UIColorType::Foreground),
    ];

    let mut color_map = HashMap::new();
    for (label, color_type) in colors {
        let color = get_color(color_type)?;
        color_map.insert(
            label.to_string(),
            format!("rgb({}, {}, {})", color.R, color.G, color.B),
        );
    }

    Ok(color_map)
}

#[tauri::command]
fn get_accent_colors_command() -> Result<HashMap<String, String>, String> {
    get_accent_colors().map_err(|e| e.to_string())
}

#[command]
fn list_audio_devices(backend: &str) -> Result<(Vec<String>, Vec<String>), String> {
    let pa =
        pa::PortAudio::new().map_err(|err| format!("Failed to initialize PortAudio: {}", err))?;

    let target_api = match backend {
        "MME" => "MME",
        "DirectSound" => "Windows DirectSound",
        "WASAPI" => "Windows WASAPI",
        "WDM-KS" => "Windows WDM-KS",
        _ => {
            return Ok((Vec::new(), Vec::new()));
        }
    };

    let target_host_index = pa
        .host_apis()
        .find_map(|(index, info)| {
            if info.name == target_api {
                Some(index)
            } else {
                None
            }
        })
        .ok_or_else(|| format!("Host API '{}' not found", target_api))?;

    let devices = pa
        .devices()
        .map_err(|err| format!("Failed to get devices: {}", err))?;

    let mut input_devices = Vec::new();
    let mut output_devices = Vec::new();

    for device in devices {
        let (_, info) = device.map_err(|_| "Failed to get device info".to_string())?;

        if info.host_api != target_host_index {
            continue;
        }

        let device_name = info.name.to_string();

        if backend == "WASAPI" {
            if info.max_input_channels > 0 {
                input_devices.push(device_name.clone());
            }
            if info.max_output_channels > 0 {
                input_devices.push(format!("{} [Loopback]", device_name));
            }
        } else {
            if info.max_input_channels > 0 {
                input_devices.push(device_name.clone());
            }
        }
        if info.max_output_channels > 0 {
            output_devices.push(device_name);
        }
    }

    Ok((input_devices, output_devices))
}

fn read_toml_file(path: &str) -> Result<Config, Box<dyn std::error::Error>> {
    let toml_str = fs::read_to_string(path)?;
    let config: Config = toml::from_str(&toml_str)?;
    Ok(config)
}

fn normalize_decimal(d: Option<Decimal>) -> Option<Decimal> {
    d.map(|x| x.round_dp(1))
}

fn normalize_config(mut config: Config) -> Config {
    if let Some(ref mut input) = config.input {
        input.suggestedLatencySeconds = normalize_decimal(input.suggestedLatencySeconds);
    }
    if let Some(ref mut output) = config.output {
        output.suggestedLatencySeconds = normalize_decimal(output.suggestedLatencySeconds);
    }
    config
}

#[command]
fn load_config(toml_path: String) -> Result<Config, String> {
    read_toml_file(&toml_path).map_err(|e| e.to_string())
}

#[command]
fn save_config(toml_path: String, config: Config) -> Result<(), String> {
    let normalized_config = normalize_config(config);
    write_toml_file(&toml_path, &normalized_config).map_err(|e| e.to_string())
}

fn write_toml_file(path: &str, config: &Config) -> Result<(), Box<dyn std::error::Error>> {
    let toml_str = toml::to_string(config)?;
    let trimmed_toml_str = toml_str.trim_end();
    fs::write(path, trimmed_toml_str)?;
    Ok(())
}

#[command]
async fn save_config_to_file(app_handle: tauri::AppHandle, config: Config) -> Result<(), String> {
    let normalized_config = normalize_config(config);
    let _toml_str = toml::to_string(&normalized_config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    if let Some(path) = app_handle
        .dialog()
        .file()
        .add_filter("TOML Configuration", &["toml"])
        .set_title("Save FlexASIO Configuration")
        .set_file_name("FlexASIO.toml")
        .blocking_save_file()
    {
        let path_str = path.to_string();
        write_toml_file(&path_str, &normalized_config)
            .map_err(|e| format!("Failed to write config file: {}", e))?;
        Ok(())
    } else {
        Err("Save operation cancelled".to_string())
    }
}

#[command]
async fn load_config_from_file(app_handle: tauri::AppHandle) -> Result<Config, String> {
    if let Some(path) = app_handle
        .dialog()
        .file()
        .add_filter("TOML Configuration", &["toml"])
        .set_title("Load FlexASIO Configuration")
        .blocking_pick_file()
    {
        let path_str = path.to_string();
        let config =
            read_toml_file(&path_str).map_err(|e| format!("Failed to read config file: {}", e))?;
        Ok(config)
    } else {
        Err("Load operation cancelled".to_string())
    }
}

#[command]
fn get_windows_version() -> (u32, u32, u32) {
    let version = OsVersion::current();
    (version.major, version.minor, version.build)
}

#[command]
fn get_dll_product_version() -> Result<String, String> {
    let wide_path: Vec<u16> = OsStr::new(FLEXASIO_DLL_PATH)
        .encode_wide()
        .chain(Some(0))
        .collect();

    unsafe {
        let mut handle = 0;
        let size = GetFileVersionInfoSizeW(PCWSTR(wide_path.as_ptr()), Some(&mut handle));

        if size == 0 {
            return Err("Failed to get version info size".to_string());
        }

        let mut version_info = vec![0u8; size as usize];

        if !GetFileVersionInfoW(
            PCWSTR(wide_path.as_ptr()),
            handle,
            size,
            version_info.as_mut_ptr().cast(),
        )
        .is_ok()
        {
            return Err("Failed to get version info".to_string());
        }

        let mut lang_ptr = std::ptr::null_mut();
        let mut lang_len = 0u32;

        if !VerQueryValueW(
            version_info.as_ptr().cast(),
            w!("\\VarFileInfo\\Translation"),
            &mut lang_ptr,
            &mut lang_len,
        )
        .as_bool()
        {
            return Err("Failed to query language info".to_string());
        }

        let lang_codepage = *(lang_ptr as *const u32);
        let lang_id = lang_codepage & 0xFFFF;
        let codepage = lang_codepage >> 16;

        let query = format!(
            "\\StringFileInfo\\{:04x}{:04x}\\ProductVersion",
            lang_id, codepage
        );
        let wide_query: Vec<u16> = OsStr::new(&query).encode_wide().chain(Some(0)).collect();

        let mut version_ptr = std::ptr::null_mut();
        let mut version_len = 0u32;

        if !VerQueryValueW(
            version_info.as_ptr().cast(),
            PCWSTR(wide_query.as_ptr()),
            &mut version_ptr,
            &mut version_len,
        )
        .as_bool()
        {
            return Err("Failed to query product version".to_string());
        }

        let version_slice =
            std::slice::from_raw_parts(version_ptr as *const u16, version_len as usize);
        let version_string = String::from_utf16_lossy(version_slice);

        Ok(version_string.trim_end_matches('\0').to_string())
    }
}

fn main() {
    let mut flags = StateFlags::all();
    flags.remove(StateFlags::VISIBLE);
    flags.remove(StateFlags::DECORATIONS);

    tauri::Builder::default()
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(flags)
                .build(),
        )
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app_handle, _, _| {
            if let Some(main_window) = app_handle.get_webview_window("main") {
                if main_window.is_minimized().unwrap() {
                    main_window.unminimize().unwrap();
                }
                main_window.set_focus().unwrap();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            list_audio_devices,
            load_config,
            save_config,
            get_windows_version,
            get_dll_product_version,
            save_config_to_file,
            load_config_from_file,
            get_accent_colors_command,
        ])
        .setup(|app| {
            let window: WebviewWindow = app.get_webview_window("main").unwrap();
            setup_accent_change_listener(window);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
