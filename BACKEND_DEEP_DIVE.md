# 🏗️ BARTER Backend - Deep Dive Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Microservices Deep Dive](#microservices-deep-dive)
4. [Authentication & Security Flow](#authentication--security-flow)
5. [Data Flow & Communication Patterns](#data-flow--communication-patterns)
6. [Database Design & Patterns](#database-design--patterns)
7. [Event-Driven Architecture](#event-driven-architecture)
8. [Real-Time Communication](#real-time-communication)
9. [Common Framework Components](#common-framework-components)
10. [Interview Preparation Guide](#interview-preparation-guide)

---

## Introduction

### What is BARTER?
BARTER is a **skill exchange platform** where users can trade skills with each other. Think of it like a dating app, but for skills! Users create profiles with:
- **Skills Offered**: What they can teach (e.g., "Java programming", "Guitar playing")
- **Skills Wanted**: What they want to learn (e.g., "Spanish", "Cooking")

The platform intelligently matches users based on complementary skills and enables them to chat and exchange knowledge.

### Why Microservices?
This project uses **microservices architecture** because:
1. **Scalability**: Each service can scale independently
2. **Technology Diversity**: Different services can use different databases (PostgreSQL, MongoDB, Elasticsearch)
3. **Team Independence**: Different teams can work on different services
4. **Fault Isolation**: If one service fails, others continue working
5. **Deployment Flexibility**: Services can be deployed independently

---

## Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│                    (React Frontend - Port 5173)                   │
└────────────────────────────┬──────────────────────────────────────┘
                             │
                             │ HTTPS/WSS
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│                    API GATEWAY / LOAD BALANCER                     │
└────────────────────────────┬──────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ User Service │    │ Matching     │    │ Chat Service │
│ Port 8080    │    │ Service      │    │ Port 8083    │
│              │    │ Port 8082    │    │              │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ PostgreSQL   │    │ PostgreSQL   │    │ MongoDB      │
│              │    │ Elasticsearch│    │              │
└──────────────┘    └──────────────┘    └──────────────┘
                             │
                             │
                             ▼
                    ┌──────────────┐
                    │ Notification │
                    │ Service      │
                    │ Port 8084    │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ MongoDB      │
                    └──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  Keycloak (Port 8081)  │  Kafka  │  Elasticsearch (Port 9200)   │
└─────────────────────────────────────────────────────────────────┘
```

### Service Responsibilities

| Service | Port | Database | Primary Responsibility |
|---------|------|----------|----------------------|
| **User Service** | 8080 | PostgreSQL | User profile management, authentication integration |
| **Matching Service** | 8082 | PostgreSQL + Elasticsearch | Intelligent matching, swipe management |
| **Chat Service** | 8083 | MongoDB | Real-time messaging via WebSocket |
| **Notification Service** | 8084 | MongoDB | Event-driven notifications |

---

## Microservices Deep Dive

### 1. User Service (Port 8080)

#### Purpose
The User Service is the **central authority** for all user-related data. It manages user profiles, handles authentication integration with Keycloak, and provides user statistics.

#### Technology Stack
- **Framework**: Spring Boot 3.x
- **Database**: PostgreSQL
- **ORM**: Spring Data JPA
- **Security**: Spring Security + Keycloak OAuth2

#### Key Components

##### 1.1 Controller Layer
```java
@RestController
@RequestMapping("/v1/user/profile")
public class UserProfileController {
    // Handles HTTP requests
    // Validates input
    // Returns responses
}
```

**Key Endpoints:**
- `GET /v1/user/profile?keycloakId={id}` - Get user by Keycloak ID
- `GET /v1/user/profile/me` - Get current authenticated user
- `GET /v1/user/profile/all` - Get all users (paginated)
- `POST /v1/user/profile/signup/public` - Public signup endpoint
- `PUT /v1/user/profile/update` - Update user profile
- `DELETE /v1/user/profile/delete` - Delete user
- `GET /v1/user/profile/skills?skill={skill}` - Find users by skill
- `GET /v1/user/profile/stats/active-users` - Get active users count
- `POST /v1/user/profile/credits/add` - Add credits to user

##### 1.2 Service Layer (Business Logic)
```java
@Service
public class UserProfileService {
    // Contains business logic
    // Orchestrates data access
    // Handles transactions
}
```

**Responsibilities:**
- User profile CRUD operations
- Skill-based search
- Credit management
- Statistics calculation

##### 1.3 Repository Layer (Data Access)
```java
@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
    // Database operations
    // Custom queries
}
```

**Database Schema Example:**
```sql
CREATE TABLE user_profile (
    id UUID PRIMARY KEY,
    keycloak_id UUID UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    username VARCHAR(50) UNIQUE,
    bio TEXT,
    gender VARCHAR(10),
    skills_offered TEXT[],  -- Array of skills
    skills_wanted TEXT[],    -- Array of skills
    credits INTEGER DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### Complete Request Flow Example

**Scenario: User wants to update their profile**

```
┌──────────┐
│  Client  │
│ (React)  │
└────┬─────┘
     │
     │ 1. PUT /v1/user/profile/update
     │    Headers: Authorization: Bearer <JWT_TOKEN>
     │    Body: { "firstName": "John", "bio": "Developer" }
     │
     ▼
┌─────────────────────────────────────┐
│  Spring Security Filter Chain        │
│  - Validates JWT token               │
│  - Extracts user info from token     │
│  - Sets AuthenticationPrincipal      │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  UserProfileController              │
│  @PutMapping("/update")             │
│  updateUserProfile(                 │
│    @RequestBody UpdateRequest,      │
│    @AuthenticationPrincipal Jwt     │
│  )                                   │
└────┬────────────────────────────────┘
     │
     │ 2. Extract user ID from JWT
     │    Extract update data from request
     │
     ▼
┌─────────────────────────────────────┐
│  UserProfileFacade                  │
│  - Validates business rules          │
│  - Checks permissions               │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  UserProfileService                 │
│  - Fetches existing profile         │
│  - Applies updates                  │
│  - Validates data                   │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  UserProfileRepository              │
│  - Saves to PostgreSQL              │
│  - Returns updated entity            │
└────┬────────────────────────────────┘
     │
     │ 3. Return updated UserProfile
     │
     ▼
┌──────────┐
│  Client  │
│ Receives │
│ Response │
└──────────┘
```

**Code Example:**
```java
@PutMapping("/update")
public UserProfile updateUserProfile(
    @RequestBody UpdateRequest request, 
    @AuthenticationPrincipal Jwt jwt
) {
    // Extract user ID from JWT token
    String userId = jwt.getSubject();
    
    // Call service layer
    return userProfileFacade.updateUserProfile(request, jwt);
}
```

#### Authentication Flow in User Service

**Scenario: User logs in through the frontend**

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ 1. POST /v1/auth/login/public
     │    { "username": "john", "password": "pass123" }
     │
     ▼
┌─────────────────────────────────────┐
│  AuthController                     │
│  @PostMapping("/login/public")      │
│  - This endpoint is PUBLIC          │
│  - No authentication required       │
└────┬────────────────────────────────┘
     │
     │ 2. Build Keycloak token request
     │    grant_type=password
     │    client_id=oauth-demo-client
     │    username=john
     │    password=pass123
     │
     ▼
┌─────────────────────────────────────┐
│  Keycloak Server                    │
│  Port 8081                          │
│  /realms/oauth2-demo/               │
│  /protocol/openid-connect/token     │
└────┬────────────────────────────────┘
     │
     │ 3. Validate credentials
     │    Generate JWT token
     │
     ▼
┌─────────────────────────────────────┐
│  AuthController                     │
│  - Receives access_token            │
│  - Receives refresh_token           │
│  - Receives expires_in              │
└────┬────────────────────────────────┘
     │
     │ 4. Return LoginResponse
     │    {
     │      "accessToken": "eyJhbGc...",
     │      "refreshToken": "eyJhbGc...",
     │      "expiresIn": 3600
     │    }
     │
     ▼
┌──────────┐
│  Client  │
│ Stores   │
│ Token    │
└──────────┘
```

---

### 2. Matching Service (Port 8082)

#### Purpose
The Matching Service is the **brain** of the platform. It:
- Finds compatible users based on skills
- Manages swipe actions (like/pass)
- Tracks matches
- Syncs user data to Elasticsearch for fast searching

#### Technology Stack
- **Framework**: Spring Boot 3.x
- **Databases**: 
  - PostgreSQL (for matches, swipes)
  - Elasticsearch (for fast user search)
- **Communication**: 
  - Feign Client (to call User Service)
  - Kafka Producer (to publish match events)

#### Key Components

##### 2.1 Matching Algorithm Flow

**Scenario: User requests top matches**

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ GET /v1/matches/top?keycloakId=abc-123
     │
     ▼
┌─────────────────────────────────────┐
│  MatchingController                 │
│  getPersonalizedProfiles()          │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  MatchingService                    │
│  findTopMatches(keycloakId)         │
└────┬────────────────────────────────┘
     │
     │ Step 1: Get current user profile
     │
     ▼
┌─────────────────────────────────────┐
│  UserServiceClient (Feign)          │
│  - Calls User Service               │
│  - GET /v1/user/profile?keycloakId  │
└────┬────────────────────────────────┘
     │
     │ Returns: UserProfile
     │ {
     │   "skillsOffered": ["Java", "Spring"],
     │   "skillsWanted": ["Guitar", "Spanish"]
     │ }
     │
     ▼
┌─────────────────────────────────────┐
│  MatchingService                    │
│  Step 2: Query Elasticsearch       │
│  - Find users whose skillsWanted    │
│    includes current user's          │
│    skillsOffered                    │
│  - Find users whose skillsOffered   │
│    includes current user's          │
│    skillsWanted                     │
└────┬────────────────────────────────┘
     │
     │ Elasticsearch Query:
     │ {
     │   "query": {
     │     "bool": {
     │       "should": [
     │         { "terms": { "skillsWanted": ["Java", "Spring"] }},
     │         { "terms": { "skillsOffered": ["Guitar", "Spanish"] }}
     │       ]
     │     }
     │   }
     │ }
     │
     ▼
┌─────────────────────────────────────┐
│  Elasticsearch                      │
│  Returns: List of UserDocuments     │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  MatchingService                    │
│  Step 3: Filter already swiped      │
│  - Query PostgreSQL for swipes     │
│  - Remove users already swiped     │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  MatchingService                    │
│  Step 4: Calculate Match Score      │
│  - Count overlapping skills         │
│  - Apply ranking algorithm          │
│  - Sort by score                    │
└────┬────────────────────────────────┘
     │
     │ Returns: Top 10 matches
     │
     ▼
┌──────────┐
│  Client  │
└──────────┘
```

**Match Score Calculation Example:**

```java
public double calculateMatchScore(UserProfile currentUser, UserDocument candidate) {
    double score = 0.0;
    
    // Check if candidate wants what current user offers
    for (String skill : currentUser.getSkillsOffered()) {
        if (candidate.getSkillsWanted().contains(skill)) {
            score += 10.0; // Perfect match
        }
    }
    
    // Check if candidate offers what current user wants
    for (String skill : currentUser.getSkillsWanted()) {
        if (candidate.getSkillsOffered().contains(skill)) {
            score += 10.0; // Perfect match
        }
    }
    
    // Bonus for mutual matches (both want each other's skills)
    // This creates a higher score for better matches
    
    return score;
}
```

##### 2.2 Swipe Flow

**Scenario: User swipes right (likes) another user**

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ POST /v1/swipe
     │ {
     │   "userId": "user-123",
     │   "swipedUserId": "user-456",
     │   "action": "RIGHT"  // or "LEFT"
     │ }
     │
     ▼
┌─────────────────────────────────────┐
│  MatchingController                 │
│  swipe(SwipeRequest)                 │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  SwipeService                       │
│  swipe(request)                     │
└────┬────────────────────────────────┘
     │
     │ Step 1: Save swipe to database
     │
     ▼
┌─────────────────────────────────────┐
│  SwipeRepository                    │
│  save(new Swipe(...))                │
└────┬────────────────────────────────┘
     │
     │ Step 2: Check if it's a match
     │ (both users swiped RIGHT)
     │
     ▼
┌─────────────────────────────────────┐
│  SwipeService                       │
│  checkForMatch(userId, swipedUserId) │
│  - Query: Has swipedUserId swiped   │
│    RIGHT on userId?                  │
└────┬────────────────────────────────┘
     │
     │ If YES → It's a MATCH!
     │
     ▼
┌─────────────────────────────────────┐
│  MatchService                       │
│  createMatch(userId, swipedUserId)  │
│  - Save match to database            │
└────┬────────────────────────────────┘
     │
     │ Step 3: Publish match event
     │
     ▼
┌─────────────────────────────────────┐
│  KafkaProducer                      │
│  publishMatchEvent(match)            │
│  Topic: "matched_topic"              │
└────┬────────────────────────────────┘
     │
     │ Event Published:
     │ {
     │   "userId1": "user-123",
     │   "userId2": "user-456",
     │   "matchedAt": "2024-01-15T10:30:00Z"
     │ }
     │
     ▼
┌─────────────────────────────────────┐
│  SwipeService                       │
│  Returns SwipeResponse               │
│  {                                   │
│    "matched": true,                  │
│    "matchDto": { ... }               │
│  }                                   │
└────┬────────────────────────────────┘
     │
     ▼
┌──────────┐
│  Client  │
│ Shows    │
│ "It's a  │
│ Match!"  │
└──────────┘
```

**Database Schema for Swipes:**
```sql
CREATE TABLE swipe (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    swiped_user_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL,  -- 'RIGHT' or 'LEFT'
    created_at TIMESTAMP,
    UNIQUE(user_id, swiped_user_id)  -- One swipe per user pair
);

CREATE TABLE match (
    id UUID PRIMARY KEY,
    user1_id UUID NOT NULL,
    user2_id UUID NOT NULL,
    matched_at TIMESTAMP,
    UNIQUE(user1_id, user2_id)
);
```

##### 2.3 Unmatch Flow

**Scenario: User wants to unmatch with someone they previously matched with**

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ DELETE /v1/matches/unmatch?user1Id=abc-123&user2Id=def-456
     │
     ▼
┌─────────────────────────────────────┐
│  MatchingController                 │
│  unmatch(user1Id, user2Id)          │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  MatchingService                    │
│  unmatch(user1Id, user2Id)          │
└────┬────────────────────────────────┘
     │
     │ Step 1: Validate inputs
     │ - Check both IDs are not null
     │ - Check IDs are not the same
     │
     │ Step 2: Find match record
     │ - Search in both directions
     │   (user1-user2 or user2-user1)
     │
     ▼
┌─────────────────────────────────────┐
│  MatchHistoryRepository             │
│  findByUser1IdAndUser2Id()          │
│  - Checks both orderings            │
└────┬────────────────────────────────┘
     │
     │ If match found:
     │
     ▼
┌─────────────────────────────────────┐
│  MatchHistoryRepository             │
│  delete(match)                      │
│  - Removes match from database      │
└────┬────────────────────────────────┘
     │
     │ Match deleted successfully
     │
     ▼
┌──────────┐
│  Client  │
│ Receives │
│ Success  │
└──────────┘
```

**Implementation Details:**
```java
@Transactional
public void unmatch(UUID user1Id, UUID user2Id) {
    // Validate inputs
    if (user1Id == null || user2Id == null) {
        throw new ServiceException("Both user IDs are required");
    }
    
    if (user1Id.equals(user2Id)) {
        throw new ServiceException("Cannot unmatch a user with themselves");
    }
    
    // Find match in both directions
    Optional<MatchHistory> match1 = 
        matchHistoryRepository.findByUser1IdAndUser2Id(user1Id, user2Id);
    Optional<MatchHistory> match2 = 
        matchHistoryRepository.findByUser1IdAndUser2Id(user2Id, user1Id);
    
    MatchHistory matchToDelete = match1.orElse(match2.orElse(null));
    
    if (matchToDelete == null) {
        throw new ServiceException("No match found between the specified users");
    }
    
    // Delete the match
    matchHistoryRepository.delete(matchToDelete);
}
```

**Key Endpoints:**
- `DELETE /v1/matches/unmatch?user1Id={id}&user2Id={id}` - Unmatch two users

##### 2.4 User Sync to Elasticsearch

**Why Elasticsearch?**
- **Fast Search**: PostgreSQL is great for transactions, but Elasticsearch is optimized for search
- **Complex Queries**: Can handle complex skill matching queries efficiently
- **Scalability**: Can handle millions of documents

**Sync Flow:**
```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ POST /v1/sync/user?keycloakId=abc-123
     │
     ▼
┌─────────────────────────────────────┐
│  MatchingController                 │
│  syncUser(keycloakId)               │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  UserSyncService                    │
│  syncUser(keycloakId)                │
└────┬────────────────────────────────┘
     │
     │ Step 1: Fetch user from User Service
     │
     ▼
┌─────────────────────────────────────┐
│  UserServiceClient (Feign)           │
│  getUserProfile(keycloakId)          │
└────┬────────────────────────────────┘
     │
     │ Returns: UserProfile
     │
     ▼
┌─────────────────────────────────────┐
│  UserSyncService                    │
│  Step 2: Convert to UserDocument     │
│  - Extract relevant fields          │
│  - Format for Elasticsearch          │
└────┬────────────────────────────────┘
     │
     │ UserDocument:
     │ {
     │   "keycloakId": "abc-123",
     │   "firstName": "John",
     │   "lastName": "Doe",
     │   "skillsOffered": ["Java", "Spring"],
     │   "skillsWanted": ["Guitar", "Spanish"]
     │ }
     │
     ▼
┌─────────────────────────────────────┐
│  ElasticsearchClient                │
│  index("users_index", document)      │
└────┬────────────────────────────────┘
     │
     │ Document indexed in Elasticsearch
     │
     ▼
┌──────────┐
│  Client  │
│ Receives │
│ "Synced" │
└──────────┘
```

---

### 3. Chat Service (Port 8083)

#### Purpose
The Chat Service handles **real-time messaging** between matched users. It uses WebSocket for instant communication and MongoDB for message persistence.

#### Technology Stack
- **Framework**: Spring Boot 3.x
- **Database**: MongoDB
- **Real-time**: WebSocket + STOMP protocol
- **Communication**: 
  - Feign Client (to verify matches)
  - Kafka Producer (to publish message events)

#### WebSocket Architecture

**Why WebSocket?**
- **Real-time**: Messages appear instantly without polling
- **Bidirectional**: Both client and server can send messages
- **Efficient**: No HTTP overhead for each message

**WebSocket Connection Flow:**

```
┌──────────┐
│  Client  │
│ (React)  │
└────┬─────┘
     │
     │ 1. WebSocket Connection
     │    ws://localhost:8083/ws
     │
     ▼
┌─────────────────────────────────────┐
│  WebSocket Handshake                │
│  - HTTP Upgrade request             │
│  - Protocol negotiation              │
└────┬────────────────────────────────┘
     │
     │ Connection Established
     │
     ▼
┌─────────────────────────────────────┐
│  STOMP Protocol                     │
│  - Subscribe to personal queue      │
│  - SUBSCRIBE /user/{userId}/        │
│    queue/messages                    │
└────┬────────────────────────────────┘
     │
     │ Connection Ready
     │
     ▼
┌─────────────────────────────────────┐
│  Client can now:                    │
│  - Send messages                    │
│  - Receive messages                  │
└─────────────────────────────────────┘
```

#### Message Sending Flow

**Scenario: User sends a message**

```
┌──────────┐
│  Client  │
│ (React)  │
└────┬─────┘
     │
     │ 1. Send via WebSocket
     │    Destination: /app/private-message
     │    Body: {
     │      "senderId": "user-123",
     │      "receiverId": "user-456",
     │      "content": "Hello!"
     │    }
     │
     ▼
┌─────────────────────────────────────┐
│  ChatController                     │
│  @MessageMapping("/private-message")│
│  sendPrivateMessage(Message)        │
└────┬────────────────────────────────┘
     │
     │ Step 1: Check if users are matched
     │
     ▼
┌─────────────────────────────────────┐
│  MatchService                       │
│  isMatch(senderId, receiverId)      │
│  - Calls Matching Service           │
│  - OR checks local cache             │
└────┬────────────────────────────────┘
     │
     │ If NOT matched → Reject message
     │ If matched → Continue
     │
     ▼
┌─────────────────────────────────────┐
│  MessageService                     │
│  saveMessage(message)                │
│  - Save to MongoDB                   │
└────┬────────────────────────────────┘
     │
     │ Message saved:
     │ {
     │   "id": "msg-789",
     │   "senderId": "user-123",
     │   "receiverId": "user-456",
     │   "content": "Hello!",
     │   "timestamp": "2024-01-15T10:30:00Z"
     │ }
     │
     ▼
┌─────────────────────────────────────┐
│  KafkaProducer                      │
│  publishMessageEvent(message)        │
│  Topic: "message_topic"              │
└────┬────────────────────────────────┘
     │
     │ Step 3: Send to receiver via WebSocket
     │
     ▼
┌─────────────────────────────────────┐
│  SimpMessagingTemplate              │
│  convertAndSend(                    │
│    "/queue/messages/user-456",      │
│    message                           │
│  )                                   │
└────┬────────────────────────────────┘
     │
     │ Message delivered to receiver
     │
     ▼
┌──────────┐
│ Receiver │
│ Client   │
│ Sees     │
│ Message  │
└──────────┘
```

**MongoDB Document Structure:**
```json
{
  "_id": "msg-789",
  "senderId": "user-123",
  "receiverId": "user-456",
  "content": "Hello!",
  "timestamp": ISODate("2024-01-15T10:30:00Z"),
  "read": false
}
```

#### Match Verification

**Why verify matches?**
- **Security**: Only matched users should chat
- **Data Integrity**: Prevents unauthorized messaging
- **User Experience**: Users only see relevant conversations

**Verification Logic:**
```java
public boolean isMatch(String userId1, String userId2) {
    // Option 1: Check if they have existing messages
    // (If they have messages, they must be matched)
    List<Message> existingMessages = 
        messageRepository.findBySenderIdAndReceiverId(userId1, userId2);
    if (!existingMessages.isEmpty()) {
        return true; // They have chat history
    }
    
    // Option 2: Check Matching Service
    return matchServiceClient.isMatch(userId1, userId2);
}
```

---

### 4. Notification Service (Port 8084)

#### Purpose
The Notification Service handles **event-driven notifications**. It listens to Kafka events and creates notifications for users.

#### Technology Stack
- **Framework**: Spring Boot 3.x
- **Database**: MongoDB
- **Communication**: 
  - Kafka Consumer (listens to events)
  - Feign Client (to fetch user info)

#### Event Consumption Flow

**Scenario: A match occurs**

```
┌─────────────────────────────────────┐
│  Matching Service                   │
│  Publishes match event               │
└────┬────────────────────────────────┘
     │
     │ Kafka Event:
     │ Topic: "matched_topic"
     │ {
     │   "userId1": "user-123",
     │   "userId2": "user-456",
     │   "matchedAt": "2024-01-15T10:30:00Z"
     │ }
     │
     ▼
┌─────────────────────────────────────┐
│  Kafka Broker                       │
│  Stores event in topic               │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  Notification Service               │
│  KafkaConsumer                       │
│  @KafkaListener("matched_topic")    │
│  consumeMatchEvent(event)            │
└────┬────────────────────────────────┘
     │
     │ Step 1: Fetch user profiles
     │
     ▼
┌─────────────────────────────────────┐
│  UserServiceClient (Feign)          │
│  getUserProfile(userId1)            │
│  getUserProfile(userId2)            │
└────┬────────────────────────────────┘
     │
     │ Step 2: Create notifications
     │
     ▼
┌─────────────────────────────────────┐
│  NotificationService                │
│  createNotification(                │
│    userId1,                          │
│    "You matched with John Doe!"      │
│  )                                   │
│  createNotification(                │
│    userId2,                          │
│    "You matched with Jane Smith!"     │
│  )                                   │
└────┬────────────────────────────────┘
     │
     │ Step 3: Save to MongoDB
     │
     ▼
┌─────────────────────────────────────┐
│  NotificationRepository             │
│  save(notification)                 │
└────┬────────────────────────────────┘
     │
     │ Notifications saved:
     │ [
     │   {
     │     "userId": "user-123",
     │     "message": "You matched with John Doe!",
     │     "type": "MATCH",
     │     "createdAt": "2024-01-15T10:30:00Z"
     │   },
     │   {
     │     "userId": "user-456",
     │     "message": "You matched with Jane Smith!",
     │     "type": "MATCH",
     │     "createdAt": "2024-01-15T10:30:00Z"
     │   }
     │ ]
     │
     ▼
┌─────────────────────────────────────┐
│  NotificationService                │
│  (Optional) Send via WebSocket      │
│  for real-time delivery              │
└─────────────────────────────────────┘
```

**Kafka Consumer Configuration:**
```java
@KafkaListener(topics = "matched_topic", groupId = "notification-service")
public void consumeMatchEvent(MatchEvent event) {
    // Process match event
    // Create notifications
    // Save to database
}
```

---

## Authentication & Security Flow

### OAuth2 / OpenID Connect Overview

**What is OAuth2?**
OAuth2 is an **authorization framework** that allows applications to access resources on behalf of users without sharing passwords.

**What is OpenID Connect?**
OpenID Connect (OIDC) is built on OAuth2 and adds **authentication** (identity verification) on top of authorization.

### Keycloak Integration

**What is Keycloak?**
Keycloak is an **open-source identity and access management** solution. It handles:
- User authentication
- User registration
- Token generation (JWT)
- Token validation

### Complete Authentication Flow

```
┌──────────┐
│  Client  │
│ (React)  │
└────┬─────┘
     │
     │ 1. User clicks "Login"
     │
     ▼
┌─────────────────────────────────────┐
│  Frontend                            │
│  Redirects to Keycloak               │
│  http://localhost:8081/realms/       │
│  oauth2-demo/protocol/openid-connect │
│  /auth?client_id=...&redirect_uri=...│
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  Keycloak Login Page                │
│  - User enters credentials          │
│  - Keycloak validates               │
└────┬────────────────────────────────┘
     │
     │ 2. Keycloak generates tokens
     │
     ▼
┌─────────────────────────────────────┐
│  Keycloak                           │
│  Returns authorization code         │
│  Redirects to:                      │
│  http://localhost:5173/callback?   │
│  code=abc123...                     │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  Frontend                            │
│  Exchanges code for tokens           │
│  POST /token                         │
│  {                                   │
│    "grant_type": "authorization_code"│
│    "code": "abc123...",              │
│    "client_id": "...",               │
│    "redirect_uri": "..."            │
│  }                                   │
└────┬────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│  Keycloak                            │
│  Returns tokens:                     │
│  {                                   │
│    "access_token": "eyJhbGc...",     │
│    "refresh_token": "eyJhbGc...",    │
│    "expires_in": 3600,               │
│    "token_type": "Bearer"            │
│  }                                   │
└────┬────────────────────────────────┘
     │
     │ 3. Frontend stores tokens
     │
     ▼
┌─────────────────────────────────────┐
│  Frontend                            │
│  - Stores access_token              │
│  - Stores refresh_token             │
│  - Adds to all API requests:        │
│    Authorization: Bearer <token>     │
└────┬────────────────────────────────┘
     │
     │ 4. API Request with token
     │
     ▼
┌─────────────────────────────────────┐
│  Backend Service                    │
│  Spring Security Filter             │
│  - Validates JWT token              │
│  - Extracts user info              │
│  - Sets AuthenticationPrincipal      │
└────┬────────────────────────────────┘
     │
     │ Request processed
     │
     ▼
┌──────────┐
│ Response│
└──────────┘
```

### JWT Token Structure

**What is a JWT?**
JWT (JSON Web Token) is a **compact, URL-safe token** that contains:
1. **Header**: Algorithm and token type
2. **Payload**: User claims (ID, roles, etc.)
3. **Signature**: Ensures token hasn't been tampered with

**Example JWT Payload:**
```json
{
  "sub": "user-123",                    // Subject (user ID)
  "iss": "http://localhost:8081/realms/oauth2-demo",  // Issuer
  "aud": ["account", "realm-management"],  // Audience
  "exp": 1705315200,                    // Expiration time
  "iat": 1705311600,                    // Issued at
  "preferred_username": "john_doe",     // Username
  "email": "john@example.com",         // Email
  "realm_access": {                     // Realm roles
    "roles": ["default-roles-oauth2-demo"]
  },
  "resource_access": {                 // Resource roles
    "account": {
      "roles": ["manage-account"]
    }
  }
}
```

### Security Configuration

**How does Spring Security validate tokens?**

```java
@Configuration
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        http
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtDecoder(jwtDecoder())  // How to decode JWT
                )
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/v1/**/public/**").permitAll()  // Public endpoints
                .anyRequest().authenticated()  // All others need auth
            );
        return http.build();
    }
    
    @Bean
    public JwtDecoder jwtDecoder() {
        // Fetches public key from Keycloak
        // Validates token signature
        return NimbusJwtDecoder
            .withJwkSetUri("http://localhost:8081/realms/oauth2-demo/protocol/openid-connect/certs")
            .build();
    }
}
```

---

## Data Flow & Communication Patterns

### Synchronous Communication (Feign)

**What is Feign?**
Feign is a **declarative HTTP client** that makes it easy to call REST APIs from other services.

**Example: Matching Service calls User Service**

```java
@FeignClient(name = "user-service", url = "http://localhost:8080")
public interface UserServiceClient {
    
    @GetMapping("/v1/user/profile")
    UserProfile getUserProfile(@RequestParam("keycloakId") UUID keycloakId);
}
```

**Usage:**
```java
@Service
public class MatchingService {
    
    @Autowired
    private UserServiceClient userServiceClient;
    
    public UserProfile getUserProfile(UUID keycloakId) {
        // This makes an HTTP GET request to:
        // http://localhost:8080/v1/user/profile?keycloakId=...
        return userServiceClient.getUserProfile(keycloakId);
    }
}
```

**Request Flow:**
```
┌─────────────────────┐
│ Matching Service    │
│ MatchingService     │
└──────┬──────────────┘
       │
       │ userServiceClient.getUserProfile(id)
       │
       ▼
┌─────────────────────┐
│ Feign Client        │
│ - Builds HTTP request│
│ - Adds authentication│
│ - Makes HTTP call   │
└──────┬──────────────┘
       │
       │ HTTP GET http://localhost:8080/v1/user/profile?keycloakId=...
       │ Headers: Authorization: Bearer <token>
       │
       ▼
┌─────────────────────┐
│ User Service        │
│ UserProfileController│
│ - Validates request │
│ - Returns profile   │
└──────┬──────────────┘
       │
       │ HTTP 200 OK
       │ Body: { "id": "...", "firstName": "John", ... }
       │
       ▼
┌─────────────────────┐
│ Matching Service    │
│ Receives response   │
└─────────────────────┘
```

### Asynchronous Communication (Kafka)

**What is Kafka?**
Apache Kafka is a **distributed event streaming platform**. It allows services to publish and subscribe to events asynchronously.

**Why use Kafka?**
- **Decoupling**: Services don't need to know about each other
- **Scalability**: Can handle millions of events per second
- **Reliability**: Events are persisted and can be replayed
- **Real-time**: Low latency event delivery

**Kafka Architecture:**

```
┌─────────────────────┐
│ Producer Service    │
│ (Matching Service)  │
└──────┬──────────────┘
       │
       │ Publishes event
       │
       ▼
┌─────────────────────┐
│ Kafka Topic         │
│ "matched_topic"     │
│ - Stores events     │
│ - Maintains order   │
└──────┬──────────────┘
       │
       │ Consumer subscribes
       │
       ▼
┌─────────────────────┐
│ Consumer Service    │
│ (Notification       │
│  Service)           │
└─────────────────────┘
```

**Event Publishing Example:**

```java
@Service
public class MatchEventProducer {
    
    @Autowired
    private KafkaTemplate<String, MatchEvent> kafkaTemplate;
    
    public void publishMatchEvent(UUID userId1, UUID userId2) {
        MatchEvent event = MatchEvent.builder()
            .userId1(userId1.toString())
            .userId2(userId2.toString())
            .matchedAt(Instant.now())
            .build();
        
        // Publish to Kafka topic
        kafkaTemplate.send("matched_topic", event);
    }
}
```

**Event Consumption Example:**

```java
@Component
public class MatchEventConsumer {
    
    @KafkaListener(topics = "matched_topic", groupId = "notification-service")
    public void consumeMatchEvent(MatchEvent event) {
        // Process the event
        // Create notifications
        // Save to database
    }
}
```

---

## Database Design & Patterns

### Database Selection Strategy

**Why different databases for different services?**

| Service | Database | Reason |
|---------|----------|--------|
| User Service | PostgreSQL | ACID transactions, relational data, complex queries |
| Matching Service | PostgreSQL | Transactional data (matches, swipes) |
| Matching Service | Elasticsearch | Fast search, skill matching queries |
| Chat Service | MongoDB | Document-based, flexible schema, high write throughput |
| Notification Service | MongoDB | Document-based, flexible notification structure |

### PostgreSQL Patterns

**Entity Relationship Example:**

```sql
-- User Profile Table
CREATE TABLE user_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_id UUID UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    bio TEXT,
    gender VARCHAR(10),
    skills_offered TEXT[],
    skills_wanted TEXT[],
    credits INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Swipe Table
CREATE TABLE swipe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profile(id),
    swiped_user_id UUID NOT NULL REFERENCES user_profile(id),
    action VARCHAR(10) NOT NULL CHECK (action IN ('LEFT', 'RIGHT')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, swiped_user_id)
);

-- Match Table
CREATE TABLE match (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES user_profile(id),
    user2_id UUID NOT NULL REFERENCES user_profile(id),
    matched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user1_id, user2_id)
);
```

### MongoDB Patterns

**Document Structure Example:**

```javascript
// Message Collection
{
  "_id": ObjectId("..."),
  "senderId": "user-123",
  "receiverId": "user-456",
  "content": "Hello! How are you?",
  "timestamp": ISODate("2024-01-15T10:30:00Z"),
  "read": false,
  "readAt": null
}

// Notification Collection
{
  "_id": ObjectId("..."),
  "userId": "user-123",
  "message": "You matched with John Doe!",
  "type": "MATCH",
  "read": false,
  "createdAt": ISODate("2024-01-15T10:30:00Z")
}
```

---

## Event-Driven Architecture

### Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    EVENT PRODUCERS                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Matching Service              Chat Service                  │
│  - Match created              - Message sent                 │
│  - Swipe recorded             - First message                │
│                                                              │
└──────────────┬───────────────────────┬──────────────────────┘
               │                       │
               │ Kafka Events          │ Kafka Events
               │                       │
               ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    KAFKA TOPICS                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  matched_topic                message_topic                 │
│  - Match events               - Message events              │
│                                                              │
└──────────────┬───────────────────────┬──────────────────────┘
               │                       │
               │ Consumes              │ Consumes
               │                       │
               ▼                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    EVENT CONSUMERS                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Notification Service                                        │
│  - Creates match notifications                              │
│  - Creates message notifications                            │
│  - Saves to MongoDB                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Event Types

**1. Match Event**
```json
{
  "userId1": "user-123",
  "userId2": "user-456",
  "matchedAt": "2024-01-15T10:30:00Z"
}
```

**2. Message Event**
```json
{
  "senderId": "user-123",
  "receiverId": "user-456",
  "messageId": "msg-789",
  "content": "Hello!",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Real-Time Communication

### WebSocket Architecture

**WebSocket vs HTTP:**
- **HTTP**: Request-response, stateless, one-way
- **WebSocket**: Persistent connection, bidirectional, real-time

**STOMP Protocol:**
STOMP (Simple Text Oriented Messaging Protocol) is a **messaging protocol** that runs over WebSocket. It provides:
- **Topics**: Broadcast messages to multiple subscribers
- **Queues**: Point-to-point messaging
- **Subscriptions**: Clients can subscribe to specific destinations

**STOMP Message Format:**
```
SEND
destination:/app/private-message
content-type:application/json

{"senderId":"user-123","receiverId":"user-456","content":"Hello!"}
```

**WebSocket Connection Lifecycle:**

```
1. Client connects: ws://localhost:8083/ws
2. STOMP CONNECT frame sent
3. Server authenticates (JWT token)
4. STOMP CONNECTED frame received
5. Client subscribes: SUBSCRIBE /user/{userId}/queue/messages
6. Connection established
7. Messages can be sent/received
8. On disconnect: STOMP DISCONNECT frame
```

---

## Common Framework Components

### bartr-common-security

**Purpose**: Centralized security configuration for all services

**Key Features:**
- JWT token validation
- Public endpoint patterns
- CORS configuration
- Smart authentication entry point

**Configuration:**
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    // Shared security configuration
    // Used by all microservices
}
```

### bartr-common-feign

**Purpose**: Service-to-service communication

**Key Features:**
- Feign client configuration
- Authentication token forwarding
- ThreadLocal token support (for WebSocket)
- Error handling

### bartr-common-kafka

**Purpose**: Kafka integration

**Key Features:**
- Kafka producer/consumer configuration
- Avro serialization
- Event publishing utilities

### bartr-common-core

**Purpose**: Shared utilities

**Key Features:**
- Common DTOs
- Exception handling
- Base classes

---

## Interview Preparation Guide

### Common Interview Questions

#### 1. Why did you choose microservices architecture?

**Answer:**
- **Scalability**: Each service can scale independently based on load
- **Technology Diversity**: Different services can use different databases (PostgreSQL for transactions, MongoDB for documents, Elasticsearch for search)
- **Team Independence**: Different teams can work on different services
- **Fault Isolation**: If one service fails, others continue working
- **Deployment Flexibility**: Services can be deployed independently

#### 2. How does authentication work in your system?

**Answer:**
1. User logs in through Keycloak (OAuth2/OpenID Connect)
2. Keycloak generates JWT tokens (access_token, refresh_token)
3. Frontend stores tokens and includes access_token in API requests
4. Backend services validate JWT tokens using Spring Security
5. Token validation includes signature verification and expiration check
6. User information is extracted from token claims

#### 3. How does the matching algorithm work?

**Answer:**
1. User requests top matches
2. Service fetches user profile from User Service (via Feign)
3. Queries Elasticsearch for users with complementary skills
4. Filters out already-swiped users (from PostgreSQL)
5. Calculates match score based on skill overlap
6. Returns top N matches sorted by score

#### 4. How do services communicate with each other?

**Answer:**
- **Synchronous**: REST API calls via Feign clients (for immediate responses)
- **Asynchronous**: Kafka events (for decoupled, event-driven communication)
- **Real-time**: WebSocket for chat (for instant messaging)

#### 5. Why use different databases?

**Answer:**
- **PostgreSQL**: For transactional data (user profiles, matches, swipes) - ACID compliance, complex queries
- **MongoDB**: For document-based data (messages, notifications) - flexible schema, high write throughput
- **Elasticsearch**: For search operations (skill matching) - optimized for fast, complex queries

#### 6. How does real-time messaging work?

**Answer:**
1. Client establishes WebSocket connection
2. Uses STOMP protocol for messaging
3. Client subscribes to personal queue: `/user/{userId}/queue/messages`
4. When sending: Client sends to `/app/private-message`
5. Server validates match, saves to MongoDB
6. Server publishes to Kafka (for notifications)
7. Server sends to receiver's queue via WebSocket
8. Receiver receives message in real-time

#### 7. How do you handle failures and errors?

**Answer:**
- **Circuit Breaker**: Feign clients can use circuit breakers to prevent cascading failures
- **Retry Logic**: Kafka consumers can retry failed events
- **Error Handling**: Centralized exception handling in common-core
- **Logging**: Comprehensive logging for debugging
- **Monitoring**: (Can add) Prometheus, Grafana for monitoring

#### 8. How do you ensure data consistency?

**Answer:**
- **Transactions**: PostgreSQL transactions for critical operations
- **Eventual Consistency**: Kafka events for eventual consistency across services
- **Idempotency**: Event handlers are idempotent (can be safely retried)
- **Validation**: Input validation at multiple layers

### Key Concepts to Understand

1. **Microservices Architecture**
2. **OAuth2 / OpenID Connect**
3. **JWT Tokens**
4. **REST APIs**
5. **WebSocket / STOMP**
6. **Kafka (Event Streaming)**
7. **Database Selection (SQL vs NoSQL)**
8. **Service-to-Service Communication**
9. **Spring Boot / Spring Security**
10. **Docker / Containerization**

---

## Conclusion

This backend architecture demonstrates **industry-level patterns** including:
- Microservices design
- Event-driven architecture
- Real-time communication
- Secure authentication
- Scalable database design
- Service orchestration

Understanding these concepts will help you:
- **In Interviews**: Explain architectural decisions confidently
- **In Development**: Build scalable, maintainable systems
- **In Learning**: Understand modern backend patterns

**Next Steps:**
1. Review the codebase
2. Run the services locally
3. Test the APIs using Postman
4. Trace through the flows
5. Experiment with modifications

---

**Happy Learning! 🚀**

