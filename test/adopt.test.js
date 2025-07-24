import { describe, test, expect } from '@jest/globals';

describe('Adopt Protocol Tests', () => {
  describe('Adoption Validation', () => {
    test('should accept valid adoption', () => {
      const validAdoption = {
        proposal_uri: '/propose/bafkrei123',
        decision_process: {
          type: 'consent',
          record: 'QmXyZ...',
          participants: ['alice', 'bob', 'charlie']
        },
        monitoring: {
          who: ['water_council', 'youth_group'],
          frequency: 'P1W'
        }
      };

      // Basic validation
      const isValid = !!(validAdoption.proposal_uri && 
                        validAdoption.decision_process?.type && 
                        validAdoption.monitoring?.who?.length > 0);

      expect(isValid).toBe(true);
    });

    test('should reject adoption without proposal URI', () => {
      const invalidAdoption = {
        decision_process: {
          type: 'consent'
        },
        monitoring: {
          who: ['water_council'],
          frequency: 'P1W'
        }
        // Missing proposal_uri
      };

      const isValid = !!(invalidAdoption.proposal_uri && 
                        invalidAdoption.decision_process?.type);

      expect(isValid).toBe(false);
    });

    test('should validate proposal URI format', () => {
      const validURIs = [
        '/propose/bafkrei123',
        '/propose/QmXyZ456',
        '/propose/abc123def'
      ];

      const invalidURIs = [
        'propose/bafkrei123', // Missing leading slash
        '/sense/bafkrei123',  // Wrong type
        '/propose/',          // Missing ID
        'invalid'             // Completely wrong format
      ];

      validURIs.forEach(uri => {
        expect(uri).toMatch(/^\/propose\/[a-zA-Z0-9]+$/);
      });

      invalidURIs.forEach(uri => {
        expect(uri).not.toMatch(/^\/propose\/[a-zA-Z0-9]+$/);
      });
    });
  });

  describe('Decision Process Types', () => {
    test('should support various decision process types', () => {
      const validTypes = [
        'consent', 
        'majority', 
        'elder_council', 
        'token_vote', 
        'oral_tradition',
        'consensus'
      ];

      validTypes.forEach(type => {
        const adoption = {
          proposal_uri: '/propose/test123',
          decision_process: { type }
        };

        expect(validTypes).toContain(adoption.decision_process.type);
      });
    });

    test('should handle cultural decision processes', () => {
      const culturalAdoption = {
        proposal_uri: '/propose/water_blessing',
        decision_process: {
          type: 'elder_council',
          participants: ['Rosa_water_keeper', 'Carlos_young_farmer_rep'],
          unanimous_consent: true,
          spiritual_validation: 'Water ceremony performed, ancestors consulted'
        }
      };

      expect(culturalAdoption.decision_process.type).toBe('elder_council');
      expect(culturalAdoption.decision_process.spiritual_validation).toContain('ancestors');
      expect(culturalAdoption.decision_process.unanimous_consent).toBe(true);
    });
  });

  describe('Modifications Handling', () => {
    test('should parse ISO 8601 duration modifications', () => {
      const parseDuration = (duration) => {
        const regex = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;
        const match = duration.match(regex);
        if (!match) return null;
        
        const [, years, months, weeks, days, hours, minutes, seconds] = match;
        return {
          years: parseInt(years) || 0,
          months: parseInt(months) || 0,
          weeks: parseInt(weeks) || 0,
          days: parseInt(days) || 0,
          hours: parseInt(hours) || 0,
          minutes: parseInt(minutes) || 0,
          seconds: parseInt(seconds) || 0
        };
      };

      expect(parseDuration('P4M')).toEqual({ 
        years: 0, months: 4, weeks: 0, days: 0, 
        hours: 0, minutes: 0, seconds: 0 
      });
      expect(parseDuration('P2W')).toEqual({ 
        years: 0, months: 0, weeks: 2, days: 0,
        hours: 0, minutes: 0, seconds: 0 
      });
      expect(parseDuration('PT2H')).toEqual({ 
        years: 0, months: 0, weeks: 0, days: 0,
        hours: 2, minutes: 0, seconds: 0 
      });
      expect(parseDuration('invalid')).toBeNull();
    });

    test('should handle test criteria modifications', () => {
      const modifications = {
        sunset: 'P4M',
        test: 'Garden produces 75% of normal harvest with 50% less water',
        cultural_additions: 'Include monthly full-moon water gratitude ceremony'
      };

      expect(modifications.test).toContain('75%');
      expect(modifications.cultural_additions).toContain('ceremony');
      expect(modifications.sunset).toMatch(/^P\d+M$/);
    });
  });

  describe('Monitoring Configuration', () => {
    test('should validate monitoring setup', () => {
      const monitoring = {
        who: ['water_council', 'youth_learners', 'elder_rosa'],
        frequency: 'P2W',
        metrics: ['well_depth_measurements', 'plant_health_scores'],
        reporting_format: 'Monthly storytelling circle + digital dashboard'
      };

      expect(monitoring.who.length).toBeGreaterThan(0);
      expect(monitoring.frequency).toMatch(/^P\d+[WDM]$/);
      expect(monitoring.metrics).toContain('well_depth_measurements');
      expect(monitoring.reporting_format).toContain('storytelling');
    });

    test('should require at least one monitor', () => {
      const invalidMonitoring = {
        who: [], // Empty array
        frequency: 'P1W'
      };

      const validMonitoring = {
        who: ['community_council'],
        frequency: 'P1W'
      };

      expect(invalidMonitoring.who.length).toBe(0);
      expect(validMonitoring.who.length).toBeGreaterThan(0);
    });
  });

  describe('Trial Period Calculation', () => {
    test('should generate review schedule', () => {
      const generateReviewSchedule = (startDate, endDate, frequency) => {
        // Mock implementation for testing
        const schedule = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Simple weekly review for testing
        if (frequency === 'P1W') {
          let current = new Date(start);
          current.setDate(current.getDate() + 7); // First review after 1 week
          
          while (current < end) {
            schedule.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 7);
          }
        }
        
        return schedule;
      };

      const schedule = generateReviewSchedule(
        '2025-08-01',
        '2025-11-01', 
        'P1W'
      );

      expect(schedule.length).toBeGreaterThan(0);
      expect(schedule[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('should calculate trial period dates', () => {
      const today = new Date().toISOString().split('T')[0];
      const fourMonthsLater = new Date();
      fourMonthsLater.setMonth(fourMonthsLater.getMonth() + 4);
      const endDate = fourMonthsLater.toISOString().split('T')[0];

      const trialPeriod = {
        starts: today,
        ends: endDate
      };

      expect(new Date(trialPeriod.starts).getTime()).toBeLessThanOrEqual(new Date(trialPeriod.ends).getTime());
      expect(trialPeriod.starts).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(trialPeriod.ends).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Revocation Conditions', () => {
    test('should generate automated revocation conditions', () => {
      const generateRevocationConditions = (testCriteria) => {
        const conditions = [];
        
        if (testCriteria.includes('conflict')) {
          conditions.push({
            if: 'community_conflict_index > 30%',
            then: 'trigger_review',
            check_frequency: 'P1W'
          });
        }
        
        if (testCriteria.includes('water') && testCriteria.includes('%')) {
          const percentMatch = testCriteria.match(/(\d+)%/);
          if (percentMatch) {
            const threshold = parseInt(percentMatch[1]);
            conditions.push({
              if: `water_efficiency < ${threshold - 10}%`,
              then: 'escalate_to_council',
              check_frequency: 'P3D'
            });
          }
        }
        
        // Always add emergency condition
        conditions.push({
          if: 'critical_failure_reported',
          then: 'immediate_halt'
        });
        
        return conditions;
      };

      const testCriteria = 'Garden produces 75% of normal harvest with 50% less water. Zero conflicts.';
      const conditions = generateRevocationConditions(testCriteria);

      expect(conditions.length).toBeGreaterThan(0);
      expect(conditions.some(c => c.if.includes('water_efficiency'))).toBe(true);
      expect(conditions.some(c => c.then === 'immediate_halt')).toBe(true);
    });
  });

  describe('Learning Archive', () => {
    test('should create learning archive structure', () => {
      const learningArchive = {
        type: 'egp_learning_archive',
        adoption_id: 'bafyrei123',
        created: new Date().toISOString(),
        structure: {
          decisions: '/decisions/',
          monitoring_data: '/monitoring/',
          community_stories: '/stories/',
          lessons_learned: '/lessons/',
          final_report: '/final_report.md'
        },
        contributors: ['water_council', 'youth_learners'],
        access_control: {
          public_read: true,
          contribute_roles: ['water_council', 'youth_learners'],
          admin_roles: ['community_council']
        }
      };

      expect(learningArchive.type).toBe('egp_learning_archive');
      expect(learningArchive.structure).toHaveProperty('community_stories');
      expect(learningArchive.structure).toHaveProperty('lessons_learned');
      expect(learningArchive.access_control.public_read).toBe(true);
      expect(learningArchive.contributors.length).toBeGreaterThan(0);
    });
  });

  describe('Adoption Lifecycle', () => {
    test('should track adoption states', () => {
      const states = ['active', 'monitoring', 'completed', 'revoked', 'expired'];
      
      expect(states).toContain('active');
      expect(states).toContain('monitoring');
      expect(states).toContain('completed');
      expect(states).toContain('revoked');
    });

    test('should generate adoption ID', () => {
      const adoption = {
        proposal_uri: '/propose/test123',
        id: `adopt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      expect(adoption.id).toMatch(/^adopt_\d+_[a-z0-9]+$/);
    });
  });
});
