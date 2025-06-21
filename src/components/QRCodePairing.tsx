import React, { useState, useEffect, useRef } from "react";
import type { PairingInfo } from "../types/sync";

interface QRCodePairingProps {
  onGeneratePairingInfo: () => Promise<PairingInfo>;
  onConnectWithPairingInfo: (info: PairingInfo) => Promise<void>;
  className?: string;
}

export function QRCodePairing({
  onGeneratePairingInfo,
  onConnectWithPairingInfo,
  className = "",
}: QRCodePairingProps) {
  const [mode, setMode] = useState<"generate" | "scan" | "manual">("generate");
  const [pairingInfo, setPairingInfo] = useState<PairingInfo | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Update countdown timer
  useEffect(() => {
    if (pairingInfo && pairingInfo.expires > Date.now()) {
      const updateTimer = () => {
        const remaining = Math.max(0, pairingInfo.expires - Date.now());
        setTimeLeft(remaining);
        
        if (remaining === 0) {
          setPairingInfo(null);
          setQrCodeDataUrl("");
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        }
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [pairingInfo]);

  // Generate QR code (simplified - in real app would use a QR library)
  const generateQRCode = (data: string): string => {
    // This is a placeholder. In a real implementation, you'd use a library like 'qrcode'
    // For now, we'll create a simple visual representation
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    canvas.width = 200;
    canvas.height = 200;

    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 200);

    // Create a simple pattern (not a real QR code)
    ctx.fillStyle = '#000000';
    const blockSize = 10;
    const hash = data.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    for (let x = 0; x < 20; x++) {
      for (let y = 0; y < 20; y++) {
        if ((hash + x * y) % 3 === 0) {
          ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
        }
      }
    }

    // Add corner markers
    ctx.fillRect(0, 0, 30, 30);
    ctx.fillRect(170, 0, 30, 30);
    ctx.fillRect(0, 170, 30, 30);

    return canvas.toDataURL();
  };

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    setError("");

    try {
      const info = await onGeneratePairingInfo();
      setPairingInfo(info);
      
      // Create QR code data
      const qrData = JSON.stringify(info);
      const qrCodeUrl = generateQRCode(qrData);
      setQrCodeDataUrl(qrCodeUrl);
    } catch (err) {
      setError(`Failed to generate pairing code: ${err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConnectWithCode = async () => {
    if (!manualCode.trim()) return;

    setIsConnecting(true);
    setError("");

    try {
      // Try to parse as JSON (QR code data)
      let pairingData: PairingInfo;
      
      try {
        pairingData = JSON.parse(manualCode);
      } catch {
        // If not JSON, treat as simple pairing code
        // This would need to be resolved to actual pairing info
        throw new Error("Invalid pairing code format");
      }

      await onConnectWithPairingInfo(pairingData);
      setManualCode("");
    } catch (err) {
      setError(`Failed to connect: ${err}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const formatTimeLeft = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast notification here
      console.log("Copied to clipboard");
    });
  };

  return (
    <div className={`qr-code-pairing bg-neutral-800 border border-neutral-600 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Device Pairing</h3>
        <div className="flex bg-neutral-700 rounded p-1">
          <button
            onClick={() => setMode("generate")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              mode === "generate" 
                ? "bg-neutral-600 text-white" 
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Generate
          </button>
          <button
            onClick={() => setMode("scan")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              mode === "scan" 
                ? "bg-neutral-600 text-white" 
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Scan
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              mode === "manual" 
                ? "bg-neutral-600 text-white" 
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Manual
          </button>
        </div>
      </div>

      {/* Generate Mode */}
      {mode === "generate" && (
        <div className="space-y-4">
          <div className="text-sm text-neutral-300">
            Generate a QR code for other devices to scan and connect.
          </div>

          {!pairingInfo ? (
            <button
              onClick={handleGenerateCode}
              disabled={isGenerating}
              className="btn-ctrl h-10 px-6 text-sm bg-blue-800 border-blue-600 hover:border-blue-400 text-white w-full"
            >
              {isGenerating ? "Generating..." : "Generate QR Code"}
            </button>
          ) : (
            <div className="space-y-4">
              {/* QR Code Display */}
              <div className="flex flex-col items-center p-4 bg-white rounded">
                {qrCodeDataUrl && (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code" 
                    className="w-48 h-48"
                  />
                )}
                <div className="mt-2 text-xs text-gray-600 text-center">
                  Scan with another device
                </div>
              </div>

              {/* Pairing Info */}
              <div className="bg-neutral-700/50 rounded p-3">
                <div className="text-xs text-neutral-400 mb-2">Pairing Information:</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Device:</span>
                    <span className="text-white">{pairingInfo.deviceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Method:</span>
                    <span className="text-white">{pairingInfo.connectionMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expires:</span>
                    <span className="text-yellow-400">{formatTimeLeft(timeLeft)}</span>
                  </div>
                </div>
              </div>

              {/* Manual Code */}
              <div className="bg-neutral-700/50 rounded p-3">
                <div className="text-xs text-neutral-400 mb-1">Manual Code:</div>
                <div className="flex gap-2">
                  <code className="flex-1 text-xs bg-neutral-600 p-2 rounded text-white font-mono break-all">
                    {JSON.stringify(pairingInfo)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(pairingInfo))}
                    className="btn-ctrl h-8 w-8 p-0 text-xs"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setPairingInfo(null);
                  setQrCodeDataUrl("");
                }}
                className="btn-ctrl h-8 px-4 text-sm w-full"
              >
                Generate New Code
              </button>
            </div>
          )}
        </div>
      )}

      {/* Scan Mode */}
      {mode === "scan" && (
        <div className="space-y-4">
          <div className="text-sm text-neutral-300">
            Scan a QR code from another device to connect.
          </div>
          
          <div className="bg-neutral-700/50 rounded p-8 text-center">
            <div className="text-4xl mb-2">📷</div>
            <div className="text-sm text-neutral-400">
              QR Code Scanner
            </div>
            <div className="text-xs text-neutral-500 mt-2">
              Camera access would be implemented here
            </div>
          </div>

          <div className="text-xs text-neutral-500 text-center">
            Point your camera at a QR code generated by another Stage Timer device
          </div>
        </div>
      )}

      {/* Manual Mode */}
      {mode === "manual" && (
        <div className="space-y-4">
          <div className="text-sm text-neutral-300">
            Enter a pairing code manually to connect to another device.
          </div>

          <div className="space-y-3">
            <textarea
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Paste pairing code here..."
              className="input-ctrl w-full h-24 p-3 text-sm resize-none"
            />

            <button
              onClick={handleConnectWithCode}
              disabled={!manualCode.trim() || isConnecting}
              className="btn-ctrl h-10 px-6 text-sm bg-green-800 border-green-600 hover:border-green-400 text-white w-full disabled:opacity-50"
            >
              {isConnecting ? "Connecting..." : "Connect"}
            </button>
          </div>

          <div className="text-xs text-neutral-500">
            Paste the complete pairing code from another device, including the JSON data.
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-600/30 rounded text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 text-xs text-neutral-500 bg-neutral-700/30 p-3 rounded">
        <strong>How it works:</strong> Generate a QR code on one device and scan it with another, 
        or copy/paste the manual code. Codes expire after 5 minutes for security.
      </div>
    </div>
  );
}
