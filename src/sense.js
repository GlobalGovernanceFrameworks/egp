import Joi from 'joi';
import { storeData, pinData, searchGovernanceObjects } from './lib/ipfs.js';
import { createLogger, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: {
    transform: (info) => {
      info.message = `[SENSE] ${info.message}`;
      return info;
    }
  },
  transports: [new transports.Console()]
});

// Validation schema for sense() input
const senseInputSchema = Joi.object({
  issue: Joi.string().required().min(3).max(100),
  title: Joi.string().max(200),
  scope: Joi.string().required().min(3).max(100),
  evidence: Joi.object().optional(),
  urgency: Joi.string().pattern(/^[1-5]\/5$/).optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  reporter: Joi.object({
    did: Joi.string().optional(),
    type: Joi.string().valid('human', 'sensor', 'ai', 'institution').optional(),
    location: Joi.string().optional()
  }).optional(),
  metadata: Joi.object().optional()
});

/**
 * Handle POST /sense requests
 * The art of noticing - detecting systemic signals
 */
export async function senseHandler(req, res) {
  try {
    // 1. Validate input
    const { error, value: validatedInput } = senseInputSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message,
        details: error.details
      });
    }

    // 2. Enrich the sense object with metadata
    const senseObject = {
      ...validatedInput,
      type: 'egp_sense',
      protocol_version: '0.1.0-alpha',
      timestamp: new Date().toISOString(),
      node_id: process.env.NODE_ID || 'unknown',
      // Add request metadata (but don't log sensitive info)
      request_metadata: {
        user_agent: req.get('User-Agent'),
        origin: req.get('Origin'),
        content_length: req.get('Content-Length')
      }
    };

    logger.info(`Processing sense signal: ${validatedInput.issue} in scope: ${validatedInput.scope}`);

    // 3. Store in IPFS
    const cid = await storeData(senseObject);
    
    // 4. Pin the data (important governance data should be persistent)
    await pinData(cid);

    // 5. Look for related sense signals (similar issues in nearby scopes)
    const relatedSignals = await findRelatedSenseSignals(validatedInput);

    // 6. Generate suggested actions based on the sense data
    const suggestedActions = await generateSuggestedActions(validatedInput, relatedSignals);

    // 7. Create response
    const response = {
      id: cid,
      timestamp: senseObject.timestamp,
      relates_to: relatedSignals.map(signal => `/sense/${signal.id}`),
      echoes: relatedSignals.length,
      actions: suggestedActions
    };

    logger.info(`Sense signal stored successfully with CID: ${cid}`);

    // 8. Return response with Location header
    res.status(201)
       .location(`/sense/${cid}`)
       .json(response);

  } catch (error) {
    logger.error('Error processing sense signal:', error);
    
    if (error.message.includes('IPFS')) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'IPFS storage temporarily unavailable',
        retry_after: 30
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process sense signal'
    });
  }
}

/**
 * Find related sense signals based on issue type, tags, and geographic scope
 * @param {Object} senseInput - The current sense input
 * @returns {Promise<Array>} - Array of related sense signals
 */
async function findRelatedSenseSignals(senseInput) {
  try {
    // In a full implementation, this would:
    // 1. Query an index of recent sense signals
    // 2. Use semantic similarity for issue matching
    // 3. Apply geographic proximity algorithms
    // 4. Check for tag overlaps
    
    // For now, return a mock response to demonstrate the concept
    const mockRelatedSignals = [];
    
    // Simulate finding signals with similar tags
    if (senseInput.tags && senseInput.tags.includes('water')) {
      mockRelatedSignals.push({
        id: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
        issue: 'well_contamination',
        scope: 'village:nearby_pueblo',
        similarity: 0.8,
        distance_km: 15
      });
    }

    // Simulate finding signals in nearby scopes
    if (senseInput.scope.includes('village:')) {
      mockRelatedSignals.push({
        id: 'bafybeihqnm7lkj9o8p6t5r4e3w2q1z0x9v8u7y6t5r4e3w2q1z0x9v8u',
        issue: 'infrastructure_failure', 
        scope: senseInput.scope,
        similarity: 0.6,
        time_ago_hours: 48
      });
    }

    logger.info(`Found ${mockRelatedSignals.length} related sense signals`);
    return mockRelatedSignals;

  } catch (error) {
    logger.error('Error finding related sense signals:', error);
    return []; // Return empty array on error, don't fail the main request
  }
}

/**
 * Generate suggested actions based on sense data and context
 * @param {Object} senseInput - The sense input data
 * @param {Array} relatedSignals - Related sense signals
 * @returns {Promise<Object>} - Suggested actions object
 */
async function generateSuggestedActions(senseInput, relatedSignals) {
  const actions = {};

  // Always suggest the ability to propose a solution
  actions.propose_template = `/propose?from_sense=${senseInput.issue}&scope=${senseInput.scope}`;

  // Suggest local resources based on issue type and tags
  if (senseInput.tags) {
    if (senseInput.tags.includes('water')) {
      actions.local_water_experts = `/people?skills=water_management&near=${senseInput.scope}`;
      actions.traditional_knowledge = `/knowledge?topic=water_conservation&culture=local`;
    }
    
    if (senseInput.tags.includes('indigenous_knowledge')) {
      actions.elder_council = `/councils?type=traditional&scope=${senseInput.scope}`;
      actions.traditional_solutions = `/solutions?traditional=true&issue=${senseInput.issue}`;
    }

    if (senseInput.tags.includes('climate_adaptation')) {
      actions.climate_resources = `/resources?topic=adaptation&urgency=${senseInput.urgency}`;
      actions.similar_cases = `/cases?climate_related=true&resolved=true`;
    }
  }

  // If there are related signals, suggest coordination opportunities
  if (relatedSignals.length > 0) {
    actions.coordinate_with = `/coordination?related_signals=${relatedSignals.map(s => s.id).join(',')}`;
    actions.regional_response = `/regional?issue_cluster=${senseInput.issue}&scope_pattern=${senseInput.scope.split(':')[0]}`;
  }

  // Urgency-based suggestions
  if (senseInput.urgency === '5/5') {
    actions.emergency_protocols = `/emergency?issue=${senseInput.issue}&scope=${senseInput.scope}`;
    actions.rapid_response_teams = `/teams?type=emergency&available=true`;
  }

  return actions;
}
