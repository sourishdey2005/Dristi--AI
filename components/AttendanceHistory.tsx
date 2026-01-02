
import React, { useState } from 'react';
import { Calendar, FileSpreadsheet } from 'lucide-react';
import { AttendanceRecord } from '../types';

interface AttendanceHistoryProps {
  attendance: AttendanceRecord[];
}

const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ attendance }) => {
  const [filterDate, setFilterDate] = useState('');

  const exportCSV = () => {
    const headers = ['ID', 'Member Name', 'Reference ID', 'Timestamp', 'Status'];

    const formatCell = (cellData) => {
      const stringData = String(cellData ?? '');
      if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
        return `"${stringData.replace(/"/g, '""')}"`;
      }
      return stringData;
    };

    const rows = attendance.map(r => {
      const timestamp = new Date(r.timestamp).toLocaleString();
      return [
        r.id,
        r.memberName,
        r.referenceId,
        timestamp,
        r.status
      ].map(formatCell).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Drishti_Attendance_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = attendance
    .filter(r => !filterDate || new Date(r.timestamp).toISOString().split('T')[0] === filterDate)
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="date" 
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          {filterDate && (
            <button onClick={() => setFilterDate('')} className="text-sm text-blue-400 hover:underline">Clear</button>
          )}
        </div>

        <button 
          onClick={exportCSV}
          className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-900/20"
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-6 py-4 font-semibold text-slate-300">Member Name</th>
                <th className="px-6 py-4 font-semibold text-slate-300">Reference ID</th>
                <th className="px-6 py-4 font-semibold text-slate-300">Date</th>
                <th className="px-6 py-4 font-semibold text-slate-300">Time</th>
                <th className="px-6 py-4 font-semibold text-slate-300">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredData.length > 0 ? filteredData.map((record) => (
                <tr key={record.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium">{record.memberName}</td>
                  <td className="px-6 py-4 text-slate-400">{record.referenceId}</td>
                  <td className="px-6 py-4 text-slate-400">{new Date(record.timestamp).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-slate-400">{new Date(record.timestamp).toLocaleTimeString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${record.status === 'Present' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-500 italic">No attendance records found for this period.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;
