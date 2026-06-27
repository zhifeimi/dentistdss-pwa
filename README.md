# Dentabot

Dentabot is a modern Progressive Web Application (PWA) that leverages artificial intelligence to provide comprehensive dental health support and education. Built with React and powered by OpenAI's advanced language models, Dentabot serves as your personal dental assistant, offering professional advice, educational resources, and dental care guidance.

Try on our website: [https://dentist.mizhifei.press/](https://dentist.mizhifei.press/)

This project codebase is managed by git on GitHub: [https://github.com/zm377/dentistdss-pwa](https://github.com/zm377/dentistdss-pwa)

## Key Features

### 🤖 AI-Powered Dental Assistant
- **Professional Dental Chatbot**: Get instant answers to your dental questions from an AI trained on dental health knowledge
- **Personalized Responses**: Receive tailored advice based on your specific dental concerns and queries
- **Real-time Consultation**: Interactive chat interface with immediate responses to help address dental issues

### 📚 Educational Resources
- **Comprehensive Learning Center**: Access a library of dental health articles covering topics from cavity prevention to oral cancer awareness
- **Interactive Content**: Filter articles by topics like Prevention, Treatment, Oral Care, and Dental Procedures
- **Visual Learning**: Each article includes relevant images and detailed explanations to enhance understanding

### 📝 Interactive Quiz System
- **Knowledge Assessment**: Test your dental health knowledge with interactive quizzes
- **Educational Feedback**: Learn from quiz results to improve your understanding of oral health

### 🏥 Dental Practice Integration
- **Find a Clinic**: Locate dental clinics in your area (feature in development)
- **Appointment Booking**: Schedule dental appointments directly through the app
- **Multi-role Support**: Separate interfaces for patients, clinic staff, and administrators

### 👤 User Management
- **Secure Authentication**: Google OAuth integration for quick and secure sign-in
- **Role-based Access**: Different features and permissions for patients, dental staff, and clinic administrators
- **Email Verification**: Secure account creation with email verification system

### 🎨 Modern User Experience
- **Responsive Design**: Fully responsive interface that works seamlessly on desktop, tablet, and mobile devices
- **Dark Mode Support**: Toggle between light and dark themes for comfortable viewing
- **Material UI Design**: Clean and intuitive interface built with Material-UI components
- **PWA Capabilities**: Install as a native-like app on any device for offline access

## Technology Stack

- **Frontend**: React 19, Material-UI 6, React Router 7
- **AI Integration**: OpenAI API and Google Vertex AI with Server-Sent Events (SSE) for real-time responses by Spring AI
- **Authentication**: Google OAuth 2.0
- **Styling**: Material-UI, Styled Components, Emotion
- **PWA**: Service Worker enabled for offline functionality
- **Build Tools**: Create React App, React Scripts

## Use Cases

1. **For Patients**: Get immediate answers to dental concerns, learn about oral health, and find professional dental care
2. **For Dental Clinics**: Manage appointments, connect with patients, and provide digital health resources
3. **For Dental Education**: Access reliable dental health information and test knowledge through interactive quizzes

## Configuration

## Backend-Only OpenAI Integration

The system uses a backend-only OpenAI integration architecture through Spring AI:

### Architecture
- **Spring AI Backend**: All OpenAI API communication handled by the backend
- **Enhanced SSE Processing**: Frontend uses OpenAI SDK utilities for better data processing
- **Type Safety**: Comprehensive TypeScript interfaces using OpenAI SDK types
- **No Frontend API Keys**: No OpenAI API keys required in the frontend environment
- **Secure Communication**: All AI interactions flow through authenticated backend endpoints

### Features
- **Enhanced SSE Streaming**: Improved Server-Sent Events processing with OpenAI SDK utilities
- **Better Error Handling**: Enhanced error detection and user-friendly messaging
- **Type Safety**: Full TypeScript support using OpenAI SDK type definitions
- **Session Management**: Backend-managed conversation sessions with JWT authentication
- **Intelligent Token Spacing**: Smart token concatenation for natural text flow

### Usage
The chatbot API interface remains unchanged:
```typescript
// Help chat (no authentication required)
const response = await api.chatbot.help("What are your clinic hours?", onStreamCallback);

// AI Dentist (requires authentication)
const clinicalResponse = await api.chatbot.aidentist("Patient symptoms...", onStreamCallback);
```

All OpenAI communication flows through the Spring AI backend at `/api/genai/chatbot/*` endpoints.

## Deployment

The PWA is deployed by Vercel's native GitHub integration:

- pull-request and feature branches create Vercel Preview deployments;
- `main` creates the production deployment;
- `dentist.mizhifei.press` is the production frontend domain;
- `VITE_API_HOST` is configured in Vercel Production as
  `https://api.mizhifei.press`.

Preview deployments deliberately do not inherit the production API host. Add a
branch-scoped preview variable only after a separate staging backend exists.
GitHub Actions remains the code-quality gate for type-checking, tests, builds,
CodeQL, and dependency updates; it does not duplicate Vercel's deployment job.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!


### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.
