# `POST /propose`  
## *The Art of Offering*  

### 🌿 **Purpose**  
A `propose()` is:  
- **A humble hypothesis** ("What if we tried X?")  
- **A cultural artifact** (e.g., a song, a flowchart, a ritual)  
- **A time-bound experiment** ("Let’s test this for 3 moons")  

### 📜 **Request**  
```http
POST /propose
Content-Type: application/json
Authorization: Bearer <DID_or_UCAN_token>

{
  "title": "Moonlight Water Sharing",  
  "in_response_to": "/sense/123",  // Linked `sense()` call  
  "solution": {
    "description": "Farmers take turns at night to reduce evaporation",
    "format": "text/markdown",     // Could be `video/mp4`, `application/geo+json`, etc.
    "content": "![Moonlit irrigation sketch](...)"  
  },
  "test": "Conflict drops 20% in 2mo",  // Success metric
  "sunset": "P6M",                     // ISO 8601 duration (6 months)
  "resources": {
    "needed": ["jugs", "volunteers"],
    "offered": ["land_access", "elders_council"]
  }
}
```

### 🌟 **Response**  
```http
201 Created
Location: /propose/456
Content-Type: application/json

{
  "id": "bafkrei...",  
  "echoes": 5,        // Similar proposals nearby  
  "conflicts": [      // Other proposals this might clash with
    { "id": "/propose/101", "reason": "overlaps_land_use" }
  ],
  "rituals": {        // Cultural protocols for adoption
    "consent_process": "/rituals/water_council",
    "offering_required": "tobacco_bundle"
  }
}
```

### 🌀 **Vibe Checks**  
- **No bureaucratese**: A `solution` can be a folk song about water justice.  
- **Test ≠ Bureaucracy**: "Does this feel right?" is a valid metric for cultural proposals.  
- **Resource poetry**: `offered: ["moonlight", "grandmothers_wisdom"]` is allowed.  

### 🌎 **Edge Cases**  
```yaml
# An AI proposes based on sensor data:
in_response_to: "/sense/789"  
solution: { 
  format: "application/llm+json", 
  content: {"algorithm": "gradient_boosting", "params": {...}}
}

# A child draws a solution:
solution: {
  format: "image/jpeg", 
  content: "base64... (crayon drawing of rain barrels)"
}
```

### 🔗 **Related**  
- How problems surface: [`POST /sense`](./sense.md)  
- How solutions are adopted: [`POST /adopt`](./adopt.md)  
