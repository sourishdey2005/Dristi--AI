
export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  photoBase64: string;
  createdAt: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  timestamp: number;
  status: 'Present' | 'Late';
}

export type AppView = 'dashboard' | 'scanner' | 'students' | 'history';
