import notepad from "./apps/notepad.js";
import files from "./apps/files.js";
import settings from "./apps/settings.js";
import trash from "./apps/trash.js";
import clock from "./apps/clock.js";
import alert from "./apps/alert.js";
import prompt from "./apps/prompt.js";
import properties from "./apps/properties.js";
import terminal from "./apps/terminal.js";
import finale from "./apps/finale.js";

const ALL = [notepad, files, settings, trash, clock, alert, prompt, properties, terminal, finale];
const BY_ID = new Map(ALL.map((app) => [app.id, app]));

export function getApp(id) {
  return BY_ID.get(id) || null;
}

export function menuApps() {
  return ALL.filter((app) => app.menu);
}

export const DESKTOP_APPS = ["notepad", "files", "settings", "trash", "clock"];
