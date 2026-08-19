import { ShiftType } from './ShiftType.js';

export class ShiftTypeModel {
  constructor(storage, emitter) {
    this.storage = storage;
    this.emitter = emitter;
    this.types = [];
    this.#load();
  }

  #load() {
    const raw = this.storage.get('shift_types');
    this.types = raw ? raw.map(t => new ShiftType(t)) : this.#getDefaults();
    if (!raw) this.#save(); // сохранить дефолтные при первом запуске
  }

  #save() {
    this.storage.set('shift_types', this.types);
  }

  #getDefaults() {
     return [
    new ShiftType({ name: 'День', color: '#ffa502', emoji: '☀️', durationHours: 12, category: 'day' }),
    new ShiftType({ name: 'Ночь', color: '#6c63ff', emoji: '🌙', durationHours: 12, category: 'night' }),
    new ShiftType({ name: 'Выходной', color: '#2ed573', emoji: '🌴', durationHours: 0, category: 'off' }),
  ];
  }

  getAll() {
    return [...this.types];
  }

  getById(id) {
    return this.types.find(t => t.id === id);
  }

  add(name, color, emoji = '') {
    const type = new ShiftType({ name, color, emoji });
    this.types.push(type);
    this.#save();
    this.emitter.emit('types-changed');
    return type;
  }

  update(id, name, color, emoji) {
    const type = this.getById(id);
    if (!type) return null;
    type.name = name;
    type.color = color;
    type.emoji = emoji;
    this.#save();
    this.emitter.emit('types-changed');
    return type;
  }

  remove(id) {
    this.types = this.types.filter(t => t.id !== id);
    this.#save();
    this.emitter.emit('types-changed');
  }
}