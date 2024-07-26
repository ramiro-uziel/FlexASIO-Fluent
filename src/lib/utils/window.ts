import type { Window } from "@tauri-apps/api/window"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { get, writable, type Writable } from "svelte/store"

export const appWindow: Writable<Window | undefined> = writable(undefined)

export const initializeAppWindow = async () => {
  import("@tauri-apps/api").then(() => {
    appWindow.set(getCurrentWindow())
  })
}

export const minimizeWindow = () => {
  get(appWindow)?.minimize()
}

export const maximizeWindow = async () => {
  await get(appWindow)?.toggleMaximize()
}

export const closeWindow = () => {
  get(appWindow)?.close()
}

export const fullscreenWindow = async () => {
  const fullscreen = await get(appWindow)?.isFullscreen()

  if (fullscreen) {
    await get(appWindow)?.setFullscreen(false)
  } else {
    await get(appWindow)?.setFullscreen(true)
  }
}
