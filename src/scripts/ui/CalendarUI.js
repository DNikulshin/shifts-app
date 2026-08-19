import { getMonthDays, getWeekDays, formatDate, isSameDay } from '../utils/dateUtils.js';
import { ShiftForm } from './ShiftForm.js';

export class CalendarUI {
  constructor(container, calendarModel, shiftTypeModel, emitter, presetModel, presetService, exportImport) {
    this.container = container;
    this.calendar = calendarModel;
    this.shiftTypeModel = shiftTypeModel;
    this.emitter = emitter;
    this.presetModel = presetModel;
    this.presetService = presetService;
    this.exportImport = exportImport;
    this.viewMode = 'month';
    this.currentDate = new Date();
    this._bindEvents();
    this.render();
  }

  _bindEvents() {
    this.emitter.on('shifts-changed', () => this.render());
    this.emitter.on('calendar-navigate', ({ direction }) => this._navigate(direction));
    this.emitter.on('go-today', () => {
      this.currentDate = new Date();
      this.render();
    });
    this.emitter.on('view-mode', (mode) => {
      this.viewMode = mode;
      this.render();
    });
    // Новое событие для экспорта текущего диапазона
    this.emitter.on('request-export', () => this._exportCurrentRange());
  }

  _navigate(direction) {
    const delta = direction === 'next' ? 1 : -1;
    if (this.viewMode === 'month') {
      this.currentDate.setMonth(this.currentDate.getMonth() + delta);
    } else {
      this.currentDate.setDate(this.currentDate.getDate() + delta * 7);
    }
    this.render();
  }

  _getVisibleDateRange() {
    if (this.viewMode === 'month') {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return { start, end };
    } else {
      const days = getWeekDays(this.currentDate);
      return { start: days[0], end: days[6] };
    }
  }

  _exportCurrentRange() {
    const { start, end } = this._getVisibleDateRange();
    this.exportImport.exportMarkdown(start, end);
  }

  render() {
    const days = this.viewMode === 'month'
      ? getMonthDays(this.currentDate.getFullYear(), this.currentDate.getMonth())
      : getWeekDays(this.currentDate);

    const today = new Date();
    const types = this.shiftTypeModel.getAll();

    const gridHtml = days.map(day => {
      const dateStr = formatDate(day);
      const shift = this.calendar.getShift(dateStr);
      const type = shift ? types.find(t => t.id === shift.typeId) : null;
      const isToday = isSameDay(day, today);
      const isCurrentMonth = this.viewMode === 'month' ? day.getMonth() === this.currentDate.getMonth() : true;

      return `
        <div class="calendar-day ${isToday ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}"
             data-date="${dateStr}">
          <span class="day-number">${day.getDate()}</span>
          ${type ? `<span class="shift-marker" style="background: ${type.color}">${type.emoji || ''}</span>` : ''}
        </div>
      `;
    }).join('');

    const monthYear = this.currentDate.toLocaleString('ru', { month: 'long', year: 'numeric' });
    const weekLabel = this.viewMode === 'week'
      ? `Неделя ${days[0].toLocaleDateString('ru', { day: 'numeric', month: 'short' })} – ${days[6].toLocaleDateString('ru', { day: 'numeric', month: 'short' })}`
      : '';

    // Статистика месяца (только для режима месяца)
    let statsHtml = '';
    if (this.viewMode === 'month') {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth() + 1;
      const stats = this.presetService.getMonthStats(year, month);
      statsHtml = `
        <div class="month-stats">
          ☀️ Дневные часы: ${stats.dayHours} &nbsp;|&nbsp; 🌙 Ночные часы: ${stats.nightHours}
        </div>
      `;
    }

    // Блок заполнения пресетом (только для месяца)
    let fillHtml = '';
    if (this.viewMode === 'month') {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();
      const firstDay = formatDate(new Date(year, month, 1));
      const lastDay = formatDate(new Date(year, month + 1, 0));
      fillHtml = `
        <div class="fill-section">
          <select id="preset-select">
            <option value="">Выберите пресет</option>
            ${this.presetModel.getAll().map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
          <label>с</label>
          <input type="date" id="fill-start" value="${firstDay}">
          <label>по</label>
          <input type="date" id="fill-end" value="${lastDay}">
          <button id="fill-range-btn">Заполнить</button>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="calendar-screen">
        <div class="calendar-header">
          <div class="nav-row">
            <button class="nav-arrow" id="prev-btn">◀</button>
            <h2>${monthYear}</h2>
            <button class="nav-arrow" id="next-btn">▶</button>
          </div>
          ${weekLabel ? `<h3>${weekLabel}</h3>` : ''}
          ${statsHtml}
          ${fillHtml}
        </div>
        <div class="calendar-grid weekdays">
          ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => `<div class="weekday">${d}</div>`).join('')}
        </div>
        <div class="calendar-grid days">
          ${gridHtml}
        </div>
      </div>
    `;

    // Навигация
    document.getElementById('prev-btn')?.addEventListener('click', () => this._navigate('prev'));
    document.getElementById('next-btn')?.addEventListener('click', () => this._navigate('next'));

    // Заполнение по диапазону
    if (this.viewMode === 'month') {
      document.getElementById('fill-range-btn')?.addEventListener('click', () => {
        const presetId = document.getElementById('preset-select').value;
        if (!presetId) return alert('Выберите пресет');
        const startVal = document.getElementById('fill-start').value;
        const endVal = document.getElementById('fill-end').value;
        if (!startVal || !endVal) return alert('Укажите даты');
        const start = new Date(startVal + 'T00:00:00');
        const end = new Date(endVal + 'T00:00:00');
        if (start > end) return alert('Начальная дата позже конечной');
        this.presetService.applyPreset(presetId, start, end);
      });
    }

    // Тап по дню
    this.container.querySelectorAll('.calendar-day').forEach(dayEl => {
      dayEl.addEventListener('click', () => {
        const date = dayEl.dataset.date;
        new ShiftForm(date, this.shiftTypeModel, this.calendar, this.emitter);
      });
    });
  }
}