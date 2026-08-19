export class AuthUI {
  constructor(container, auth, emitter) {
    this.container = container;
    this.auth = auth;
    this.emitter = emitter;
    this.mode = auth.isFirstRun() ? 'create' : 'login';
  }

  render() {
    this.container.innerHTML = `
      <div class="auth-screen">
        <h1>График смен</h1>
        <form id="pin-form">
          ${this.mode === 'create' ? `
            <div class="form-group">
              <label for="pin-input">Придумайте PIN (4-6 цифр)</label>
              <input type="password" id="pin-input" maxlength="6" placeholder="Новый PIN" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
            </div>
            <div class="form-group">
              <label for="pin-confirm">Подтвердите PIN</label>
              <input type="password" id="pin-confirm" maxlength="6" placeholder="Повторите PIN" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
            </div>
            <button type="submit">Сохранить</button>
          ` : `
            <div class="form-group">
              <label for="pin-input">Введите PIN</label>
              <input type="password" id="pin-input" maxlength="6" placeholder="PIN" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
            </div>
            <button type="submit">Войти</button>
          `}
        </form>
        <p id="pin-error" class="error-message" style="display: none;"></p>
      </div>
    `;

    this.form = this.container.querySelector('#pin-form');
    this.errorEl = this.container.querySelector('#pin-error');
    this.pinInput = this.container.querySelector('#pin-input');
    this.pinConfirm = this.container.querySelector('#pin-confirm');

    this.form.addEventListener('submit', this.handleSubmit.bind(this));
  }

  async handleSubmit(e) {
    e.preventDefault();
    this.errorEl.style.display = 'none';
    const pin = this.pinInput.value.trim();

    if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      this.showError('PIN должен содержать от 4 до 6 цифр');
      return;
    }

    if (this.mode === 'create') {
      const confirm = this.pinConfirm.value.trim();
      if (pin !== confirm) {
        this.showError('Пароли не совпадают');
        return;
      }
      await this.auth.setPin(pin);
      this.emitter.emit('auth-success');
    } else {
      const valid = await this.auth.validatePin(pin);
      if (valid) {
        this.emitter.emit('auth-success');
      } else {
        this.showError('Неверный PIN');
        this.pinInput.value = '';
      }
    }
  }

  showError(message) {
    this.errorEl.textContent = message;
    this.errorEl.style.display = 'block';
  }
}