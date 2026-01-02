
import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { resetAttendance } from '../db';

interface SettingsProps {
  onReset: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onReset }) => {

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all attendance data? This action cannot be undone.')) {
      resetAttendance().then(() => {
        alert('Attendance data has been reset.');
        onReset();
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <ShieldCheck className="text-amber-400 mr-3" />
          Admin Controls
        </h3>
        <p className="text-slate-400 mb-6">
          Use these settings with caution. Actions taken here may be irreversible.
        </p>
        
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-start space-x-4">
          <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-red-500/10 rounded-full">
            <AlertTriangle className="text-red-400" />
          </div>
          <div>
            <h4 className="font-bold text-red-300">Reset Attendance Data</h4>
            <p className="text-sm text-red-400/80 mt-1 mb-3">
              This will permanently delete all attendance records from the database. Student data will not be affected. This is useful for clearing out test data or starting a new semester.
            </p>
            <button 
              onClick={handleReset}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-semibold"
            >
              Reset All Attendance Records
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
