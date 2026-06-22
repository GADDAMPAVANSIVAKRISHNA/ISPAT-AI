// production.js — Production and loss data

export const dailyProduction = [
  { date: 'Jun 12', target: 1000, actual: 940, loss: 60 },
  { date: 'Jun 13', target: 1000, actual: 875, loss: 125 },
  { date: 'Jun 14', target: 1000, actual: 960, loss: 40 },
  { date: 'Jun 15', target: 1000, actual: 820, loss: 180 },
  { date: 'Jun 16', target: 1000, actual: 910, loss: 90 },
  { date: 'Jun 17', target: 1000, actual: 850, loss: 150 },
  { date: 'Jun 18', target: 1000, actual: 920, loss: 80 },
];

export const todayProduction = {
  target: 1000,
  actual: 850,
  loss: 150,
  efficiency: 85,
  downtime: 4.2,
  lossBreakdown: [
    { category: 'Conveyor Failure', tons: 60, color: '#ef4444', percent: 40 },
    { category: 'Shift Delay', tons: 40, color: '#f59e0b', percent: 26.7 },
    { category: 'Material Delay', tons: 30, color: '#8b5cf6', percent: 20 },
    { category: 'Energy Loss', tons: 12, color: '#06b6d4', percent: 8 },
    { category: 'Maintenance Stop', tons: 8, color: '#f97316', percent: 5.3 },
  ]
};

export const monthlyTrend = [
  { month: 'Jan', production: 28500, loss: 3200, efficiency: 89.9 },
  { month: 'Feb', production: 26800, loss: 4100, efficiency: 86.7 },
  { month: 'Mar', production: 29100, loss: 2800, efficiency: 91.2 },
  { month: 'Apr', production: 27600, loss: 3900, efficiency: 87.6 },
  { month: 'May', production: 28900, loss: 3300, efficiency: 89.8 },
  { month: 'Jun', production: 24500, loss: 5200, efficiency: 82.5 },
];

export const rootCauseAnalysis = [
  {
    id: 'RCA001',
    date: '2026-06-17',
    lossPercent: 15,
    primaryCause: 'Conveyor Belt Breakdown',
    primaryCauseDept: 'Rolling Mill',
    secondaryCause: 'Shift Handover Delay',
    secondaryCauseDept: 'Production',
    tertiaryCause: 'Material Shortage (Coke)',
    confidence: 91,
    productionLost: 150,
    aiSummary: 'Conveyor M12 bearing failure caused a 4.2-hour shutdown in Bay 3A. The failure was exacerbated by a delayed shift handover (38 min delay) which increased reaction time. Coke material shortage from Blast Furnace Section additionally reduced output by 30 tons.',
    timeline: [
      { time: '06:20', event: 'Vibration alarm triggered on Conveyor M12' },
      { time: '07:05', event: 'Operator reported abnormal sound' },
      { time: '07:40', event: 'Conveyor M12 tripped — production stopped' },
      { time: '08:15', event: 'Maintenance team reached site (35 min delay)' },
      { time: '12:00', event: 'Bearing replaced, conveyor restarted' },
    ]
  },
  {
    id: 'RCA002',
    date: '2026-06-15',
    lossPercent: 18,
    primaryCause: 'Power Plant Fluctuation',
    primaryCauseDept: 'Power Plant',
    secondaryCause: 'Rolling Mill Stoppage',
    secondaryCauseDept: 'Rolling Mill',
    tertiaryCause: 'Emergency Maintenance',
    confidence: 88,
    productionLost: 180,
    aiSummary: 'A 2.5-hour power fluctuation event in the Power Plant caused multiple safety trips in the Rolling Mill. Emergency maintenance for protection relay recalibration was required. Production losses were compounded by lack of standby power protocol.',
    timeline: [
      { time: '14:10', event: 'Power quality anomaly detected' },
      { time: '14:18', event: 'Rolling Mill emergency stop triggered' },
      { time: '14:25', event: 'Power Plant team notified' },
      { time: '15:40', event: 'Relay recalibration complete' },
      { time: '16:45', event: 'Rolling Mill restarted at 70% capacity' },
    ]
  }
];
