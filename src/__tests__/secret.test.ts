import { Request, Response } from 'express';
import {
  getSecrets,
  createSecret,
  getSecret,
  updateSecret,
  deleteSecret
} from '../api/controllers/secretController';

// Mock the prisma import
jest.mock('../infrastructure/db/prisma', () => ({
  __esModule: true,
  default: {
    project: {
      findFirst: jest.fn(),
    },
    secret: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock the crypto service
jest.mock('../infrastructure/crypto/crypto', () => ({
  __esModule: true,
  default: {
    encrypt: jest.fn(() => ({
      encryptedValue: 'encrypted_value',
      iv: 'test_iv',
      authTag: 'test_auth_tag'
    })),
    decrypt: jest.fn(() => ({ value: 'decrypted_value' }))
  }
}));

// Import the mocked prisma
import prisma from '../infrastructure/db/prisma';

describe('Secret Controller', () => {
  let mockRequest: Partial<Request & { user?: { userId: string; email: string } }>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      user: { userId: 'test-user-id', email: 'test@example.com' },
      body: {},
      params: {},
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('getSecrets', () => {
    it('should return project secrets (keys only)', async () => {
      const mockSecrets = [
        { id: '1', key: 'API_KEY', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', key: 'DATABASE_URL', createdAt: new Date(), updatedAt: new Date() }
      ];
      
      mockRequest.params = { id: 'project-1' };
      (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: 'project-1' });
      (prisma.secret.findMany as jest.Mock).mockResolvedValue(mockSecrets);

      await getSecrets(mockRequest as Request, mockResponse as Response);

      expect(prisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: 'project-1', userId: 'test-user-id' }
      });
      expect(prisma.secret.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-1' },
        select: {
          id: true,
          key: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      expect(mockResponse.json).toHaveBeenCalledWith({ secrets: mockSecrets });
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { id: 'project-1' };

      await getSecrets(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should return 404 if project not found', async () => {
      mockRequest.params = { id: 'project-1' };
      (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);

      await getSecrets(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Project not found' });
    });
  });

  describe('createSecret', () => {
    it('should create a new secret successfully', async () => {
      const mockSecret = { id: '1', key: 'API_KEY', createdAt: new Date(), updatedAt: new Date() };
      mockRequest.params = { id: 'project-1' };
      mockRequest.body = { key: 'API_KEY', value: 'secret-value' };
      
      (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: 'project-1' });
      (prisma.secret.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.secret.create as jest.Mock).mockResolvedValue(mockSecret);

      await createSecret(mockRequest as Request, mockResponse as Response);

      expect(prisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: 'project-1', userId: 'test-user-id' }
      });
      expect(prisma.secret.findFirst).toHaveBeenCalledWith({
        where: { projectId: 'project-1', key: 'API_KEY' }
      });
      expect(prisma.secret.create).toHaveBeenCalledWith({
        data: {
          key: 'API_KEY',
          value: JSON.stringify({
            encryptedValue: 'encrypted_value',
            iv: 'test_iv',
            authTag: 'test_auth_tag'
          }),
          projectId: 'project-1'
        },
        select: {
          id: true,
          key: true,
          createdAt: true,
          updatedAt: true
        }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Secret created successfully',
        secret: mockSecret
      });
    });

    it('should return 400 if key is missing', async () => {
      mockRequest.params = { id: 'project-1' };
      mockRequest.body = { value: 'secret-value' };

      await createSecret(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Secret key and value are required' });
    });

    it('should return 400 if value is missing', async () => {
      mockRequest.params = { id: 'project-1' };
      mockRequest.body = { key: 'API_KEY' };

      await createSecret(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Secret key and value are required' });
    });

    it('should return 400 if key is empty', async () => {
      mockRequest.params = { id: 'project-1' };
      mockRequest.body = { key: '', value: 'secret-value' };

      await createSecret(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Secret key and value are required' });
    });

    it('should return 409 if secret key already exists', async () => {
      mockRequest.params = { id: 'project-1' };
      mockRequest.body = { key: 'API_KEY', value: 'secret-value' };
      
      (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: 'project-1' });
      (prisma.secret.findFirst as jest.Mock).mockResolvedValue({ id: '1', key: 'API_KEY' });

      await createSecret(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Secret key already exists in this project' });
    });
  });

  describe('getSecret', () => {
    it('should return decrypted secret', async () => {
      const mockSecret = {
        id: '1',
        key: 'API_KEY',
        value: JSON.stringify({
          encryptedValue: 'encrypted_value',
          iv: 'test_iv',
          authTag: 'test_auth_tag'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockRequest.params = { id: 'project-1', secretId: 'secret-1' };
      (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: 'project-1' });
      (prisma.secret.findFirst as jest.Mock).mockResolvedValue(mockSecret);

      await getSecret(mockRequest as Request, mockResponse as Response);

      expect(prisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: 'project-1', userId: 'test-user-id' }
      });
      expect(prisma.secret.findFirst).toHaveBeenCalledWith({
        where: { id: 'secret-1', projectId: 'project-1' }
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        secret: {
          id: '1',
          key: 'API_KEY',
          value: 'decrypted_value',
          createdAt: mockSecret.createdAt,
          updatedAt: mockSecret.updatedAt
        }
      });
    });

    it('should return 404 if secret not found', async () => {
      mockRequest.params = { id: 'project-1', secretId: 'secret-1' };
      (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: 'project-1' });
      (prisma.secret.findFirst as jest.Mock).mockResolvedValue(null);

      await getSecret(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Secret not found' });
    });
  });

  describe('updateSecret', () => {
    it('should update secret successfully', async () => {
      const mockSecret = { id: '1', key: 'API_KEY', createdAt: new Date(), updatedAt: new Date() };
      mockRequest.params = { id: 'project-1', secretId: 'secret-1' };
      mockRequest.body = { value: 'new-secret-value' };
      
      (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: 'project-1' });
      (prisma.secret.findFirst as jest.Mock).mockResolvedValue({ id: 'secret-1' });
      (prisma.secret.update as jest.Mock).mockResolvedValue(mockSecret);

      await updateSecret(mockRequest as Request, mockResponse as Response);

      expect(prisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: 'project-1', userId: 'test-user-id' }
      });
      expect(prisma.secret.findFirst).toHaveBeenCalledWith({
        where: { id: 'secret-1', projectId: 'project-1' }
      });
      expect(prisma.secret.update).toHaveBeenCalledWith({
        where: { id: 'secret-1' },
        data: {
          value: JSON.stringify({
            encryptedValue: 'encrypted_value',
            iv: 'test_iv',
            authTag: 'test_auth_tag'
          })
        },
        select: {
          id: true,
          key: true,
          createdAt: true,
          updatedAt: true
        }
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Secret updated successfully',
        secret: mockSecret
      });
    });

    it('should return 400 if value is missing', async () => {
      mockRequest.params = { id: 'project-1', secretId: 'secret-1' };
      mockRequest.body = {};

      await updateSecret(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Secret value is required and must be a string' });
    });

    it('should return 400 if value is not a string', async () => {
      mockRequest.params = { id: 'project-1', secretId: 'secret-1' };
      mockRequest.body = { value: 123 };

      await updateSecret(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Secret value is required and must be a string' });
    });
  });

  describe('deleteSecret', () => {
    it('should delete secret successfully', async () => {
      mockRequest.params = { id: 'project-1', secretId: 'secret-1' };
      
      (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: 'project-1' });
      (prisma.secret.findFirst as jest.Mock).mockResolvedValue({ id: 'secret-1' });
      (prisma.secret.delete as jest.Mock).mockResolvedValue({ id: 'secret-1' });

      await deleteSecret(mockRequest as Request, mockResponse as Response);

      expect(prisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: 'project-1', userId: 'test-user-id' }
      });
      expect(prisma.secret.findFirst).toHaveBeenCalledWith({
        where: { id: 'secret-1', projectId: 'project-1' }
      });
      expect(prisma.secret.delete).toHaveBeenCalledWith({
        where: { id: 'secret-1' }
      });
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Secret deleted successfully' });
    });

    it('should return 404 if secret not found', async () => {
      mockRequest.params = { id: 'project-1', secretId: 'secret-1' };
      (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: 'project-1' });
      (prisma.secret.findFirst as jest.Mock).mockResolvedValue(null);

      await deleteSecret(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Secret not found' });
    });
  });
});
