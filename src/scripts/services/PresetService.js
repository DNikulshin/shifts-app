import { formatDate, daysBetween } from '../utils/dateUtils.js';

export class PresetService {
  constructor(presetModel, shiftTypeModel, calendarModel, storage) {
    this.presetModel = presetModel;
    this.shiftTypeModel = shiftTypeModel;
    this.calendarModel = calendarModel;
    this.storage = storage;
  }

  _getMeta() {
    return this.storage.get('preset_meta') || {};
  }

  _saveMeta(meta) {
    this.storage.set('preset_meta', meta);
  }

  // Применить пресет к диапазону дат (перезапись)
  applyPreset(presetId, startDate, endDate) {
    const preset = this.presetModel.getAll().find(p => p.id === presetId);
    if (!preset || preset.sequence.length === 0) return false;

    const seq = preset.sequence;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const meta = this._getMeta();

    // Дата перед началом диапазона
    const prevDate = new Date(start);
    prevDate.setDate(prevDate.getDate() - 1);

    let startIndex;
    if (meta[presetId]) {
      // Уже есть опорная точка – вычисляем индекс для prevDate
      const { referenceDate, referenceIndex } = meta[presetId];
      const refDate = new Date(referenceDate);
      const daysDiff = daysBetween(refDate, prevDate); // может быть отрицательным
      // Индекс последнего дня (prevDate) относительно опорной точки
      const prevIndex = ((referenceIndex + daysDiff) % seq.length + seq.length) % seq.length;
      startIndex = (prevIndex + 1) % seq.length;
    } else {
      // Первое применение – создаём опорную точку с началом диапазона
      startIndex = 0;
      meta[presetId] = {
        referenceDate: formatDate(start),
        referenceIndex: 0
      };
      this._saveMeta(meta);
    }

    // Заполняем все дни
    const current = new Date(start);
    let idx = startIndex;
    while (current <= end) {
      const dateStr = formatDate(current);
      this.calendarModel.setShift(dateStr, seq[idx % seq.length], '');
      current.setDate(current.getDate() + 1);
      idx++;
    }

    return true;
  }

  // Статистика часов за месяц
  getMonthStats(year, month) {
    const shifts = this.calendarModel.getAllShifts();
    let dayHours = 0;
    let nightHours = 0;

    shifts.forEach(shift => {
      const [y, m] = shift.date.split('-').map(Number);
      if (y === year && m === month) {
        const type = this.shiftTypeModel.getById(shift.typeId);
        if (type && type.category !== 'off') {
          if (type.category === 'day') dayHours += type.durationHours;
          else if (type.category === 'night') nightHours += type.durationHours;
        }
      }
    });

    return { dayHours, nightHours };
  }

  // Опционально: сброс опорной точки
  resetReference(presetId) {
    const meta = this._getMeta();
    delete meta[presetId];
    this._saveMeta(meta);
  }
}