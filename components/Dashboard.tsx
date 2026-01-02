
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Treemap } from 'recharts';
import { Student, AttendanceRecord } from '../types';
import { Users, UserCheck, Calendar, Clock } from 'lucide-react';

interface DashboardProps {
  students: Student[];
  attendance: AttendanceRecord[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

const Dashboard: React.FC<DashboardProps> = ({ students, attendance }) => {
  const stats = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    const todayRecords = attendance.filter(r => new Date(r.timestamp).setHours(0, 0, 0, 0) === today);
    const uniquePresentToday = new Set(todayRecords.map(r => r.studentId)).size;
    
    return {
      totalStudents: students.length,
      presentToday: uniquePresentToday,
      absentToday: Math.max(0, students.length - uniquePresentToday),
      attendanceRate: students.length ? Math.round((uniquePresentToday / students.length) * 100) : 0
    };
  }, [students, attendance]);

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const count = attendance.filter(r => new Date(r.timestamp).toISOString().split('T')[0] === date).length;
      return { date, count };
    });
  }, [attendance]);

  const pieData = [
    { name: 'Present', value: stats.presentToday, color: '#10b981' },
    { name: 'Absent', value: stats.absentToday, color: '#ef4444' },
  ];

  const treemapData = useMemo(() => {
    const deptMap: Record<string, number> = {};
    
    // Create a lookup for student departments
    const studentDeptMap = students.reduce((acc, s) => {
      acc[s.id] = s.department;
      return acc;
    }, {} as Record<string, string>);

    attendance.forEach(record => {
      const dept = studentDeptMap[record.studentId] || 'Unknown';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });

    return Object.entries(deptMap).map(([name, value]) => ({
      name,
      value,
    }));
  }, [students, attendance]);

  const CustomizedContent = (props: any) => {
    const { root, depth, x, y, width, height, index, name } = props;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: COLORS[index % COLORS.length],
            stroke: '#1e293b',
            strokeWidth: 2,
            opacity: 0.8,
          }}
        />
        {width > 50 && height > 30 && (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            fill="#fff"
            fontSize={12}
            fontWeight="bold"
          >
            {name}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Users className="text-blue-400" />} label="Total Students" value={stats.totalStudents} />
        <StatCard icon={<UserCheck className="text-emerald-400" />} label="Present Today" value={stats.presentToday} />
        <StatCard icon={<Calendar className="text-purple-400" />} label="Absentees" value={stats.absentToday} />
        <StatCard icon={<Clock className="text-orange-400" />} label="Attendance Rate" value={`${stats.attendanceRate}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2">
          <h3 className="text-lg font-semibold mb-6">Attendance Trend (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickFormatter={(str) => str.split('-')[2]} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#60a5fa' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="glass-card p-6 rounded-2xl relative">
          <h3 className="text-lg font-semibold mb-6">Today's Presence</h3>
          <div className="h-64 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center pointer-events-none">
              <span className="text-2xl font-bold">{stats.attendanceRate}%</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Present</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Treemap */}
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Department-wise Distribution</h3>
            <p className="text-xs text-slate-400">Total attendance volume per department</p>
          </div>
          <div className="h-80">
            {treemapData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={treemapData}
                  dataKey="value"
                  stroke="#1e293b"
                  fill="#8884d8"
                  content={<CustomizedContent />}
                >
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                    formatter={(value: number) => [`${value} Records`, 'Attendance']}
                  />
                </Treemap>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 italic">
                No departmental data available yet. Mark some attendance to see insights.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <div className="glass-card p-6 rounded-2xl flex items-center space-x-4">
    <div className="p-3 bg-white/5 rounded-xl">{icon}</div>
    <div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

export default Dashboard;
