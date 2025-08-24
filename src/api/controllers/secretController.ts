import { Request, Response } from 'express';
import prisma from '../../infrastructure/db/prisma';
import cryptoService from '../../infrastructure/crypto/crypto';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}


async function checkProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId }
  });
  return project;
}


function encryptSecretValue(value: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-for-development';

  const encrypted = cryptoService.encrypt(value, encryptionKey);


  return JSON.stringify(encrypted);
}


function decryptSecretValue(encryptedData: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-for-development';

  try {
    const encrypted = JSON.parse(encryptedData);
    const decrypted = cryptoService.decrypt(encrypted, encryptionKey);
    return decrypted.value;
  } catch (error) {
    throw new Error('Failed to decrypt secret value');
  }
}



export const getSecrets = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id: projectId } = req.params;


    const project = await checkProjectOwnership(projectId, req.user.userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }


    const secrets = await prisma.secret.findMany({
      where: { projectId },
      select: {
        id: true,
        key: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ secrets });
  } catch (error) {
    console.error('Get secrets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const createSecret = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id: projectId } = req.params;
    const { key, value } = req.body;

    
    if (!key || !value) {
      return res.status(400).json({ error: 'Secret key and value are required' });
    }

    if (typeof key !== 'string' || typeof value !== 'string') {
      return res.status(400).json({ error: 'Secret key and value must be strings' });
    }

    if (key.trim().length === 0) {
      return res.status(400).json({ error: 'Secret key cannot be empty' });
    }

   
    const project = await checkProjectOwnership(projectId, req.user.userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

   
    const existingSecret = await prisma.secret.findFirst({
      where: { projectId, key }
    });

    if (existingSecret) {
      return res.status(409).json({ error: 'Secret key already exists in this project' });
    }


    const encryptedValue = encryptSecretValue(value);


    const secret = await prisma.secret.create({
      data: {
        key,
        value: encryptedValue,
        projectId
      },
      select: {
        id: true,
        key: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json({
      message: 'Secret created successfully',
      secret
    });
  } catch (error) {
    console.error('Create secret error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const getSecret = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id: projectId, secretId } = req.params;


    const project = await checkProjectOwnership(projectId, req.user.userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const secret = await prisma.secret.findFirst({
      where: { id: secretId, projectId }
    });

    if (!secret) {
      return res.status(404).json({ error: 'Secret not found' });
    }

    const decryptedValue = decryptSecretValue(secret.value);

    res.json({
      secret: {
        id: secret.id,
        key: secret.key,
        value: decryptedValue,
        createdAt: secret.createdAt,
        updatedAt: secret.updatedAt
      }
    });
  } catch (error) {
    console.error('Get secret error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const updateSecret = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id: projectId, secretId } = req.params;
    const { value } = req.body;

    if (!value || typeof value !== 'string') {
      return res.status(400).json({ error: 'Secret value is required and must be a string' });
    }

    const project = await checkProjectOwnership(projectId, req.user.userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const existingSecret = await prisma.secret.findFirst({
      where: { id: secretId, projectId }
    });

    if (!existingSecret) {
      return res.status(404).json({ error: 'Secret not found' });
    }

    const encryptedValue = encryptSecretValue(value);

    const updatedSecret = await prisma.secret.update({
      where: { id: secretId },
      data: { value: encryptedValue },
      select: {
        id: true,
        key: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Secret updated successfully',
      secret: updatedSecret
    });
  } catch (error) {
    console.error('Update secret error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const deleteSecret = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id: projectId, secretId } = req.params;

    const project = await checkProjectOwnership(projectId, req.user.userId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const existingSecret = await prisma.secret.findFirst({
      where: { id: secretId, projectId }
    });

    if (!existingSecret) {
      return res.status(404).json({ error: 'Secret not found' });
    }

    await prisma.secret.delete({
      where: { id: secretId }
    });

    res.json({ message: 'Secret deleted successfully' });
  } catch (error) {
    console.error('Delete secret error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
