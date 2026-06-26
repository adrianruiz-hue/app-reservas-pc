export interface Equipment {
  id: string;
  name: string;
  fullName: string;
  color: string;
  textColor: string;
  subTextColor: string;
  timeColor: string;
}

export interface Booking {
  id: string;
  equipmentId: string;
  userName: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format (24h)
  endTime: string; // HH:mm format (24h)
  purpose?: string;
}

export const EQUIPMENTS: Equipment[] = [
  { 
    id: 'eq-1', 
    name: 'Equipo 01',
    fullName: 'Oscilloscope 7000x', 
    color: 'bg-indigo-50 border-l-4 border-indigo-500',
    textColor: 'text-indigo-700',
    subTextColor: 'text-indigo-600',
    timeColor: 'text-indigo-400'
  },
  { 
    id: 'eq-2', 
    name: 'Equipo 02', 
    fullName: 'Spectrum Analyzer',
    color: 'bg-emerald-50 border-l-4 border-emerald-500',
    textColor: 'text-emerald-700',
    subTextColor: 'text-emerald-600',
    timeColor: 'text-emerald-400'
  },
  { 
    id: 'eq-3', 
    name: 'Equipo 03', 
    fullName: 'Thermal Chamber',
    color: 'bg-rose-50 border-l-4 border-rose-500',
    textColor: 'text-rose-700',
    subTextColor: 'text-rose-600',
    timeColor: 'text-rose-400'
  },
];
