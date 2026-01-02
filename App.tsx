
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Camera, Users, History, Settings, ShieldCheck, Menu, X, Loader2 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import AttendanceScanner from './components/AttendanceScanner';
import StudentManagement from './components/StudentManagement';
import AttendanceHistory from './components/AttendanceHistory';
import SettingsPage from './components/Settings';
import { AppView, Student, AttendanceRecord } from './types';
import { getAllStudents, getAllAttendance } from './db';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>('scanner');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const s = await getAllStudents();
      const a = await getAllAttendance();
      setStudents(s);
      setAttendance(a);
    } catch (err) {
      console.error("DB Fetch Error", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const navItems = [
    { id: 'scanner', label: 'Face Scan', icon: Camera },
    { id: 'dashboard', label: 'Analytics', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-blue-400">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <div className="text-xl font-bold tracking-widest uppercase">Loading System</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 glass transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center space-x-3">
            <img src="https://res.cloudinary.com/dodhvvewu/image/upload/v1767356980/dristi_Ai_ymdrkt.jpg" alt="Dristi AI Logo" className="w-10 h-10 rounded-xl shadow-lg shadow-blue-900/40" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Drishti-AI</h1>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Presence Secured</p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveView(item.id as AppView); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    activeView === item.id ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-400'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${activeView === item.id ? 'text-white' : 'group-hover:text-blue-400'}`} />
                  <span className="font-medium">{item.label}</span>
                  {activeView === item.id && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
                </button>
              );
            })}
          </nav>

          <div className="p-4 mt-auto">
            <div className="glass-card p-4 rounded-xl text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">System Status</span>
                <span className="text-emerald-400 font-bold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span>Online</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">AI Accuracy</span>
                <span className="text-blue-400">98.4%</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <header className="flex items-center justify-between mb-8 md:hidden">
          <div className="flex items-center space-x-3">
             <img src="https://res.cloudinary.com/dodhvvewu/image/upload/v1767356980/dristi_Ai_ymdrkt.jpg" alt="Dristi AI Logo" className="w-8 h-8 rounded-lg" />
            <h1 className="text-lg font-bold">Drishti-AI</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 glass rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
             <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
               {navItems.find(i => i.id === activeView)?.label}
             </h2>
             <p className="text-slate-400 mt-1">Manage your institution's presence with intelligence.</p>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeView === 'scanner' && <AttendanceScanner students={students} onAttendanceMarked={fetchData} />}
            {activeView === 'dashboard' && <Dashboard students={students} attendance={attendance} />}
            {activeView === 'students' && <StudentManagement students={students} onUpdate={fetchData} />}
            {activeView === 'history' && <AttendanceHistory attendance={attendance} />}
            {activeView === 'settings' && <SettingsPage onReset={fetchData} />}
          </div>
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
