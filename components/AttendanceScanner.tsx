
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle, AlertCircle, Loader2, Zap, LogIn, LogOut } from 'lucide-react';
import { Member, AttendanceRecord } from '../types';
import { recognizeMember } from '../services/geminiService';
import { recordAttendance } from '../db';

interface AttendanceScannerProps {
  members: Member[];
  onAttendanceMarked: () => void;
}

const AttendanceScanner: React.FC<AttendanceScannerProps> = ({ members, onAttendanceMarked }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'Present' | 'Out'>('Present');
  const [autoScan, setAutoScan] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'scanning' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: 'Ready to scan'
  });
  const [lastMarkedId, setLastMarkedId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playBeep = (type: 'success' | 'error') => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    const play = (freq: number, duration: number, delay: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + delay);
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + delay + duration);

      oscillator.start(audioContext.currentTime + delay);
      oscillator.stop(audioContext.currentTime + delay + duration);
    };

    if (type === 'success') {
      play(600, 0.1, 0);
    } else {
      play(300, 0.1, 0);
      play(300, 0.1, 0.15);
    }
  };
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Camera access denied' });
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleScan = useCallback(async () => {
    if (isScanning || members.length === 0) return;
    
    setIsScanning(true);
    setStatus({ type: 'scanning', message: 'Drishti AI is detecting...' });

    const frame = captureFrame();
    if (!frame) {
      setIsScanning(false);
      setStatus({ type: 'error', message: 'Failed to capture frame' });
      playBeep('error');
      return;
    }

    try {
      const memberId = await recognizeMember(frame, members);
      
      if (memberId) {
        const member = members.find(m => m.id === memberId);
        if (member) {
          const statusMessage = scanMode === 'Present' ? `Identity Verified: ${member.name}` : `Goodbye: ${member.name}`;
          if (lastMarkedId === `${memberId}-${scanMode}`) {
             setStatus({ type: 'success', message: `Confirmed: ${member.name} is ${scanMode.toLowerCase()}` });
          } else {
            const record: AttendanceRecord = {
              id: crypto.randomUUID(),
              memberId: member.id,
              memberName: member.name,
              referenceId: member.referenceId,
              timestamp: Date.now(),
              status: scanMode
            };
            await recordAttendance(record);
            setLastMarkedId(`${memberId}-${scanMode}`);
            setStatus({ type: 'success', message: statusMessage });
            onAttendanceMarked();
            playBeep('success');
          }
        }
      } else {
        setStatus({ type: 'error', message: 'Face not recognized. Adjust lighting.' });
        playBeep('error');
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'AI Connection Error' });
      playBeep('error');
    } finally {
      setIsScanning(false);
      setTimeout(() => {
        setStatus(prev => (prev.type === 'scanning' ? prev : { type: 'idle', message: autoScan ? 'Monitoring...' : 'Ready to scan' }));
      }, 3000);
    }
  }, [isScanning, members, lastMarkedId, onAttendanceMarked, autoScan, scanMode]);

  useEffect(() => {
    let timer: number;
    if (autoScan && !isScanning && status.type !== 'scanning' && status.type !== 'success') {
      timer = window.setInterval(() => {
        handleScan();
      }, 4000); 
    }
    return () => clearInterval(timer);
  }, [autoScan, isScanning, status.type, handleScan]);

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Mode Toggles */}
      <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 glass shadow-inner w-full max-w-sm">
        <button
          onClick={() => setAutoScan(false)}
          className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${!autoScan ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <Camera className="w-4 h-4" />
          <span className="text-sm font-semibold">Manual</span>
        </button>
        <button
          onClick={() => setAutoScan(true)}
          className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${autoScan ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <Zap className={`w-4 h-4 ${autoScan ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-semibold">Auto-Scan</span>
        </button>
      </div>

      {!autoScan && (
        <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 glass shadow-inner w-full max-w-sm">
          <button
            onClick={() => setScanMode('Present')}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${scanMode === 'Present' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
            <LogIn className="w-4 h-4" />
            <span className="text-sm font-semibold">IN</span>
          </button>
          <button
            onClick={() => setScanMode('Out')}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${scanMode === 'Out' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-semibold">OUT</span>
          </button>
        </div>
      )}

      <div className="relative w-full max-w-2xl aspect-video rounded-3xl overflow-hidden glass shadow-[0_0_50px_rgba(37,99,235,0.15)] group">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            {autoScan && !isScanning && (
              <div className="absolute w-72 h-72 border border-blue-500/20 rounded-full animate-ping duration-[3000ms]" />
            )}
            
            <div className={`w-64 h-64 border-2 border-blue-500/30 rounded-full border-dashed ${isScanning ? 'animate-[spin_4s_linear_infinite]' : 'animate-[spin_12s_linear_infinite]'}`} />
            
            <div className={`absolute w-48 h-48 border-t-4 border-l-4 rounded-tl-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${isScanning ? 'border-blue-400 w-56 h-56' : 'border-blue-400/40'}`} />
            <div className={`absolute w-48 h-48 border-b-4 border-r-4 rounded-br-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${isScanning ? 'border-blue-400 w-56 h-56' : 'border-blue-400/40'}`} />
            
            {isScanning && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_15px_#60a5fa] animate-[bounce_2s_infinite] opacity-50" />
            )}
        </div>

        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl flex items-center space-x-4 shadow-2xl transition-all duration-500 backdrop-blur-2xl border ${
          status.type === 'success' ? (scanMode === 'Present' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100' : 'bg-rose-500/20 border-rose-500/30 text-rose-100') : 
          status.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-100' : 
          'bg-slate-900/60 border-white/10 text-white'
        }`}>
          <div className="p-2 bg-white/10 rounded-lg">
            {status.type === 'scanning' && <Loader2 className="w-5 h-5 animate-spin text-blue-400" />}
            {status.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {status.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
            {status.type === 'idle' && (autoScan ? <Zap className="w-5 h-5 text-indigo-400 animate-pulse" /> : <Camera className="w-5 h-5 text-blue-400" />)}
          </div>
          <div className="flex flex-col">
            <span className="text-xs uppercase font-bold tracking-widest opacity-60">System Status</span>
            <span className="font-semibold text-sm">{status.message}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-4">
        {!autoScan ? (
          <button
            onClick={handleScan}
            disabled={isScanning || members.length === 0}
            className="px-12 py-5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl font-bold shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.4)] hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-4 border border-white/10"
          >
            {isScanning ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
            <span className="text-lg">{isScanning ? 'Authenticating...' : `Mark ${scanMode}` }</span>
          </button>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400 bg-indigo-500/10 px-6 py-3 rounded-full border border-indigo-500/20 animate-pulse">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
              <span className="font-bold text-sm uppercase tracking-tighter">Auto-Monitoring Active</span>
            </div>
            <p className="text-slate-500 text-xs">Step in front of the camera for hands-free verification</p>
          </div>
        )}

        {members.length === 0 && (
          <div className="flex items-center space-x-2 text-orange-400 bg-orange-400/10 px-5 py-3 rounded-xl border border-orange-400/20">
            <AlertCircle className="w-4 h-4" />
            <p className="font-medium text-sm">No members registered yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceScanner;
