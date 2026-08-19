import { Shift } from './Shift.js';

export class CalendarModel {
  #shifts = new Map(); // date -> Shift

  constructor(storage, emitter) {
    this.storage = storage;
    this.emitter = emitter;
    this.#load();
  }

  #load() {
    const raw = this.storage.get('shifts') || [];
    raw.forEach(s => this.#shifts.set(s.date, new Shift(s)));
  }

  #save() {
    this.storage.set('shifts', Array.from(this.#shifts.values()));
  }

  // Получить все смены массивом
  getAllShifts() {
    return Array.from(this.#shifts.values());
  }

  getShift(date) {
    return this.#shifts.get(date) || null;
  }

  setShift(date, typeId, note = '') {
    const existing = this.#shifts.get(date);
    if (existing) {
      existing.typeId = typeId;
      existing.note = note;
      existing.updatedAt = new Date().toISOString();
    } else {
      this.#shifts.set(date, new Shift({ date, typeId, note }));
    }
    this.#save();
    this.emitter.emit('shifts-changed', { date });
  }

  deleteShift(date) {
    this.#shifts.delete(date);
    this.#save();
    this.emitter.emit('shifts-changed', { date });
  }
}