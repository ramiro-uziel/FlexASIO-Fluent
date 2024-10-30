export interface Config {
  backend: string;
  bufferSizeSamples: number | null;
  input: InputOutput;
  output: InputOutput;
}

export interface InputOutput {
  device: string | null;
  suggestedLatencySeconds: number | null;
  wasapiExclusiveMode: boolean | null;
  wasapiAutoConvert: boolean | null;
  channels: number | null;
}

export interface DeviceItem {
  name: string;
  label: string;
  device: string;
  value: number;
}

export interface AudioBackend {
  value: string;
  displayName: string;
}
