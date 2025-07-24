# `POST /adopt`  
## *The Art of Temporary Commitment*  

### 🌱 **Purpose**  
An `adopt()` is:  
- **A time-bound experiment** ("Let’s try this for one season")  
- **A collective ritual** (e.g., signing a clay tablet, blockchain attestation)  
- **A learning loop** (success or fail, we document and share)  

### 📜 **Request**  
```http
POST /adopt
Content-Type: application/json
Authorization: Bearer <DID_or_UCAN_token>

{
  "proposal_uri": "/propose/456",  // Linked proposal  
  "decision_process": {
    "type": "consent",             // Could be "majority", "elder_council", etc.
    "record": "QmXyZ...",          // IPFS hash of meeting minutes/video
  },
  "modifications": {               // Optional tweaks
    "sunset": "P3M",               // Shortened/lengthened duration  
    "test": "Conflict drops 10%",  // Adjusted success metric
  },
  "monitoring": {
    "who": ["water_council", "youth_group"],
    "frequency": "P1W",            // ISO 8601 (e.g., weekly check-ins)
  }
}
```

### 🌟 **Response**  
```http
201 Created
Location: /adopt/789
Content-Type: application/json

{
  "id": "bafy...",  
  "trial_period": {
    "starts": "2025-08-01",
    "ends": "2025-11-01",
    "review_at": ["2025-09-01", "2025-10-01"]  // Midpoint check-ins
  },
  "revocation_conditions": [
    {
      "if": "conflict > 30%", 
      "then": "auto_revert",
      "recorded_by": "sensor:water_disputes"
    }
  ],
  "learning_archive": "/ipfs/QmLearn..."  // Shared memory space
}
```

### 🌀 **Vibe Checks**  
- **Sunset as sacred**: Expiration dates prevent institutional inertia.  
- **Modifications honored**: Communities can adapt proposals *without* bureaucracy.  
- **Failure = data**: Revocation conditions are celebrated, not feared.  

### 🌍 **Edge Cases**  
```yaml
# A DAO adopts via smart contract:
decision_process: {
  type: "token_vote",
  record: "0xabc... (tx hash)"
}

# A village adopts through song:
decision_process: {
  type: "oral_tradition",
  record: "memory:elder_juanita"
}
```

### 🔗 **Related**  
- How problems surface: [`POST /sense`](./sense.md)  
- How solutions form: [`POST /propose`](./propose.md)  

