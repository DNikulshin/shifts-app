// src/scripts/services/AuthService.js
import { hashPin } from '../utils/hash.js';

export class AuthService {
  constructor(storage) {
    this.storage = storage;
  }

  isFirstRun() {
    return !this.storage.get('auth_pin_hash');
  }

  async setPin(pin) {
    const hash = await hashPin(pin);
    this.storage.set('auth_pin_hash', hash);
  }

  async validatePin(pin) {
    const stored = this.storage.get('auth_pin_hash');
    if (!stored) return false;
    const hash = await hashPin(pin);
    return hash === stored;
  }

  async changePin(oldPin, newPin) {
    if (await this.validatePin(oldPin)) {
      await this.setPin(newPin);
      return true;
    }
    return false;
  }

  removePin() {
    this.storage.remove('auth_pin_hash');
    this.logout();
  }

  // Новые методы для сессии
  login() {
    this.storage.set('auth_session', 'true');
  }

  logout() {
    this.storage.remove('auth_session');
  }

  isAuthenticated() {
    return this.storage.get('auth_session') === 'true';
  }
}