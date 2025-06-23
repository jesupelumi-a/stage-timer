import { useState, useEffect } from 'react';
import { useSocket } from '../hooks/use-socket';
import socketClient from '../lib/socket-client';
import { cn } from '../lib/utils';
import type { Message } from '@stage-timer/db';

interface MessagePanelProps {
  roomId: number;
  timerId?: number;
  className?: string;
  isController?: boolean;
  messages?: Message[];
}

interface DisplayMessage extends Omit<Message, 'id' | 'timerId' | 'createdAt' | 'updatedAt'> {
  id?: number;
  isVisible: boolean;
  duration?: number; // Auto-hide duration in ms
}

export function MessagePanel({ 
  roomId,
  timerId,
  className = '',
  isController = false,
  messages = []
}: MessagePanelProps) {
  const [currentMessage, setCurrentMessage] = useState<DisplayMessage | null>(null);
  // const [messageQueue, setMessageQueue] = useState<DisplayMessage[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  
  const socket = useSocket();
  
  // Handle incoming message events
  useEffect(() => {
    const handleMessageShown = (data: any) => {
      if (data.roomId === roomId) {
        setCurrentMessage({
          ...data.message,
          isVisible: true,
        });
        setIsVisible(true);
      }
    };
    
    const handleMessageHidden = (data: any) => {
      if (data.roomId === roomId) {
        setCurrentMessage(null);
        setIsVisible(false);
      }
    };
    
    const handleMessageUpdated = (data: any) => {
      if (data.roomId === roomId && currentMessage) {
        setCurrentMessage({
          ...data.message,
          isVisible: true,
        });
      }
    };
    
    socketClient.on('message-shown', handleMessageShown);
    socketClient.on('message-hidden', handleMessageHidden);
    socketClient.on('message-updated', handleMessageUpdated);

    return () => {
      socketClient.off('message-shown', handleMessageShown);
      socketClient.off('message-hidden', handleMessageHidden);
      socketClient.off('message-updated', handleMessageUpdated);
    };
  }, [socket, roomId, currentMessage]);
  
  // Auto-hide message after duration
  useEffect(() => {
    if (currentMessage?.duration && currentMessage.isVisible) {
      const timer = setTimeout(() => {
        hideMessage();
      }, currentMessage.duration);
      
      return () => clearTimeout(timer);
    }
  }, [currentMessage]);
  
  // Show message
  const showMessage = (message: DisplayMessage) => {
    if (!socket.isConnected || !timerId) return;
    
    socket.showMessage({
      roomId,
      timerId,
      message: {
        id: message.id || 0,
        timerId,
        text: message.text,
        color: message.color,
        bold: message.bold,
        uppercase: message.uppercase,
        index: message.index,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      action: 'show',
      timestamp: Date.now(),
    });
  };
  
  // Hide current message
  const hideMessage = () => {
    if (!socket.isConnected || !timerId || !currentMessage) return;
    
    socket.hideMessage({
      roomId,
      timerId,
      message: {
        id: currentMessage.id || 0,
        timerId,
        text: currentMessage.text,
        color: currentMessage.color,
        bold: currentMessage.bold,
        uppercase: currentMessage.uppercase,
        index: currentMessage.index,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      action: 'hide',
      timestamp: Date.now(),
    });
  };
  
  // Quick message presets
  const quickMessages: DisplayMessage[] = [
    {
      text: 'Welcome!',
      color: '#ffffff',
      bold: true,
      uppercase: false,
      index: 0,
      isVisible: false,
    },
    {
      text: 'Please take your seats',
      color: '#fbbf24',
      bold: false,
      uppercase: false,
      index: 1,
      isVisible: false,
    },
    {
      text: 'Starting soon...',
      color: '#34d399',
      bold: true,
      uppercase: true,
      index: 2,
      isVisible: false,
    },
    {
      text: 'Thank you!',
      color: '#60a5fa',
      bold: true,
      uppercase: false,
      index: 3,
      isVisible: false,
    },
  ];
  
  // Message display component
  const MessageDisplay = () => {
    if (!isVisible || !currentMessage) return null;
    
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div 
          className={cn(
            'px-8 py-4 rounded-lg shadow-2xl max-w-4xl mx-4 text-center transition-all duration-300',
            'bg-black/80 backdrop-blur-sm border border-white/20'
          )}
          style={{ color: currentMessage.color }}
        >
          <p 
            className={cn(
              'text-2xl md:text-4xl lg:text-6xl',
              currentMessage.bold && 'font-bold',
              currentMessage.uppercase && 'uppercase'
            )}
          >
            {currentMessage.text}
          </p>
        </div>
      </div>
    );
  };
  
  // Controller interface
  if (isController) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Messages</h3>
          {currentMessage && (
            <button
              onClick={hideMessage}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
            >
              Hide Message
            </button>
          )}
        </div>
        
        {/* Current Message Display */}
        {currentMessage && (
          <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-neutral-400">Currently Showing:</span>
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: currentMessage.color }}
              />
            </div>
            <p 
              className={cn(
                'text-lg',
                currentMessage.bold && 'font-bold',
                currentMessage.uppercase && 'uppercase'
              )}
              style={{ color: currentMessage.color }}
            >
              {currentMessage.text}
            </p>
          </div>
        )}
        
        {/* Quick Messages */}
        <div>
          <h4 className="text-sm font-medium text-neutral-300 mb-2">Quick Messages</h4>
          <div className="grid grid-cols-2 gap-2">
            {quickMessages.map((message, index) => (
              <button
                key={index}
                onClick={() => showMessage(message)}
                className="p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-left transition-colors"
                disabled={!socket.isConnected}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: message.color }}
                  />
                  <span className="text-xs text-neutral-400">
                    {message.bold && 'Bold'} {message.uppercase && 'UPPER'}
                  </span>
                </div>
                <p className="text-sm text-white truncate">{message.text}</p>
              </button>
            ))}
          </div>
        </div>
        
        {/* Saved Messages */}
        {messages.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-neutral-300 mb-2">Saved Messages</h4>
            <div className="space-y-2">
              {messages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => showMessage({
                    ...message,
                    isVisible: false,
                  })}
                  className="w-full p-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-left transition-colors"
                  disabled={!socket.isConnected}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: message.color }}
                    />
                    <span className="text-xs text-neutral-400">
                      {message.bold && 'Bold'} {message.uppercase && 'UPPER'}
                    </span>
                  </div>
                  <p className="text-sm text-white">{message.text}</p>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Connection Status */}
        {!socket.isConnected && (
          <div className="p-3 bg-yellow-900/20 border border-yellow-500 rounded-lg">
            <p className="text-yellow-400 text-sm">
              Not connected to server. Messages cannot be sent.
            </p>
          </div>
        )}
      </div>
    );
  }
  
  // Display interface (just shows messages)
  return (
    <div className={className}>
      <MessageDisplay />
    </div>
  );
}
