# Bartr Frontend - Complete Setup Guide

## Overview

This is a production-ready React frontend for the Bartr skill matchmaking platform. It features modern UI, real-time chat, authentication, and seamless integration with all backend microservices.

## Prerequisites

Before starting, ensure you have:

1. **Node.js 18+** and npm installed
2. **All backend services running**:
   - User Service: `http://localhost:8080`
   - Matching Service: `http://localhost:8082`
   - Chat Service: `http://localhost:8083`
   - Notification Service: `http://localhost:8084`
3. **Keycloak server** running on `http://localhost:8081`
4. **Keycloak configured** with:
   - Realm: `Bartr`
   - Client: `oauth-demo-client`
   - Direct Access Grants enabled

## Installation

1. **Navigate to the frontend directory**:
```bash
cd bartr-frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Create environment file**:
Create a `.env.local` file in the `bartr-frontend` directory:
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

4. **Start the development server**:
```bash
npm run dev
```

5. **Open your browser**:
Navigate to `http://localhost:5173`

## Project Structure

```
bartr-frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx       # Main layout with navigation
│   │   └── ProtectedRoute.tsx  # Route protection
│   ├── config/              # Configuration
│   │   └── env.ts           # Environment variables
│   ├── lib/                 # Utility libraries
│   │   └── keycloak.ts      # Keycloak integration
│   ├── pages/               # Page components
│   │   ├── Landing.tsx      # Landing page
│   │   ├── Login.tsx        # Login page
│   │   ├── Signup.tsx       # Signup page
│   │   ├── Dashboard.tsx    # User dashboard
│   │   ├── Profile.tsx       # User profile
│   │   ├── Matches.tsx      # Swiping interface
│   │   ├── PastMatches.tsx  # Past matches list
│   │   └── Chat.tsx         # Chat interface
│   ├── services/            # API services
│   │   ├── api.ts           # Axios configuration
│   │   ├── userService.ts   # User API calls
│   │   ├── matchingService.ts  # Matching API calls
│   │   ├── chatService.ts   # Chat API calls
│   │   └── notificationService.ts  # Notification API
│   ├── store/               # State management (Zustand)
│   │   ├── authStore.ts     # Authentication state
│   │   └── chatStore.ts     # Chat/WebSocket state
│   ├── App.tsx              # Main app with routing
│   └── main.tsx             # Entry point
├── tailwind.config.js       # Tailwind CSS configuration
├── vite.config.ts          # Vite configuration
└── package.json            # Dependencies
```

## Features

### 1. Authentication Flow
- **Landing Page**: Beautiful landing page with login/signup options
- **Signup**: Create account via User Service API
- **Login**: Authenticate via Keycloak Direct Access Grant
- **Protected Routes**: Automatic redirect if not authenticated
- **Token Management**: Automatic token refresh

### 2. Dashboard
- Overview of user stats
- Quick navigation to:
  - Find Matches
  - Past Matches
  - Profile

### 3. Profile Management
- View profile information
- Edit profile (name, bio, skills)
- Manage skills offered and wanted
- Real-time updates

### 4. Matching
- Swipe-based interface with animations
- Personalized match recommendations
- Match notifications
- Smooth card transitions

### 5. Real-time Chat
- WebSocket/STOMP integration
- Real-time messaging
- Chat history
- Online/offline status
- Message timestamps

### 6. UI/UX
- Modern, responsive design
- Smooth animations (Framer Motion)
- Beautiful gradients and colors
- Mobile-friendly
- Loading states
- Error handling

## Key Technologies

- **React 19** - Latest React with hooks
- **TypeScript** - Type safety throughout
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Zustand** - Lightweight state management
- **React Query** - Server state management
- **Framer Motion** - Smooth animations
- **Tailwind CSS** - Utility-first CSS
- **Keycloak JS** - Authentication
- **STOMP.js** - WebSocket messaging
- **Axios** - HTTP client with interceptors

## API Integration

### User Service (`http://localhost:8080`)
- `POST /v1/user/profile/signup/public` - Signup
- `GET /v1/user/profile/me` - Get current user
- `PUT /v1/user/profile/update` - Update profile
- `GET /v1/user/profile?keycloakId={id}` - Get user by ID

### Matching Service (`http://localhost:8082`)
- `GET /v1/matches/top?keycloakId={id}` - Get matches
- `POST /v1/swipe` - Swipe on a user

### Chat Service (`http://localhost:8083`)
- `GET /messages?senderId={id}&receiverId={id}` - Get chat history
- `GET /check-match/{userId1}/{userId2}` - Check if matched
- WebSocket: `ws://localhost:8083/ws`
  - Subscribe: `/queue/messages/{userId}`
  - Send: `/app/private-message`

### Notification Service (`http://localhost:8084`)
- `GET /notifications/{userId}` - Get notifications

## Development

### Running in Development
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Troubleshooting

### Keycloak Login Issues
- Ensure Direct Access Grants is enabled in Keycloak
- Check that the client secret matches in `.env.local`
- Verify Keycloak server is running

### CORS Errors
- Ensure backend services allow requests from `http://localhost:5173`
- Check browser console for specific CORS errors

### WebSocket Connection Issues
- Verify Chat Service is running on port 8083
- Check WebSocket endpoint: `ws://localhost:8083/ws`
- Ensure user is authenticated before connecting

### API Errors
- Check that all backend services are running
- Verify API URLs in `.env.local`
- Check browser console and network tab

## Best Practices Implemented

1. **Type Safety**: Full TypeScript coverage
2. **Error Handling**: Comprehensive error handling throughout
3. **Loading States**: Loading indicators for async operations
4. **Responsive Design**: Mobile-first approach
5. **Code Organization**: Clean separation of concerns
6. **State Management**: Centralized state with Zustand
7. **API Layer**: Centralized API configuration with interceptors
8. **Security**: JWT token management and automatic refresh
9. **Performance**: React Query for efficient data fetching
10. **UX**: Smooth animations and transitions

## Next Steps

1. Add unit tests with Vitest
2. Add E2E tests with Playwright
3. Implement error boundaries
4. Add loading skeletons
5. Implement offline support
6. Add push notifications
7. Optimize bundle size
8. Add PWA support

## License

Proprietary - See LICENSE file for details.

