import { create } from 'ipfs-http-client';
import { CID } from 'multiformats/cid';
import { createLogger, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: {
    transform: (info) => {
      info.message = `[IPFS] ${info.message}`;
      return info;
    }
  },
  transports: [new transports.Console()]
});

// IPFS client instance
let ipfs = null;

/**
 * Initialize IPFS connection
 * Uses local IPFS node if available, falls back to public gateway
 */
export async function initIPFS() {
  const ipfsUrl = process.env.IPFS_API_URL || 'http://127.0.0.1:5001';
  
  try {
    // Try connecting to local IPFS node first
    ipfs = create({ url: ipfsUrl });
    
    // Test the connection
    const version = await ipfs.version();
    logger.info(`Connected to IPFS node: ${version.version}`);
    
    return ipfs;
  } catch (error) {
    logger.warn(`Failed to connect to local IPFS at ${ipfsUrl}: ${error.message}`);
    
    try {
      // Fallback to Infura IPFS (requires API key in production)
      const infuraProjectId = process.env.INFURA_PROJECT_ID;
      const infuraProjectSecret = process.env.INFURA_PROJECT_SECRET;
      
      if (infuraProjectId && infuraProjectSecret) {
        const auth = 'Basic ' + Buffer.from(infuraProjectId + ':' + infuraProjectSecret).toString('base64');
        
        ipfs = create({
          host: 'ipfs.infura.io',
          port: 5001,
          protocol: 'https',
          headers: {
            authorization: auth,
          },
        });
        
        const version = await ipfs.version();
        logger.info(`Connected to Infura IPFS: ${version.version}`);
        return ipfs;
      }
      
      throw new Error('No IPFS connection available and no Infura credentials provided');
    } catch (fallbackError) {
      logger.error('Failed to establish any IPFS connection:', fallbackError.message);
      throw fallbackError;
    }
  }
}

/**
 * Store data in IPFS and return CID
 * @param {Object} data - Data to store
 * @returns {Promise<string>} - Content ID (CID)
 */
export async function storeData(data) {
  if (!ipfs) {
    throw new Error('IPFS not initialized. Call initIPFS() first.');
  }

  try {
    // Convert data to JSON if it's an object
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    
    // Add to IPFS
    const result = await ipfs.add(content);
    const cid = result.cid.toString();
    
    logger.info(`Stored data in IPFS with CID: ${cid}`);
    return cid;
  } catch (error) {
    logger.error('Failed to store data in IPFS:', error);
    throw new Error(`IPFS storage failed: ${error.message}`);
  }
}

/**
 * Retrieve data from IPFS by CID
 * @param {string} cid - Content ID
 * @returns {Promise<Object>} - Retrieved data
 */
export async function retrieveData(cid) {
  if (!ipfs) {
    throw new Error('IPFS not initialized. Call initIPFS() first.');
  }

  try {
    // Validate CID format
    CID.parse(cid);
    
    // Retrieve from IPFS
    const stream = ipfs.cat(cid);
    let data = '';
    
    for await (const chunk of stream) {
      data += new TextDecoder().decode(chunk);
    }
    
    // Try to parse as JSON, fall back to raw string
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  } catch (error) {
    logger.error(`Failed to retrieve data from IPFS (CID: ${cid}):`, error);
    throw new Error(`IPFS retrieval failed: ${error.message}`);
  }
}

/**
 * Pin data in IPFS to prevent garbage collection
 * @param {string} cid - Content ID to pin
 * @returns {Promise<void>}
 */
export async function pinData(cid) {
  if (!ipfs) {
    throw new Error('IPFS not initialized. Call initIPFS() first.');
  }

  try {
    await ipfs.pin.add(cid);
    logger.info(`Pinned data in IPFS: ${cid}`);
  } catch (error) {
    logger.error(`Failed to pin data (CID: ${cid}):`, error);
    throw new Error(`IPFS pinning failed: ${error.message}`);
  }
}

/**
 * Create an IPLD link structure for governance relationships
 * @param {string} fromCID - Source CID
 * @param {string} toCID - Target CID  
 * @param {string} relationshipType - Type of relationship
 * @returns {Promise<string>} - CID of the relationship object
 */
export async function createRelationship(fromCID, toCID, relationshipType) {
  const relationship = {
    type: 'egp_relationship',
    from: { '/': fromCID },
    to: { '/': toCID },
    relationshipType,
    timestamp: new Date().toISOString(),
    protocol_version: '0.1.0-alpha'
  };

  return await storeData(relationship);
}

/**
 * Search for governance objects by type and criteria
 * This is a basic implementation - in production you'd want a proper indexing system
 * @param {string} objectType - Type of object to search for ('sense', 'propose', 'adopt')
 * @param {Object} criteria - Search criteria
 * @returns {Promise<Array>} - Array of matching objects
 */
export async function searchGovernanceObjects(objectType, criteria = {}) {
  // This is a placeholder - in a real implementation you would:
  // 1. Maintain an index of governance objects
  // 2. Use IPFS pubsub to track new objects
  // 3. Implement proper querying capabilities
  
  logger.warn('searchGovernanceObjects is not fully implemented - this is a development placeholder');
  
  return []; // Return empty array for now
}

/**
 * Get IPFS node status and peer information
 * @returns {Promise<Object>} - Node status
 */
export async function getNodeStatus() {
  if (!ipfs) {
    return { connected: false, error: 'IPFS not initialized' };
  }

  try {
    const [version, id, peers] = await Promise.all([
      ipfs.version(),
      ipfs.id(),
      ipfs.swarm.peers()
    ]);

    return {
      connected: true,
      version: version.version,
      nodeId: id.id,
      peerCount: peers.length,
      agentVersion: version.commit
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
}

export { ipfs };
