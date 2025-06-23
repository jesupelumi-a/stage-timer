import { useState, useEffect } from 'react';
import { firebaseService } from '../services/firebase';

export function FirebaseTest() {
  const [status, setStatus] = useState('Testing...');
  const [details, setDetails] = useState<string[]>([]);

  useEffect(() => {
    const testFirebase = async () => {
      const logs: string[] = [];
      
      try {
        // Test 1: Check configuration
        logs.push('✅ Firebase service imported successfully');
        
        // Test 2: Check connection status
        const initialStatus = firebaseService.status;
        logs.push(`📊 Initial status: ${initialStatus}`);
        
        // Test 3: Try authentication
        logs.push('🔐 Attempting authentication...');
        const user = await firebaseService.authenticate();
        logs.push(`✅ Authentication successful: ${user.uid}`);
        
        // Test 4: Try creating a test session
        logs.push('🚀 Testing session creation...');
        const sessionId = await firebaseService.createSession({
          controllerDeviceId: 'test-device',
          isActive: true,
          timers: { timers: [], activeTimerId: null },
          currentMessage: null,
          messageQueue: [],
          settings: {
            display: { theme: 'dark', fontSize: 'medium', showSeconds: true, timeFormat: '24h', showDate: false },
            timer: { defaultType: 'countdown', visualAlerts: true, flashOnExpiry: true, showMilliseconds: false }
          },
          blackoutMode: false,
          flashMode: false,
        });
        logs.push(`✅ Session created: ${sessionId}`);
        
        // Test 5: Clean up
        await firebaseService.deleteSession();
        logs.push('🧹 Test session cleaned up');
        
        setStatus('✅ All tests passed!');
        
      } catch (error) {
        logs.push(`❌ Error: ${error}`);
        setStatus('❌ Tests failed');
      }
      
      setDetails(logs);
    };

    testFirebase();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Firebase Connection Test</h3>
      <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{status}</div>
      <div className="max-h-40 overflow-y-auto text-xs text-gray-600 dark:text-gray-400">
        {details.map((detail, index) => (
          <div key={index} className="mb-1">{detail}</div>
        ))}
      </div>
    </div>
  );
}
