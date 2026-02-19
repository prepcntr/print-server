import { Tray, Menu, nativeImage, BrowserWindow, app } from "electron";
import path from "node:path";

let tray: Tray | null = null;

export function createTray(getWindow: () => BrowserWindow | null): Tray {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "assets", "trayIconTemplate.png")
    : path.join(__dirname, "..", "..", "assets", "trayIconTemplate.png");

  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });

  tray = new Tray(icon);
  tray.setToolTip("Print Server");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Print Server is running",
      enabled: false,
    },
    { type: "separator" },
    {
      label: "Show Status Window",
      click: () => {
        const win = getWindow();
        if (win) {
          win.show();
          win.focus();
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  return tray;
}
