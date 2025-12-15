# Frontend Architecture

This document describes the modular architecture of the KobeGPT frontend application.

## Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── ChatHeader.tsx   # Header with title and clear button
│   ├── ChatFooter.tsx   # Footer with conversation ID
│   ├── ChatInput.tsx    # Input form with text and voice input
│   └── MessageList.tsx  # Message display with auto-scroll
├── hooks/              # Custom React hooks
│   ├── useChat.ts      # Chat logic and message management
│   └── useAudioRecorder.ts  # Audio recording and transcription
├── services/           # API communication layer
│   └── chatApi.ts      # API calls (chat, transcribe, clear)
├── types/              # TypeScript type definitions
│   └── message.ts      # Message interface
├── App.tsx             # Main application component (orchestration)
├── App.css             # Global styles
└── main.tsx            # Application entry point
```

## Component Responsibilities

### App.tsx (Main Component)
- **Purpose**: Orchestrates the application by composing all parts
- **Responsibilities**:
  - Manages conversation ID
  - Connects hooks to components
  - Handles clear conversation logic
- **Size**: ~30 lines (reduced from ~270 lines)

### Components

#### ChatHeader
- Displays app title
- Clear conversation button
- Props: `onClear`, `hasMessages`

#### MessageList
- Displays conversation messages
- Welcome message for empty state
- Auto-scrolls to latest message
- Shows typing indicator
- Props: `messages`, `isLoading`

#### ChatInput
- Text input field
- Send button
- Voice recording button (hold to record)
- Props: `onSend`, `onStartRecording`, `onStopRecording`, `isLoading`, `isRecording`, `isTranscribing`

#### ChatFooter
- Displays conversation ID
- Props: `conversationId`

### Custom Hooks

#### useChat
- Manages chat messages state
- Handles sending messages
- Processes streaming responses
- Error handling
- Returns: `messages`, `isLoading`, `sendMessage`, `clearMessages`

#### useAudioRecorder
- Manages audio recording state
- Handles MediaRecorder API
- Triggers transcription
- Returns: `isRecording`, `isTranscribing`, `startRecording`, `stopRecording`

### Services

#### chatApi
- `sendChatMessage()`: Sends message and handles streaming response
- `transcribeAudio()`: Sends audio for transcription
- `clearConversation()`: Deletes conversation history

### Types

#### Message
- `role`: 'user' | 'assistant'
- `content`: string
- `timestamp`: number

## Benefits of This Architecture

1. **Separation of Concerns**: Each file has a single, well-defined purpose
2. **Reusability**: Components and hooks can be easily reused
3. **Testability**: Isolated units are easier to test
4. **Maintainability**: Smaller files are easier to understand and modify
5. **Type Safety**: Centralized type definitions prevent inconsistencies
6. **Scalability**: Easy to add new features without bloating existing files

## Data Flow

```
User Input → ChatInput Component
           ↓
     useChat Hook / useAudioRecorder Hook
           ↓
     chatApi Service
           ↓
     Backend API
           ↓
     chatApi Service (response)
           ↓
     useChat Hook (state update)
           ↓
     MessageList Component (display)
```

## Adding New Features

### Adding a New Component
1. Create file in `src/components/`
2. Define props interface
3. Export component
4. Import and use in `App.tsx` or other components

### Adding a New Hook
1. Create file in `src/hooks/`
2. Implement hook logic
3. Return state and functions
4. Use in components or App.tsx

### Adding a New API Call
1. Add function to `src/services/chatApi.ts`
2. Handle request/response
3. Export function
4. Use in hooks or components
