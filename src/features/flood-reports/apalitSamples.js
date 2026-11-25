import { demoBarangay, demoBarangayOfficers, demoFieldReporters } from '../auth/demoAccounts.js';
import { summarizeReports } from '../bdrrmo/sitRepSummary.js';

export const demoMapCenter = { latitude: 14.946, longitude: 120.775 };

const dateFormat = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
});

function sample(id, reporterIndex, location, landmark, latitude, longitude, depth, families, time, details) {
  const { email, fullName, phone, barangay } = demoFieldReporters[reporterIndex];
  const submittedAt = Date.parse(`2026-11-${time}+08:00`);
  return {
    id: `demo-sv-${id}`, reporter: { id: email, fullName, phone, barangay }, location, landmark, latitude, longitude,
    waterLevelCm: depth, waterLevel: `${depth} cm`, estimatedAffectedFamilies: families,
    submittedAt, dateLabel: dateFormat.format(submittedAt), isSample: true,
    status: 'In SitRep', waterFlow: 'Slow', evacuationNeeded: false,
    accessibleByRescueBoat: false, vulnerableResidents: 'None',
    ...details,
  };
}

export const sampleReports = [
  sample('01', 0, 'San Vicente Barangay Hall approach', 'Road in front of the barangay hall', 14.94582, 120.74810, 42, 8, '22T15:12:00', {
    description: 'Runoff crossed the road and reached two front steps. The raised sidewalk on the hall side remains usable.',
  }),
  sample('02', 3, 'Cansinala residential lane', 'Low end of the residential lane', 14.9623, 120.8039, 83, 17, '22T15:25:00', {
    waterFlow: 'Fast', evacuationNeeded: true, accessibleByRescueBoat: true, vulnerableResidents: 'Present',
    description: 'Water entered single-storey homes at the low end of the lane. Two older residents need help moving to higher ground.',
  }),
  sample('03', 4, 'Cansinala access road', 'Low shoulder by the roadside ditch', 14.9628, 120.8044, 31, 5, '22T15:47:00', {
    description: 'Water covers the lowest section near the ditch. Motorcycles are turning back; people can use the raised shoulder.',
  }),
  sample('04', 5, 'Cansinala neighborhood approach', 'Entrance to the residential block', 14.9627, 120.8035, 64, 11, '22T16:04:00', {
    evacuationNeeded: true, vulnerableResidents: 'Present',
    description: 'Several families moved belongings onto shelves after water entered their ground floors. Debris narrows the lane.',
  }),
  sample('05', 6, 'Capalangan service lane', 'Service lane next to a compound', 14.9382, 120.7685, 24, 4, '23T05:41:00', {
    status: 'Accepted', waterFlow: 'Still',
    description: 'Standing water remains across the service lane after rainfall eased. No new water was seen entering houses.',
  }),
  sample('06', 1, 'San Vicente Elementary School frontage', 'Main gate on Gonzales Avenue', 14.95006, 120.75938, 28, 3, '22T16:20:00', {
    waterFlow: 'Still',
    description: 'Water pools at the main gate and covers the curb. The school entrance on higher pavement remains clear.',
  }),
  sample('07', 7, 'Capalangan road low point', 'Low section by a storm drain', 14.9378, 120.7689, 58, 9, '22T16:35:00', {
    waterFlow: 'Fast', vulnerableResidents: 'Present',
    description: 'Water is moving across the pavement toward a blocked drain. Residents reported one person with limited mobility at home.',
  }),
  sample('08', 8, 'Capalangan chapel approach', 'Lane near a chapel entrance', 14.9384, 120.7692, 76, 14, '22T16:52:00', {
    evacuationNeeded: true, vulnerableResidents: 'Present',
    description: 'The lane is waist-deep at its lowest point. Families near the chapel requested help reaching the higher main road.',
  }),
  sample('09', 9, 'Sulipan commercial service lane', 'Service lane beside the main road', 14.9302, 120.7475, 19, 2, '22T17:08:00', {
    description: 'Water covers the service-lane curb; the main carriageway is clear. Shopkeepers are keeping the frontage closed.',
  }),
  sample('10', 10, 'Sulipan roadside shoulder', 'Raised shoulder on the local access road', 14.9298, 120.7481, 52, 0, '23T05:53:00', {
    status: 'Accepted', vulnerableResidents: 'Unknown',
    description: 'The waterline on a roadside post confirmed the depth. The raised shoulder remained passable. Household impacts were not observed.',
  }),
  sample('11', 11, 'Sulipan market access lane', 'Vehicle entrance to the market area', 14.9304, 120.7482, 37, 0, '22T17:21:00', {
    description: 'The vehicle entrance is flooded past the curb. Traders are directing customers to the raised pedestrian entrance.',
  }),
  sample('12', 12, 'Tabuyuc residential lane', 'Low residential lane near the main road', 14.9503, 120.785, 106, 21, '22T17:37:00', {
    waterFlow: 'Fast', evacuationNeeded: true, accessibleByRescueBoat: true, vulnerableResidents: 'Present',
    description: 'Water rose above door handles on the lowest row. Several residents, including young children, are waiting on upper floors for assistance.',
  }),
  sample('13', 13, 'Tabuyuc school frontage', 'Road beside the school grounds', 14.9508, 120.7854, 46, 7, '22T17:50:00', {
    description: 'Floodwater covers one lane at the school frontage and has reached nearby doorsteps. The opposite shoulder is higher.',
  }),
  sample('14', 2, 'San Vicente Multi-Purpose Hall approach', 'Gonzales Avenue near the hall', 14.95321, 120.76813, 33, 6, '22T18:03:00', {
    description: 'The side approach is flooded. Access remains possible from the higher pavement toward the municipal compound.',
  }),
  sample('15', 14, 'Tabuyuc delivery lane', 'Delivery access behind the commercial frontage', 14.9501, 120.7857, 49, 5, '23T06:06:00', {
    status: 'Awaiting Review', waterFlow: 'Still', vulnerableResidents: 'Unknown',
    description: 'Standing water blocks the delivery lane and reaches several adjacent units. A second depth reading is pending.',
  }),
].sort((a, b) => b.submittedAt - a.submittedAt);

const sitRepNotes = {
  Cansinala: ['Check the low residential lane first and keep the raised shoulder open for pedestrians.', 'Assistance requested for older residents'],
  Capalangan: ['Keep traffic away from the flooded drain and assist families near the chapel.', 'Assisted evacuation requested near the chapel'],
  [demoBarangay]: ['Direct pedestrians to the raised sidewalk and monitor the school and hall approaches.', 'Higher access routes remain open'],
  Sulipan: ['Keep vehicles off the flooded service lane and direct customers to the raised market entrance.', 'Raised pedestrian access remains open'],
  Tabuyuc: ['Prioritize rescue in the low residential lane and keep the higher school shoulder clear.', 'Rescue assistance requested for residents on upper floors'],
};

export const sampleSitReps = demoBarangayOfficers.map(({ barangay, fullName }, index) => {
  const reports = sampleReports.filter((report) => report.status === 'In SitRep' && report.reporter.barangay === barangay);
  const reference = String(591670 + index);
  const [narrative, evacuationStatus] = sitRepNotes[barangay];
  return {
    id: `demo-apalit-sitrep-${reference}`, reference, reportIds: reports.map(({ id }) => id),
    barangay, author: fullName, isSample: true,
    createdAt: Date.parse(`2026-11-23T08:0${index}:00+08:00`),
    narrative, evacuationStatus, ...summarizeReports(reports),
  };
}).reverse();
