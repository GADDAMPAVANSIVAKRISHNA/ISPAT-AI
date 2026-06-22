// shifts.js — Shift performance data

export const shiftData = [
  {
    id: 'S001',
    name: 'Morning Shift',
    supervisor: 'Rajesh Kumar',
    time: '06:00 - 14:00',
    efficiency: 92,
    output: 348,
    target: 333,
    downtime: 0.8,
    incidents: 1,
    delays: 0,
    date: '2026-06-18',
    color: '#10b981',
    status: 'excellent',
  },
  {
    id: 'S002',
    name: 'Evening Shift',
    supervisor: 'Amit Sharma',
    time: '14:00 - 22:00',
    efficiency: 83,
    output: 302,
    target: 333,
    downtime: 2.1,
    incidents: 2,
    delays: 1,
    date: '2026-06-18',
    color: '#f59e0b',
    status: 'good',
  },
  {
    id: 'S003',
    name: 'Night Shift',
    supervisor: 'Suresh Patil',
    time: '22:00 - 06:00',
    efficiency: 74,
    output: 267,
    target: 333,
    downtime: 4.2,
    incidents: 3,
    delays: 2,
    date: '2026-06-18',
    color: '#ef4444',
    status: 'poor',
  },
];

export const shiftWeeklyTrend = [
  { day: 'Mon', morning: 94, evening: 86, night: 78 },
  { day: 'Tue', morning: 91, evening: 82, night: 71 },
  { day: 'Wed', morning: 96, evening: 88, night: 80 },
  { day: 'Thu', morning: 89, evening: 79, night: 65 },
  { day: 'Fri', morning: 93, evening: 85, night: 76 },
  { day: 'Sat', morning: 88, evening: 81, night: 73 },
  { day: 'Sun', morning: 92, evening: 83, night: 74 },
];

export const shiftIncidents = [
  { time: '23:15', shift: 'Night', type: 'Equipment', description: 'Conveyor M12 vibration alarm', severity: 'high', resolved: false },
  { time: '01:40', shift: 'Night', type: 'Process', description: 'Material feed interruption - Coke section', severity: 'medium', resolved: true },
  { time: '03:20', shift: 'Night', type: 'Human', description: 'Shift handover delay - 38 minutes', severity: 'medium', resolved: true },
  { time: '15:10', shift: 'Evening', type: 'Equipment', description: 'Pressure drop in Pump P-07', severity: 'medium', resolved: true },
  { time: '16:55', shift: 'Evening', type: 'Process', description: 'Rolling schedule delayed - upstream fault', severity: 'low', resolved: true },
  { time: '07:00', shift: 'Morning', type: 'Human', description: 'Safety inspection pause (routine)', severity: 'low', resolved: true },
];
