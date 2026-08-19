export class PresetModel {
  constructor(storage, emitter) {
    this.storage = storage;
    this.emitter = emitter;
    this.presets = [];
    this.#load();
  }

  #load() {
    const raw = this.storage.get('presets');
    this.presets = raw || [];
  }

  #save() {
    this.storage.set('presets', this.presets);
  }

  getAll() {
    return [...this.presets];
  }

  add(name, sequence) {
    const preset = { id: crypto.randomUUID(), name, sequence };
    this.presets.push(preset);
    this.#save();
    this.emitter.emit('presets-changed');
    return preset;
  }

  update(id, name, sequence) {
    const preset = this.presets.find(p => p.id === id);
    if (!preset) return null;
    preset.name = name;
    preset.sequence = sequence;
    this.#save();
    this.emitter.emit('presets-changed');
    return preset;
  }

  remove(id) {
    this.presets = this.presets.filter(p => p.id !== id);
    this.#save();
    this.emitter.emit('presets-changed');
  }
}