# Bartr Frontend

A modern, industry-grade React frontend for the Bartr skill matchmaking platform.

## Features

- 🎨 Modern UI with animations using Framer Motion
- 🔐 Keycloak authentication integration
- 💬 Real-time chat with WebSocket/STOMP
- 🎯 Smart matching and swiping interface
- 📱 Responsive design
- 🚀 Built with React, TypeScript, Vite, and Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Keycloak server running on `http://localhost:8081`
- All backend microservices running:
  - User Service: `http://localhost:8080`
  - Matching Service: `http://localhost:8082`
  - Chat Service: `http://localhost:8083`
  - Notification Service: `http://localhost:8084`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env.local` file in the root directory:
```
VITE_KEYCLOAK_URL=http://localhost:8081
VITE_KEYCLOAK_REALM=Bartr
VITE_KEYCLOAK_CLIENT=oauth-demo-client
VITE_KEYCLOAK_CLIENT_SECRET=ZLClZb63KD6YUlQGyAbVjCJxp5d5wlik
VITE_API_BASE_URL=http://localhost:8080
VITE_MATCHING_SERVICE_URL=http://localhost:8082
VITE_CHAT_SERVICE_URL=http://localhost:8083
VITE_NOTIFICATION_SERVICE_URL=http://localhost:8084
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/       # Reusable components
├── config/          # Configuration files
├── lib/             # Utility libraries (Keycloak, etc.)
├── pages/           # Page components
├── services/        # API service layer
├── store/           # State management (Zustand)
└── App.tsx          # Main app component with routing
```

## Key Features

### Authentication
- Keycloak integration for secure authentication
- JWT token management
- Automatic token refresh
- Protected routes

### Matching
- Swipe-based matching interface
- Personalized match recommendations
- Match notifications

### Chat
- Real-time messaging via WebSocket/STOMP
- Chat history
- Online/offline status

### Profile Management
- View and edit profile
- Manage skills offered and wanted
- Update personal information

## Technologies Used

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Zustand** - State management
- **React Query** - Data fetching
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **Keycloak JS** - Authentication
- **STOMP.js** - WebSocket messaging
- **Axios** - HTTP client

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Development

The app uses:
- **Vite** for fast development and building
- **ESLint** for code quality
- **TypeScript** for type safety
- **Tailwind CSS** for styling

## License

Proprietary - See LICENSE file for details.
