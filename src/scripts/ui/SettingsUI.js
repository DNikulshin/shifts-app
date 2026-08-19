export class SettingsUI {
  constructor(container, shiftTypeModel, emitter, auth) {
    this.container = container;
    this.model = shiftTypeModel;
    this.emitter = emitter;
    this.auth = auth;
    this.editingId = null;
    this.render();
    this.emitter.on('types-changed', () => this.render());
  }

  render() {
    const types = this.model.getAll();
    this.container.innerHTML = `
      <div class="settings-screen">
        <h2>Управление типами смен</h2>
        <div class="types-list">
          ${types.map(t => this.#typeCard(t)).join('')}
        </div>
        <div class="add-type-form">
          <h3>${this.editingId ? 'Изменить' : 'Добавить'} тип</h3>
          <form id="type-form">
            <input type="text" id="type-name" placeholder="Название" required maxlength="20" value="${this.editingId ? this.model.getById(this.editingId)?.name || '' : ''}">
            <input type="color" id="type-color" value="${this.editingId ? this.model.getById(this.editingId)?.color || '#ffa502' : '#ffa502'}">
            <input type="text" id="type-emoji" placeholder="Эмодзи (например ☀️)" maxlength="4" value="${this.editingId ? this.model.getById(this.editingId)?.emoji || '' : ''}">
            <button type="submit">${this.editingId ? 'Сохранить' : 'Добавить'}</button>
            ${this.editingId ? '<button type="button" id="cancel-edit">Отмена</button>' : ''}
          </form>
        </div>
        <div class="settings-navigation">
          <button id="go-to-calendar">📅 График</button>
          <button id="change-pin-btn">🔐 Сменить PIN</button>
          <button id="logout-from-settings">🚪 Выйти</button>
        </div>
      </div>
    `;

    // Обработчики формы типов
    document.getElementById('type-form')?.addEventListener('submit', (e) => this.#handleSubmit(e));
    document.getElementById('cancel-edit')?.addEventListener('click', () => this.#cancelEdit());

    // Навигация
    document.getElementById('go-to-calendar')?.addEventListener('click', () => this.emitter.emit('navigate', 'main'));
    document.getElementById('logout-from-settings')?.addEventListener('click', () => {
      this.auth.logout();
      this.emitter.emit('show-auth');
    });

    // Смена PIN
    document.getElementById('change-pin-btn')?.addEventListener('click', () => this.#openChangePinModal());

    // Редактирование/удаление типов
    this.container.querySelectorAll('.edit-type-btn').forEach(btn => {
      btn.addEventListener('click', () => this.#startEdit(btn.dataset.id));
    });
    this.container.querySelectorAll('.delete-type-btn').forEach(btn => {
      btn.addEventListener('click', () => this.#deleteType(btn.dataset.id));
    });
  }

  #typeCard(type) {
    return `
      <div class="type-card" style="border-left: 4px solid ${type.color}">
        <span class="type-emoji">${type.emoji || '📋'}</span>
        <span class="type-name">${type.name}</span>
        <div class="type-actions">
          <button class="edit-type-btn" data-id="${type.id}">✎</button>
          <button class="delete-type-btn" data-id="${type.id}">✕</button>
        </div>
      </div>
    `;
  }

  #handleSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('type-name').value.trim();
    const color = document.getElementById('type-color').value;
    const emoji = document.getElementById('type-emoji').value.trim();
    if (!name) return;

    if (this.editingId) {
      this.model.update(this.editingId, name, color, emoji);
    } else {
      this.model.add(name, color, emoji);
    }
    this.editingId = null;
  }

  #startEdit(id) {
    this.editingId = id;
    this.render();
  }

  #cancelEdit() {
    this.editingId = null;
    this.render();
  }

  #deleteType(id) {
    if (confirm('Удалить тип смены? Все смены с этим типом останутся, но тип пропадёт.')) {
      this.model.remove(id);
    }
  }

  // Модальное окно смены PIN
  #openChangePinModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Смена PIN-кода</h3>
        <form id="change-pin-form">
          <label for="old-pin">Старый PIN</label>
          <input type="password" id="old-pin" maxlength="6" placeholder="Введите старый PIN" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
          <label for="new-pin">Новый PIN (4-6 цифр)</label>
          <input type="password" id="new-pin" maxlength="6" placeholder="Новый PIN" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
          <label for="confirm-pin">Подтвердите новый PIN</label>
          <input type="password" id="confirm-pin" maxlength="6" placeholder="Повторите новый PIN" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
          <div class="modal-actions">
            <button type="submit">Сохранить</button>
            <button type="button" id="close-change-pin">Отмена</button>
          </div>
        </form>
        <p id="change-pin-error" class="error-message" style="display:none;"></p>
      </div>
    `;

    document.body.appendChild(modal);

    const errorEl = modal.querySelector('#change-pin-error');
    modal.querySelector('#close-change-pin').addEventListener('click', () => modal.remove());
    modal.querySelector('#change-pin-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.style.display = 'none';
      const oldPin = modal.querySelector('#old-pin').value.trim();
      const newPin = modal.querySelector('#new-pin').value.trim();
      const confirmPin = modal.querySelector('#confirm-pin').value.trim();

      if (!oldPin || !newPin || !confirmPin) {
        errorEl.textContent = 'Заполните все поля';
        errorEl.style.display = 'block';
        return;
      }
      if (newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
        errorEl.textContent = 'Новый PIN должен содержать от 4 до 6 цифр';
        errorEl.style.display = 'block';
        return;
      }
      if (newPin !== confirmPin) {
        errorEl.textContent = 'Новый PIN и подтверждение не совпадают';
        errorEl.style.display = 'block';
        return;
      }

      const success = await this.auth.changePin(oldPin, newPin);
      if (success) {
        alert('PIN-код успешно изменён');
        modal.remove();
      } else {
        errorEl.textContent = 'Неверный старый PIN';
        errorEl.style.display = 'block';
      }
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }
}