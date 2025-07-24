#!/usr/bin/env node
// test-egp.js - Quick test script for EGP API

const API_BASE = 'http://localhost:4010';
const AUTH_HEADER = 'Bearer did:key:test123';

async function testEGP() {
  console.log('🌱 Testing EGP API...\n');

  // Test 1: sense() - The art of noticing
  console.log('1️⃣ Testing /sense - The art of noticing');
  try {
    const senseResponse = await fetch(`${API_BASE}/sense`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH_HEADER
      },
      body: JSON.stringify({
        issue: "water_shortage",
        title: "The well is dry",
        scope: "village:llajta",
        evidence: {
          sensor_data: "pH 9.2",
          oral_history: "Elder María says this hasn't happened in 70 years"
        },
        urgency: "3/5",
        tags: ["water", "climate", "indigenous_knowledge"]
      })
    });
    
    const senseData = await senseResponse.json();
    console.log('✅ Sense signal created:', senseData);
    console.log('📍 Location:', senseResponse.headers.get('location'));
  } catch (error) {
    console.log('❌ Sense test failed:', error.message);
  }

  console.log('\n' + '─'.repeat(50) + '\n');

  // Test 2: propose() - The art of offering
  console.log('2️⃣ Testing /propose - The art of offering');
  try {
    const proposeResponse = await fetch(`${API_BASE}/propose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH_HEADER
      },
      body: JSON.stringify({
        title: "Moonlight Water Sharing",
        in_response_to: "/sense/123",
        solution: {
          description: "Farmers take turns at night to reduce evaporation",
          format: "text/markdown",
          content: "![Moonlit irrigation sketch](...)"
        },
        test: "Conflict drops 20% in 2mo",
        sunset: "P6M",
        resources: {
          needed: ["jugs", "volunteers"],
          offered: ["land_access", "elders_council"]
        }
      })
    });
    
    const proposeData = await proposeResponse.json();
    console.log('✅ Proposal created:', proposeData);
    console.log('🔗 Echoes:', proposeData.echoes, 'similar proposals nearby');
    if (proposeData.rituals) {
      console.log('🎭 Cultural rituals:', proposeData.rituals);
    }
  } catch (error) {
    console.log('❌ Propose test failed:', error.message);
  }

  console.log('\n' + '─'.repeat(50) + '\n');

  // Test 3: adopt() - The art of temporary commitment
  console.log('3️⃣ Testing /adopt - The art of temporary commitment');
  try {
    const adoptResponse = await fetch(`${API_BASE}/adopt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH_HEADER
      },
      body: JSON.stringify({
        proposal_uri: "/propose/456",
        decision_process: {
          type: "consent",
          record: "QmXyZ..."
        },
        modifications: {
          sunset: "P3M",
          test: "Conflict drops 10%"
        },
        monitoring: {
          who: ["water_council", "youth_group"],
          frequency: "P1W"
        }
      })
    });
    
    const adoptData = await adoptResponse.json();
    console.log('✅ Adoption created:', adoptData);
    console.log('⏰ Trial period:', adoptData.trial_period);
    if (adoptData.revocation_conditions) {
      console.log('🔄 Auto-revert conditions:', adoptData.revocation_conditions);
    }
  } catch (error) {
    console.log('❌ Adopt test failed:', error.message);
  }

  console.log('\n🌍 EGP test complete! The three verbs of governance coordination. 🌍');
}

// Run the tests
testEGP().catch(console.error);
