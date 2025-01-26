import type { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { checkWindows11 } from "./app";
import { isWidescreen } from "./stores";

export class WindowManager {
  private unlisten?: () => void;
  private resizeObserver?: ResizeObserver;

  constructor(private window: WebviewWindow) {}

  async initialize(): Promise<void> {
    await this.setupTheme();
    await this.setWindowBackground();
    this.setupEventListeners();
  }

  private async setupTheme(): Promise<void> {
    const theme = await this.window.theme();
    this.updateDarkMode(theme?.toString() || "dark");
    this.unlisten = await this.window.onThemeChanged(({ payload: theme }) => {
      this.updateDarkMode(theme);
    });
  }

  private updateDarkMode(theme: string): void {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }

  private async setWindowBackground(): Promise<void> {
    const isWin11 = await checkWindows11();
    if (!isWin11) {
      document.body.style.backgroundColor = "#202020";
    }
  }

  private setupEventListeners(): void {
    if (this.isTauriLocalhost()) {
      this.setupSecurityListeners();
    }
    this.setupResizeObserver();
  }

  private isTauriLocalhost(): boolean {
    return window.location.hostname === "tauri.localhost";
  }

  private setupSecurityListeners(): void {
    document.addEventListener("contextmenu", this.disableContextMenu, {
      capture: true,
    });
    document.addEventListener("keydown", this.disableSpecificKeys, {
      capture: true,
    });
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      isWidescreen.set(window.innerWidth >= 645);
    });
    this.resizeObserver.observe(document.documentElement);
  }

  private disableContextMenu(e: MouseEvent): void {
    if (!(e.target as Element).closest("[data-enable-context-menu]")) {
      e.preventDefault();
    }
  }

  private disableSpecificKeys(e: KeyboardEvent): void {
    const isFunctionKey =
      e.key.startsWith("F") && !isNaN(Number(e.key.substring(1)));
    const isDisabledCtrlCombination =
      e.ctrlKey && ["f", "g", "j", "p"].includes(e.key.toLowerCase());
    const isAllowedCtrlCombination =
      e.ctrlKey && ["a", "c", "v", "x", "z"].includes(e.key.toLowerCase());

    if (
      (isFunctionKey || isDisabledCtrlCombination) &&
      !isAllowedCtrlCombination
    ) {
      e.preventDefault();
    }
  }

  cleanup(): void {
    this.unlisten?.();
    if (this.isTauriLocalhost()) {
      document.removeEventListener("contextmenu", this.disableContextMenu, {
        capture: true,
      });
      document.removeEventListener("keydown", this.disableSpecificKeys, {
        capture: true,
      });
    }
    this.resizeObserver?.disconnect();
  }
}
