import { GestureHandler } from '../utils/GestureHandler.js';

export class FloatingPanel {
  constructor(container, emitter, exportImportService) {
    this.container = container;
    this.emitter = emitter;
    this.exportImport = exportImportService;
    this.isExpanded = false;
    this.render();
    this._setupGestures();
  }

  render() {
    this.container.innerHTML = `
      <div class="floating-panel ${this.isExpanded ? 'expanded' : ''}">
        <button class="panel-toggle" id="panel-toggle-btn">☰</button>
        <div class="panel-actions">
          <button id="btn-today">Сегодня</button>
          <button id="btn-month">Месяц</button>
          <button id="btn-week">Неделя</button>
          <button id="btn-export">Экспорт</button>
          <button id="btn-import">Импорт</button>
          <button id="btn-settings">Типы</button>
		  <button id="btn-presets">Пресеты</button>
        </div>
      </div>
    `;

    // Обработчики кнопок
    document.getElementById('panel-toggle-btn')?.addEventListener('click', () => {
      this.isExpanded = !this.isExpanded;
      this.container.querySelector('.floating-panel').classList.toggle('expanded', this.isExpanded);
    });

    document.getElementById('btn-today')?.addEventListener('click', () => this.emitter.emit('go-today'));
    document.getElementById('btn-month')?.addEventListener('click', () => this.emitter.emit('view-mode', 'month'));
    document.getElementById('btn-week')?.addEventListener('click', () => this.emitter.emit('view-mode', 'week'));
	document.getElementById('btn-presets')?.addEventListener('click', () => this.emitter.emit('open-presets'));
    
    document.getElementById('btn-export')?.addEventListener('click', () => {
       this.emitter.emit('request-export');
    });

    document.getElementById('btn-import')?.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.md,.txt';
      input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          const count = await this.exportImport.importMarkdown(file);
          if (count) alert(`Импортировано смен: ${count}`);
          else alert('Не найдено смен в файле');
        }
      });
      input.click();
    });

    document.getElementById('btn-settings')?.addEventListener('click', () => this.emitter.emit('open-settings'));
  }

  _setupGestures() {
    const panelEl = this.container.querySelector('.floating-panel');
    if (!panelEl) return;
    new GestureHandler(panelEl, this.emitter);

    this.emitter.on('swipe-left', () => this.emitter.emit('calendar-navigate', { direction: 'next' }));
    this.emitter.on('swipe-right', () => this.emitter.emit('calendar-navigate', { direction: 'prev' }));
    this.emitter.on('swipe-up', () => {
      this.isExpanded = true;
      panelEl.classList.add('expanded');
    });
    this.emitter.on('swipe-down', () => {
      this.isExpanded = false;
      panelEl.classList.remove('expanded');
    });
    this.emitter.on('tap', () => {
      this.isExpanded = !this.isExpanded;
      panelEl.classList.toggle('expanded', this.isExpanded);
    });
  }
}