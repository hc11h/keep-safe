import { Request, Response } from 'express';
import { getProjects, createProject, getProject, updateProject, deleteProject } from '../api/controllers/projectController';

// Mock the prisma import
jest.mock('../infrastructure/db/prisma', () => ({
  __esModule: true,
  default: {
    project: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Import the mocked prisma
import prisma from '../infrastructure/db/prisma';

describe('Project Controller', () => {
  let mockRequest: Partial<Request & { user?: { userId: string; email: string } }>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

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
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getProjects', () => {
    it('should return user projects', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', description: 'Test project', createdAt: new Date(), updatedAt: new Date() }
      ];
      (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);

      await getProjects(mockRequest as Request, mockResponse as Response);

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      expect(mockResponse.json).toHaveBeenCalledWith({ projects: mockProjects });
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await getProjects(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      const mockProject = { id: '1', name: 'New Project', description: 'Test', createdAt: new Date(), updatedAt: new Date() };
      mockRequest.body = { name: 'New Project', description: 'Test' };
      (prisma.project.create as jest.Mock).mockResolvedValue(mockProject);

      await createProject(mockRequest as Request, mockResponse as Response);

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          name: 'New Project',
          description: 'Test',
          userId: 'test-user-id'
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true
        }
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Project created successfully',
        project: mockProject
      });
    });

    it('should return 400 if name is missing', async () => {
      mockRequest.body = { description: 'Test' };

      await createProject(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Project name is required' });
    });

    it('should return 400 if name is empty', async () => {
      mockRequest.body = { name: '', description: 'Test' };

      await createProject(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Project name is required' });
    });
  });

  describe('getProject', () => {
    it('should return project if it exists and belongs to user', async () => {
      const mockProject = { id: '1', name: 'Project 1', description: 'Test', createdAt: new Date(), updatedAt: new Date() };
      mockRequest.params = { id: '1' };
      (prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProject);

      await getProject(mockRequest as Request, mockResponse as Response);

      expect(prisma.project.findFirst).toHaveBeenCalledWith({
        where: { id: '1', userId: 'test-user-id' },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true
        }
      });
      expect(mockResponse.json).toHaveBeenCalledWith({ project: mockProject });
    });

    it('should return 404 if project not found', async () => {
      mockRequest.params = { id: '1' };
      (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);

      await getProject(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Project not found' });
    });
  });

  describe('updateProject', () => {
    it('should update project if it exists and belongs to user', async () => {
      const mockProject = { id: '1', name: 'Updated Project', description: 'Updated', createdAt: new Date(), updatedAt: new Date() };
      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'Updated Project', description: 'Updated' };
      (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: '1' });
      (prisma.project.update as jest.Mock).mockResolvedValue(mockProject);

      await updateProject(mockRequest as Request, mockResponse as Response);

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Updated Project',
          description: 'Updated'
        },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true
        }
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Project updated successfully',
        project: mockProject
      });
    });

    it('should return 404 if project not found', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { name: 'Updated Project' };
      (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);

      await updateProject(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Project not found' });
    });
  });

  describe('deleteProject', () => {
    it('should delete project if it exists and belongs to user', async () => {
      mockRequest.params = { id: '1' };
      (prisma.project.findFirst as jest.Mock).mockResolvedValue({ id: '1' });
      (prisma.project.delete as jest.Mock).mockResolvedValue({ id: '1' });

      await deleteProject(mockRequest as Request, mockResponse as Response);

      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: '1' }
      });
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Project deleted successfully' });
    });

    it('should return 404 if project not found', async () => {
      mockRequest.params = { id: '1' };
      (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);

      await deleteProject(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Project not found' });
    });
  });
});
