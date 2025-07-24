#!/bin/bash

# EGP "Hello World" - Complete sense() -> propose() -> adopt() Flow
# Scenario: Community garden water crisis in San Pedro de Atacama

echo "🌱 EGP Hello World: Community Garden Water Crisis Resolution"
echo "============================================================"
echo ""

# Set base URL and authorization
BASE_URL="http://localhost:4010"
AUTH_HEADER="Authorization: Bearer did:key:community_san_pedro"

echo "📡 Step 1: SENSE - Flagging the water crisis..."
echo "-----------------------------------------------"

# 1. sense() - Community notices well running dry
SENSE_RESPONSE=$(curl -s -X POST "$BASE_URL/sense" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d @sense.json)

echo "✅ Sense signal created:"
echo "$SENSE_RESPONSE" | jq '.'

# Extract the sense ID for the next step
SENSE_ID=$(echo "$SENSE_RESPONSE" | jq -r '.id')
echo ""
echo "🔗 Sense ID: $SENSE_ID"
echo ""

# Update propose.json with the actual sense ID
sed -i.bak "s|/sense/bafyrei\.\.\.|/sense/$SENSE_ID|g" propose.json

echo "💡 Step 2: PROPOSE - Offering traditional solution..."
echo "---------------------------------------------------"

# 2. propose() - Elder suggests combining traditional knowledge with immediate action
PROPOSE_RESPONSE=$(curl -s -X POST "$BASE_URL/propose" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d @propose.json)

echo "✅ Proposal created:"
echo "$PROPOSE_RESPONSE" | jq '.'

# Extract the proposal ID for the next step
PROPOSAL_ID=$(echo "$PROPOSE_RESPONSE" | jq -r '.id')
echo ""
echo "🔗 Proposal ID: $PROPOSAL_ID"
echo ""

# Update adopt.json with the actual proposal ID
sed -i.bak "s|/propose/bafkrei\.\.\.|/propose/$PROPOSAL_ID|g" adopt.json

echo "🤝 Step 3: ADOPT - Community commits to experiment..."
echo "----------------------------------------------------"

# 3. adopt() - Community council decides through traditional ceremony
ADOPT_RESPONSE=$(curl -s -X POST "$BASE_URL/adopt" \
  -H "Content-Type: application/json" \
  -H "$AUTH_HEADER" \
  -d @adopt.json)

echo "✅ Adoption confirmed:"
echo "$ADOPT_RESPONSE" | jq '.'

# Extract key details for summary
TRIAL_START=$(echo "$ADOPT_RESPONSE" | jq -r '.trial_period.starts')
TRIAL_END=$(echo "$ADOPT_RESPONSE" | jq -r '.trial_period.ends')
LEARNING_ARCHIVE=$(echo "$ADOPT_RESPONSE" | jq -r '.learning_archive')

echo ""
echo "🎉 EGP CYCLE COMPLETE!"
echo "====================="
echo ""
echo "📊 Summary:"
echo "  • Problem: Community garden water shortage"
echo "  • Solution: Traditional terracing + night irrigation"
echo "  • Decision: Elder council with spiritual validation"
echo "  • Trial Period: $TRIAL_START to $TRIAL_END"
echo "  • Learning Archive: $LEARNING_ARCHIVE"
echo ""
echo "🌙 Next Steps:"
echo "  • Community begins moonlight irrigation tonight"
echo "  • Elders map traditional terrace locations this week"
echo "  • Youth begin apprenticeship in water management"
echo "  • Monthly storytelling circles to share progress"
echo ""
echo "✨ This demonstrates the EGP's power to bridge ancient wisdom"
echo "   with contemporary challenges through respectful process!"

# Clean up backup files
rm -f sense.json.bak propose.json.bak adopt.json.bak

echo ""
echo "📁 Files used: sense.json, propose.json, adopt.json"
echo "🔄 Ready for next EGP cycle!"
