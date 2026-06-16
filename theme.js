// theme.js - Dark/Light theme management
class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem('theme') || 'light';
    this.init();
  }

  init() {
    this.applyTheme();
    this.createToggle();
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  createToggle() {
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle';
    toggle.setAttribute('aria-label', 'Toggle theme');
    toggle.innerHTML = this.theme === 'dark' ? '☀️' : '🌙';
    
    toggle.addEventListener('click', () => {
      const newTheme = this.theme === 'dark' ? 'light' : 'dark';
      this.setTheme(newTheme);
      toggle.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
      
      // Add rotation animation
      toggle.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        toggle.style.transform = '';
      }, 300);
    });
    
    document.body.appendChild(toggle);
  }

  setTheme(theme) {
    this.theme = theme;
    localStorage.setItem('theme', theme);
    this.applyTheme();
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.content = this.theme === 'dark' ? '#111827' : '#6366f1';
    }
  }

  toggle() {
    const newTheme = this.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  }
}

const themeManager = new ThemeManager();
window.themeManager = themeManager;


