export const pendingSync = 'Pending sync';
export const pendingEndorsement = 'Pending endorsement';

export const reportStatuses = {
  [pendingSync]: { tone: 'waiting', icon: 'waiting', explanation: 'Saved on this device. Waiting for a connection to submit to the local demo.' },
  [pendingEndorsement]: { tone: 'waiting', icon: 'waiting', explanation: 'Included in a situation report saved offline for endorsement.' },
  'Awaiting Review': { tone: 'waiting', icon: 'waiting', explanation: 'Awaiting BDRRMO review.' },
  Accepted: { tone: 'accepted', icon: 'accepted', explanation: 'The BDRRM Officer accepted this report.' },
  'Needs Correction': { tone: 'correction', icon: 'alert', explanation: 'The BDRRM Officer requested a correction.' },
  'In SitRep': { tone: 'sent', icon: 'send', explanation: 'Included in a situation report endorsed to MDRRMO.' },
};
