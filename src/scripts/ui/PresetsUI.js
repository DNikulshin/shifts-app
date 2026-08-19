export class PresetsUI {
  constructor(container, presetModel, shiftTypeModel, emitter, calendarModel, presetService) {
    this.container = container;
    this.presetModel = presetModel;
    this.shiftTypeModel = shiftTypeModel;
    this.emitter = emitter;
    this.calendarModel = calendarModel;
    this.presetService = presetService;
    this.editingPresetId = null;
    this.tempSequence = [];
    this.render();
    this.emitter.on('presets-changed', () => this.render());
  }

  render() {
    const presets = this.presetModel.getAll();
    const types = this.shiftTypeModel.getAll();
    const editingPreset = this.editingPresetId ? presets.find(p => p.id === this.editingPresetId) : null;

    this.container.innerHTML = `
      <div class="presets-screen">
        <h2>Пресеты графиков</h2>
        <div class="presets-list">
          ${presets.map(p => this.#presetCard(p, types)).join('')}
        </div>
        <div class="preset-form">
          <h3>${editingPreset ? 'Изменить' : 'Новый'} пресет</h3>
          <input type="text" id="preset-name" placeholder="Название пресета" maxlength="30" value="${editingPreset?.name || ''}">
          <div class="sequence-editor">
            <h4>Последовательность смен</h4>
            <div id="sequence-list">
              ${(editingPreset ? editingPreset.sequence : this.tempSequence).map((typeId, idx) => {
                const type = types.find(t => t.id === typeId);
                return `<div class="sequence-item">
                  <span>${idx+1}. ${type?.emoji || ''} ${type?.name || '?'}</span>
                  <button class="remove-step-btn" data-index="${idx}">✕</button>
                </div>`;
              }).join('')}
            </div>
            <div class="add-step">
              <select id="step-type-select">
                ${types.map(t => `<option value="${t.id}">${t.emoji || ''} ${t.name}</option>`).join('')}
              </select>
              <button id="add-step-btn">Добавить шаг</button>
            </div>
          </div>
          <div class="preset-form-actions">
            <button id="save-preset">${editingPreset ? 'Сохранить' : 'Создать'}</button>
            ${editingPreset ? '<button id="cancel-edit-preset">Отмена</button>' : ''}
          </div>
        </div>
        <button id="back-from-presets">← Назад</button>
      </div>
    `;

    // Обработчики
    document.getElementById('back-from-presets')?.addEventListener('click', () => this.emitter.emit('navigate', 'main'));
    document.getElementById('save-preset')?.addEventListener('click', () => this.#handleSave());
    document.getElementById('cancel-edit-preset')?.addEventListener('click', () => this.#cancelEdit());
    document.getElementById('add-step-btn')?.addEventListener('click', () => this.#addStep());
    this.container.querySelectorAll('.remove-step-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.#removeStep(parseInt(e.target.dataset.index)));
    });
    this.container.querySelectorAll('.edit-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => this.#startEdit(btn.dataset.id));
    });
    this.container.querySelectorAll('.delete-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => this.#deletePreset(btn.dataset.id));
    });
	document.querySelectorAll('.reset-ref-btn').forEach(btn => {
		  btn.addEventListener('click', () => {
			if (confirm('Сбросить точку отсчёта для пресета? Следующее заполнение начнётся с первого элемента.')) {
			  this.presetService.resetReference(btn.dataset.id);
			  alert('Точка отсчёта сброшена.');
			}
		  });
		});
  }

  #presetCard(preset, types) {
    const seqStr = preset.sequence.map(id => {
      const t = types.find(t => t.id === id);
      return t ? (t.emoji || t.name) : '?';
    }).join(' → ');
    return `
      <div class="preset-card">
        <div class="preset-info">
          <strong>${preset.name}</strong>
          <small>${seqStr || 'пусто'}</small>
        </div>
        <div class="preset-actions">
          <button class="edit-preset-btn" data-id="${preset.id}">✎</button>
          <button class="delete-preset-btn" data-id="${preset.id}">✕</button>
		  <button class="reset-ref-btn" data-id="${preset.id}">↺</button>
        </div>
      </div>
    `;
  }

  #handleSave() {
    const name = document.getElementById('preset-name').value.trim();
    if (!name) return;
    const sequence = this.editingPresetId 
      ? this._getCurrentSequence()
      : [...this.tempSequence];
    if (sequence.length === 0) return;

    if (this.editingPresetId) {
      this.presetModel.update(this.editingPresetId, name, sequence);
    } else {
      this.presetModel.add(name, sequence);
    }
    this.editingPresetId = null;
    this.tempSequence = [];
  }

  _getCurrentSequence() {
    // собираем из DOM, если редактируем существующий
    const items = document.querySelectorAll('#sequence-list .sequence-item span');
    const sequence = [];
    const editingPreset = this.presetModel.getAll().find(p => p.id === this.editingPresetId);
    if (!editingPreset) return [];
    // Используем текущий порядок из DOM, но пока нет перестановки – берём из модели
    return editingPreset.sequence; // упрощённо, без изменения порядка
  }

  #addStep() {
    const select = document.getElementById('step-type-select');
    if (select && select.value) {
      this.tempSequence.push(select.value);
      this.render(); // перерендер для отображения
    }
  }

  #removeStep(index) {
    if (this.editingPresetId) {
      const preset = this.presetModel.getAll().find(p => p.id === this.editingPresetId);
      if (preset) {
        preset.sequence.splice(index, 1);
        this.presetModel.update(preset.id, preset.name, preset.sequence);
      }
    } else {
      this.tempSequence.splice(index, 1);
      this.render();
    }
  }

  #startEdit(id) {
    this.editingPresetId = id;
    this.tempSequence = [];
    this.render();
  }

  #cancelEdit() {
    this.editingPresetId = null;
    this.tempSequence = [];
    this.render();
  }

  #deletePreset(id) {
    if (confirm('Удалить пресет?')) this.presetModel.remove(id);
  }
}