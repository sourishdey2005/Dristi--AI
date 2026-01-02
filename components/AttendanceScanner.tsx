
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Student, AttendanceRecord } from '../types';
import { recognizeStudent } from '../services/geminiService';
import { recordAttendance } from '../db';

interface AttendanceScannerProps {
  students: Student[];
  onAttendanceMarked: () => void;
}

const AttendanceScanner: React.FC<AttendanceScannerProps> = ({ students, onAttendanceMarked }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'scanning' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: 'Ready to scan'
  });
  const [lastMarkedId, setLastMarkedId] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

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

  const handleScan = async () => {
    if (isScanning || students.length === 0) return;
    setIsScanning(true);
    setStatus({ type: 'scanning', message: 'AI is analyzing face...' });

    const frame = captureFrame();
    if (!frame) {
      setIsScanning(false);
      setStatus({ type: 'error', message: 'Failed to capture frame' });
      return;
    }

    const studentId = await recognizeStudent(frame, students);
    
    if (studentId) {
      const student = students.find(s => s.id === studentId);
      if (student) {
        if (lastMarkedId === studentId) {
           setStatus({ type: 'success', message: `Attendance already recorded for ${student.name}` });
        } else {
          const record: AttendanceRecord = {
            id: crypto.randomUUID(),
            studentId: student.id,
            studentName: student.name,
            rollNumber: student.rollNumber,
            timestamp: Date.now(),
            status: 'Present'
          };
          await recordAttendance(record);
          setLastMarkedId(studentId);
          setStatus({ type: 'success', message: `Welcome, ${student.name}! Attendance marked.` });
          onAttendanceMarked();
        }
      }
    } else {
      setStatus({ type: 'error', message: 'Face not recognized. Please try again.' });
    }
    
    setIsScanning(false);
    setTimeout(() => {
        if (status.type !== 'scanning') {
             setStatus({ type: 'idle', message: 'Ready for next scan' });
        }
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative w-full max-w-2xl aspect-video rounded-3xl overflow-hidden glass shadow-2xl">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Scanning Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            <div className="w-64 h-64 border-2 border-blue-500/50 rounded-full border-dashed animate-[spin_10s_linear_infinite]" />
            <div className="absolute w-48 h-48 border-t-4 border-l-4 border-blue-400 rounded-tl-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute w-48 h-48 border-b-4 border-r-4 border-blue-400 rounded-br-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Status Toast */}
        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full flex items-center space-x-3 transition-all duration-300 ${
          status.type === 'success' ? 'bg-emerald-500/90 text-white' : 
          status.type === 'error' ? 'bg-red-500/90 text-white' : 
          'bg-white/10 text-white backdrop-blur-xl'
        }`}>
          {status.type === 'scanning' && <Loader2 className="w-5 h-5 animate-spin" />}
          {status.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {status.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {status.type === 'idle' && <Camera className="w-5 h-5 text-blue-400" />}
          <span className="font-medium">{status.message}</span>
        </div>
      </div>

      <button
        onClick={handleScan}
        disabled={isScanning || students.length === 0}
        className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-bold shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
      >
        {isScanning ? <RefreshCw className="animate-spin" /> : <Camera />}
        <span>{isScanning ? 'Processing...' : 'Mark Attendance'}</span>
      </button>

      {students.length === 0 && (
        <p className="text-orange-400 bg-orange-400/10 px-4 py-2 rounded-lg text-sm">
          No students registered. Please add students first.
        </p>
      )}
    </div>
  );
};

export default AttendanceScanner;
