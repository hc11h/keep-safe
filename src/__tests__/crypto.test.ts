import cryptoService, { CryptoService, EncryptedData } from '../infrastructure/crypto/crypto';

describe('CryptoService', () => {
  let service: CryptoService;
  const testKey = 'test-key-123';
  const testValue = 'This is a test secret value';

  beforeEach(() => {
    service = new CryptoService();
  });

  describe('Key Management', () => {
    it('should generate a valid encryption key', () => {
      const key = service.generateKey();
      expect(key).toHaveLength(64); // 32 bytes as hex string
    });

    it('should work with any key length', () => {
      const shortKey = 'short';
      const longKey = 'a'.repeat(100);
      
      expect(() => service.encrypt(testValue, shortKey)).not.toThrow();
      expect(() => service.encrypt(testValue, longKey)).not.toThrow();
    });
  });

  describe('Encryption', () => {
    it('should encrypt a value successfully', () => {
      const encrypted = service.encrypt(testValue, testKey);
      
      expect(encrypted).toHaveProperty('encryptedValue');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');
      
      expect(encrypted.encryptedValue).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      
      // Encrypted value should be different from original
      expect(encrypted.encryptedValue).not.toBe(testValue);
    });

    it('should generate different IVs for each encryption', () => {
      const encrypted1 = service.encrypt(testValue, testKey);
      const encrypted2 = service.encrypt(testValue, testKey);
      
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.encryptedValue).not.toBe(encrypted2.encryptedValue);
    });

    it('should handle empty string values', () => {
      const encrypted = service.encrypt('', testKey);
      expect(encrypted.encryptedValue).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
    });

    it('should handle special characters and unicode', () => {
      const specialValue = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?`~"\'\\\n\t\r';
      const unicodeValue = 'Unicode: 🚀🌟🎉中文日本語한국어';
      
      const encryptedSpecial = service.encrypt(specialValue, testKey);
      const encryptedUnicode = service.encrypt(unicodeValue, testKey);
      
      expect(encryptedSpecial.encryptedValue).toBeDefined();
      expect(encryptedUnicode.encryptedValue).toBeDefined();
    });
  });

  describe('Decryption', () => {
    it('should decrypt an encrypted value successfully', () => {
      const encrypted = service.encrypt(testValue, testKey);
      const decrypted = service.decrypt(encrypted, testKey);
      
      expect(decrypted.value).toBe(testValue);
    });

    it('should decrypt empty string values', () => {
      const encrypted = service.encrypt('', testKey);
      const decrypted = service.decrypt(encrypted, testKey);
      
      expect(decrypted.value).toBe('');
    });

    it('should decrypt special characters and unicode', () => {
      const specialValue = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?`~"\'\\\n\t\r';
      const unicodeValue = 'Unicode: 🚀🌟🎉中文日本語한국어';
      
      const encryptedSpecial = service.encrypt(specialValue, testKey);
      const encryptedUnicode = service.encrypt(unicodeValue, testKey);
      
      const decryptedSpecial = service.decrypt(encryptedSpecial, testKey);
      const decryptedUnicode = service.decrypt(encryptedUnicode, testKey);
      
      expect(decryptedSpecial.value).toBe(specialValue);
      expect(decryptedUnicode.value).toBe(unicodeValue);
    });

    it('should throw error for corrupted encrypted data', () => {
      const corruptedData: EncryptedData = {
        encryptedValue: 'corrupted',
        iv: 'corrupted',
        authTag: 'corrupted'
      };
      
      expect(() => {
        service.decrypt(corruptedData, testKey);
      }).toThrow('Failed to decrypt value');
    });

    it('should throw error for wrong key', () => {
      const encrypted = service.encrypt(testValue, testKey);
      const wrongKey = 'wrong-key';
      
      expect(() => {
        service.decrypt(encrypted, wrongKey);
      }).toThrow('Failed to decrypt value');
    });
  });

  describe('Round-trip Encryption/Decryption', () => {
    it('should handle multiple encryption/decryption cycles', () => {
      let currentValue = testValue;
      
      for (let i = 0; i < 5; i++) {
        const encrypted = service.encrypt(currentValue, testKey);
        const decrypted = service.decrypt(encrypted, testKey);
        
        expect(decrypted.value).toBe(currentValue);
        currentValue = decrypted.value;
      }
    });

    it('should handle large values', () => {
      const largeValue = 'x'.repeat(10000);
      const encrypted = service.encrypt(largeValue, testKey);
      const decrypted = service.decrypt(encrypted, testKey);
      
      expect(decrypted.value).toBe(largeValue);
    });
  });

  describe('Singleton Instance', () => {
    it('should export a singleton instance', () => {
      expect(cryptoService).toBeInstanceOf(CryptoService);
    });

    it('should work with the singleton instance', () => {
      const encrypted = cryptoService.encrypt(testValue, testKey);
      const decrypted = cryptoService.decrypt(encrypted, testKey);
      
      expect(decrypted.value).toBe(testValue);
    });
  });
});
