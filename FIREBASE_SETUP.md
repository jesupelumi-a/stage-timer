# Firebase Setup Guide

This guide will help you set up Firebase for the Stage Timer app to enable real-time synchronization between controller and display devices.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "stage-timer")
4. Disable Google Analytics (optional for this use case)
5. Click "Create project"

## 2. Enable Firestore Database

1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll update security rules later)
4. Select a location close to your users
5. Click "Done"

## 3. Enable Authentication

1. Go to "Authentication" in the Firebase console
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Anonymous" authentication
5. Click "Save"

## 4. Get Firebase Configuration

1. Go to "Project settings" (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (</>) to add a web app
4. Enter app nickname (e.g., "stage-timer-web")
5. Don't check "Firebase Hosting" for now
6. Click "Register app"
7. Copy the configuration object

## 5. Update Environment Variables

1. Copy `.env.example` to `.env`
2. Replace the demo values with your actual Firebase config:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_actual_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
VITE_FIREBASE_APP_ID=your_actual_app_id
```

## 6. Update Firestore Security Rules

1. In Firebase console, go to "Firestore Database"
2. Click "Rules" tab
3. Replace the default rules with the content from `firestore.rules`
4. Click "Publish"

## 7. Test the Setup

1. Start the development server: `pnpm dev`
2. Open the controller route: `http://localhost:5173/control`
3. Click the "Multi-Device" button to create a session
4. Open the display route in another browser/device: `http://localhost:5173/`
5. Enter the session code to join
6. Test timer synchronization between devices

## Free Tier Limits

Firebase's free tier (Spark plan) includes:
- **Firestore**: 1 GB storage, 50K reads/day, 20K writes/day, 20K deletes/day
- **Authentication**: Unlimited users
- **Bandwidth**: 10 GB/month

This is more than sufficient for a small stage timer app with multiple devices.

## Production Considerations

For production use:
1. Update Firestore security rules to be more restrictive
2. Consider implementing proper user authentication
3. Add session expiration and cleanup
4. Monitor usage to ensure you stay within free tier limits
5. Consider upgrading to Blaze plan if needed

## Troubleshooting

### Connection Issues
- Check that your Firebase config is correct
- Ensure Firestore and Authentication are enabled
- Check browser console for error messages

### Session Not Found
- Verify the session ID is correct (case-sensitive)
- Check that the controller device created the session successfully
- Ensure Firestore rules allow read access

### Real-time Updates Not Working
- Check that both devices are connected to the same session
- Verify Firestore security rules allow read/write access
- Check network connectivity
