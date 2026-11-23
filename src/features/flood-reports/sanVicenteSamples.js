import { summarizeReports } from '../bdrrmo/sitRepSummary.js';

export const demoBarangay = 'San Vicente';
export const demoMapCenter = { latitude: 14.9495, longitude: 120.7565 };

function reporter(fullName, email, phone) {
  return { id: email, fullName, phone, barangay: demoBarangay };
}

const mark = reporter('Mark Jason Patron', 'markjasonpatron@gmail.com', '09000000001');
const aljon = reporter('Aljon Ken Fernandez', 'aljonkenfernandez@gmail.com', '09000000003');
const nina = reporter('Nina Santos', 'ninasantos@example.test', '09000000002');
const dateFormat = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
});

function sample(id, owner, location, landmark, latitude, longitude, depth, families, time, details) {
  const submittedAt = Date.parse(`2026-11-${time}+08:00`);
  return {
    id: `demo-sv-${id}`, reporter: owner, location, landmark, latitude, longitude,
    waterLevelCm: depth, waterLevel: `${depth} cm`, estimatedAffectedFamilies: families,
    submittedAt, dateLabel: dateFormat.format(submittedAt), isSample: true,
    status: 'In SitRep', waterFlow: 'Slow', evacuationNeeded: false,
    accessibleByRescueBoat: false, vulnerableResidents: 'None',
    ...details,
  };
}

export const sampleReports = [
  sample('01', mark, 'San Vicente Barangay Hall approach', 'Road in front of the barangay hall', 14.94582, 120.74810, 42, 8, '22T15:12:00', {
    description: 'Runoff crossed the road and reached two front steps. The raised sidewalk on the hall side remains usable.',
  }),
  sample('02', mark, 'Sampaga residential lane', 'West of the barangay hall', 14.94545, 120.74677, 83, 17, '22T15:25:00', {
    waterFlow: 'Fast', evacuationNeeded: true, accessibleByRescueBoat: true, vulnerableResidents: 'Present',
    description: 'Water entered single-storey homes at the low end of the lane. Two older residents need help moving to higher ground.',
  }),
  sample('03', mark, 'Sampaga access road', 'North of the old rail crossing', 14.94673, 120.74715, 31, 5, '22T15:47:00', {
    description: 'Water covers the lowest section near the ditch. Motorcycles are turning back; people can use the raised shoulder.',
  }),
  sample('04', mark, 'Old Apalit Station approach', 'Lane leading to the former railway stop', 14.94511, 120.74948, 64, 11, '22T16:04:00', {
    evacuationNeeded: true, vulnerableResidents: 'Present',
    description: 'Several families moved belongings onto shelves after water entered their ground floors. Debris narrows the lane.',
  }),
  sample('05', mark, 'Barangay hall service lane', 'Side road behind the hall compound', 14.94626, 120.74874, 24, 4, '23T05:41:00', {
    status: 'Awaiting Review', waterFlow: 'Still',
    description: 'Standing water remains across the service lane after rainfall eased. No new water was seen entering houses.',
  }),
  sample('06', aljon, 'San Vicente Elementary School frontage', 'Main gate on Gonzales Avenue', 14.95006, 120.75938, 28, 3, '22T16:20:00', {
    waterFlow: 'Still',
    description: 'Water pools at the main gate and covers the curb. The school entrance on higher pavement remains clear.',
  }),
  sample('07', aljon, 'Gonzales Avenue low point', 'Road south of the school frontage', 14.94927, 120.75981, 58, 9, '22T16:35:00', {
    waterFlow: 'Fast', vulnerableResidents: 'Present',
    description: 'Water is moving across the pavement toward a blocked drain. Residents reported one person with limited mobility at home.',
  }),
  sample('08', aljon, 'San Vicente Chapel approach', 'Lane by the chapel entrance', 14.94879, 120.76038, 76, 14, '22T16:52:00', {
    evacuationNeeded: true, vulnerableResidents: 'Present',
    description: 'The lane is waist-deep at its lowest point. Families near the chapel requested help reaching the higher main road.',
  }),
  sample('09', aljon, 'MacArthur Highway service lane', 'Commercial frontage west of the chapel', 14.94848, 120.75865, 19, 2, '22T17:08:00', {
    description: 'Water covers the service-lane curb; the main carriageway is clear. Shopkeepers are keeping the frontage closed.',
  }),
  sample('10', aljon, 'Gonzales Avenue school-side shoulder', 'Shoulder east of the elementary school entrance', 14.95039, 120.76017, 52, 0, '23T05:53:00', {
    status: 'Needs Correction', vulnerableResidents: 'Unknown',
    description: 'Depth was estimated from a passing vehicle. Household impacts could not be checked from the shoulder.',
    reviewNote: 'Depth could not be validated against a fixed reference. Recheck from a safe position and include the waterline or a marked reference.',
  }),
  sample('11', nina, 'Apalit Public Market vehicle entrance', 'Market access in Bagong Pag-asa', 14.95343, 120.75702, 37, 0, '22T17:21:00', {
    description: 'The vehicle entrance is flooded past the curb. Traders are directing customers to the raised pedestrian entrance.',
  }),
  sample('12', nina, 'Bagong Pag-asa market lane', 'Residential lane west of the public market', 14.95284, 120.75591, 106, 21, '22T17:37:00', {
    waterFlow: 'Fast', evacuationNeeded: true, accessibleByRescueBoat: true, vulnerableResidents: 'Present',
    description: 'Water rose above door handles on the lowest row. Several residents, including young children, are waiting on upper floors for assistance.',
  }),
  sample('13', nina, 'Gonzalez Memorial College frontage', 'Public road between the school and market', 14.95229, 120.75737, 46, 7, '22T17:50:00', {
    description: 'Floodwater covers one lane at the school frontage and has reached nearby doorsteps. The opposite shoulder is higher.',
  }),
  sample('14', nina, 'San Vicente Multi-Purpose Hall approach', 'Gonzales Avenue near the hall', 14.95321, 120.76813, 33, 6, '22T18:03:00', {
    description: 'The side approach is flooded. Access remains possible from the higher pavement toward the municipal compound.',
  }),
  sample('15', nina, 'Public market loading lane', 'Lane south of the market building', 14.95305, 120.75769, 49, 5, '23T06:06:00', {
    status: 'Awaiting Review', waterFlow: 'Still', vulnerableResidents: 'Unknown',
    description: 'Standing water blocks the delivery lane and reaches several adjacent units. A second depth reading is pending.',
  }),
].sort((a, b) => b.submittedAt - a.submittedAt);

function sampleSitRep(reference, owner, time, narrative, evacuationStatus) {
  const reports = sampleReports.filter(({ status, reporter: source }) => status === 'In SitRep' && source === owner);
  return {
    id: `demo-sv-sitrep-${reference}`, reference, reportIds: reports.map(({ id }) => id),
    barangay: demoBarangay, author: 'Patrick Pioquinto', isSample: true,
    createdAt: Date.parse(`2026-11-22T${time}+08:00`),
    narrative, evacuationStatus, ...summarizeReports(reports),
  };
}

export const sampleSitReps = [
  sampleSitRep('591672', nina, '18:15:00', 'The deepest measurement was in the residential lane west of the market. Request a rescue team for households waiting upstairs and keep the raised market entrance clear.', 'Rescue assistance requested for Bagong Pag-asa'),
  sampleSitRep('591671', aljon, '17:20:00', 'The chapel approach needs assisted evacuation. Restrict vehicles at the Gonzales Avenue low point and direct pedestrians to the higher school frontage.', 'Assisted evacuation requested near the chapel'),
  sampleSitRep('591670', mark, '16:15:00', 'Prioritize the low-lying Sampaga and old station lanes. Use the barangay hall approach for staging while the raised sidewalk remains passable.', 'Barangay team checking residents who need assistance'),
];
