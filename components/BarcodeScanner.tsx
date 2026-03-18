'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

const cameraAvailable =
  typeof navigator !== 'undefined' &&
  typeof navigator.mediaDevices?.getUserMedia === 'function' &&
  window.isSecureContext;

export default function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (!cameraAvailable || !videoRef.current) return;
    const reader = new BrowserMultiFormatReader();
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        reader
          .decodeOnceFromStream(stream, videoRef.current!)
          .then((result) => { if (!cancelled) onDetected(result.getText()); })
          .catch(() => { if (!cancelled) setError('No barcode detected. Try again.'); });
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Camera access denied.');
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <p className="text-sm font-medium text-zinc-200">
          {cameraAvailable ? 'Point camera at barcode' : 'Enter barcode'}
        </p>
        <button className="rounded-lg bg-zinc-800 px-3 py-1 text-xs" onClick={onClose}>
          Cancel
        </button>
      </div>

      {!cameraAvailable || error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!cameraAvailable && (
            <p className="text-center text-xs text-zinc-400">
              Camera requires HTTPS. Enter the barcode number manually.
            </p>
          )}
          <input
            className="w-full max-w-xs text-center"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 0123456789012"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            autoFocus
          />
          <button
            className="w-full max-w-xs bg-indigo-600 font-semibold"
            disabled={manualCode.trim().length < 8}
            onClick={() => onDetected(manualCode.trim())}
          >
            Look up
          </button>
        </div>
      ) : (
        <div className="relative flex-1">
          <video ref={videoRef} className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-40 w-64 rounded-lg border-2 border-indigo-400 opacity-80" />
          </div>
        </div>
      )}
    </div>
  );
}
