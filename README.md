
# 🔄 Bartr Platform

A sophisticated microservices-based skill exchange platform enabling secure and efficient matching of users for skill bartering.

## 🎯 Overview

Bartr Platform is an enterprise-grade skill exchange platform built with Spring Boot microservices architecture. The platform facilitates seamless skill bartering by connecting users, managing real-time communications, and automating intelligent matches based on user preferences and skills.

### ✨ Key Features

- **User Management**: Secure user profiles, authentication, and profile management
- **Real-time Chat**: WebSocket-based instant messaging between matched users
- **Smart Matching**: Intelligent skill-based matching algorithm with personalized recommendations
- **Push Notifications**: Real-time event-driven notifications for matches, messages, and updates
- **Secure Authentication**: OAuth2/OpenID Connect via Keycloak with JWT tokens
- **Event-Driven Architecture**: Powered by Apache Kafka for asynchronous communication
- **Search & Discovery**: Elasticsearch-powered user search and matching
- **Modern Frontend**: React-based responsive UI with real-time updates

## 🏗 Architecture

### Microservices Architecture

The platform follows a microservices architecture with clear separation of concerns:

```
Bartr Platform
├── bartr-user-service          # Port 8080 - User management and profiles
├── bartr-matching-service      # Port 8082 - Matching algorithms and recommendations
├── bartr-chat-service          # Port 8083 - Real-time messaging via WebSocket
├── bartr-notification-service # Port 8084 - Event notifications
├── bartr-framework            # Shared components and utilities
│   ├── bartr-common-security  # Centralized security configuration
│   ├── bartr-common-kafka     # Kafka integration and Avro serialization
│   ├── bartr-common-feign     # Service-to-service communication
│   └── bartr-common-core      # Common utilities and base classes
└── bartr-frontend             # Port 5173 - React frontend application
```

### Service Details

#### 1. **User Service** (`bartr-user-service`)
- **Port**: 8080
- **Database**: PostgreSQL
- **Responsibilities**:
  - User profile management (CRUD operations)
  - User authentication integration with Keycloak
  - Profile statistics and analytics
  - User preferences management
- **Key Endpoints**:
  - `GET /v1/user/profile` - Get user profile
  - `POST /v1/user/profile` - Create/update profile
  - `GET /v1/user/profile/stats/**` - Public stats endpoint
  - `GET /v1/user/profile/{keycloakId}` - Get user by Keycloak ID

#### 2. **Matching Service** (`bartr-matching-service`)
- **Port**: 8082
- **Databases**: PostgreSQL, Elasticsearch
- **Responsibilities**:
  - Intelligent matching algorithm
  - Personalized profile recommendations
  - Swipe/match management
  - Match history tracking
  - User synchronization with Elasticsearch
- **Key Endpoints**:
  - `GET /v1/matches/top?keycloakId={id}` - Get personalized matches
  - `POST /v1/swipe` - Record swipe action (like/pass)
  - `GET /v1/matches/history?keycloakId={id}` - Get match history
  - `GET /v1/stats/matches` - Public stats endpoint
  - `POST /v1/sync/user?keycloakId={id}` - Sync user to Elasticsearch
- **Features**:
  - Elasticsearch integration for fast user search
  - Feign client for calling User Service
  - Kafka event publishing for match events

#### 3. **Chat Service** (`bartr-chat-service`)
- **Port**: 8083
- **Database**: MongoDB
- **Responsibilities**:
  - Real-time messaging via WebSocket/STOMP
  - Message persistence
  - Chat history management
  - Match verification before chat
- **Key Endpoints**:
  - `GET /messages?senderId={id}&receiverId={id}` - Get chat history
  - `GET /check-match/{userId1}/{userId2}` - Verify match exists
  - `GET /conversations?userId={id}` - Get all conversations
- **WebSocket**:
  - Endpoint: `/ws`
  - Protocol: STOMP over WebSocket
  - Private messaging: `/app/private-message`
  - User-specific subscriptions: `/user/{userId}/queue/messages`

#### 4. **Notification Service** (`bartr-notification-service`)
- **Port**: 8084
- **Database**: MongoDB
- **Responsibilities**:
  - Event-driven notifications
  - Kafka event consumption (match events, message events)
  - Notification delivery via WebSocket
  - Notification history and persistence
- **Key Endpoints**:
  - `GET /notifications/{userId}` - Get user notifications
- **Kafka Consumers**:
  - `matched_topic` - Consumes match events from Matching Service
  - `message_topic` - Consumes message events from Chat Service

#### 5. **Framework** (`bartr-framework`)
Shared components used across all services:
- **bartr-common-security**: 
  - Centralized OAuth2/Keycloak security configuration
  - Smart authentication entry point (API vs browser detection)
  - CORS configuration
  - Public endpoint patterns
- **bartr-common-kafka**: 
  - Kafka producers and consumers
  - Avro serialization/deserialization
  - Custom Avro schema support
- **bartr-common-feign**: 
  - Feign client configuration
  - Request interceptors for authentication
  - ThreadLocal token support (for WebSocket sessions)
  - Service account token fallback
- **bartr-common-core**: 
  - Common utilities and base classes
  - Exception handling
  - Shared DTOs and models

#### 6. **Frontend** (`bartr-frontend`)
- **Port**: 5173 (development)
- **Tech Stack**: React 19, TypeScript, Vite, Tailwind CSS, Zustand, React Query
- **Features**:
  - Keycloak authentication integration (react-oidc-context)
  - Real-time chat interface (WebSocket/STOMP)
  - Swipe-based matching UI with animations (Framer Motion)
  - Responsive design (mobile-first)
  - State management with Zustand
  - Server state management with React Query
  - Error tracking with Sentry
  - Modern UI components (Radix UI)
- **Key Pages**:
  - Landing page with authentication options
  - Dashboard with user statistics
  - Profile management
  - Matching/swiping interface
  - Chat interface
  - Past matches
- **Key Components**:
  - Protected routes with authentication
  - Layout with navigation
  - Notification bell
  - Real-time chat components

## 🛠 Tech Stack

### Backend
- **Framework**: Spring Boot 3.x
- **Language**: Java 21
- **Build Tool**: Maven 3.8+
- **Security**: 
  - Keycloak (OAuth2/OpenID Connect)
  - Spring Security
  - JWT token-based authentication
- **Databases**:
  - PostgreSQL (User, Matching, Notification services)
  - MongoDB (Chat service)
  - Elasticsearch (Matching service - user search)
- **Messaging**:
  - Apache Kafka (event-driven communication)
  - Apache Avro (event serialization)
  - WebSocket/STOMP (real-time chat)
- **Service Communication**:
  - Spring Cloud OpenFeign (REST client)
  - HTTP/REST APIs

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7.2.4
- **Styling**: Tailwind CSS 4.1.18
- **State Management**: 
  - Zustand (client state)
  - React Query (server state)
- **HTTP Client**: Axios with interceptors
- **Authentication**: 
  - react-oidc-context (Keycloak integration)
  - keycloak-js
  - oidc-client-ts
- **WebSocket**: 
  - @stomp/stompjs (STOMP over WebSocket)
  - sockjs-client
- **UI Components**: 
  - Radix UI (accessible components)
  - Lucide React (icons)
  - Framer Motion (animations)
- **Error Tracking**: Sentry
- **Routing**: React Router DOM

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Identity Provider**: Keycloak
- **Message Broker**: Apache Kafka (KRaft mode)
- **Search Engine**: Elasticsearch

## 🚀 Getting Started

### Prerequisites

Before starting, ensure you have the following installed:

```bash
Java 21+
Maven 3.8+
Node.js 18+ and npm
Docker & Docker Compose (optional, for infrastructure)
PostgreSQL 14+
MongoDB 6+
Elasticsearch 8+
Apache Kafka 4.1.0+ (KRaft mode)
Keycloak 23+
```

### Infrastructure Setup

#### 1. **PostgreSQL**
```bash
# Using Docker
docker run -d \
  --name postgres-bartr \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=testdb \
  -p 5432:5432 \
  postgres:14

# Or use existing PostgreSQL instance
# Update connection strings in application.yaml files
```

#### 2. **MongoDB**
```bash
# Using Docker
docker run -d \
  --name mongodb-bartr \
  -p 27017:27017 \
  mongo:6
```

#### 3. **Elasticsearch**
```bash
# Using Docker
docker run -d \
  --name elasticsearch-bartr \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=true" \
  -e "ELASTIC_PASSWORD=elastic" \
  -e "xpack.security.http.ssl.enabled=false" \
  -p 9200:9200 \
  elasticsearch:8.11.0
```

#### 4. **Apache Kafka (KRaft Mode)**
```bash
# Download Kafka 4.1.0+
# Extract and configure server.properties for KRaft mode
# Start Kafka:
bin/kafka-server-start.bat config/server.properties  # Windows
bin/kafka-server-start.sh config/server.properties   # Linux/Mac
```

#### 5. **Keycloak**
```bash
# Using Docker
docker run -d \
  --name keycloak-bartr \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  -p 8081:8080 \
  quay.io/keycloak/keycloak:23.0 \
  start-dev

# Access Keycloak Admin Console: http://localhost:8081
# Create realm: Bartr
# Create client: oauth-demo-client
# Configure client secret: ZLClZb63KD6YUlQGyAbVjCJxp5d5wlik
```

### Installation Steps

#### 1. **Clone Repository**
```bash
git clone <repository-url>
cd Bartr
```

#### 2. **Build Framework (Required First)**
```bash
cd bartr-framework
mvn clean install
```

#### 3. **Build All Services**
```bash
# From project root
mvn clean install
```

#### 4. **Start Services in Order**

**Start User Service:**
```bash
cd bartr-user-service/user-profile
mvn spring-boot:run
# Service starts on http://localhost:8080
```

**Start Matching Service:**
```bash
cd bartr-matching-service/matching-service
mvn spring-boot:run
# Service starts on http://localhost:8082
```

**Start Chat Service:**
```bash
cd bartr-chat-service/chat
mvn spring-boot:run
# Service starts on http://localhost:8083
```

**Start Notification Service:**
```bash
cd bartr-notification-service/notification
mvn spring-boot:run
# Service starts on http://localhost:8084
```

#### 5. **Start Frontend**

**Create Environment File**:
Create a `.env.local` file in `bartr-frontend/`:
```env
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=Bartr
VITE_KEYCLOAK_CLIENT=oauth-demo-client
VITE_KEYCLOAK_CLIENT_SECRET=ZLClZb63KD6YUlQGyAbVjCJxp5d5wlik
VITE_API_BASE_URL=http://localhost:8080
VITE_MATCHING_SERVICE_URL=http://localhost:8082
VITE_CHAT_SERVICE_URL=http://localhost:8083
VITE_NOTIFICATION_SERVICE_URL=http://localhost:8084
```

**Start Development Server**:
```bash
cd bartr-frontend
npm install
npm run dev
# Frontend starts on http://localhost:5173
```

## ⚙️ Configuration

### Service Configuration

Each service has its own `application.yaml` with service-specific settings:

#### Common Configuration Pattern
```yaml
server:
  port: [service-port]

spring:
  application:
    name: [service-name]
  datasource:
    url: jdbc:postgresql://localhost:5432/testdb
    username: postgres
    password: password
  jpa:
    hibernate:
      ddl-auto: update
    database-platform: org.hibernate.dialect.PostgreSQLDialect

security:
  cors:
    allowed-origins: http://localhost:5173
  oauth2:
    jwk-set-uri: http://localhost:8081/realms/Bartr/protocol/openid-connect/certs
  permit-all-patterns: [public-endpoints]
```

#### Service-Specific Ports
- **User Service**: 8080
- **Matching Service**: 8082
- **Chat Service**: 8083
- **Notification Service**: 8084
- **Frontend**: 5173
- **Keycloak**: 8081
- **PostgreSQL**: 5432
- **MongoDB**: 27017
- **Elasticsearch**: 9200
- **Kafka**: 9092

#### Service-Specific Configuration

**User Service** (`bartr-user-service/user-profile/src/main/resources/application.yaml`):
- Database: PostgreSQL (`testdb`)
- Public endpoints: `/v1/user/profile/stats/**`
- Feign clients: None

**Matching Service** (`bartr-matching-service/matching-service/src/main/resources/application.yaml`):
- Databases: PostgreSQL (`testdb`), Elasticsearch
- Public endpoints: `/v1/stats/**`
- Feign clients: User Service (`http://localhost:8080`)
- Elasticsearch: `https://localhost:9200` (username: `elastic`, password: `elastic`)

**Chat Service** (`bartr-chat-service/chat/src/main/resources/application.yaml`):
- Database: MongoDB (`chatapp`)
- Public endpoints: `/ws/**`, `/topic/**`, `/app/**`, `/user/**`, `/queue/**`, `/messages/**`, `/check-match/**`, `/conversations/**`
- Feign clients: Matching Service, User Service
- Kafka: Consumes `matched_topic`, Produces `message_topic`

**Notification Service** (`bartr-notification-service/notification/src/main/resources/application.yaml`):
- Database: MongoDB (`notification_app`)
- Public endpoints: `/notifications/**`, `/ws/**`, `/topic/**`, `/app/**`, `/user/**`, `/queue/**`
- Feign clients: User Service
- Kafka: Consumes `matched_topic`, `message_topic`

### Security Configuration

The platform uses a centralized security configuration in `bartr-framework/bartr-common-security`:

#### Key Features
- **OAuth2 Resource Server**: JWT token validation for API requests
- **OAuth2 Login**: Browser-based authentication flow
- **Smart Authentication Entry Point**: 
  - Returns JSON 401 for API requests (with/without Bearer tokens)
  - Detects API vs browser requests automatically
  - Prevents HTML redirects for API clients
- **CORS Configuration**: Configurable allowed origins
- **Public Endpoints**: Service-specific permit-all patterns

#### Security Flow
1. **Frontend Authentication**: User logs in via Keycloak, receives JWT token
2. **API Requests**: Frontend includes JWT in `Authorization: Bearer <token>` header
3. **Token Validation**: Spring Security validates JWT against Keycloak JWK endpoint
4. **Service-to-Service**: Feign clients use client credentials flow for inter-service calls

### Keycloak Configuration

#### Required Setup
1. **Realm**: `Bartr`
2. **Client**: `oauth-demo-client`
   - Client ID: `oauth-demo-client`
   - Client Secret: `ZLClZb63KD6YUlQGyAbVjCJxp5d5wlik`
   - Enabled: Direct Access Grants, Authorization Code Flow
   - Valid Redirect URIs: `http://localhost:8080/*`, `http://localhost:5173/*`
3. **Users**: Create test users in Keycloak realm

### Kafka Configuration

#### Kafka Topics

The platform uses the following Kafka topics for event-driven communication:

1. **`matched_topic`** - Match Events
   - **Producer**: Matching Service (when users match)
   - **Consumers**: 
     - Chat Service (creates match records for chat verification)
     - Notification Service (sends match notifications)
   - **Event Schema** (Avro):
     ```json
     {
       "type": "record",
       "name": "MatchEvent",
       "fields": [
         {"name": "user1Id", "type": "string"},
         {"name": "user2Id", "type": "string"},
         {"name": "matchedTimestamp", "type": "string"}
       ]
     }
     ```

2. **`message_topic`** - Message Events
   - **Producer**: Chat Service (when messages are sent)
   - **Consumers**: 
     - Notification Service (sends message notifications)
   - **Event Schema** (Avro):
     ```json
     {
       "type": "record",
       "name": "MessageEvent",
       "fields": [
         {"name": "senderId", "type": "string"},
         {"name": "receiverId", "type": "string"},
         {"name": "messageTimestamp", "type": "string"},
         {"name": "message", "type": "string"}
       ]
     }
     ```

#### Kafka Configuration

**Producer Configuration** (Matching Service, Chat Service):
```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: com.bartr.common.kafka.KafkaAvroSerializer
```

**Consumer Configuration** (Chat Service, Notification Service):
```yaml
spring:
  kafka:
    consumer:
      bootstrap-servers: localhost:9092
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: com.bartr.common.kafka.KafkaAvroDeserializer
      group-id: [service-name]
      auto-offset-reset: earliest
      enable-auto-commit: true
```

#### Event Flow

1. **Match Flow**:
   - User swipes → Matching Service processes → Publishes to `matched_topic`
   - Chat Service consumes → Creates match record for chat verification
   - Notification Service consumes → Sends match notification

2. **Message Flow**:
   - User sends message → Chat Service persists → Publishes to `message_topic`
   - Notification Service consumes → Sends message notification

## 🔒 Security

### Authentication & Authorization

- **OAuth2/OpenID Connect**: Via Keycloak
- **JWT Tokens**: Stateless authentication
- **Token Validation**: Automatic validation against Keycloak JWK endpoint
- **Role-Based Access Control**: Configurable via Keycloak roles
- **Service-to-Service Security**: Client credentials flow for Feign clients

### API Security

- **Protected Endpoints**: All `/v1/*` endpoints require authentication
- **Public Endpoints**: Configurable via `security.permit-all-patterns`
- **CORS**: Configured per service
- **JSON Error Responses**: API requests return JSON 401 instead of HTML redirects

### Security Best Practices

- Stateless sessions (no server-side session storage)
- JWT token expiration and refresh
- HTTPS in production (configured for development)
- Secure service-to-service communication
- Input validation and sanitization

## 📝 API Documentation

### Swagger UI Access

Once services are running, access Swagger documentation:

- **User Service**: `http://localhost:8080/swagger-ui.html`
- **Matching Service**: `http://localhost:8082/swagger-ui.html`
- **Chat Service**: `http://localhost:8083/swagger-ui.html`
- **Notification Service**: `http://localhost:8084/swagger-ui.html`

### API Examples

#### Get User Profile (Authenticated)
```bash
curl -X GET "http://localhost:8080/v1/user/profile" \
  -H "Authorization: Bearer <your-jwt-token>"
```

#### Get Top Matches
```bash
curl -X GET "http://localhost:8082/v1/matches/top?keycloakId=<user-uuid>" \
  -H "Authorization: Bearer <your-jwt-token>"
```

#### Get Match Stats (Public)
```bash
curl -X GET "http://localhost:8082/v1/stats/matches"
```

#### Send Message via WebSocket
```bash
# Connect to WebSocket: ws://localhost:8083/ws
# Subscribe to: /user/{userId}/queue/messages
# Send to: /app/private-message
# Message format:
{
  "senderId": "user-uuid",
  "receiverId": "user-uuid",
  "message": "Hello!"
}
```

#### Get Chat History
```bash
curl -X GET "http://localhost:8083/messages?senderId={id}&receiverId={id}" \
  -H "Authorization: Bearer <your-jwt-token>"
```

#### Get Notifications
```bash
curl -X GET "http://localhost:8084/notifications/{userId}" \
  -H "Authorization: Bearer <your-jwt-token>"
```

## ⚡ Development

### Build Commands

```bash
# Build entire project
mvn clean install

# Build specific service
cd bartr-user-service
mvn clean install

# Build framework only
cd bartr-framework
mvn clean install
```

### Running Services

**From Command Line**:
```bash
# Run from service directory
cd bartr-user-service/user-profile
mvn spring-boot:run

# Or run from IDE
# Import as Maven project
# Run the main application classes:
# - UserApplication (User Service)
# - MatchingApplication (Matching Service)
# - ChatAppApplication (Chat Service)
# - NotificationAppApplication (Notification Service)
```

**Application Entry Points**:
- **User Service**: `com.bartr.user.UserApplication`
- **Matching Service**: `com.bartr.matching.MatchingApplication`
- **Chat Service**: `com.bartr.chat.ChatAppApplication`
- **Notification Service**: `com.bartr.notification.NotificationAppApplication`

### Testing

```bash
# Run all tests
mvn test

# Run specific service tests
cd bartr-user-service
mvn test
```

### Development Workflow

1. **Start Infrastructure**: PostgreSQL, MongoDB, Elasticsearch, Kafka, Keycloak
2. **Build Framework**: `cd bartr-framework && mvn clean install`
3. **Build Services**: `mvn clean install` (from root)
4. **Start Services**: In order - User → Matching → Chat → Notification
5. **Start Frontend**: `cd bartr-frontend && npm run dev`
6. **Access Application**: `http://localhost:5173`

## 📦 Project Structure

```
Bartr/
├── bartr-framework/              # Shared framework components
│   ├── bartr-common-security/   # Security configuration
│   ├── bartr-common-kafka/      # Kafka integration
│   ├── bartr-common-feign/      # Feign client config
│   └── bartr-common-core/       # Common utilities
├── bartr-user-service/          # User management service
│   ├── user-profile/            # Main service module
│   ├── dto/                     # Data transfer objects
│   ├── constants/               # Constants
│   └── client/                  # Feign clients
├── bartr-matching-service/      # Matching service
│   ├── matching-service/        # Main service module
│   ├── avro/                    # Avro schemas
│   ├── dto/                     # DTOs
│   ├── constants/               # Constants
│   └── client/                  # Feign clients
├── bartr-chat-service/          # Chat service
│   ├── chat/                    # Main service module
│   ├── avro/                    # Avro schemas
│   ├── dto/                     # DTOs
│   ├── constants/               # Constants
│   └── client/                  # Feign clients
├── bartr-notification-service/  # Notification service
│   ├── notification/             # Main service module
│   ├── avro/                    # Avro schemas
│   ├── dto/                     # DTOs
│   ├── constants/               # Constants
│   └── client/                  # Feign clients
├── bartr-frontend/              # React frontend
│   ├── src/
│   │   ├── components/          # UI components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API services
│   │   ├── store/               # State management
│   │   └── config/              # Configuration
│   └── package.json
└── keycloak-theme/              # Keycloak custom theme
```

## 🔧 Troubleshooting

### Common Issues

#### 1. **Kafka Connection Issues**
- Ensure Kafka is running in KRaft mode
- Check `server.properties` configuration
- Verify Kafka port (default 9092)

#### 2. **Keycloak Authentication Failures**
- Verify Keycloak is running on port 8081
- Check realm and client configuration
- Ensure client secret matches configuration

#### 3. **Database Connection Errors**
- Verify PostgreSQL/MongoDB are running
- Check connection strings in `application.yaml`
- Ensure database credentials are correct

#### 4. **Elasticsearch Connection Issues**
- Verify Elasticsearch is running on port 9200
- Check SSL configuration (disabled for development)
- Verify credentials: `elastic/elastic`

#### 5. **Service Build Failures**
- Always build `bartr-framework` first: `cd bartr-framework && mvn clean install`
- Ensure Java 21 is installed and configured
- Check Maven version (3.8+)

#### 6. **Frontend API Errors**
- Verify all backend services are running
- Check CORS configuration in services
- Ensure JWT token is valid and not expired
- Check browser console for detailed errors

#### 7. **WebSocket Connection Issues**
- Verify Chat Service is running on port 8083
- Check WebSocket endpoint: `ws://localhost:8083/ws`
- Ensure CORS allows WebSocket connections
- Check browser console for connection errors
- Verify user is authenticated before connecting
- Check that match exists before attempting to chat

#### 8. **Feign Client Issues**
- Verify target service is running and accessible
- Check Feign client URL configuration in `application.yaml`
- Ensure service-to-service authentication is configured
- Check Keycloak service account credentials
- Verify ThreadLocal token holder for WebSocket-initiated calls

#### 9. **Elasticsearch SSL Issues**
- For development, SSL verification is disabled
- Check `verify-hostname: false` in Matching Service config
- Verify Elasticsearch credentials: `elastic/elastic`
- Ensure Elasticsearch is accessible on port 9200

#### 10. **Avro Schema Issues**
- Ensure Avro schemas are properly defined in each service
- Check that Kafka serializers/deserializers match schema
- Verify custom Avro schema configuration in `application.yaml`
- Rebuild services after schema changes

### Logs

Check service logs for detailed error messages:
- **User Service**: Console output or logs in `bartr-user-service/user-profile/logs/`
- **Matching Service**: Console output
- **Chat Service**: Console output (DEBUG level for MongoDB and WebSocket)
- **Notification Service**: Console output (DEBUG level for MongoDB and messaging)
- **Frontend**: Browser console and terminal output

### Debugging Tips

1. **Enable Debug Logging**: Set logging levels in `application.yaml`:
   ```yaml
   logging:
     level:
       com.bartr: DEBUG
       org.springframework.web: DEBUG
   ```

2. **Check Kafka Topics**: Use Kafka console tools to verify events:
   ```bash
   bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic matched_topic
   ```

3. **Verify Database Connections**: Check service startup logs for database connection status

4. **Test Authentication**: Use Postman or curl to test API endpoints with JWT tokens

5. **Monitor WebSocket**: Use browser DevTools → Network → WS to inspect WebSocket connections

## 🚢 Deployment

### Production Considerations

1. **Environment Variables**: Use environment variables for sensitive configuration
2. **Database**: Use production-grade PostgreSQL and MongoDB instances
3. **Kafka**: Configure Kafka cluster for high availability
4. **Keycloak**: Set up production Keycloak instance with proper SSL
5. **Elasticsearch**: Configure Elasticsearch cluster
6. **HTTPS**: Enable HTTPS for all services
7. **Monitoring**: Set up application monitoring and logging
8. **Load Balancing**: Configure load balancers for services

### Docker Deployment

**Note**: Docker Compose configuration should be created for production deployment.

```bash
# Build Docker images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Environment Variables for Production

**Backend Services**:
- `SPRING_DATASOURCE_URL` - Database connection URL
- `SPRING_DATASOURCE_USERNAME` - Database username
- `SPRING_DATASOURCE_PASSWORD` - Database password
- `KEYCLOAK_SERVER_URL` - Keycloak server URL
- `KEYCLOAK_REALM` - Keycloak realm name
- `KEYCLOAK_CLIENT_ID` - Keycloak client ID
- `KEYCLOAK_CLIENT_SECRET` - Keycloak client secret
- `KAFKA_BOOTSTRAP_SERVERS` - Kafka bootstrap servers
- `ELASTICSEARCH_URIS` - Elasticsearch connection URI
- `ELASTICSEARCH_USERNAME` - Elasticsearch username
- `ELASTICSEARCH_PASSWORD` - Elasticsearch password

**Frontend**:
- `VITE_KEYCLOAK_URL` - Keycloak server URL
- `VITE_KEYCLOAK_REALM` - Keycloak realm name
- `VITE_KEYCLOAK_CLIENT` - Keycloak client ID
- `VITE_API_BASE_URL` - User Service URL
- `VITE_MATCHING_SERVICE_URL` - Matching Service URL
- `VITE_CHAT_SERVICE_URL` - Chat Service URL
- `VITE_NOTIFICATION_SERVICE_URL` - Notification Service URL

## 🔄 Event-Driven Architecture

### Event Flow Diagram

```
User Action → Service → Kafka Topic → Consumer Services
     ↓
1. Swipe Match → Matching Service → matched_topic → Chat Service, Notification Service
2. Send Message → Chat Service → message_topic → Notification Service
```

### Service Dependencies

- **Matching Service** → User Service (via Feign) - Fetches user profiles
- **Chat Service** → Matching Service, User Service (via Feign) - Verifies matches, fetches user info
- **Notification Service** → User Service (via Feign) - Fetches user info for notifications
- **All Services** → Keycloak (via OAuth2) - Authentication and authorization

### Inter-Service Communication

1. **Synchronous**: REST API calls via Feign clients
2. **Asynchronous**: Kafka events for decoupled communication
3. **Real-time**: WebSocket for chat and notifications

## 📚 Additional Documentation

- **Frontend Setup**: See `bartr-frontend/FRONTEND_SETUP.md`
- **Frontend README**: See `bartr-frontend/README.md`
- **Keycloak Theme**: See `keycloak-theme/INSTALLATION.md`
- **Postman Collection**: See `BARTER.postman_collection.json`

## ⚠️ Important Notes

- **Proprietary Software**: This software is proprietary and confidential
- **Development Environment**: Current configuration is for development only
- **Security**: Update all default passwords and secrets for production
- **Database**: Use proper database migrations in production (not `ddl-auto: update`)
- **Monitoring**: Implement proper logging and monitoring in production

## 🔐 License

This software is proprietary and confidential. See LICENSE file for details.

## 🤝 Support

For technical support or inquiries:
- **Email**: support@bartrplatform.com
- **Documentation**: See service-specific README files
- **Issue Tracking**: Internal JIRA

## 📝 Version Information

### Backend Versions
- **Spring Boot**: 3.2.0-M3
- **Java**: 21
- **Maven**: 3.8+
- **Kafka**: 4.1.0 (KRaft mode)
- **Kafka Clients**: 4.1.0
- **Spring Kafka**: 3.3.9
- **Keycloak**: 23.0.3
- **Keycloak Admin Client**: 23.0.3
- **Avro**: 1.11.3
- **Lombok**: 1.18.30
- **PostgreSQL Driver**: Latest (via Spring Boot)
- **MongoDB Driver**: Latest (via Spring Data MongoDB)
- **Elasticsearch**: 8.11.0
- **Spring Cloud OpenFeign**: 2023.0.1

### Frontend Versions
- **React**: 19.2.0
- **TypeScript**: 5.9.3
- **Vite**: 7.2.4
- **Node.js**: 18+
- **Tailwind CSS**: 4.1.18
- **Zustand**: 5.0.9
- **React Router**: 6.30.2
- **Axios**: 1.13.2
- **Keycloak JS**: 26.2.2
- **react-oidc-context**: 3.3.0
- **@stomp/stompjs**: 7.2.1
- **Framer Motion**: 12.23.26
- **Sentry**: 10.32.1

### Infrastructure Versions
- **PostgreSQL**: 14+
- **MongoDB**: 6+
- **Elasticsearch**: 8.11.0
- **Apache Kafka**: 4.1.0+ (KRaft mode)
- **Keycloak**: 23.0+

---

© 2025 Bartr Platform. All rights reserved.
=======
# Bartr
