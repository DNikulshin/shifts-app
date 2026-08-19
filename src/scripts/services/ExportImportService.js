import { formatDate } from '../utils/dateUtils.js';

export class ExportImportService {
  constructor(calendarModel, shiftTypeModel) {
    this.calendarModel = calendarModel;
    this.shiftTypeModel = shiftTypeModel;
  }

  // Экспорт за период (по умолчанию текущий месяц)
  exportMarkdown(startDate, endDate) {
    const shifts = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateStr = formatDate(current); // <-- исправлено: локальная дата
      const shift = this.calendarModel.getShift(dateStr);
      if (shift) {
        shifts.push({ date: dateStr, shift });
      }
      current.setDate(current.getDate() + 1);
    }

    const types = this.shiftTypeModel.getAll();
    const typeMap = Object.fromEntries(types.map(t => [t.id, t]));

    let md = '# График смен\n\n';
    md += `Период: ${startDate.toLocaleDateString('ru')} – ${endDate.toLocaleDateString('ru')}\n\n`;

    // Легенда
    md += '## Типы смен\n| Эмодзи | Название | Цвет |\n|--------|----------|------|\n';
    types.forEach(t => md += `| ${t.emoji || '—'} | ${t.name} | ${t.color} |\n`);

    // Таблица смен
    md += '\n## Смены\n| Дата | Тип | Заметка |\n|------|-----|--------|\n';
    shifts.forEach(({ date, shift }) => {
      const type = typeMap[shift.typeId] || { name: 'неизвестно' };
      md += `| ${date} | ${type.name} | ${shift.note || ''} |\n`;
    });

    // Скачивание файла
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `график_смен_${formatDate(startDate)}_${formatDate(endDate)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Импорт из файла
  async importMarkdown(file) {
    const text = await file.text();
    const lines = text.split('\n');
    const shiftsToImport = [];
    let inTable = false;
    const typeMap = this._buildTypeMap();

    for (const line of lines) {
      if (line.startsWith('| Дата | Тип | Заметка |')) {
        inTable = true;
        continue;
      }
      if (inTable && line.startsWith('|')) {
        const parts = line.split('|').map(s => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          const [date, typeName] = parts;
          if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            const typeId = this._resolveTypeId(typeName);
            const note = parts[2] || '';
            shiftsToImport.push({ date, typeId, note });
          }
        }
      }
    }

    if (shiftsToImport.length === 0) return false;

    shiftsToImport.forEach(({ date, typeId, note }) => {
      this.calendarModel.setShift(date, typeId, note);
    });

    return shiftsToImport.length;
  }

  _buildTypeMap() {
    const types = this.shiftTypeModel.getAll();
    const map = {};
    types.forEach(t => { map[t.name.toLowerCase()] = t.id; });
    return map;
  }

  _resolveTypeId(name) {
    const lowerName = name.toLowerCase();
    const map = this._buildTypeMap();
    if (map[lowerName]) return map[lowerName];
    // Если тип не найден, создаём новый
    const newType = this.shiftTypeModel.add(name, '#cccccc', '');
    return newType.id;
  }
}