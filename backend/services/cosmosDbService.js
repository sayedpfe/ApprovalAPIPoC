const { CosmosClient } = require('@azure/cosmos');

class CosmosDBService {
  constructor() {
    this.client = null;
    this.database = null;
    this.container = null;
  }

  async initialize() {
    try {
      const endpoint = process.env.COSMOS_ENDPOINT;
      const key = process.env.COSMOS_KEY;
      const databaseId = process.env.COSMOS_DATABASE_ID || 'ApprovalsDB';
      const containerId = process.env.COSMOS_CONTAINER_ID || 'ApprovalMetadata';

      if (!endpoint || !key) {
        throw new Error('Cosmos DB endpoint and key must be configured in .env file');
      }

      console.log('Initializing Cosmos DB client...');
      this.client = new CosmosClient({ endpoint, key });

      // Create database if it doesn't exist
      const { database } = await this.client.databases.createIfNotExists({
        id: databaseId
      });
      this.database = database;
      console.log(`Database ready: ${databaseId}`);

      // Create container if it doesn't exist
      const { container } = await this.database.containers.createIfNotExists({
        id: containerId,
        partitionKey: { paths: ['/approvalId'] }
      });
      this.container = container;
      console.log(`Container ready: ${containerId}`);

      return true;
    } catch (error) {
      console.error('Error initializing Cosmos DB:', error);
      throw error;
    }
  }

  /**
   * Save or update approval metadata
   */
  async saveMetadata(approvalId, metadata) {
    try {
      const item = {
        id: approvalId,
        approvalId: approvalId,
        ...metadata,
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(item);
      console.log(`Metadata saved for approval: ${approvalId}`);
      return resource;
    } catch (error) {
      console.error('Error saving metadata:', error);
      throw error;
    }
  }

  /**
   * Get metadata for a specific approval
   */
  async getMetadata(approvalId) {
    try {
      const { resource } = await this.container.item(approvalId, approvalId).read();
      return resource;
    } catch (error) {
      if (error.code === 404) {
        return null; // Metadata not found
      }
      console.error('Error getting metadata:', error);
      throw error;
    }
  }

  /**
   * Get all metadata (for a specific user if needed)
   */
  async getAllMetadata(filters = {}) {
    try {
      let query = 'SELECT * FROM c';
      const conditions = [];

      if (filters.creatorEmail) {
        conditions.push(`c.creatorEmail = "${filters.creatorEmail}"`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      const { resources } = await this.container.items
        .query(query)
        .fetchAll();

      return resources;
    } catch (error) {
      console.error('Error getting all metadata:', error);
      throw error;
    }
  }

  /**
   * Delete metadata for an approval
   */
  async deleteMetadata(approvalId) {
    try {
      await this.container.item(approvalId, approvalId).delete();
      console.log(`Metadata deleted for approval: ${approvalId}`);
      return true;
    } catch (error) {
      if (error.code === 404) {
        return false; // Already deleted or doesn't exist
      }
      console.error('Error deleting metadata:', error);
      throw error;
    }
  }

  /**
   * Update specific fields in metadata
   */
  async updateMetadataFields(approvalId, updates) {
    try {
      const existing = await this.getMetadata(approvalId);
      if (!existing) {
        throw new Error(`Metadata not found for approval: ${approvalId}`);
      }

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const { resource } = await this.container.items.upsert(updated);
      console.log(`Metadata updated for approval: ${approvalId}`);
      return resource;
    } catch (error) {
      console.error('Error updating metadata fields:', error);
      throw error;
    }
  }
}

module.exports = new CosmosDBService();
