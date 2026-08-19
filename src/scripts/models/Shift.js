export class Shift {
  constructor({ id, date, typeId, note = '', createdAt, updatedAt }) {
    this.id = id || crypto.randomUUID();
    this.date = date; // строка YYYY-MM-DD
    this.typeId = typeId;
    this.note = note;
    this.createdAt = createdAt || new Date().toISOString();
    this.updatedAt = updatedAt || new Date().toISOString();
  }
}