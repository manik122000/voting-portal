// crypto.js - Advanced cryptographic operations
class CryptoManager {
  constructor() {
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
  }

  async hashPassword(password, salt = '') {
    const data = this.encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async verifyPassword(password, storedHash) {
    const inputHash = await this.hashPassword(password);
    return inputHash === storedHash;
  }

  // Generate a secure random token for additional security
  generateToken(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Encrypt sensitive data (optional, for future use)
  async encryptData(data, key) {
    const encodedData = this.encoder.encode(JSON.stringify(data));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      this.encoder.encode(key),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encodedData
    );
    
    return {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encrypted))
    };
  }
}

const cryptoManager = new CryptoManager();
window.cryptoManager = cryptoManager;



