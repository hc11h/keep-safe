import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-secret-key';

describe('Authentication Utils', () => {
  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'testPassword123';
      const saltRounds = 10;
      
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should verify hashed password correctly', async () => {
      const password = 'testPassword123';
      const saltRounds = 10;
      
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const isValid = await bcrypt.compare(password, hashedPassword);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword123';
      const saltRounds = 10;
      
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const isValid = await bcrypt.compare(wrongPassword, hashedPassword);
      
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Generation', () => {
    it('should generate JWT token correctly', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com'
      };
      
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should verify JWT token correctly', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com'
      };
      
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should reject invalid JWT token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        jwt.verify(invalidToken, JWT_SECRET);
      }).toThrow();
    });

    it('should reject JWT token with wrong secret', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com'
      };
      
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
      const wrongSecret = 'wrong-secret';
      
      expect(() => {
        jwt.verify(token, wrongSecret);
      }).toThrow();
    });
  });
});
