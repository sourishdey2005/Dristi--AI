
export interface Member {
  id: string;
  name: string;
  referenceId: string;
  department: string;
  photoBase64: string;
  createdAt: number;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  referenceId: string;
  timestamp: number;
  status: 'Present' | 'Out';
}

export type AppView = 'dashboard' | 'scanner' | 'members' | 'history' | 'settings';
