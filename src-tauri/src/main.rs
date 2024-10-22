#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use portaudio as pa;
use rust_decimal::prelude::*;
use rust_decimal::Decimal;
use serde::de::Error as DeError;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::fs;
use tauri::command;
use tauri::Manager;
use windows::Win32::Foundation::BOOL;
use windows::Win32::Graphics::Dwm::DwmGetColorizationColor;
use windows_version::OsVersion;

use tauri_plugin_window_state::StateFlags;

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
    fs::write(path, toml_str)?;
    Ok(())
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
    let mut flags = StateFlags::all();
    flags.remove(StateFlags::VISIBLE);

    tauri::Builder::default()
        .setup(|app| {
            let main_window = app.get_webview_window("main").unwrap();
            main_window.set_decorations(true).unwrap();
            Ok(())
        })
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_state_flags(flags)
                .build(),
        )
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .invoke_handler(tauri::generate_handler![
            list_audio_devices,
            load_config,
            save_config,
            get_accent_color,
            get_windows_version
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
