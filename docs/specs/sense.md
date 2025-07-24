# `POST /sense`  
## *The Art of Noticing*  

### 🌱 **Purpose**  
This is how the world whispers to the system. A `sense()` call is:  
- **A distress signal** (e.g., "Our river is toxic")  
- **A love letter** (e.g., "The elders’ stories are healing us")  
- **A data pulse** (e.g., "PM2.5 levels just hit 300")  

### 📮 **Request**  
```http
POST /sense
Content-Type: application/json
Authorization: Bearer <DID_or_UCAN_token>

{
  "issue": "water_shortage",  // Machine-readable ID (see taxonomy)
  "title": "The well is dry", // Human title
  "scope": "village:llajta", // GPS, bioregion, or community ID  
  "evidence": {              // Flexible proof
    "sensor_data": "pH 9.2", 
    "oral_history": "Elder María says this hasn’t happened in 70 years"
  },
  "urgency": "3/5",          // 1=chronic, 5=catastrophic
  "tags": ["water", "climate", "indigenous_knowledge"]
}
```

### 🌊 **Response**  
```http
201 Created
Location: /sense/123
Content-Type: application/json

{
  "id": "bafyrei...",        // IPFS CID (immutable)
  "timestamp": "2025-07-24T12:34:56Z",
  "relates_to": ["/sense/101"],  // Linked issues
  "echoes": 42,              // Similar `sense()` calls nearby
  "actions": {               // Suggested next steps
    "propose_template": "/propose?from_sense=123",
    "local_healers": "/people?skills=water_rituals"
  }
}
```

### 🧠 **Vibe Checks**  
- **No perfect evidence**: A child’s drawing of a dying tree is valid.  
- **No forced categories**: `issue` can be a hashtag (`#no_water`) or URI (`lex:water/shortage`).  
- **Living metadata**: `tags` evolve via ML (e.g., auto-add `#drought` if linked to climate signals).  

### 🚧 **Edge Cases**  
```yaml
# A sensor pings without context:
{"issue": "air_quality", "scope": "geo:45.5017,-73.5673", "evidence": {"pm2.5": 300}}

# A poet senses collective grief:
{"issue": "solastalgia", "scope": "network:transition_town", "evidence": {"poem": "..."}}
```

### Related  
- How solutions emerge: [`POST /propose`](./propose.md)  
- How solutions are adopted: [`POST /adopt`](./adopt.md)  
