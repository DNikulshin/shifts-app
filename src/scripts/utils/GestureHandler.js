export class GestureHandler {
  constructor(element, emitter, threshold = 50) {
    this.element = element;
    this.emitter = emitter;
    this.threshold = threshold;
    this.startX = 0;
    this.startY = 0;
    this.isDragging = false;
    this._bindEvents();
  }

  _bindEvents() {
    this.element.addEventListener('touchstart', e => {
      this.startX = e.touches[0].clientX;
      this.startY = e.touches[0].clientY;
      this.isDragging = true;
    });

    this.element.addEventListener('touchmove', e => {
      if (!this.isDragging) return;
      // предотвращаем скролл страницы, если нужно
      e.preventDefault();
    });

    this.element.addEventListener('touchend', e => {
      if (!this.isDragging) return;
      this.isDragging = false;
      const dx = e.changedTouches[0].clientX - this.startX;
      const dy = e.changedTouches[0].clientY - this.startY;

      if (Math.abs(dx) > this.threshold && Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) {
          this.emitter.emit('swipe-right');
        } else {
          this.emitter.emit('swipe-left');
        }
      } else if (Math.abs(dy) > this.threshold && Math.abs(dy) > Math.abs(dx)) {
        if (dy > 0) {
          this.emitter.emit('swipe-down');
        } else {
          this.emitter.emit('swipe-up');
        }
      } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        this.emitter.emit('tap');
      }
    });
  }
}