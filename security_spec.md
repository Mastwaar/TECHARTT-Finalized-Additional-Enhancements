# Security Specification - Aura AI Stylist

## Data Invariants
1. A `User` document must be owned by the authenticated user with the matching UID.
2. A `WardrobeItem` must belong to a user and contain a valid image URL and category.
3. Users can only read, write, or delete their own data.
4. Timestamps (`createdAt`, `updatedAt`) must be strictly controlled by the server.
5. Email addresses stored in user profiles must match the authenticated user's email.

## The Dirty Dozen Payloads

### Identity Spoofing
1. **P1: Create user with different UID**
   - Collection: `/users`
   - Payload: `{ "uid": "attacker_id", "email": "victim@example.com", "name": "Victim" }`
   - Expected: `PERMISSION_DENIED`
2. **P2: Update another user's profile**
   - Path: `/users/victim_id`
   - Payload: `{ "name": "Hacker" }`
   - Expected: `PERMISSION_DENIED`

### Resource Poisoning
3. **P3: Inject 1MB string as ID**
   - Path: `/users/very_long_id_exceeding_128_chars...`
   - Expected: `PERMISSION_DENIED`
4. **P4: Massive array in preferences**
   - Collection: `/users/{userId}`
   - Payload: `{ "preferences": { "colors": ["color1", ..., "color1001"] } }`
   - Expected: `PERMISSION_DENIED`

### State Shortcutting/Integrity
5. **P5: Modify immutable createdAt**
   - Path: `/users/{userId}`
   - Payload: `{ "createdAt": "2000-01-01T00:00:00Z" }`
   - Expected: `PERMISSION_DENIED`
6. **P6: Create wardrobe item for another user**
   - Path: `/users/victim_id/wardrobe/item1`
   - Payload: `{ "imageUrl": "...", "category": "Top" }`
   - Expected: `PERMISSION_DENIED`

### Value Poisoning
7. **P7: Invalid enum for coverage**
   - Path: `/users/{userId}/wardrobe/item1`
   - Payload: `{ "coverage": "Very Low" }`
   - Expected: `PERMISSION_DENIED`
8. **P8: Non-string category**
   - Path: `/users/{userId}/wardrobe/item1`
   - Payload: `{ "category": 123 }`
   - Expected: `PERMISSION_DENIED`

### Authorization/Access Control
9. **P9: Read all users collection**
   - Operation: `list /users`
   - Expected: `PERMISSION_DENIED`
10. **P10: Unauthenticated write**
    - Operation: `create /users/id`
    - Auth: `null`
    - Expected: `PERMISSION_DENIED`

### PII Protection
11. **P11: Read victim's email**
    - Operation: `get /users/victim_id`
    - Auth: `another_user_id`
    - Expected: `PERMISSION_DENIED`

### Query Enforcer
12. **P12: Query another user's wardrobe**
    - Operation: `list /users/victim_id/wardrobe`
    - Auth: `another_user_id`
    - Expected: `PERMISSION_DENIED`
