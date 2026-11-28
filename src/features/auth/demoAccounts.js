export const demoBarangay = 'San Vicente';
export const reportBarangays = ['Cansinala', 'Capalangan', demoBarangay, 'Sulipan', 'Tabuyuc'];

// Initial password for all bundled demo accounts: Floodinteldemo.
const demoHash = '0fb9343dbc180d512adfa2d0967b3997e33a1cc87fd6b475b5417088fb6b5440';
const demoPhone = (number) => `090000000${String(number).padStart(2, '0')}`;

function demoAccount(fullName, number, role, barangay, {
  email = `${fullName.toLowerCase().replaceAll(' ', '.')}@example.test`,
  previousName,
  previousNumber,
} = {}) {
  return {
    fullName, email, phone: demoPhone(number), role, barangay, initialHash: demoHash,
    previousName, previousPhone: previousNumber === undefined ? undefined : demoPhone(previousNumber),
  };
}

export const demoBarangayOfficers = [
  demoAccount('Ramon Manaloto', 2, 'BDRRM Officer', 'Cansinala'),
  demoAccount('Teresa Dizon', 3, 'BDRRM Officer', 'Capalangan'),
  demoAccount('Gabriel Santiago', 4, 'BDRRM Officer', demoBarangay, {
    email: 'patrickpioquinto@gmail.com',
    previousName: 'Patrick Pioquinto',
  }),
  demoAccount('Elena Valdez', 5, 'BDRRM Officer', 'Sulipan'),
  demoAccount('Noel Pangilinan', 6, 'BDRRM Officer', 'Tabuyuc'),
];

export const demoFieldReporters = [
  demoAccount('Mateo Reyes', 7, 'Field Reporter', demoBarangay, {
    email: 'markjasonpatron@gmail.com',
    previousName: 'Mark Jason Patron', previousNumber: 1,
  }),
  demoAccount('Lara Mendoza', 8, 'Field Reporter', demoBarangay, {
    email: 'ninasantos@example.test',
    previousName: 'Nina Santos', previousNumber: 2,
  }),
  demoAccount('Paolo Navarro', 9, 'Field Reporter', demoBarangay, {
    email: 'aljonkenfernandez@gmail.com',
    previousName: 'Aljon Ken Fernandez', previousNumber: 3,
  }),
  demoAccount('Bianca Santos', 10, 'Field Reporter', 'Cansinala'),
  demoAccount('Joel Pineda', 11, 'Field Reporter', 'Cansinala'),
  demoAccount('Mariel Garcia', 12, 'Field Reporter', 'Cansinala'),
  demoAccount('Adrian Mercado', 13, 'Field Reporter', 'Capalangan'),
  demoAccount('Camille David', 14, 'Field Reporter', 'Capalangan'),
  demoAccount('Luis Flores', 15, 'Field Reporter', 'Capalangan'),
  demoAccount('Diana Cruz', 16, 'Field Reporter', 'Sulipan'),
  demoAccount('Rafael Torres', 17, 'Field Reporter', 'Sulipan'),
  demoAccount('Irene Bautista', 18, 'Field Reporter', 'Sulipan'),
  demoAccount('Carlo Aquino', 19, 'Field Reporter', 'Tabuyuc'),
  demoAccount('Sofia Ramos', 20, 'Field Reporter', 'Tabuyuc'),
  demoAccount('Miguel Castro', 21, 'Field Reporter', 'Tabuyuc'),
];

export const demoAccounts = [
  demoAccount('Cesar Carlos', 1, 'MDRRMO Officer', 'Apalit', {
    email: 'cesarcarlos@gmail.com',
    previousNumber: 5,
  }),
  ...demoBarangayOfficers,
  ...demoFieldReporters,
];
