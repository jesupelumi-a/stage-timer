# Firebase Connection Troubleshooting

If you're seeing "Firebase connection status: disconnected" in the console, here's how to fix it:

## Step 1: Check Firebase Console Logs

Open your browser's Developer Tools (F12) and look for these messages:
- `🔧 Firebase Config:` - Shows if your config is loaded correctly
- `🔐 Attempting Firebase authentication...` - Shows if auth is starting
- `❌ Firebase authentication failed:` - Shows specific auth errors

## Step 2: Enable Anonymous Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `stage-timer-d97b9`
3. Go to **Authentication** → **Sign-in method**
4. Click on **Anonymous**
5. Toggle **Enable** and click **Save**

## Step 3: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for now)
4. Select a location (choose closest to you)
5. Click **Done**

## Step 4: Update Firestore Security Rules

1. In Firestore Database, go to **Rules** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all authenticated users for sessions
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

## Step 5: Verify Environment Variables

Check that your `.env` file has the correct values from Firebase Console:

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Click on your web app
4. Copy the config values to your `.env` file

## Step 6: Restart Development Server

After making changes:
```bash
# Stop the server (Ctrl+C)
pnpm dev
```

## Common Error Messages

### "Firebase: Error (auth/operation-not-allowed)"
- **Solution**: Enable Anonymous Authentication (Step 2)

### "FirebaseError: Missing or insufficient permissions"
- **Solution**: Update Firestore security rules (Step 4)

### "Firebase: No Firebase App '[DEFAULT]' has been created"
- **Solution**: Check environment variables are correct (Step 5)

### "Firebase: Error (auth/api-key-not-valid)"
- **Solution**: Double-check your API key in `.env` file

## Test the Connection

1. Open browser console (F12)
2. Go to `http://localhost:5174/control`
3. Look for these success messages:
   - `🔧 Firebase Config:` with correct project ID
   - `✅ Firebase authentication successful:`
   - Connection status should change from "disconnected" to "connected"

## Still Having Issues?

1. **Check Firebase Console** for any error messages
2. **Verify billing** - make sure your Firebase project is on the Spark (free) plan
3. **Check network** - ensure you can access Firebase from your network
4. **Try incognito mode** - to rule out browser cache issues

## Quick Test

Try this in your browser console:
```javascript
// This should show your Firebase config
console.log(import.meta.env.VITE_FIREBASE_PROJECT_ID)
```

If it shows `undefined`, your environment variables aren't loading correctly.
