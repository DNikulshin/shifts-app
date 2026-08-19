export class ShiftType {
  constructor({ id, name, color, emoji = '', durationHours = 12, category = 'day' }) {
    this.id = id || crypto.randomUUID();
    this.name = name;
    this.color = color;
    this.emoji = emoji;
    this.durationHours = durationHours;
    this.category = category; // 'day', 'night', 'off'
  }
}