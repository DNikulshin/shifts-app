import { EventEmitter } from './core/EventEmitter.js';
import { StorageService } from './services/StorageService.js';
import { AuthService } from './services/AuthService.js';
import { AuthUI } from './ui/AuthUI.js';
import { ShiftTypeModel } from './models/ShiftTypeModel.js';
import { CalendarModel } from './models/CalendarModel.js';
import { CalendarUI } from './ui/CalendarUI.js';
import { FloatingPanel } from './ui/FloatingPanel.js';
import { SettingsUI } from './ui/SettingsUI.js';
import { PresetModel } from './models/PresetModel.js';
import { PresetService } from './services/PresetService.js';
import { PresetsUI } from './ui/PresetsUI.js';
import { ExportImportService } from './services/ExportImportService.js';

const emitter = new EventEmitter();
const storage = new StorageService();
const auth = new AuthService(storage);

const appContainer = document.getElementById('app');

// Глобальные модели
const shiftTypeModel = new ShiftTypeModel(storage, emitter);
const calendarModel = new CalendarModel(storage, emitter);
const presetModel = new PresetModel(storage, emitter);
const presetService = new PresetService(presetModel, shiftTypeModel, calendarModel, storage);
const exportImport = new ExportImportService(calendarModel, shiftTypeModel);

// Навигация между экранами
emitter.on('open-settings', () => {
  appContainer.innerHTML = '';
  new SettingsUI(appContainer, shiftTypeModel, emitter, auth);
});

emitter.on('open-presets', () => {
  appContainer.innerHTML = '';
  new PresetsUI(appContainer, presetModel, shiftTypeModel, emitter, calendarModel, presetService);
});

emitter.on('navigate', (screen) => {
  if (screen === 'main') showMainApp();
});

// Обработка выхода из приложения
emitter.on('show-auth', () => {
  const authUI = new AuthUI(appContainer, auth, emitter);
  authUI.render();
});

function showMainApp() {
  appContainer.innerHTML = `
    <div class="main-layout">
      <div id="calendar-container"></div>
      <div id="panel-container"></div>
    </div>
  `;
  new CalendarUI(
    document.getElementById('calendar-container'),
    calendarModel,
    shiftTypeModel,
    emitter,
    presetModel,
    presetService,
	exportImport
  );
  new FloatingPanel(
    document.getElementById('panel-container'),
    emitter,
    exportImport
  );
}

emitter.on('auth-success', () => {
  auth.login();
  showMainApp();
});

// Старт приложения
if (auth.isAuthenticated()) {
  showMainApp();
} else {
  const authUI = new AuthUI(appContainer, auth, emitter);
  authUI.render();
}