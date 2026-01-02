
import { Member, AttendanceRecord } from './types';

const DB_NAME = 'DrishtiAIDB';
const DB_VERSION = 2; // Incremented version to trigger schema update

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject('Error opening database');
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // Remove old 'students' store if it exists and create 'members'
      if (db.objectStoreNames.contains('students')) {
        db.deleteObjectStore('students');
      }
      if (!db.objectStoreNames.contains('members')) {
        db.createObjectStore('members', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('attendance')) {
        db.createObjectStore('attendance', { keyPath: 'id' });
      }
    };
  });
};

export const addMember = async (member: Member): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['members'], 'readwrite');
    const store = transaction.objectStore('members');
    const request = store.add(member);
    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error adding member');
  });
};

export const getAllMembers = async (): Promise<Member[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['members'], 'readonly');
    const store = transaction.objectStore('members');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching members');
  });
};

export const deleteMember = async (id: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['members'], 'readwrite');
    const store = transaction.objectStore('members');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error deleting member');
  });
};

export const recordAttendance = async (record: AttendanceRecord): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['attendance'], 'readwrite');
    const store = transaction.objectStore('attendance');
    const request = store.add(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error recording attendance');
  });
};

export const getAllAttendance = async (): Promise<AttendanceRecord[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['attendance'], 'readonly');
    const store = transaction.objectStore('attendance');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Error fetching attendance');
  });
};

export const resetAttendance = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['attendance'], 'readwrite');
    const store = transaction.objectStore('attendance');
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error resetting attendance');
  });
};
