# Frontend Architecture

Modular React application with separation of concerns.

## Directory Structure

```
src/
├── components/          # UI components
│   ├── ChatHeader.tsx   # Header with clear button
│   ├── ChatFooter.tsx   # Footer with conversation ID
│   ├── ChatInput.tsx    # Text/voice input
│   └── MessageList.tsx  # Message display with auto-scroll
├── hooks/              # Business logic
│   ├── useChat.ts      # Chat state and streaming
│   └── useAudioRecorder.ts  # Audio recording
├── services/           # API communication
│   └── chatApi.ts      # HTTP requests
├── types/              # TypeScript definitions
│   └── message.ts      # Message interface
└── App.tsx             # Main orchestrator (~30 lines)
```

## Component Responsibilities

**App.tsx**
- Manages conversation ID
- Connects hooks to components
- Handles clear conversation

**ChatHeader**
- Displays title and clear button
- Props: `onClear`, `hasMessages`

**MessageList**
- Renders messages with auto-scroll
- Welcome message when empty
- Typing indicator
- Props: `messages`, `isLoading`

**ChatInput**
- Text input with send button
- Hold-to-record voice button
- Props: `onSend`, `onStartRecording`, `onStopRecording`, `isLoading`, `isRecording`, `isTranscribing`

**ChatFooter**
- Shows conversation ID
- Props: `conversationId`

## Custom Hooks

**useChat**
- Manages message state
- Handles sending and streaming
- Error handling
- Returns: `messages`, `isLoading`, `sendMessage`, `clearMessages`

**useAudioRecorder**
- MediaRecorder API wrapper
- Triggers transcription
- Returns: `isRecording`, `isTranscribing`, `startRecording`, `stopRecording`

## Services

**chatApi**
- `sendChatMessage()` - POST with SSE streaming
- `transcribeAudio()` - POST with FormData
- `clearConversation()` - DELETE

## Data Flow

```
User Input
    ↓
Component (ChatInput)
    ↓
Hook (useChat / useAudioRecorder)
    ↓
Service (chatApi)
    ↓
Backend API
    ↓
Service (response parsing)
    ↓
Hook (state update)
    ↓
Component (MessageList)
```

## Benefits

- Single Responsibility Principle
- Reusable components and hooks
- Easy to test
- Type-safe
- Scalable
