// db.js - High-performance IndexedDB wrapper with caching
const DB_NAME = 'VotingPortalV2';
const DB_VERSION = 2;
const STORE_NAME = 'polls';
const SETTINGS_STORE = 'settings';

class Database {
  constructor() {
    this.db = null;
    this.cache = new Map();
    this.pendingWrites = new Set();
  }

  async init() {
    if (this.db) return this.db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const pollsStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          pollsStore.createIndex('status', 'status', { unique: false });
          pollsStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
        }
      };
      
      request.onsuccess = (e) => {
        this.db = e.target.result;
        
        // Handle connection close
        this.db.onclose = () => {
          this.db = null;
          this.cache.clear();
        };
        
        resolve(this.db);
      };
      
      request.onerror = (e) => {
        console.error('Database error:', e.target.error);
        reject(e.target.error);
      };
      
      request.onblocked = () => {
        console.warn('Database blocked. Please close other tabs.');
        reject(new Error('Database blocked'));
      };
    });
  }

  async getPolls() {
    const db = await this.init();
    const cacheKey = 'all_polls';
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const polls = request.result;
        this.cache.set(cacheKey, polls);
        resolve(polls);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async getPoll(id) {
    const cacheKey = `poll_${id}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      
      request.onsuccess = () => {
        const poll = request.result;
        if (poll) this.cache.set(cacheKey, poll);
        resolve(poll);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async savePoll(poll) {
    const db = await this.init();
    
    // Debounce writes
    if (this.pendingWrites.has(poll.id)) {
      return;
    }
    
    this.pendingWrites.add(poll.id);
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(poll);
      
      request.onsuccess = () => {
        // Update cache
        this.cache.set(`poll_${poll.id}`, poll);
        this.cache.delete('all_polls');
        this.pendingWrites.delete(poll.id);
        resolve();
      };
      
      request.onerror = (e) => {
        this.pendingWrites.delete(poll.id);
        reject(e.target.error);
      };
    });
  }

  async updatePollVote(pollId, candidateId, votedCombo) {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getRequest = store.get(pollId);
      
      getRequest.onsuccess = () => {
        const poll = getRequest.result;
        if (!poll) {
          reject(new Error('Poll not found'));
          return;
        }
        
        const candidate = poll.candidates.find(c => c.id === candidateId);
        if (candidate) {
          candidate.votes++;
        }
        
        if (!poll.votedCombos.includes(votedCombo)) {
          poll.votedCombos.push(votedCombo);
        }
        
        const putRequest = store.put(poll);
        
        putRequest.onsuccess = () => {
          this.cache.set(`poll_${pollId}`, poll);
          this.cache.delete('all_polls');
          resolve(poll);
        };
        
        putRequest.onerror = (e) => reject(e.target.error);
      };
      
      getRequest.onerror = (e) => reject(e.target.error);
    });
  }

  async deletePoll(id) {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        this.cache.delete(`poll_${id}`);
        this.cache.delete('all_polls');
        resolve();
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // Settings methods
  async getSetting(key) {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SETTINGS_STORE, 'readonly');
      const store = tx.objectStore(SETTINGS_STORE);
      const request = store.get(key);
      
      request.onsuccess = () => {
        resolve(request.result?.value);
      };
      
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async setSetting(key, value) {
    const db = await this.init();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SETTINGS_STORE, 'readwrite');
      const store = tx.objectStore(SETTINGS_STORE);
      const request = store.put({ key, value });
      
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  }

  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
const db = new Database();

// Export for use in other files
window.db = db;


