import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

export interface EncryptedData {
  encryptedValue: string;
  iv: string;
  authTag: string;
}

export interface DecryptedData {
  value: string;
}

export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';

  /**
   * Encrypt a value using AES-256-GCM
   * @param value - The plaintext value to encrypt
   * @param secretKey - The encryption key (will be padded/truncated to 32 bytes)
   * @returns EncryptedData object containing encrypted value, IV, and auth tag
   */
  encrypt(value: string, secretKey: string): EncryptedData {
    // Normalize the key to exactly 32 bytes
    const normalizedKey = this.normalizeKey(secretKey);

    // Generate a random IV (16 bytes for AES)
    const iv = randomBytes(16);

    // Create cipher with the normalized key and IV
    const cipher = createCipheriv(this.algorithm, normalizedKey, iv);

    // Encrypt the value
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get the authentication tag
    const authTag = cipher.getAuthTag();

    return {
      encryptedValue: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }


  decrypt(encryptedData: EncryptedData, secretKey: string): DecryptedData {
    try {
      const normalizedKey = this.normalizeKey(secretKey);

      const iv = Buffer.from(encryptedData.iv, 'hex');
      const authTag = Buffer.from(encryptedData.authTag, 'hex');

      const decipher = createDecipheriv(this.algorithm, normalizedKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedData.encryptedValue, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return { value: decrypted };
    } catch (error) {
      throw new Error('Failed to decrypt value. The data may be corrupted or the key is incorrect.');
    }
  }

  generateKey(): string {
    return randomBytes(32).toString('hex');
  }

  private normalizeKey(key: string): Buffer {
    if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
      return Buffer.from(key, 'hex');
    }

    const crypto = require('crypto');
    return crypto.createHash('sha256').update(key).digest();
  }
}

export const cryptoService = new CryptoService();
export default cryptoService;
