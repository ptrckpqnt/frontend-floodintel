export const demoBarangay = 'San Vicente';
export const reportBarangays = ['Cansinala', 'Capalangan', demoBarangay, 'Sulipan', 'Tabuyuc'];

// Initial password for the new synthetic accounts: FloodIntelDemo26.
const demoHash = 'b1303594a4a8d8f31878ba1cfebfc425a52d40d5c9bcf456e41a6fbc4a37419c';
const demoPhone = (number) => `090000000${String(number).padStart(2, '0')}`;

function demoAccount(fullName, number, role, barangay, {
  email = `${fullName.toLowerCase().replaceAll(' ', '.')}@example.test`,
  initialHash = demoHash,
  previousName,
  previousNumber,
} = {}) {
  return {
    fullName, email, phone: demoPhone(number), role, barangay, initialHash,
    previousName, previousPhone: previousNumber === undefined ? undefined : demoPhone(previousNumber),
  };
}

export const demoBarangayOfficers = [
  demoAccount('Ramon Manaloto', 2, 'BDRRM Officer', 'Cansinala'),
  demoAccount('Teresa Dizon', 3, 'BDRRM Officer', 'Capalangan'),
  demoAccount('Gabriel Santiago', 4, 'BDRRM Officer', demoBarangay, {
    email: 'patrickpioquinto@gmail.com',
    previousName: 'Patrick Pioquinto',
    initialHash: 'c5f71e11073a7245bb5ce15fcb72a9d66a069e5e0bb1d6790dd95344ab8e66b2',
  }),
  demoAccount('Elena Valdez', 5, 'BDRRM Officer', 'Sulipan'),
  demoAccount('Noel Pangilinan', 6, 'BDRRM Officer', 'Tabuyuc'),
];

export const demoFieldReporters = [
  demoAccount('Mateo Reyes', 7, 'Field Reporter', demoBarangay, {
    email: 'markjasonpatron@gmail.com',
    previousName: 'Mark Jason Patron', previousNumber: 1,
    initialHash: '332380e74195a60f4df62aef6b1869540492112ab00217322ede4dea1926dbcc',
  }),
  demoAccount('Lara Mendoza', 8, 'Field Reporter', demoBarangay, {
    email: 'ninasantos@example.test',
    previousName: 'Nina Santos', previousNumber: 2,
    initialHash: 'e4a0915be1cb6eba70bdf32358ab05c6fcb3c91bb07e38d7f657fd61e0ad24a3',
  }),
  demoAccount('Paolo Navarro', 9, 'Field Reporter', demoBarangay, {
    email: 'aljonkenfernandez@gmail.com',
    previousName: 'Aljon Ken Fernandez', previousNumber: 3,
    initialHash: '5e2c3e9e303da226b679cb0b67fa008055654c3121a5cdd0810c7e3c5aa3edd4',
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
    initialHash: '925a44115c8907538941dbde555e8e94226b66307b761049c5221e9d7b573286',
  }),
  ...demoBarangayOfficers,
  ...demoFieldReporters,
];
