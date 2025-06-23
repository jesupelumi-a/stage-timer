import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { signInAnonymously, type User } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import type { TimerCollection, Message, AppSettings } from '../types';

// Simple shared data structure - no sessions needed!
export interface SharedTimerData {
  timers: TimerCollection;
  currentMessage: Message | null;
  messageQueue: Message[];
  settings: AppSettings;
  blackoutMode: boolean;
  flashMode: boolean;
  lastUpdated: Timestamp;
  controllerActive: boolean;
}

// Connection status
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export class SimpleFirebaseService {
  private user: User | null = null;
  private unsubscribeData: Unsubscribe | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private statusCallbacks: ((status: ConnectionStatus) => void)[] = [];
  private dataCallbacks: ((data: SharedTimerData) => void)[] = [];

  // Use a fixed document ID - simple!
  private readonly SHARED_DOC_ID = 'shared-timer-data';

  constructor() {
    // Listen for auth state changes
    auth.onAuthStateChanged((user) => {
      this.user = user;
      if (user) {
        this.setConnectionStatus('connected');
        this.startListening();
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
      console.log('🔐 Authenticating with Firebase...');
      const result = await signInAnonymously(auth);
      this.user = result.user;
      console.log('✅ Firebase authentication successful');
      this.setConnectionStatus('connected');
      return this.user;
    } catch (error) {
      console.error('❌ Firebase authentication failed:', error);
      this.setConnectionStatus('error');
      throw new Error(`Authentication failed: ${error}`);
    }
  }

  // Fetch existing data from Firebase (if any)
  async fetchExistingData(): Promise<SharedTimerData | null> {
    await this.authenticate();

    const docRef = doc(db, 'timer-data', this.SHARED_DOC_ID);

    try {
      console.log('🔍 Fetching existing data from Firebase...');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as SharedTimerData;
        console.log('✅ Found existing data in Firebase');
        return data;
      } else {
        console.log('📭 No existing data found in Firebase');
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to fetch existing data:', error);
      throw error;
    }
  }

  // Initialize or update the shared data (controller only)
  async initializeData(
    data: Omit<SharedTimerData, 'lastUpdated' | 'controllerActive'>
  ): Promise<void> {
    await this.authenticate();

    const docRef = doc(db, 'timer-data', this.SHARED_DOC_ID);

    try {
      console.log('🚀 Initializing shared timer data...');

      // Clean the data to remove undefined values
      const cleanedData = this.cleanData(data);

      await setDoc(docRef, {
        ...cleanedData,
        lastUpdated: serverTimestamp(),
        controllerActive: true,
      });
      console.log('✅ Shared data initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize data:', error);
      console.error('❌ Data that failed:', data);
      throw error;
    }
  }

  // Update specific fields
  async updateTimers(timers: TimerCollection): Promise<void> {
    return this.updateData({ timers });
  }

  async updateCurrentMessage(currentMessage: Message | null): Promise<void> {
    return this.updateData({ currentMessage });
  }

  async updateMessageQueue(messageQueue: Message[]): Promise<void> {
    return this.updateData({ messageQueue });
  }

  async updateSettings(settings: AppSettings): Promise<void> {
    return this.updateData({ settings });
  }

  async updateBlackoutMode(blackoutMode: boolean): Promise<void> {
    return this.updateData({ blackoutMode });
  }

  async updateFlashMode(flashMode: boolean): Promise<void> {
    return this.updateData({ flashMode });
  }

  // Helper function to clean data (remove undefined values)
  private cleanData(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.cleanData(item));
    }

    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.cleanData(value);
        }
      }
      return cleaned;
    }

    return obj;
  }

  // Generic update method
  private async updateData(
    updates: Partial<Omit<SharedTimerData, 'lastUpdated' | 'controllerActive'>>
  ): Promise<void> {
    if (!this.user) {
      await this.authenticate();
    }

    const docRef = doc(db, 'timer-data', this.SHARED_DOC_ID);

    try {
      // Clean the data to remove undefined values
      const cleanedUpdates = this.cleanData(updates);

      await updateDoc(docRef, {
        ...cleanedUpdates,
        lastUpdated: serverTimestamp(),
        controllerActive: true,
      });
    } catch (error) {
      console.error('❌ Failed to update data:', error);
      console.error('❌ Data that failed:', updates);
      throw error;
    }
  }

  // Start listening for changes (both controller and display)
  private startListening(): void {
    if (this.unsubscribeData) {
      this.unsubscribeData();
    }

    const docRef = doc(db, 'timer-data', this.SHARED_DOC_ID);

    this.unsubscribeData = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as SharedTimerData;
          this.dataCallbacks.forEach((callback) => callback(data));
        }
      },
      (error) => {
        console.error('❌ Data subscription error:', error);
        this.setConnectionStatus('error');
      }
    );
  }

  // Subscribe to data changes
  onDataChange(callback: (data: SharedTimerData) => void): () => void {
    this.dataCallbacks.push(callback);
    return () => {
      const index = this.dataCallbacks.indexOf(callback);
      if (index > -1) {
        this.dataCallbacks.splice(index, 1);
      }
    };
  }

  // Subscribe to connection status changes
  onConnectionStatusChange(
    callback: (status: ConnectionStatus) => void
  ): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  private setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.statusCallbacks.forEach((callback) => callback(status));
  }

  // Cleanup
  disconnect(): void {
    if (this.unsubscribeData) {
      this.unsubscribeData();
      this.unsubscribeData = null;
    }
  }

  // Getters
  get isAuthenticated(): boolean {
    return !!this.user;
  }

  get status(): ConnectionStatus {
    return this.connectionStatus;
  }
}

// Export singleton instance
export const simpleFirebaseService = new SimpleFirebaseService();
