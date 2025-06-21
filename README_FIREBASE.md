# Stage Timer - Firebase Multi-Device Sync

This implementation adds real-time multi-device synchronization using Firebase/Firestore, allowing you to control timers from one device while displaying them on another (like a TV or projector).

## Features

✅ **Real-time Synchronization**: Timer state, messages, and settings sync instantly between devices
✅ **Session-based Connection**: Simple 6-character codes for connecting devices
✅ **Controller/Display Separation**: Dedicated interfaces for control and display
✅ **Firebase Free Tier**: Uses the most cost-effective Firebase plan
✅ **Offline Graceful Degradation**: Works locally when Firebase is unavailable
✅ **Visual Connection Status**: Clear indicators for connection and session status

## How It Works

### Controller Device (Phone/Tablet)
- Navigate to `/control` route
- Click "Multi-Device" button to create a session
- Get a 6-character session code (e.g., "ABC123")
- Control timers, messages, and settings
- All changes sync to connected display devices

### Display Device (TV/Projector)
- Navigate to `/` route (root)
- Enter the session code when prompted
- Display automatically syncs with controller
- Shows timer in TimerPreview style with progress bars
- Receives blackout/flash commands from controller

## Quick Start

1. **Set up Firebase** (see FIREBASE_SETUP.md for detailed instructions)
2. **Update environment variables** in `.env`
3. **Start the development server**: `pnpm dev`
4. **Test the sync**:
   - Open controller: `http://localhost:5173/control`
   - Create a session and note the code
   - Open display: `http://localhost:5173/`
   - Enter the session code
   - Test timer controls on controller

## Architecture

### Firebase Service Layer
- `src/services/firebase.ts`: Core Firebase/Firestore operations
- `src/hooks/useFirebaseSync.ts`: React hook for Firebase integration
- `src/components/SessionManager.tsx`: UI for creating/joining sessions

### Data Structure
```typescript
interface SessionData {
  id: string;                    // 6-character session code
  controllerDeviceId: string;    // Controller device identifier
  timers: TimerCollection;       // All timer data
  currentMessage: Message | null; // Active message
  messageQueue: Message[];       // Queued messages
  settings: AppSettings;         // Display settings
  blackoutMode: boolean;         // Blackout state
  flashMode: boolean;           // Flash state
  isActive: boolean;            // Session status
  createdAt: Timestamp;         // Creation time
  lastUpdated: Timestamp;       // Last update time
}
```

### Real-time Updates
- Controller updates Firestore on every state change
- Display subscribes to Firestore changes
- Updates are applied immediately to display state
- Connection status indicators show sync health

## Firebase Configuration

### Firestore Collections
- `sessions/{sessionId}`: Session documents with timer/message data

### Security Rules
- Anonymous authentication required
- Read access for all authenticated users
- Write access for authenticated users
- Delete access only for session controller

### Free Tier Usage
- **Storage**: Minimal (session data only)
- **Reads**: ~1-10 per second during active use
- **Writes**: ~1-5 per second during timer operation
- **Bandwidth**: Very low (small JSON documents)

## Development vs Production

### Development Mode
- Uses demo Firebase config by default
- Can use Firebase emulators (optional)
- Session codes are simple for testing

### Production Mode
- Requires real Firebase project setup
- Update `.env` with actual Firebase config
- Consider session expiration and cleanup
- Monitor usage to stay within free tier

## Troubleshooting

### Common Issues

**"Session not found"**
- Check session code is correct (case-sensitive)
- Verify controller created session successfully
- Check Firestore security rules

**"No real-time updates"**
- Verify both devices use same session code
- Check Firebase connection status indicators
- Ensure Firestore rules allow read/write access

**"Firebase connection failed"**
- Check `.env` configuration
- Verify Firebase project is set up correctly
- Check browser console for detailed errors

### Debug Information
- Connection status indicators in top-right corner
- Debug info overlay (hover bottom-left on display)
- Browser console logs for Firebase operations

## Next Steps

1. **Test the implementation** with multiple devices
2. **Set up your Firebase project** using FIREBASE_SETUP.md
3. **Customize session management** (expiration, cleanup)
4. **Add error handling** for network issues
5. **Consider upgrading** to paid Firebase plan if needed

## Benefits Over Local Sync

- ✅ Works across different networks
- ✅ No complex network discovery
- ✅ Reliable real-time updates
- ✅ Simple session codes
- ✅ Scales to multiple display devices
- ✅ Works on mobile networks
- ✅ No firewall/router configuration needed
