export class ShiftForm {
  constructor(date, shiftTypeModel, calendarModel, emitter) {
    this.date = date;
    this.shiftTypeModel = shiftTypeModel;
    this.calendarModel = calendarModel;
    this.emitter = emitter;
    this.shift = calendarModel.getShift(date);
    this.render();
  }

  render() {
    const types = this.shiftTypeModel.getAll();
    const currentTypeId = this.shift ? this.shift.typeId : null;
    const note = this.shift ? this.shift.note : '';

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>${this.date}</h3>
        <div class="type-selector">
          ${types.map(t => `
            <label class="type-option ${t.id === currentTypeId ? 'selected' : ''}" style="border-color: ${t.color}">
              <input type="radio" name="shift-type" value="${t.id}" ${t.id === currentTypeId ? 'checked' : ''}>
              <span class="type-emoji">${t.emoji || '📋'}</span>
              <span class="type-name">${t.name}</span>
            </label>
          `).join('')}
        </div>
        <textarea id="shift-note" placeholder="Заметка (опционально)" rows="2">${note}</textarea>
        <div class="modal-actions">
          <button id="save-shift">Сохранить</button>
          ${this.shift ? '<button id="delete-shift">Удалить</button>' : ''}
          <button id="close-form">Отмена</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#close-form')?.addEventListener('click', () => modal.remove());
    modal.querySelector('#save-shift')?.addEventListener('click', () => {
      const selected = modal.querySelector('input[name="shift-type"]:checked');
      const note = modal.querySelector('#shift-note').value.trim();
      if (selected) {
        this.calendarModel.setShift(this.date, selected.value, note);
      }
      modal.remove();
    });
    modal.querySelector('#delete-shift')?.addEventListener('click', () => {
      if (confirm('Удалить смену за эту дату?')) {
        this.calendarModel.deleteShift(this.date);
        modal.remove();
      }
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }
}