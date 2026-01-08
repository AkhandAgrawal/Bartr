# 🎨 BARTER Frontend - Deep Dive Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack Deep Dive](#technology-stack-deep-dive)
4. [Authentication Flow](#authentication-flow)
5. [State Management](#state-management)
6. [API Communication](#api-communication)
7. [Real-Time Communication (WebSocket)](#real-time-communication-websocket)
8. [Routing & Navigation](#routing--navigation)
9. [Component Architecture](#component-architecture)
10. [Data Fetching Patterns](#data-fetching-patterns)
11. [UI/UX Patterns](#uiux-patterns)
12. [Error Handling & Monitoring](#error-handling--monitoring)
13. [Interview Preparation Guide](#interview-preparation-guide)

---

## Introduction

### What is the Frontend?
The frontend is the **user interface** that users interact with. It's built with **React** and provides:
- User authentication and login
- Profile management
- Skill matching and swiping
- Real-time chat
- Notifications
- Dashboard with statistics

### Why React?
- **Component-Based**: Reusable UI components
- **Virtual DOM**: Efficient rendering
- **Ecosystem**: Rich library ecosystem
- **Developer Experience**: Great tooling and debugging
- **Performance**: Optimized for modern browsers

### Project Structure

```
bartr-frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   │   ├── Layout.tsx      # Main layout wrapper
│   │   ├── ProtectedRoute.tsx  # Route protection
│   │   └── NotificationBell.tsx
│   ├── pages/              # Page components (routes)
│   │   ├── Landing.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Profile.tsx
│   │   ├── Matches.tsx
│   │   ├── PastMatches.tsx
│   │   ├── Chat.tsx
│   │   └── ChatList.tsx
│   ├── services/           # API service layer
│   │   ├── api.ts          # Axios configuration
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── matchingService.ts
│   │   ├── chatService.ts
│   │   └── notificationService.ts
│   ├── store/             # State management (Zustand)
│   │   ├── authStore.ts
│   │   └── chatStore.ts
│   ├── types/             # TypeScript type definitions
│   │   ├── user.ts
│   │   ├── matching.ts
│   │   └── chat.ts
│   ├── lib/               # Utility libraries
│   │   ├── keycloak.ts
│   │   ├── oidc.ts
│   │   ├── sentry.ts
│   │   └── utils.ts
│   ├── config/            # Configuration files
│   │   ├── env.ts
│   │   └── oidc.ts
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── package.json
├── vite.config.ts        # Vite configuration
└── tailwind.config.js    # Tailwind CSS configuration
```

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER BROWSER                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              React Application                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │    │
│  │  │  Pages   │  │Components│  │  Store   │        │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘        │    │
│  │       │              │             │                │    │
│  │       └──────────────┼─────────────┘                │    │
│  │                      │                               │    │
│  │              ┌───────▼────────┐                     │    │
│  │              │  Service Layer │                     │    │
│  │              │  (API Calls)    │                     │    │
│  │              └───────┬─────────┘                     │    │
│  └──────────────────────┼──────────────────────────────┘    │
│                         │                                     │
│         ┌───────────────┼───────────────┐                    │
│         │               │                 │                    │
│         ▼               ▼                 ▼                    │
│  ┌──────────┐   ┌──────────┐    ┌──────────┐               │
│  │ REST API │   │ WebSocket│    │ Keycloak │               │
│  │ (HTTP)   │   │ (WSS)     │    │ (OAuth2) │               │
│  └──────────┘   └──────────┘    └──────────┘               │
└─────────────────────────────────────────────────────────────┘
         │               │                 │
         ▼               ▼                 ▼
┌──────────┐   ┌──────────┐    ┌──────────┐
│ Backend  │   │ Chat      │    │ Keycloak │
│ Services │   │ Service   │    │ Server   │
└──────────┘   └──────────┘    └──────────┘
```

### Data Flow Pattern

```
User Action
    │
    ▼
Component (UI)
    │
    ▼
Service Layer (API Call)
    │
    ▼
Backend API
    │
    ▼
Response
    │
    ▼
State Management (Store/React Query)
    │
    ▼
Component Re-renders
    │
    ▼
UI Updates
```

---

## Technology Stack Deep Dive

### 1. React 19

**What is React?**
React is a **JavaScript library** for building user interfaces. It uses a **component-based architecture** where UI is broken into reusable pieces.

**Key Concepts:**

#### Components
```tsx
// Functional Component
function Welcome({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}

// Usage
<Welcome name="John" />
```

#### Hooks
Hooks are functions that let you "hook into" React features.

**useState Hook:**
```tsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

**useEffect Hook:**
```tsx
import { useEffect, useState } from 'react';

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // This runs after component mounts
    fetchUser(userId).then(setUser);
  }, [userId]); // Re-run if userId changes
  
  return <div>{user?.name}</div>;
}
```

### 2. TypeScript

**What is TypeScript?**
TypeScript is **JavaScript with types**. It helps catch errors before runtime.

**Example:**
```typescript
// Type definition
interface User {
  id: string;
  name: string;
  email: string;
}

// Function with types
function getUser(id: string): Promise<User> {
  return fetch(`/api/users/${id}`).then(res => res.json());
}

// Usage (TypeScript will check types)
const user: User = await getUser("123");
```

### 3. Vite

**What is Vite?**
Vite is a **build tool** that provides:
- **Fast Development**: Hot Module Replacement (HMR)
- **Fast Builds**: Optimized production builds
- **Modern**: Uses ES modules

**How it works:**
```
Development:
  Source Code → Vite Dev Server → Browser
  (Fast HMR, no bundling)

Production:
  Source Code → Vite Build → Optimized Bundle → Browser
  (Code splitting, minification, tree-shaking)
```

### 4. Tailwind CSS

**What is Tailwind CSS?**
Tailwind is a **utility-first CSS framework**. Instead of writing custom CSS, you use utility classes.

**Example:**
```tsx
// Instead of:
<div className="card">
  <h2 className="title">Hello</h2>
</div>

// You write:
<div className="bg-white rounded-lg shadow-md p-4">
  <h2 className="text-2xl font-bold text-gray-800">Hello</h2>
</div>
```

**Benefits:**
- **Fast Development**: No context switching between files
- **Consistent**: Predefined design system
- **Small Bundle**: Unused styles are removed

### 5. Zustand (State Management)

**What is Zustand?**
Zustand is a **lightweight state management library**. It's simpler than Redux but more powerful than Context API.

**Example Store:**
```typescript
import { create } from 'zustand';

interface AuthStore {
  user: User | null;
  token: string | null;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, token: null }),
}));
```

**Usage in Component:**
```tsx
function Profile() {
  const { user, setUser } = useAuthStore();
  
  return <div>{user?.name}</div>;
}
```

### 6. React Query (TanStack Query)

**What is React Query?**
React Query manages **server state** (data from APIs). It provides:
- **Caching**: Stores API responses
- **Refetching**: Automatically refetches stale data
- **Loading States**: Built-in loading/error states
- **Optimistic Updates**: Update UI before server confirms

**Example:**
```tsx
import { useQuery } from '@tanstack/react-query';

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{data.name}</div>;
}
```

### 7. React Router

**What is React Router?**
React Router enables **client-side routing** (navigation without page reloads).

**Example:**
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Authentication Flow

### Complete Authentication Flow

```
┌──────────┐
│  User    │
│  Browser │
└────┬─────┘
     │
     │ 1. User clicks "Login"
     │
     ▼
┌─────────────────────────────────────┐
│  Login Page                          │
│  <Login /> component                 │
└────┬────────────────────────────────┘
     │
     │ 2. Redirect to Keycloak
     │    window.location.href = 
     │    keycloak.loginUrl
     │
     ▼
┌─────────────────────────────────────┐
│  Keycloak Login Page                │
│  - User enters credentials          │
│  - Keycloak validates               │
└────┬────────────────────────────────┘
     │
     │ 3. Keycloak redirects back
     │    with authorization code
     │    http://localhost:5173/callback?code=abc123
     │
     ▼
┌─────────────────────────────────────┐
│  Callback Handler                   │
│  - Exchanges code for tokens        │
│  - Stores tokens                    │
└────┬────────────────────────────────┘
     │
     │ 4. Tokens stored:
     │    - access_token (JWT)
     │    - refresh_token
     │    - id_token
     │
     ▼
┌─────────────────────────────────────┐
│  Auth Store (Zustand)               │
│  - Updates user state               │
│  - Sets authenticated = true        │
└────┬────────────────────────────────┘
     │
     │ 5. Redirect to dashboard
     │
     ▼
┌─────────────────────────────────────┐
│  Dashboard                          │
│  - Protected route                  │
│  - Shows user data                  │
└─────────────────────────────────────┘
```

### Implementation Details

#### 1. OIDC Configuration

```typescript
// config/oidc.ts
export const oidcConfig = {
  authority: 'http://localhost:8081/realms/oauth2-demo',
  client_id: 'bartr-frontend',
  redirect_uri: 'http://localhost:5173/callback',
  response_type: 'code',
  scope: 'openid profile email',
  post_logout_redirect_uri: 'http://localhost:5173',
};
```

#### 2. Auth Provider Setup

```tsx
// App.tsx
import { AuthProvider } from 'react-oidc-context';

function App() {
  return (
    <AuthProvider {...oidcConfig}>
      <Router>
        <Routes>
          {/* Routes */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}
```

#### 3. Using Auth in Components

```tsx
import { useAuth } from 'react-oidc-context';

function Dashboard() {
  const { user, isAuthenticated, signinRedirect, signoutRedirect } = useAuth();
  
  if (!isAuthenticated) {
    return <button onClick={() => signinRedirect()}>Login</button>;
  }
  
  return (
    <div>
      <p>Welcome, {user?.profile.name}!</p>
      <button onClick={() => signoutRedirect()}>Logout</button>
    </div>
  );
}
```

#### 4. Token Usage in API Calls

```typescript
// services/api.ts
import axios from 'axios';
import { useAuth } from 'react-oidc-context';

const api = axios.create({
  baseURL: 'http://localhost:8080',
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const auth = useAuth.getState();
  if (auth.user?.access_token) {
    config.headers.Authorization = `Bearer ${auth.user.access_token}`;
  }
  return config;
});
```

---

## State Management

### State Management Strategy

**Two Types of State:**

1. **Client State** (Zustand)
   - UI state (modals, dropdowns)
   - User preferences
   - Temporary form data

2. **Server State** (React Query)
   - API data (user profiles, matches, messages)
   - Cached responses
   - Background refetching

### Zustand Store Examples

#### Auth Store

```typescript
// store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
}));
```

#### Chat Store

```typescript
// store/chatStore.ts
import { create } from 'zustand';

interface ChatState {
  messages: Message[];
  activeChat: string | null;
  addMessage: (message: Message) => void;
  setActiveChat: (userId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  activeChat: null,
  addMessage: (message) => 
    set((state) => ({ 
      messages: [...state.messages, message] 
    })),
  setActiveChat: (userId) => set({ activeChat: userId }),
}));
```

### React Query Usage

#### Fetching User Profile

```tsx
import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/userService';

function Profile() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => userService.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  if (isLoading) return <div>Loading...</div>;
  
  return <div>{user?.name}</div>;
}
```

#### Mutating Data (Creating/Updating)

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';

function UpdateProfile() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: (data: UpdateRequest) => userService.updateProfile(data),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
  
  const handleSubmit = (data: UpdateRequest) => {
    mutation.mutate(data);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

---

## API Communication

### Service Layer Architecture

**Why a Service Layer?**
- **Separation of Concerns**: UI components don't know about API details
- **Reusability**: Same service can be used in multiple components
- **Testability**: Easy to mock services in tests
- **Centralized Configuration**: API base URLs, headers in one place

### Axios Configuration

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (adds token)
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken(); // Get from auth store
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (handles errors)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Service Examples

#### User Service

```typescript
// services/userService.ts
import api from './api';

export const userService = {
  // Get current user profile
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/v1/user/profile/me');
    return response.data;
  },
  
  // Get user by ID
  getUserById: async (keycloakId: string): Promise<User> => {
    const response = await api.get(`/v1/user/profile?keycloakId=${keycloakId}`);
    return response.data;
  },
  
  // Update profile
  updateProfile: async (data: UpdateRequest): Promise<User> => {
    const response = await api.put('/v1/user/profile/update', data);
    return response.data;
  },
  
  // Signup
  signup: async (data: SignupRequest): Promise<User> => {
    const response = await api.post('/v1/user/profile/signup/public', data);
    return response.data;
  },
};
```

#### Matching Service

```typescript
// services/matchingService.ts
import api from './api';

export const matchingService = {
  // Get top matches
  getTopMatches: async (keycloakId: string): Promise<UserDocument[]> => {
    const response = await api.get(`/v1/matches/top?keycloakId=${keycloakId}`);
    return response.data;
  },
  
  // Swipe (like/pass)
  swipe: async (data: SwipeRequest): Promise<SwipeResponse> => {
    const response = await api.post('/v1/swipe', data);
    return response.data;
  },
  
  // Get match history
  getMatchHistory: async (keycloakId: string): Promise<MatchHistory[]> => {
    const response = await api.get(`/v1/matches/history?keycloakId=${keycloakId}`);
    return response.data;
  },
  
  // Unmatch users
  unmatch: async (user1Id: string, user2Id: string): Promise<void> => {
    await api.delete('/v1/matches/unmatch', {
      params: { user1Id, user2Id },
    });
  },
};
```

### Request Flow Example

**Scenario: User updates their profile**

```
┌──────────┐
│  User    │
│  Fills   │
│  Form    │
└────┬─────┘
     │
     │ 1. User clicks "Save"
     │
     ▼
┌─────────────────────────────────────┐
│  Profile Component                  │
│  handleSubmit(data)                  │
└────┬────────────────────────────────┘
     │
     │ 2. Call service
     │    userService.updateProfile(data)
     │
     ▼
┌─────────────────────────────────────┐
│  User Service                       │
│  - Builds request                   │
│  - Adds auth token                  │
│  - Makes HTTP PUT request           │
└────┬────────────────────────────────┘
     │
     │ 3. HTTP PUT /v1/user/profile/update
     │    Headers: Authorization: Bearer <token>
     │    Body: { "firstName": "John", ... }
     │
     ▼
┌─────────────────────────────────────┐
│  Backend API                        │
│  - Validates request                │
│  - Updates database                 │
│  - Returns updated user             │
└────┬────────────────────────────────┘
     │
     │ 4. HTTP 200 OK
     │    Body: { "id": "...", "firstName": "John", ... }
     │
     ▼
┌─────────────────────────────────────┐
│  User Service                       │
│  - Returns user data                │
└────┬────────────────────────────────┘
     │
     │ 5. Update React Query cache
     │
     ▼
┌─────────────────────────────────────┐
│  Profile Component                  │
│  - UI updates with new data        │
│  - Shows success message            │
└─────────────────────────────────────┘
```

---

## Real-Time Communication (WebSocket)

### WebSocket Architecture

**Why WebSocket for Chat?**
- **Real-time**: Messages appear instantly
- **Bidirectional**: Both client and server can send
- **Efficient**: No HTTP overhead per message
- **Persistent Connection**: Stays open for multiple messages

### STOMP Protocol

**What is STOMP?**
STOMP (Simple Text Oriented Messaging Protocol) is a **messaging protocol** over WebSocket. It provides:
- **Destinations**: Topics and queues
- **Subscriptions**: Clients subscribe to receive messages
- **Sending**: Clients send to specific destinations

### Chat Service Implementation

```typescript
// services/chatService.ts
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class ChatService {
  private client: Client | null = null;
  
  connect(userId: string, onMessage: (message: Message) => void) {
    // Create WebSocket connection
    const socket = new SockJS('http://localhost:8083/ws');
    
    // Create STOMP client
    this.client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });
    
    // On connection
    this.client.onConnect = (frame) => {
      console.log('Connected: ' + frame);
      
      // Subscribe to personal message queue
      this.client?.subscribe(
        `/user/${userId}/queue/messages`,
        (message) => {
          const msg: Message = JSON.parse(message.body);
          onMessage(msg);
        }
      );
    };
    
    // On error
    this.client.onStompError = (frame) => {
      console.error('STOMP error:', frame);
    };
    
    // Activate client
    this.client.activate();
  }
  
  sendMessage(message: Message) {
    if (this.client?.connected) {
      this.client.publish({
        destination: '/app/private-message',
        body: JSON.stringify(message),
      });
    }
  }
  
  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }
}

export const chatService = new ChatService();
```

### Chat Component Implementation

```tsx
// pages/Chat.tsx
import { useEffect, useState } from 'react';
import { chatService } from '../services/chatService';
import { useChatStore } from '../store/chatStore';

function Chat({ receiverId }: { receiverId: string }) {
  const [message, setMessage] = useState('');
  const { messages, addMessage } = useChatStore();
  const { user } = useAuth();
  
  useEffect(() => {
    // Connect to WebSocket
    chatService.connect(user.id, (newMessage) => {
      addMessage(newMessage);
    });
    
    // Cleanup on unmount
    return () => {
      chatService.disconnect();
    };
  }, [user.id]);
  
  const handleSend = () => {
    if (message.trim()) {
      chatService.sendMessage({
        senderId: user.id,
        receiverId,
        content: message,
        timestamp: new Date().toISOString(),
      });
      setMessage('');
    }
  };
  
  return (
    <div>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id}>{msg.content}</div>
        ))}
      </div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

### WebSocket Connection Flow

```
┌──────────┐
│  Client  │
│ (React)  │
└────┬─────┘
     │
     │ 1. Component mounts
     │    chatService.connect()
     │
     ▼
┌─────────────────────────────────────┐
│  SockJS Connection                  │
│  ws://localhost:8083/ws             │
└────┬────────────────────────────────┘
     │
     │ 2. WebSocket handshake
     │
     ▼
┌─────────────────────────────────────┐
│  STOMP CONNECT                       │
│  - Authenticates with JWT           │
└────┬────────────────────────────────┘
     │
     │ 3. STOMP CONNECTED
     │
     ▼
┌─────────────────────────────────────┐
│  Subscribe to Queue                │
│  SUBSCRIBE /user/{userId}/         │
│  queue/messages                      │
└────┬────────────────────────────────┘
     │
     │ 4. Connection ready
     │    Can send/receive messages
     │
     ▼
┌─────────────────────────────────────┐
│  Send Message                       │
│  SEND /app/private-message          │
│  { "senderId": "...", ... }          │
└────┬────────────────────────────────┘
     │
     │ 5. Server processes
     │    Saves to MongoDB
     │    Publishes to Kafka
     │
     ▼
┌─────────────────────────────────────┐
│  Receive Message                    │
│  MESSAGE /user/{userId}/           │
│  queue/messages                      │
│  { "content": "Hello!", ... }       │
└────┬────────────────────────────────┘
     │
     │ 6. Update UI
     │
     ▼
┌──────────┐
│  Message │
│  Displayed│
└──────────┘
```

---

## Routing & Navigation

### Route Configuration

```tsx
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Matches from './pages/Matches';
import Chat from './pages/Chat';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matches"
          element={
            <ProtectedRoute>
              <Matches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:userId"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Protected Route Component

```tsx
// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}
```

### Navigation Example

```tsx
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  
  const handleViewProfile = () => {
    navigate('/profile');
  };
  
  const handleViewMatches = () => {
    navigate('/matches');
  };
  
  return (
    <div>
      <button onClick={handleViewProfile}>View Profile</button>
      <button onClick={handleViewMatches}>View Matches</button>
    </div>
  );
}
```

---

## Component Architecture

### Component Hierarchy

```
App
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── Navigation
│   │   └── NotificationBell
│   ├── Sidebar (optional)
│   └── Main Content
│       ├── Dashboard
│       │   ├── Stats Cards
│       │   └── Quick Actions
│       ├── Profile
│       │   ├── Profile Form
│       │   └── Skills Selector
│       ├── Matches
│       │   ├── Swipe Card
│       │   └── Match Actions
│       └── Chat
│           ├── Chat List
│           └── Chat Window
└── Modals/Dialogs
    ├── Login Modal
    └── Confirmation Dialogs
```

### Component Patterns

#### 1. Container/Presentational Pattern

**Container Component** (Logic):
```tsx
// pages/Dashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/userService';
import DashboardView from '../components/DashboardView';

function Dashboard() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => userService.getCurrentUser(),
  });
  
  if (isLoading) return <div>Loading...</div>;
  
  return <DashboardView user={user} />;
}
```

**Presentational Component** (UI):
```tsx
// components/DashboardView.tsx
interface DashboardViewProps {
  user: User;
}

function DashboardView({ user }: DashboardViewProps) {
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      {/* UI components */}
    </div>
  );
}
```

#### 2. Compound Components

```tsx
// components/Card.tsx
function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

Card.Header = function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="card-header">{children}</div>;
};

Card.Body = function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="card-body">{children}</div>;
};

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>
```

#### 3. Custom Hooks

```tsx
// hooks/useUser.ts
import { useQuery } from '@tanstack/react-query';
import { userService } from '../services/userService';

export function useUser() {
  return useQuery({
    queryKey: ['user', 'current'],
    queryFn: () => userService.getCurrentUser(),
  });
}

// Usage
function Profile() {
  const { data: user, isLoading } = useUser();
  // ...
}
```

---

## Data Fetching Patterns

### 1. Fetch on Mount

```tsx
function UserList() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAllUsers(),
  });
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {data?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### 2. Fetch on Action

```tsx
function SearchUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data } = useQuery({
    queryKey: ['users', 'search', searchTerm],
    queryFn: () => userService.searchUsers(searchTerm),
    enabled: searchTerm.length > 2, // Only fetch if search term > 2 chars
  });
  
  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {data?.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### 3. Optimistic Updates

```tsx
function LikeButton({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: () => matchingService.swipe({ userId, action: 'RIGHT' }),
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['matches'] });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(['matches']);
      
      // Optimistically update
      queryClient.setQueryData(['matches'], (old: any) => ({
        ...old,
        liked: true,
      }));
      
      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['matches'], context?.previous);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
  
  return (
    <button onClick={() => mutation.mutate()}>
      {mutation.isPending ? 'Liking...' : 'Like'}
    </button>
  );
}
```

---

## UI/UX Patterns

### 1. Loading States

```tsx
function UserProfile() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['user'],
    queryFn: () => userService.getCurrentUser(),
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="spinner">Loading...</div>
      </div>
    );
  }
  
  if (isError) {
    return <div className="error">Failed to load profile</div>;
  }
  
  return <div>{data.name}</div>;
}
```

### 2. Error States

```tsx
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        // Log to Sentry
        Sentry.captureException(error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="error-container">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={() => window.location.reload()}>
        Reload Page
      </button>
    </div>
  );
}
```

### 3. Form Handling

```tsx
import { useForm } from 'react-hook-form';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  bio: string;
}

function ProfileForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>();
  const mutation = useMutation({
    mutationFn: (data: ProfileFormData) => userService.updateProfile(data),
  });
  
  const onSubmit = (data: ProfileFormData) => {
    mutation.mutate(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('firstName', { required: 'First name is required' })}
        className={errors.firstName ? 'error' : ''}
      />
      {errors.firstName && <span>{errors.firstName.message}</span>}
      
      <input
        {...register('lastName', { required: 'Last name is required' })}
      />
      
      <textarea {...register('bio')} />
      
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

---

## Error Handling & Monitoring

### Error Handling Strategy

1. **API Errors**: Handled by Axios interceptors
2. **Component Errors**: Error boundaries
3. **Async Errors**: Try-catch in async functions
4. **Monitoring**: Sentry for error tracking

### Sentry Integration

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/react';

export function initSentry() {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

### Error Logging

```tsx
import * as Sentry from '@sentry/react';

function handleError(error: Error) {
  // Log to console (development)
  console.error(error);
  
  // Send to Sentry (production)
  if (import.meta.env.PROD) {
    Sentry.captureException(error);
  }
}
```

---

## Interview Preparation Guide

### Common Interview Questions

#### 1. Why did you choose React?

**Answer:**
- **Component-Based**: Reusable, maintainable code
- **Virtual DOM**: Efficient rendering and updates
- **Ecosystem**: Rich library ecosystem (React Query, React Router)
- **Community**: Large community, lots of resources
- **Performance**: Optimized for modern browsers

#### 2. How does state management work?

**Answer:**
- **Client State**: Zustand for UI state, user preferences
- **Server State**: React Query for API data, caching, refetching
- **Local State**: useState for component-specific state
- **Why this approach**: Separation of concerns, optimal performance

#### 3. How does authentication work?

**Answer:**
1. User clicks login, redirects to Keycloak
2. Keycloak authenticates and returns authorization code
3. Frontend exchanges code for tokens (access_token, refresh_token)
4. Tokens stored in memory/localStorage
5. Axios interceptor adds token to all API requests
6. Backend validates token on each request

#### 4. How does real-time chat work?

**Answer:**
1. WebSocket connection established (SockJS + STOMP)
2. Client subscribes to personal queue: `/user/{userId}/queue/messages`
3. When sending: Client sends to `/app/private-message`
4. Server validates match, saves to MongoDB, publishes to Kafka
5. Server sends to receiver's queue via WebSocket
6. Receiver's client receives message and updates UI

#### 5. How do you handle API errors?

**Answer:**
- **Axios Interceptors**: Centralized error handling
- **React Query**: Built-in error states
- **Error Boundaries**: Catch component errors
- **Sentry**: Error tracking and monitoring
- **User Feedback**: Toast notifications for errors

#### 6. How do you optimize performance?

**Answer:**
- **React Query Caching**: Reduces API calls
- **Code Splitting**: Lazy loading routes
- **Memoization**: useMemo, useCallback for expensive operations
- **Virtual Scrolling**: For long lists
- **Image Optimization**: Lazy loading images
- **Bundle Size**: Tree shaking, code splitting

#### 7. How do you handle forms?

**Answer:**
- **React Hook Form**: For form state and validation
- **Validation**: Zod or Yup for schema validation
- **Error Display**: Show errors next to fields
- **Submission**: useMutation for API calls
- **Optimistic Updates**: Update UI before server confirms

### Key Concepts to Understand

1. **React Hooks** (useState, useEffect, useMemo, useCallback)
2. **React Query** (useQuery, useMutation, caching)
3. **State Management** (Zustand, React Query)
4. **Routing** (React Router, protected routes)
5. **WebSocket** (STOMP protocol, real-time communication)
6. **TypeScript** (Types, interfaces, generics)
7. **Axios** (Interceptors, error handling)
8. **Tailwind CSS** (Utility-first CSS)
9. **Vite** (Build tool, HMR)
10. **Error Handling** (Error boundaries, Sentry)

---

## Conclusion

This frontend architecture demonstrates **industry-level patterns** including:
- Modern React patterns (hooks, context, custom hooks)
- State management (Zustand + React Query)
- Real-time communication (WebSocket/STOMP)
- Type safety (TypeScript)
- Performance optimization
- Error handling and monitoring

Understanding these concepts will help you:
- **In Interviews**: Explain frontend architecture confidently
- **In Development**: Build scalable, maintainable UIs
- **In Learning**: Understand modern frontend patterns

**Next Steps:**
1. Review the codebase
2. Run the frontend locally
3. Test the features
4. Experiment with modifications
5. Build new features

---

**Happy Learning! 🚀**

