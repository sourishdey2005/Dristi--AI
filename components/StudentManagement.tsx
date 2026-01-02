
import React, { useState, useRef } from 'react';
import { Plus, Trash2, Camera, X, UserPlus, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { Student } from '../types';
import { addStudent, deleteStudent } from '../db';

interface StudentManagementProps {
  students: Student[];
  onUpdate: () => void;
}

const StudentManagement: React.FC<StudentManagementProps> = ({ students, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', rollNumber: '', department: '' });
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera error", err);
      setFormError("Camera access denied. Please enable permissions to capture student photo.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const data = canvas.toDataURL('image/jpeg');
      setCapturedPhoto(data);
      setFormError(null); // Clear error when photo is captured
      // Stop camera
      (video.srcObject as MediaStream)?.getTracks().forEach(t => t.stop());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!capturedPhoto) {
      setFormError('Identity verification required: Please capture a student photo before proceeding.');
      return;
    }
    
    const newStudent: Student = {
      id: crypto.randomUUID(),
      ...formData,
      photoBase64: capturedPhoto,
      createdAt: Date.now()
    };

    try {
      await addStudent(newStudent);
      onUpdate();
      closeModal();
    } catch (err) {
      setFormError('Failed to save student record. Please try again.');
    }
  };

  const closeModal = () => {
    setIsAdding(false);
    setCapturedPhoto(null);
    setFormError(null);
    setFormData({ name: '', rollNumber: '', department: '' });
    // Ensure camera is stopped if modal is closed
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      await deleteStudent(id);
      onUpdate();
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search students..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => { setIsAdding(true); startCamera(); }}
          className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all shadow-lg"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add Student</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredStudents.map((student) => (
          <div key={student.id} className="glass-card rounded-2xl overflow-hidden group">
            <div className="aspect-square bg-slate-800 relative">
              <img src={student.photoBase64} alt={student.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={() => handleDelete(student.id)}
                  className="p-3 bg-red-500 rounded-full hover:scale-110 transition-transform"
                >
                  <Trash2 className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-lg truncate">{student.name}</h4>
              <p className="text-sm text-slate-400">Roll: {student.rollNumber}</p>
              <p className="text-xs text-blue-400 mt-1 uppercase font-semibold">{student.department}</p>
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-xl font-bold">Register New Student</h3>
              <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-200">{formError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Full Name</label>
                  <input required className="w-full p-2 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-blue-500 transition-colors" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Roll Number</label>
                  <input required className="w-full p-2 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-blue-500 transition-colors" value={formData.rollNumber} onChange={e => setFormData({...formData, rollNumber: e.target.value})} />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-sm text-slate-400">Department</label>
                  <input required className="w-full p-2 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-blue-500 transition-colors" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                </div>
              </div>

              <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border-2 border-dashed border-white/20">
                {!capturedPhoto ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <button type="button" onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded-full font-bold flex items-center space-x-2 hover:scale-105 active:scale-95 transition-transform">
                      <Camera className="w-5 h-5" />
                      <span>Take Photo</span>
                    </button>
                  </>
                ) : (
                  <>
                    <img src={capturedPhoto} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setCapturedPhoto(null); startCamera(); }} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-2 rounded-full font-bold flex items-center space-x-2 hover:scale-105 active:scale-95 transition-transform">
                      <RefreshCw className="w-5 h-5" />
                      <span>Retake</span>
                    </button>
                  </>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />

              <button type="submit" className="w-full py-4 bg-blue-600 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20 active:scale-[0.98]">
                Complete Registration
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
