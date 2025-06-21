import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  DocumentReference,
  type Unsubscribe,
} from 'firebase/firestore';
import { signInAnonymously, type User } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import type { TimerCollection, Message, AppSettings } from '../types';

// Global timer state structure for Firestore
export interface GlobalTimerState {
  lastUpdated: Timestamp;
  controllerDeviceId: string;
  timers: TimerCollection;
  currentMessage: Message | null;
  messageQueue: Message[];
  settings: AppSettings;
  blackoutMode: boolean;
  flashMode: boolean;
}

// Session data structure for Firestore (keeping for backward compatibility)
export interface SessionData {
  id: string;
  createdAt: Timestamp;
  lastUpdated: Timestamp;
  controllerDeviceId: string;
  isActive: boolean;
  timers: TimerCollection;
  currentMessage: Message | null;
  messageQueue: Message[];
  settings: AppSettings;
  blackoutMode: boolean;
  flashMode: boolean;
}

// Connection status
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export class FirebaseService {
  private user: User | null = null;
  private sessionId: string | null = null;
  private unsubscribeSession: Unsubscribe | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private statusCallbacks: ((status: ConnectionStatus) => void)[] = [];
  private dataCallbacks: ((data: Partial<SessionData>) => void)[] = [];

  constructor() {
    // Listen for auth state changes
    auth.onAuthStateChanged((user) => {
      this.user = user;
      if (user) {
        this.setConnectionStatus('connected');
      } else {
        this.setConnectionStatus('disconnected');
      }
    });
  }

  // Authentication
  async authenticate(): Promise<User> {
    if (this.user) return this.user;

    this.setConnectionStatus('connecting');
    try {
      console.log('🔐 Attempting Firebase authentication...');
      const result = await signInAnonymously(auth);
      this.user = result.user;
      console.log('✅ Firebase authentication successful:', this.user.uid);
      this.setConnectionStatus('connected');
      return this.user;
    } catch (error) {
      console.error('❌ Firebase authentication failed:', error);
      this.setConnectionStatus('error');
      throw new Error(`Authentication failed: ${error}`);
    }
  }

  // Session management
  async createSession(
    initialData: Omit<SessionData, 'id' | 'createdAt' | 'lastUpdated'>
  ): Promise<string> {
    await this.authenticate();

    const sessionId = this.generateSessionId();
    const sessionRef = doc(db, 'sessions', sessionId);

    console.log('🚀 Creating Firebase session:', sessionId);

    const sessionData: SessionData = {
      ...initialData,
      id: sessionId,
      createdAt: serverTimestamp() as Timestamp,
      lastUpdated: serverTimestamp() as Timestamp,
    };

    try {
      await setDoc(sessionRef, sessionData);
      this.sessionId = sessionId;
      console.log('✅ Session created successfully:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('❌ Failed to create session:', error);
      throw error;
    }
  }

  async joinSession(sessionId: string): Promise<SessionData | null> {
    await this.authenticate();

    const sessionRef = doc(db, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      throw new Error('Session not found');
    }

    this.sessionId = sessionId;
    return sessionSnap.data() as SessionData;
  }

  // Real-time subscription
  subscribeToSession(
    sessionId: string,
    callback: (data: SessionData | null) => void
  ): Unsubscribe {
    const sessionRef = doc(db, 'sessions', sessionId);

    return onSnapshot(
      sessionRef,
      (doc) => {
        if (doc.exists()) {
          callback(doc.data() as SessionData);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Session subscription error:', error);
        this.setConnectionStatus('error');
      }
    );
  }

  // Update session data
  async updateSession(
    updates: Partial<Omit<SessionData, 'id' | 'createdAt'>>
  ): Promise<void> {
    if (!this.sessionId) throw new Error('No active session');

    const sessionRef = doc(db, 'sessions', this.sessionId);
    await updateDoc(sessionRef, {
      ...updates,
      lastUpdated: serverTimestamp(),
    });
  }

  // Specific update methods
  async updateTimers(timers: TimerCollection): Promise<void> {
    return this.updateSession({ timers });
  }

  async updateCurrentMessage(currentMessage: Message | null): Promise<void> {
    return this.updateSession({ currentMessage });
  }

  async updateMessageQueue(messageQueue: Message[]): Promise<void> {
    return this.updateSession({ messageQueue });
  }

  async updateSettings(settings: AppSettings): Promise<void> {
    return this.updateSession({ settings });
  }

  async updateBlackoutMode(blackoutMode: boolean): Promise<void> {
    return this.updateSession({ blackoutMode });
  }

  async updateFlashMode(flashMode: boolean): Promise<void> {
    return this.updateSession({ flashMode });
  }

  // Session cleanup
  async endSession(): Promise<void> {
    if (!this.sessionId) return;

    const sessionRef = doc(db, 'sessions', this.sessionId);
    await updateDoc(sessionRef, {
      isActive: false,
      lastUpdated: serverTimestamp(),
    });

    if (this.unsubscribeSession) {
      this.unsubscribeSession();
      this.unsubscribeSession = null;
    }

    this.sessionId = null;
  }

  async deleteSession(): Promise<void> {
    if (!this.sessionId) return;

    const sessionRef = doc(db, 'sessions', this.sessionId);
    await deleteDoc(sessionRef);

    if (this.unsubscribeSession) {
      this.unsubscribeSession();
      this.unsubscribeSession = null;
    }

    this.sessionId = null;
  }

  // Global sync methods (simpler approach)
  async syncGlobalState(
    data: Omit<GlobalTimerState, 'lastUpdated'>
  ): Promise<void> {
    await this.authenticate();

    const globalRef = doc(db, 'global', 'timer-state');
    const globalData: GlobalTimerState = {
      ...data,
      lastUpdated: serverTimestamp() as Timestamp,
    };

    try {
      await setDoc(globalRef, globalData);
      console.log('✅ Global state synced successfully');
    } catch (error) {
      console.error('❌ Failed to sync global state:', error);
      throw error;
    }
  }

  subscribeToGlobalState(
    callback: (data: GlobalTimerState | null) => void
  ): Unsubscribe {
    const globalRef = doc(db, 'global', 'timer-state');

    return onSnapshot(
      globalRef,
      (doc) => {
        if (doc.exists()) {
          callback(doc.data() as GlobalTimerState);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Global state subscription error:', error);
        this.setConnectionStatus('error');
      }
    );
  }

  // Utility methods
  private generateSessionId(): string {
    // Generate a 6-character session code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.statusCallbacks.forEach((callback) => callback(status));
  }

  // Event listeners
  onConnectionStatusChange(
    callback: (status: ConnectionStatus) => void
  ): () => void {
    this.statusCallbacks.push(callback);
    // Return unsubscribe function
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  onDataChange(callback: (data: Partial<SessionData>) => void): () => void {
    this.dataCallbacks.push(callback);
    return () => {
      const index = this.dataCallbacks.indexOf(callback);
      if (index > -1) {
        this.dataCallbacks.splice(index, 1);
      }
    };
  }

  // Getters
  get currentSessionId(): string | null {
    return this.sessionId;
  }

  get isAuthenticated(): boolean {
    return !!this.user;
  }

  get status(): ConnectionStatus {
    return this.connectionStatus;
  }
}

// Export singleton instance
export const firebaseService = new FirebaseService();
