# FlexASIO Fluent
GUI for [FlexASIO](https://github.com/dechamps/FlexASIO) TOML configuration files.

<p align="center" >
  <img src="https://github.com/user-attachments/assets/7afa7468-b53c-41c5-a116-28dfc2490f12" width="400" title="Screenshot" alt="Application screenshot"/>
  <img src="https://github.com/user-attachments/assets/f2bbc16e-6da4-4519-b7dc-98610af54c82" width="400" title="Screenshot" alt="Application screenshot"/>
</p>

### Download
[Releases page](https://github.com/ramiro-uziel/FlexASIO-Fluent/releases/)

### Notes
- This project is not affiliated with FlexASIO!
- FlexASIO-Fluent is only a user interface that modifies a configuration file.
- Audio and device issues should go to [FlexASIO](https://github.com/dechamps/FlexASIO) (and viceversa, GUI issues to this repo)

### Compatibility
This overwrites the registry entry made by FlexASIO GUI on install. This means that if you open a DAW or any other software that can call to open a configuration GUI, it will open this one. If you want to revert to FlexASIO GUI, uninstall this first, then reinstall FlexASIO GUI.

### About
I have been using FlexASIO for my music production needs, configuring it with [flipswitchingmonkey's editor](https://github.com/flipswitchingmonkey/FlexASIO_GUI). I wanted to add additional features and implement a modern user interface, including dark mode support. My main goal was to create an editor that would look and feel like a native Windows 11 application while maintaining the usability of the original FlexASIO GUI.

I wanted to have a balance between keeping it lightweight and making it simple to develop. Although Tauri's appeal is for cross-platform development, I think it produced a decently native-feeling Windows application.

Built with [Tauri](https://v2.tauri.app/) and [SvelteKit](https://svelte.dev/). Not possible without components from [Fluent Svelte](https://fluent-svelte.vercel.app/).
