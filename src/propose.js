import Joi from 'joi';
import { storeData, pinData, retrieveData, createRelationship } from './lib/ipfs.js';
import { createLogger, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: {
    transform: (info) => {
      info.message = `[PROPOSE] ${info.message}`;
      return info;
    }
  },
  transports: [new transports.Console()]
});

// Validation schema for propose() input
const proposeInputSchema = Joi.object({
  title: Joi.string().required().min(5).max(200),
  in_response_to: Joi.string().required().pattern(/^\/sense\/[a-zA-Z0-9]+$/),
  solution: Joi.object({
    description: Joi.string().required().min(10).max(1000),
    format: Joi.string().valid('text/plain', 'text/markdown', 'text/html').default('text/markdown'),
    content: Joi.string().optional().max(10000) // For detailed content, diagrams, etc.
  }).required(),
  test: Joi.string().required().min(10).max(500),
  sunset: Joi.string().required().pattern(/^P(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T\d+H)?(\d+M)?(\d+S)?$/), // ISO 8601 duration
  resources: Joi.object({
    needed: Joi.array().items(Joi.string().max(100)).max(20).optional(),
    offered: Joi.array().items(Joi.string().max(100)).max(20).optional()
  }).optional(),
  proposer: Joi.object({
    did: Joi.string().optional(),
    type: Joi.string().valid('individual', 'organization', 'ai', 'collective').optional(),
    credentials: Joi.array().items(Joi.string()).optional()
  }).optional(),
  metadata: Joi.object().optional()
});

/**
 * Handle POST /propose requests
 * The art of offering - suggesting solutions to sense signals
 */
export async function proposeHandler(req, res) {
  try {
    // 1. Validate input
    const { error, value: validatedInput } = proposeInputSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message,
        details: error.details
      });
    }

    // 2. Verify the referenced sense signal exists
    const senseId = validatedInput.in_response_to.replace('/sense/', '');
    let referencedSense;
    try {
      referencedSense = await retrieveData(senseId);
      if (!referencedSense || referencedSense.type !== 'egp_sense') {
        return res.status(404).json({
          error: 'Sense Signal Not Found',
          message: `Referenced sense signal ${validatedInput.in_response_to} does not exist or is not a valid sense signal`
        });
      }
    } catch (ipfsError) {
      return res.status(404).json({
        error: 'Sense Signal Not Found',
        message: `Could not retrieve referenced sense signal: ${ipfsError.message}`
      });
    }

    // 3. Parse and validate sunset duration
    const sunsetDuration = parseDuration(validatedInput.sunset);
    if (!sunsetDuration || sunsetDuration.totalDays > 365 * 2) { // Max 2 years
      return res.status(400).json({
        error: 'Invalid Sunset Duration',
        message: 'Sunset duration must be valid ISO 8601 duration, maximum 2 years'
      });
    }

    // 4. Enrich the proposal object
    const proposalObject = {
      ...validatedInput,
      type: 'egp_propose',
      protocol_version: '0.1.0-alpha',
      timestamp: new Date().toISOString(),
      node_id: process.env.NODE_ID || 'unknown',
      sunset_date: calculateSunsetDate(sunsetDuration),
      status: 'proposed', // proposed -> adopted -> active -> completed/expired
      sense_context: {
        id: senseId,
        issue: referencedSense.issue,
        scope: referencedSense.scope,
        urgency: referencedSense.urgency
      }
    };

    logger.info(`Processing proposal: "${validatedInput.title}" for sense signal: ${senseId}`);

    // 5. Store in IPFS
    const cid = await storeData(proposalObject);
    
    // 6. Pin the data
    await pinData(cid);

    // 7. Create relationship link between proposal and sense signal
    const relationshipCid = await createRelationship(cid, senseId, 'responds_to');
    await pinData(relationshipCid);

    // 8. Look for conflicting proposals
    const conflicts = await findConflictingProposals(proposalObject, referencedSense);

    // 9. Suggest cultural/governance protocols for adoption
    const rituals = await suggestAdoptionRituals(proposalObject, referencedSense);

    // 10. Calculate "echoes" - similar proposals in this context
    const echoes = await findSimilarProposals(proposalObject, referencedSense);

    // 11. Create response
    const response = {
      id: cid,
      timestamp: proposalObject.timestamp,
      sunset_date: proposalObject.sunset_date,
      echoes: echoes.length,
      conflicts: conflicts,
      rituals: rituals,
      relationship_id: relationshipCid
    };

    logger.info(`Proposal stored successfully with CID: ${cid}`);

    // 12. Return response with Location header
    res.status(201)
       .location(`/propose/${cid}`)
       .json(response);

  } catch (error) {
    logger.error('Error processing proposal:', error);
    
    if (error.message.includes('IPFS')) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'IPFS storage temporarily unavailable',
        retry_after: 30
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process proposal'
    });
  }
}

/**
 * Parse ISO 8601 duration string into a useful object
 * @param {string} duration - ISO 8601 duration (e.g., "P6M", "P1Y2M3D")
 * @returns {Object|null} - Parsed duration object or null if invalid
 */
function parseDuration(duration) {
  const regex = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;
  const match = duration.match(regex);
  
  if (!match) return null;
  
  const [, years, months, weeks, days, hours, minutes, seconds] = match;
  
  const parsed = {
    years: parseInt(years) || 0,
    months: parseInt(months) || 0,
    weeks: parseInt(weeks) || 0,
    days: parseInt(days) || 0,
    hours: parseInt(hours) || 0,
    minutes: parseInt(minutes) || 0,
    seconds: parseInt(seconds) || 0
  };
  
  // Calculate total days for validation
  parsed.totalDays = parsed.years * 365 + parsed.months * 30 + parsed.weeks * 7 + parsed.days;
  
  return parsed;
}

/**
 * Calculate sunset date based on duration
 * @param {Object} duration - Parsed duration object
 * @returns {string} - ISO date string for sunset
 */
function calculateSunsetDate(duration) {
  const now = new Date();
  const sunset = new Date(now);
  
  sunset.setFullYear(sunset.getFullYear() + duration.years);
  sunset.setMonth(sunset.getMonth() + duration.months);
  sunset.setDate(sunset.getDate() + duration.weeks * 7 + duration.days);
  sunset.setHours(sunset.getHours() + duration.hours);
  sunset.setMinutes(sunset.getMinutes() + duration.minutes);
  sunset.setSeconds(sunset.getSeconds() + duration.seconds);
  
  return sunset.toISOString();
}

/**
 * Find proposals that might conflict with this one
 * @param {Object} proposal - Current proposal
 * @param {Object} senseSignal - Referenced sense signal
 * @returns {Promise<Array>} - Array of conflicting proposals
 */
async function findConflictingProposals(proposal, senseSignal) {
  try {
    // In a full implementation, this would:
    // 1. Query proposals responding to the same sense signal
    // 2. Check for resource conflicts (needed vs offered)
    // 3. Identify mutually exclusive approaches
    // 4. Flag timing conflicts
    
    const conflicts = [];
    
    // Mock conflict detection
    if (proposal.resources?.needed?.includes('land_access')) {
      conflicts.push({
        id: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
        reason: 'overlaps_land_use',
        severity: 'medium',
        details: 'Both proposals require exclusive access to the same land area'
      });
    }
    
    if (proposal.solution.description.includes('night irrigation') && 
        senseSignal.scope.includes('village:')) {
      conflicts.push({
        id: 'bafybeihqnm7lkj9o8p6t5r4e3w2q1z0x9v8u7y6t5r4e3w2q1z0x9v8u',
        reason: 'timing_conflict',
        severity: 'low', 
        details: 'Another proposal suggests daytime water management which may conflict'
      });
    }
    
    logger.info(`Found ${conflicts.length} potential conflicts`);
    return conflicts;
    
  } catch (error) {
    logger.error('Error finding conflicting proposals:', error);
    return [];
  }
}

/**
 * Suggest cultural protocols for adopting this proposal
 * @param {Object} proposal - Current proposal
 * @param {Object} senseSignal - Referenced sense signal
 * @returns {Promise<Object>} - Suggested adoption rituals/protocols
 */
async function suggestAdoptionRituals(proposal, senseSignal) {
  const rituals = {};
  
  // Suggest governance protocols based on scope and cultural context
  if (senseSignal.scope.includes('village:')) {
    rituals.consent_process = '/rituals/village_council';
    
    if (senseSignal.tags?.includes('indigenous_knowledge')) {
      rituals.elder_blessing = '/rituals/elder_council_blessing';
      rituals.spiritual_validation = '/ceremonies/water_blessing';
    }
    
    if (senseSignal.tags?.includes('water')) {
      rituals.offering_required = 'traditional_water_ceremony';
      rituals.blessing_required = 'water_spirit_consultation';
    }
  }
  
  // Resource-based ritual suggestions
  if (proposal.resources?.needed?.length > 0) {
    rituals.resource_commitment_ceremony = '/rituals/resource_sharing';
  }
  
  // Urgency-based protocols
  if (senseSignal.urgency === '5/5') {
    rituals.emergency_adoption = '/protocols/crisis_decision';
    rituals.rapid_consent = '/rituals/emergency_council';
  } else {
    rituals.deliberative_process = '/protocols/consensus_building';
    rituals.community_dialogue = '/rituals/talking_circle';
  }
  
  return rituals;
}

/**
 * Find similar proposals for calculating "echoes"
 * @param {Object} proposal - Current proposal
 * @param {Object} senseSignal - Referenced sense signal
 * @returns {Promise<Array>} - Array of similar proposals
 */
async function findSimilarProposals(proposal, senseSignal) {
  try {
    // Mock implementation - in reality would use semantic similarity
    const similar = [];
    
    // Find proposals with similar resource patterns
    if (proposal.resources?.offered?.includes('traditional_knowledge')) {
      similar.push({
        id: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
        similarity: 0.7,
        reason: 'both_offer_traditional_knowledge'
      });
    }
    
    // Find proposals with similar solution approaches
    if (proposal.solution.description.includes('traditional') && 
        proposal.solution.description.includes('irrigation')) {
      similar.push({
        id: 'bafybeihqnm7lkj9o8p6t5r4e3w2q1z0x9v8u7y6t5r4e3w2q1z0x9v8u',
        similarity: 0.85,
        reason: 'similar_traditional_water_management'
      });
    }
    
    logger.info(`Found ${similar.length} similar proposals`);
    return similar;
    
  } catch (error) {
    logger.error('Error finding similar proposals:', error);
    return [];
  }
}
