const mark = { id: 'markjasonpatron@gmail.com', fullName: 'Mark Jason Patron', phone: '09000000001', barangay: 'Paligui' };
const aljon = { id: 'aljonkenfernandez@gmail.com', fullName: 'Aljon Ken Fernandez', phone: '09000000003', barangay: 'Paligui' };

export const sampleReports = [
  { id: 'sample-aroma', reporter: mark, waterLevelCm: 75, location: 'Aroma Street', dateLabel: 'Jun 24, 01:23 AM', waterLevel: '75 cm', status: 'Awaiting Review',
    landmark: 'Near irrigation', latitude: 14.945767, longitude: 120.786809, waterFlow: 'Fast',
    estimatedAffectedFamilies: 12, description: 'Water is rising along the street. Residents are requesting evacuation assistance.',
    evacuationNeeded: true, accessibleByRescueBoat: true, vulnerableResidents: 'Present' },
  { id: 'sample-villena', reporter: aljon, waterLevelCm: 55, location: 'Villena Street', dateLabel: 'Jun 23, 10:47 AM', waterLevel: '55 cm', status: 'Accepted',
    landmark: 'Near the covered court', waterFlow: 'Slow', estimatedAffectedFamilies: 6,
    description: 'Floodwater covers part of the road near the covered court.',
    evacuationNeeded: false, accessibleByRescueBoat: true, vulnerableResidents: 'None' },
  { id: 'sample-riverside', reporter: mark, waterLevelCm: 32, location: 'Riverside Road', dateLabel: 'Jun 22, 08:15 AM', waterLevel: '32 cm', status: 'Needs Correction',
    landmark: 'Near the footbridge', waterFlow: 'Still', estimatedAffectedFamilies: 3,
    description: 'Standing water covers the path beside the footbridge.',
    evacuationNeeded: false, accessibleByRescueBoat: false, vulnerableResidents: 'Unknown',
    reviewNote: 'The BDRRM Officer requested a clearer photo showing the floodwater.' },
];

export const reportStatuses = {
  'Awaiting Review': { tone: 'waiting', icon: 'waiting', explanation: 'Awaiting BDRRMO review.' },
  Accepted: { tone: 'accepted', icon: 'accepted', explanation: 'The BDRRM Officer accepted this report.' },
  'Needs Correction': { tone: 'correction', icon: 'alert', explanation: 'The BDRRM Officer requested a correction.' },
  'In SitRep': { tone: 'sent', icon: 'send', explanation: 'Included in a situation report endorsed to MDRRMO.' },
};
