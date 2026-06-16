// notifications.js - Advanced toast notification system
class NotificationManager {
  constructor() {
    this.container = null;
    this.queue = [];
    this.isProcessing = false;
    this.init();
  }

  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.setAttribute('role', 'alert');
    this.container.setAttribute('aria-live', 'polite');
    document.body.appendChild(this.container);
  }

  async show(message, type = 'info', duration = 3000) {
    this.queue.push({ message, type, duration });
    
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    const { message, type, duration } = this.queue.shift();
    
    const toast = this.createToast(message, type);
    this.container.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });
    
    await new Promise(resolve => {
      setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
        
        setTimeout(() => {
          toast.remove();
          resolve();
        }, 300);
      }, duration);
    });
    
    await this.processQueue();
  }

  createToast(message, type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.transform = 'translateX(100%)';
    toast.style.opacity = '0';
    toast.style.transition = 'all 0.3s ease';
    toast.innerHTML = `
      <span style="font-size:1.25rem;">${icons[type]}</span>
      <span>${message}</span>
    `;
    
    return toast;
  }

  success(message, duration) {
    this.show(message, 'success', duration);
    Utils.playSound('success');
  }

  error(message, duration = 4000) {
    this.show(message, 'error', duration);
    Utils.playSound('error');
  }

  warning(message, duration) {
    this.show(message, 'warning', duration);
  }

  info(message, duration) {
    this.show(message, 'info', duration);
  }
}

const notifications = new NotificationManager();
window.notifications = notifications;


