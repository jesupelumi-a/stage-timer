# Stage Timer - Simple Firebase Sync

## 🎯 **Perfect for Your Use Case!**

No sessions, no codes, no complexity. Just **one controller** (your laptop) and **one display** (your TV) syncing perfectly in real-time via Firebase.

## ✨ **How It Works**

### **Controller (Your Laptop)**
- Go to: `http://localhost:5174/control`
- Control all timers, messages, and settings
- Everything syncs automatically to Firebase

### **Display (Your TV)**
- Go to: `http://localhost:5174/`
- Shows TimerPreview-style display
- Automatically receives all updates from controller
- No setup needed - just open the page!

## 🚀 **Quick Start**

1. **Set up Firebase** (see FIREBASE_SETUP.md)
2. **Update your `.env`** with Firebase config
3. **Open controller**: `http://localhost:5174/control`
4. **Open display**: `http://localhost:5174/`
5. **Start using timers** - they sync instantly!

## 🔄 **What Syncs Automatically**

- ✅ **Timer state**: Start, pause, reset, time changes
- ✅ **Active timer**: Which timer is currently selected
- ✅ **Messages**: Show/hide messages and presets
- ✅ **Settings**: Theme, display preferences
- ✅ **Blackout mode**: Screen blackout on/off
- ✅ **Flash mode**: Screen flash effects

## 📱 **Connection Status**

Both pages show connection status in the top-right corner:
- **Controller**: "Firebase: connected • Syncing"
- **Display**: "Firebase: connected • Synced"

## 🛠 **Technical Details**

### **Firebase Structure**
```
timer-data/
  └── shared-timer-data/
      ├── timers: { timers: [], activeTimerId: null }
      ├── currentMessage: null
      ├── messageQueue: []
      ├── settings: { display: {...}, timer: {...} }
      ├── blackoutMode: false
      ├── flashMode: false
      └── lastUpdated: timestamp
```

### **How Sync Works**
1. **Controller** initializes shared data on first connection
2. **Controller** updates Firebase on every state change
3. **Display** subscribes to Firebase changes
4. **Display** updates immediately when data changes

### **No Sessions Needed!**
- Uses a single shared document: `timer-data/shared-timer-data`
- Controller writes, display reads
- Perfect for single controller + single display setup

## 🎮 **Usage**

### **Controller Features**
- All normal timer controls
- Message management
- Settings configuration
- Blackout/flash controls
- "Multi-Device" button removed (not needed!)

### **Display Features**
- TimerPreview-style display
- Real-time updates
- Double-click to go to controller (for setup)
- Automatic fullscreen support

## 🔧 **Troubleshooting**

### **"Firebase: disconnected"**
1. Check your `.env` file has correct Firebase config
2. Ensure Anonymous Authentication is enabled
3. Verify Firestore database is created
4. Update security rules (see firestore.rules)

### **"Waiting for data" on display**
1. Make sure controller is open and connected
2. Controller should show "Syncing" status
3. Check browser console for errors

### **Changes not syncing**
1. Both devices should show "connected" status
2. Check Firebase console for data updates
3. Verify Firestore security rules allow read/write

## 🎉 **Benefits of This Approach**

- ✅ **Super simple**: No session codes or pairing
- ✅ **Just works**: Open two browser tabs/windows
- ✅ **Real-time**: Instant synchronization
- ✅ **Reliable**: Firebase handles all the complexity
- ✅ **Free**: Uses minimal Firebase resources
- ✅ **Perfect for your setup**: One laptop + one TV

## 🚀 **Ready to Use!**

Your simplified Firebase sync is now ready! Just:

1. **Controller**: Open `/control` on your laptop
2. **Display**: Open `/` on your TV browser
3. **Enjoy**: Real-time timer sync with zero setup!

No more session codes, no more complexity - just pure, simple sync between your laptop and TV! 🎯
