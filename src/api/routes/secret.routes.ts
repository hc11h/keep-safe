import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getSecrets,
  createSecret,
  getSecret,
  updateSecret,
  deleteSecret
} from '../controllers/secretController';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Secret:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the secret
 *         key:
 *           type: string
 *           description: The secret key/name
 *         value:
 *           type: string
 *           description: The decrypted secret value (only returned when fetching individual secret)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the secret was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the secret was last updated
 *       required:
 *         - id
 *         - key
 *         - createdAt
 *         - updatedAt
 *     
 *     SecretList:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         key:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     CreateSecretRequest:
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *           description: The secret key/name
 *           example: "API_KEY"
 *         value:
 *           type: string
 *           description: The secret value to encrypt and store
 *           example: "sk-1234567890abcdef"
 *       required:
 *         - key
 *         - value
 *     
 *     UpdateSecretRequest:
 *       type: object
 *       properties:
 *         value:
 *           type: string
 *           description: The new secret value to encrypt and store
 *           example: "sk-new-api-key-123"
 *       required:
 *         - value
 */

/**
 * @swagger
 * /projects/{projectId}/secrets:
 *   get:
 *     summary: Get all secrets for a project
 *     description: Returns a list of secret keys (no values) for the specified project
 *     tags: [Secrets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *     responses:
 *       200:
 *         description: List of secrets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 secrets:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SecretList'
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/secrets', authenticateToken, getSecrets);

/**
 * @swagger
 * /projects/{projectId}/secrets:
 *   post:
 *     summary: Create a new secret
 *     description: Creates and encrypts a new secret in the specified project
 *     tags: [Secrets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSecretRequest'
 *     responses:
 *       201:
 *         description: Secret created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 secret:
 *                   $ref: '#/components/schemas/SecretList'
 *       400:
 *         description: Invalid input - missing key/value or empty key
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Project not found
 *       409:
 *         description: Secret key already exists in this project
 *       500:
 *         description: Internal server error
 */
router.post('/:id/secrets', authenticateToken, createSecret);

/**
 * @swagger
 * /projects/{projectId}/secrets/{secretId}:
 *   get:
 *     summary: Get a specific secret
 *     description: Retrieves and decrypts a specific secret (includes the decrypted value)
 *     tags: [Secrets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *       - in: path
 *         name: secretId
 *         required: true
 *         schema:
 *           type: string
 *         description: The secret ID
 *     responses:
 *       200:
 *         description: Secret retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 secret:
 *                   $ref: '#/components/schemas/Secret'
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Project or secret not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/secrets/:secretId', authenticateToken, getSecret);

/**
 * @swagger
 * /projects/{projectId}/secrets/{secretId}:
 *   put:
 *     summary: Update a secret
 *     description: Updates and re-encrypts the value of an existing secret
 *     tags: [Secrets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *       - in: path
 *         name: secretId
 *         required: true
 *         schema:
 *           type: string
 *         description: The secret ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSecretRequest'
 *     responses:
 *       200:
 *         description: Secret updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 secret:
 *                   $ref: '#/components/schemas/SecretList'
 *       400:
 *         description: Invalid input - missing value
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Project or secret not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/secrets/:secretId', authenticateToken, updateSecret);

/**
 * @swagger
 * /projects/{projectId}/secrets/{secretId}:
 *   delete:
 *     summary: Delete a secret
 *     description: Permanently deletes a secret from the project
 *     tags: [Secrets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *       - in: path
 *         name: secretId
 *         required: true
 *         schema:
 *           type: string
 *         description: The secret ID
 *     responses:
 *       200:
 *         description: Secret deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Project or secret not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id/secrets/:secretId', authenticateToken, deleteSecret);

export default router;
