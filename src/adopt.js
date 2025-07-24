import Joi from 'joi';
import { storeData, pinData, retrieveData, createRelationship } from './lib/ipfs.js';
import { createLogger, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: {
    transform: (info) => {
      info.message = `[ADOPT] ${info.message}`;
      return info;
    }
  },
  transports: [new transports.Console()]
});

// Validation schema for adopt() input
const adoptInputSchema = Joi.object({
  proposal_uri: Joi.string().required().pattern(/^\/propose\/[a-zA-Z0-9]+$/),
  decision_process: Joi.object({
    type: Joi.string().valid('consent', 'majority', 'elder_council', 'token_vote', 'oral_tradition', 'consensus').required(),
    record: Joi.string().optional(),
    participants: Joi.array().items(Joi.string()).optional(),
    unanimous_consent: Joi.boolean().optional(),
    spiritual_validation: Joi.string().optional()
  }).required(),
  modifications: Joi.object({
    sunset: Joi.string().pattern(/^P(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T\d+H)?(\d+M)?(\d+S)?$/).optional(),
    test: Joi.string().max(500).optional(),
    cultural_additions: Joi.string().max(1000).optional()
  }).optional(),
  monitoring: Joi.object({
    who: Joi.array().items(Joi.string().max(100)).min(1).required(),
    frequency: Joi.string().pattern(/^P(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T\d+H)?(\d+M)?(\d+S)?$/).required(),
    metrics: Joi.array().items(Joi.string().max(100)).optional(),
    reporting_format: Joi.string().max(200).optional()
  }).optional(),
  adopter: Joi.object({
    did: Joi.string().optional(),
    type: Joi.string().valid('community', 'organization', 'collective', 'institution').optional(),
    authority: Joi.string().optional()
  }).optional(),
  metadata: Joi.object().optional()
});

/**
 * Handle POST /adopt requests
 * The art of temporary commitment - implementing experiments
 */
export async function adoptHandler(req, res) {
  try {
    // 1. Validate input
    const { error, value: validatedInput } = adoptInputSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message,
        details: error.details
      });
    }

    // 2. Verify the referenced proposal exists and is adoptable
    const proposalId = validatedInput.proposal_uri.replace('/propose/', '');
    let referencedProposal;
    try {
      referencedProposal = await retrieveData(proposalId);
      if (!referencedProposal || referencedProposal.type !== 'egp_propose') {
        return res.status(404).json({
          error: 'Proposal Not Found',
          message: `Referenced proposal ${validatedInput.proposal_uri} does not exist or is not a valid proposal`
        });
      }
      
      // Check if proposal has expired
      if (new Date(referencedProposal.sunset_date) < new Date()) {
        return res.status(410).json({
          error: 'Proposal Expired',
          message: `Proposal expired on ${referencedProposal.sunset_date}`,
          sunset_date: referencedProposal.sunset_date
        });
      }
      
    } catch (ipfsError) {
      return res.status(404).json({
        error: 'Proposal Not Found',
        message: `Could not retrieve referenced proposal: ${ipfsError.message}`
      });
    }

    // 3. Handle sunset modifications
    let finalSunsetDate = referencedProposal.sunset_date;
    if (validatedInput.modifications?.sunset) {
      const newDuration = parseDuration(validatedInput.modifications.sunset);
      if (!newDuration || newDuration.totalDays > 365 * 2) {
        return res.status(400).json({
          error: 'Invalid Modified Sunset',
          message: 'Modified sunset duration must be valid ISO 8601 duration, maximum 2 years'
        });
      }
      finalSunsetDate = calculateSunsetDate(newDuration);
    }

    // 4. Validate monitoring frequency
    if (validatedInput.monitoring?.frequency) {
      const monitoringDuration = parseDuration(validatedInput.monitoring.frequency);
      if (!monitoringDuration) {
        return res.status(400).json({
          error: 'Invalid Monitoring Frequency',
          message: 'Monitoring frequency must be valid ISO 8601 duration'
        });
      }
    }

    // 5. Enrich the adoption object
    const adoptionObject = {
      ...validatedInput,
      type: 'egp_adopt',
      protocol_version: '0.1.0-alpha',
      timestamp: new Date().toISOString(),
      node_id: process.env.NODE_ID || 'unknown',
      status: 'active', // active -> monitoring -> completed/revoked
      trial_period: {
        starts: new Date().toISOString().split('T')[0], // Today
        ends: finalSunsetDate.split('T')[0],
        original_sunset: referencedProposal.sunset_date
      },
      proposal_context: {
        id: proposalId,
        title: referencedProposal.title,
        sense_id: referencedProposal.sense_context.id,
        original_test: referencedProposal.test
      }
    };

    logger.info(`Processing adoption: "${referencedProposal.title}" via ${validatedInput.decision_process.type}`);

    // 6. Store in IPFS
    const cid = await storeData(adoptionObject);
    
    // 7. Pin the data
    await pinData(cid);

    // 8. Create relationship links
    const proposalRelationshipCid = await createRelationship(cid, proposalId, 'adopts');
    await pinData(proposalRelationshipCid);

    // If there are modifications, link to the original
    let modificationRelationshipCid;
    if (validatedInput.modifications) {
      modificationRelationshipCid = await createRelationship(cid, proposalId, 'modifies');
      await pinData(modificationRelationshipCid);
    }

    // 9. Generate monitoring schedule
    const reviewSchedule = generateReviewSchedule(
      adoptionObject.trial_period.starts,
      adoptionObject.trial_period.ends,
      validatedInput.monitoring?.frequency || 'P2W' // Default: every 2 weeks
    );

    // 10. Set up revocation conditions based on test criteria
    const revocationConditions = generateRevocationConditions(
      validatedInput.modifications?.test || referencedProposal.test,
      validatedInput.monitoring
    );

    // 11. Create learning archive structure
    const learningArchive = await createLearningArchive(adoptionObject, referencedProposal);

    // 12. Create response
    const response = {
      id: cid,
      timestamp: adoptionObject.timestamp,
      trial_period: {
        starts: adoptionObject.trial_period.starts,
        ends: adoptionObject.trial_period.ends,
        review_at: reviewSchedule
      },
      revocation_conditions: revocationConditions,
      learning_archive: learningArchive,
      relationship_ids: {
        adopts: proposalRelationshipCid,
        ...(modificationRelationshipCid && { modifies: modificationRelationshipCid })
      }
    };

    logger.info(`Adoption stored successfully with CID: ${cid}`);

    // 13. Return response with Location header
    res.status(201)
       .location(`/adopt/${cid}`)
       .json(response);

  } catch (error) {
    logger.error('Error processing adoption:', error);
    
    if (error.message.includes('IPFS')) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'IPFS storage temporarily unavailable',
        retry_after: 30
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process adoption'
    });
  }
}

/**
 * Parse ISO 8601 duration - reused from propose.js
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
  
  parsed.totalDays = parsed.years * 365 + parsed.months * 30 + parsed.weeks * 7 + parsed.days;
  return parsed;
}

/**
 * Calculate sunset date - reused from propose.js
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
 * Generate review schedule based on monitoring frequency
 * @param {string} startDate - Trial start date
 * @param {string} endDate - Trial end date  
 * @param {string} frequency - ISO 8601 duration for review frequency
 * @returns {Array<string>} - Array of review dates
 */
function generateReviewSchedule(startDate, endDate, frequency) {
  const schedule = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const freq = parseDuration(frequency);
  
  if (!freq) return [];
  
  let current = new Date(start);
  
  // Add review intervals
  while (current < end) {
    current.setFullYear(current.getFullYear() + freq.years);
    current.setMonth(current.getMonth() + freq.months);
    current.setDate(current.getDate() + freq.weeks * 7 + freq.days);
    current.setHours(current.getHours() + freq.hours);
    current.setMinutes(current.getMinutes() + freq.minutes);
    current.setSeconds(current.getSeconds() + freq.seconds);
    
    if (current < end) {
      schedule.push(current.toISOString().split('T')[0]);
    }
  }
  
  return schedule;
}

/**
 * Generate automatic revocation conditions based on test criteria
 * @param {string} testCriteria - Success/failure test criteria
 * @param {Object} monitoring - Monitoring configuration
 * @returns {Array<Object>} - Array of revocation conditions
 */
function generateRevocationConditions(testCriteria, monitoring) {
  const conditions = [];
  
  // Parse common test patterns and create automated conditions
  if (testCriteria.includes('conflict')) {
    conditions.push({
      if: 'community_conflict_index > 30%',
      then: 'trigger_review',
      recorded_by: monitoring?.who?.[0] || 'community_council',
      check_frequency: 'P1W'
    });
  }
  
  if (testCriteria.includes('water') && testCriteria.includes('%')) {
    // Extract percentage targets from test criteria
    const percentMatch = testCriteria.match(/(\d+)%/);
    if (percentMatch) {
      const threshold = parseInt(percentMatch[1]);
      conditions.push({
        if: `water_efficiency < ${threshold - 10}%`, // 10% buffer
        then: 'escalate_to_council',
        recorded_by: 'sensor:water_monitoring',
        check_frequency: 'P3D'
      });
    }
  }
  
  if (testCriteria.includes('harvest') || testCriteria.includes('yield')) {
    conditions.push({
      if: 'crop_yield < 50% of_target',
      then: 'auto_revert',
      recorded_by: monitoring?.who?.find(w => w.includes('farmer')) || 'agricultural_monitor',
      check_frequency: 'P1M'
    });
  }
  
  // Always add a general failure condition
  conditions.push({
    if: 'critical_failure_reported',
    then: 'immediate_halt',
    recorded_by: 'any_monitor',
    description: 'Emergency stop if any monitor reports critical failure'
  });
  
  return conditions;
}

/**
 * Create IPFS-based learning archive for this adoption
 * @param {Object} adoption - Adoption object
 * @param {Object} proposal - Referenced proposal
 * @returns {Promise<string>} - IPFS URI for learning archive
 */
async function createLearningArchive(adoption, proposal) {
  try {
    const archiveStructure = {
      type: 'egp_learning_archive',
      adoption_id: 'will_be_set_after_storage',
      proposal_id: proposal.id || 'unknown',
      sense_id: proposal.sense_context?.id || 'unknown',
      created: adoption.timestamp,
      structure: {
        decisions: '/decisions/',
        monitoring_data: '/monitoring/',
        community_stories: '/stories/',
        lessons_learned: '/lessons/',
        adaptations: '/adaptations/',
        final_report: '/final_report.md'
      },
      contributors: adoption.monitoring?.who || [],
      access_control: {
        public_read: true,
        contribute_roles: adoption.monitoring?.who || [],
        admin_roles: [adoption.adopter?.did || 'community_council']
      }
    };
    
    const archiveCid = await storeData(archiveStructure);
    await pinData(archiveCid);
    
    return `/ipfs/${archiveCid}`;
    
  } catch (error) {
    logger.error('Failed to create learning archive:', error);
    // Return a placeholder - don't fail the main adoption
    return '/ipfs/learning_archive_placeholder';
  }
}
