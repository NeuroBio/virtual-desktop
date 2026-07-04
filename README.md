# Task Assistant
## Fresh Machine Installation Steps
### The usual
1. Run `npm install`
2. See `package.json` for commands

### Configure Windows Auto-Launch on Boot for Dev Work
To make the application automatically run when you log into Windows:
1. Press `Win + R` on your keyboard to open the Run window.
2. Type `shell:startup` and press `Enter` to open your user account's startup folder.
3. Copy the `virtual-desktop-launcher.bat` file from this project folder.
4. Paste it directly into that Windows Startup folder.
5. Update the path in the file to match the project's root.


### For Build
- `npm install`
- `npm run build`
- snag `Virtual Desktop Setup [Version Number].exe` from dist
- Run the installer and launch it
- On launch, it will auto register to run on startup