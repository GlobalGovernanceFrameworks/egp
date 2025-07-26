Here’s how to **merge EGP’s JSON schema with the Love Ledger’s requirements**, creating a unified data structure that connects governance signals (`sense/propose/adopt`) with care economies (`Hearts/Leaves`):

---

### **1. Unified JSON Schema Design**
#### **Core Principles**  
- **EGP Compatibility**: Reuse EGP’s `operation`, `timestamp`, `location` fields.  
- **Love Ledger Extensions**: Add `care_metrics`, `hearts_allocation`, `leaves_metadata`.  
- **Interoperability**: Ensure AUBI systems can ingest the data via shared fields.  

#### **Schema (`schema.json`)**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "EGP_LoveLedger_Unified",
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": ["sense", "propose", "adopt"],
      "description": "EGP system call type"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp"
    },
    "agent": {
      "type": "string",
      "description": "DID or community ID",
      "examples": ["did:example:elder", "baz:navajo"]
    },
    "location": {
      "type": "object",
      "properties": {
        "gps": { "type": "string" },
        "community_id": { "type": "string" }
      }
    },
    // EGP <> Love Ledger Shared Fields
    "content": {
      "type": "object",
      "properties": {
        "description": { "type": "string" },
        "evidence": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Photos, voice notes, sensor data"
        }
      }
    },
    // Love Ledger-Specific Fields
    "care_metrics": {
      "type": "object",
      "properties": {
        "act_type": {
          "type": "string",
          "enum": ["childcare", "elders", "ecological"]
        },
        "hours": { "type": "number" },
        "impact_score": {
          "type": "number",
          "minimum": 1,
          "maximum": 5
        }
      }
    },
    "currency_alloc": {
      "type": "object",
      "properties": {
        "hearts": { "type": "number" },
        "leaves": { 
          "type": "object",
          "properties": {
            "amount": { "type": "number" },
            "nft_metadata": { 
              "type": "object",
              "properties": {
                "gps": { "type": "string" },
                "eco_act": { "type": "string" }
              }
            }
          }
        }
      }
    },
    // EGP <> AUBI Bridge
    "aubi_integration": {
      "type": "object",
      "properties": {
        "layer": {
          "type": "integer",
          "description": "AUBI payout layer (1-4)",
          "minimum": 1,
          "maximum": 4
        },
        "sunset_clause": {
          "type": "string",
          "description": "ISO 8601 duration (e.g., P6M)"
        }
      }
    }
  },
  "required": ["operation", "timestamp", "agent"]
}
```

---

### **2. Example Payloads**  
#### **A. `sense()` + Care Log**  
```json
{
  "operation": "sense",
  "timestamp": "2025-07-25T14:30:00Z",
  "agent": "did:example:maria",
  "location": { "gps": "35.6812,-105.9056", "community_id": "baz:taos" },
  "content": {
    "description": "Elder José isolated for 3 days",
    "evidence": ["ipfs://QmXyZ..."]
  },
  "care_metrics": {
    "act_type": "elders",
    "hours": 0,  // Sense calls have no hours initially
    "impact_score": 3
  }
}
```

#### **B. `propose()` + Hearts Reward**  
```json
{
  "operation": "propose",
  "timestamp": "2025-07-25T15:00:00Z",
  "agent": "did:example:weaver",
  "location": { "community_id": "baz:taos" },
  "content": {
    "description": "Daily elder check-ins by volunteers",
    "evidence": ["ipfs://QmAbC..."]
  },
  "care_metrics": {
    "act_type": "elders",
    "hours": 1,
    "impact_score": 4
  },
  "currency_alloc": {
    "hearts": 20,
    "leaves": null
  },
  "aubi_integration": {
    "layer": 2,
    "sunset_clause": "P3M"
  }
}
```

#### **C. `adopt()` + Leaves NFT**  
```json
{
  "operation": "adopt",
  "timestamp": "2025-07-25T16:00:00Z",
  "agent": "baz:taos_council",
  "location": { "gps": "35.6812,-105.9056" },
  "content": {
    "description": "Adopted elder check-ins + river cleanup",
    "evidence": ["ipfs://QmDeF..."]
  },
  "care_metrics": {
    "act_type": "ecological",
    "hours": 2,
    "impact_score": 5
  },
  "currency_alloc": {
    "hearts": 10,
    "leaves": {
      "amount": 5,
      "nft_metadata": {
        "gps": "35.6812,-105.9056",
        "eco_act": "river_cleanup"
      }
    }
  },
  "aubi_integration": {
    "layer": 2,
    "sunset_clause": "P6M"
  }
}
```

---

### **3. Key Integration Points**  
1. **EGP → Love Ledger**:  
   - `sense()` acts trigger **Hearts**-eligible proposals (`impact_score ≥ 3`).  
   - `adopt()` decisions auto-mint **Leaves** NFTs via `nft_metadata`.  

2. **Love Ledger → AUBI**:  
   - `aubi_integration.layer` determines payout tier (e.g., Layer 2 = Hearts bonus).  
   - `sunset_clause` aligns with AUBI’s policy expiration.  

3. **Shared Validation**:  
   - All `evidence` fields use IPFS for immutable storage (EGP’s standard).  
   - `agent` uses DIDs (Decentralized Identifiers) for cross-system trust.  

---

### **4. Implementation Steps**  
1. **Create `schema.json`** in the EGP repo’s `/schemas` folder.  
2. **Add Validators**:  
   ```javascript
   // Validate against schema
   import Ajv from 'ajv';
   const ajv = new Ajv();
   const validate = ajv.compile(require('./schemas/schema.json'));

   if (!validate(payload)) console.log(validate.errors);
   ```
3. **Test with Real Data**:  
   - Use the example payloads above in EGP’s mock server.  
   - Verify Love Ledger can ingest `care_metrics` and `currency_alloc`.  

4. **Document the Bridge**:  
   ```markdown
   ## EGP ↔ Love Ledger Data Flow  
   - `sense()` → Logs care gaps → Love Ledger proposes **Hearts**.  
   - `adopt()` → Mints **Leaves** NFTs → AUBI pays out.  
   ```

---

### **5. Why This Works**  
- **Backward Compatible**: EGP nodes ignore `care_metrics` if unused.  
- **Extensible**: Add new `act_type` enums without breaking changes.  
- **Human+Machine Readable**: Schema supports both UI forms and API automation.  

Need a hand implementing the validator or testing with your mock API? I can draft the Node.js/Python code.
