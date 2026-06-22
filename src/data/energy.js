// energy.js — Energy consumption and loss data

export const energyDailyData = [
  { time: '00:00', consumed: 4200, produced: 320, efficiency: 76 },
  { time: '02:00', consumed: 3800, produced: 290, efficiency: 76 },
  { time: '04:00', consumed: 3600, produced: 270, efficiency: 75 },
  { time: '06:00', consumed: 4800, produced: 420, efficiency: 87 },
  { time: '08:00', consumed: 5200, produced: 460, efficiency: 88 },
  { time: '10:00', consumed: 5400, produced: 490, efficiency: 90 },
  { time: '12:00', consumed: 5100, produced: 450, efficiency: 88 },
  { time: '14:00', consumed: 4900, produced: 410, efficiency: 83 },
  { time: '16:00', consumed: 4700, produced: 380, efficiency: 80 },
  { time: '18:00', consumed: 4400, produced: 350, efficiency: 79 },
  { time: '20:00', consumed: 4100, produced: 310, efficiency: 75 },
  { time: '22:00', consumed: 3900, produced: 295, efficiency: 75 },
];

export const energyWasteSources = [
  { source: 'Idle Conveyor Operations', waste: 18.5, units: 'MWh', cost: '₹74,000', color: '#ef4444' },
  { source: 'Blast Furnace Leakage', waste: 12.3, units: 'MWh', cost: '₹49,200', color: '#f59e0b' },
  { source: 'Compressed Air Leaks', waste: 8.7, units: 'MWh', cost: '₹34,800', color: '#8b5cf6' },
  { source: 'Lighting (Unoccupied)', waste: 4.2, units: 'MWh', cost: '₹16,800', color: '#06b6d4' },
  { source: 'Cooling Tower Inefficiency', waste: 6.1, units: 'MWh', cost: '₹24,400', color: '#f97316' },
];

export const energySummary = {
  totalConsumed: 52400,
  totalWasted: 49.8,
  wastePercent: 12.3,
  costImpact: '₹1,99,200',
  topCause: 'Idle Conveyor Operations',
  co2Saved: '28.4 tons',
};

export const departmentEnergy = [
  { dept: 'Blast Furnace', consumed: 18200, efficiency: 82, waste: 12 },
  { dept: 'Steel Melt Shop', consumed: 14800, efficiency: 88, waste: 7 },
  { dept: 'Rolling Mill', consumed: 11200, efficiency: 85, waste: 9 },
  { dept: 'Power Plant', consumed: 5800, efficiency: 91, waste: 5 },
  { dept: 'Maintenance', consumed: 2400, efficiency: 78, waste: 15 },
];
