import { useState, useCallback } from 'react';
import { cn } from '../lib/utils';
import { MdContentCopy, MdCheck, MdClose } from 'react-icons/md';

interface SessionManagerProps {
  mode: 'create' | 'join';
  sessionId?: string;
  isConnected: boolean;
  connectionStatus: string;
  onCreateSession: () => Promise<string>;
  onJoinSession: (sessionId: string) => Promise<void>;
  onClose: () => void;
  className?: string;
}

export function SessionManager({
  mode,
  sessionId,
  isConnected,
  connectionStatus,
  onCreateSession,
  onJoinSession,
  onClose,
  className = '',
}: SessionManagerProps) {
  const [inputSessionId, setInputSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await onCreateSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setIsLoading(false);
    }
  }, [onCreateSession]);

  const handleJoinSession = useCallback(async () => {
    if (!inputSessionId.trim()) {
      setError('Please enter a session ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await onJoinSession(inputSessionId.trim().toUpperCase());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join session');
    } finally {
      setIsLoading(false);
    }
  }, [inputSessionId, onJoinSession]);

  const handleCopySessionId = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy session ID:', err);
    }
  }, [sessionId]);

  const formatSessionId = (id: string) => {
    // Format as XXX-XXX for better readability
    return id.length === 6 ? `${id.slice(0, 3)}-${id.slice(3)}` : id;
  };

  return (
    <div className={cn('session-manager', className)}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Create Session' : 'Join Session'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <MdClose size={20} />
            </button>
          </div>

          {/* Connection Status */}
          <div className="mb-4 flex items-center gap-2">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                isConnected ? 'bg-green-500' : 'bg-red-500'
              )}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {connectionStatus}
            </span>
          </div>

          {/* Content */}
          {mode === 'create' ? (
            <div className="space-y-4">
              {!sessionId ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create a new session to allow display devices to connect and sync with this controller.
                  </p>
                  <button
                    onClick={handleCreateSession}
                    disabled={isLoading || !isConnected}
                    className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Creating...' : 'Create Session'}
                  </button>
                </>
              ) : (
                <>
                  <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Session created successfully! Share this code with display devices:
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="flex-1 rounded bg-green-100 px-3 py-2 text-lg font-mono font-bold text-green-900 dark:bg-green-800 dark:text-green-100">
                        {formatSessionId(sessionId)}
                      </code>
                      <button
                        onClick={handleCopySessionId}
                        className="rounded p-2 text-green-700 hover:bg-green-200 dark:text-green-300 dark:hover:bg-green-800"
                        title="Copy session ID"
                      >
                        {copied ? <MdCheck size={20} /> : <MdContentCopy size={20} />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Display devices can now connect using this session ID. The session will remain active until you end it.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter the session ID provided by the controller device to connect and sync.
              </p>
              <div className="space-y-2">
                <label htmlFor="sessionId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Session ID
                </label>
                <input
                  id="sessionId"
                  type="text"
                  value={inputSessionId}
                  onChange={(e) => setInputSessionId(e.target.value.toUpperCase())}
                  placeholder="XXX-XXX"
                  maxLength={7}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-center text-lg uppercase tracking-wider focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                onClick={handleJoinSession}
                disabled={isLoading || !isConnected || !inputSessionId.trim()}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Joining...' : 'Join Session'}
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-3 dark:bg-red-900/20">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
