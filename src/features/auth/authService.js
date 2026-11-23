import { demoBarangay } from '../flood-reports/sanVicenteSamples.js';

// Client-side fixtures for the demo. Laravel will own production authentication.
const accounts = [
  { fullName: 'Cesar Carlos', email: 'cesarcarlos@gmail.com', phone: '09000000005', role: 'MDRRMO Officer', initialHash: '925a44115c8907538941dbde555e8e94226b66307b761049c5221e9d7b573286' },
  { fullName: 'Mark Jason Patron', email: 'markjasonpatron@gmail.com', phone: '09000000001', initialHash: '332380e74195a60f4df62aef6b1869540492112ab00217322ede4dea1926dbcc' },
  { fullName: 'Nina Santos', email: 'ninasantos@example.test', phone: '09000000002', initialHash: 'e4a0915be1cb6eba70bdf32358ab05c6fcb3c91bb07e38d7f657fd61e0ad24a3' },
  { fullName: 'Patrick Pioquinto', email: 'patrickpioquinto@gmail.com', phone: '09000000004', role: 'BDRRM Officer', initialHash: 'c5f71e11073a7245bb5ce15fcb72a9d66a069e5e0bb1d6790dd95344ab8e66b2' },
  { fullName: 'Aljon Ken Fernandez', email: 'aljonkenfernandez@gmail.com', phone: '09000000003', initialHash: '5e2c3e9e303da226b679cb0b67fa008055654c3121a5cdd0810c7e3c5aa3edd4' },
];

const sessionKey = 'floodintel.demo.reporter.session';
const passwordKey = (email) => `floodintel.demo.password.${email}`;
const resetKey = (email) => `floodintel.demo.reset.${email}`;
const profileKey = (id) => `floodintel.demo.profile.${id}`;
const teamKey = 'floodintel.demo.team';
const accountId = (account) => account.id ?? account.email;
const avatarColors = ['#185abc', '#137333', '#a50e0e', '#7627bb', '#00695c', '#9c4600', '#a61d65', '#3f51b5'];

function avatarColorFor(account) {
  if (avatarColors.includes(account.avatarColor)) return account.avatarColor;
  // Older accounts keep a stable color based on their immutable account ID.
  let index = 0;
  for (const character of accountId(account)) {
    index = (index * 31 + character.codePointAt(0)) % avatarColors.length;
  }
  return avatarColors[index];
}

function readTeam() {
  const saved = JSON.parse(localStorage.getItem(teamKey));
  return saved ?? { created: [], removed: [] };
}

function activeAccounts(team = readTeam()) {
  return [...accounts, ...team.created].filter((account) => !team.removed.includes(accountId(account)));
}

function readAccount(account) {
  const id = accountId(account);
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(profileKey(id)));
  } catch {
    saved = null;
  }
  return {
    id,
    role: account.role ?? 'Field Reporter',
    avatarColor: avatarColorFor(account),
    fullName: saved?.fullName ?? account.fullName,
    email: saved?.email ?? account.email,
    phone: saved?.phone ?? account.phone,
    passwordHash: saved?.passwordHash ?? localStorage.getItem(passwordKey(id)) ?? account.initialHash,
  };
}

function accountProfile({ id, fullName, email, phone, role, avatarColor }) {
  return { id, fullName, email, phone, role, avatarColor, barangay: role === 'MDRRMO Officer' ? 'Apalit' : demoBarangay };
}

function normalizePhone(phone) {
  const value = phone.trim();
  if (!/^\+?[\d\s()-]+$/.test(value)) return value;
  return value.replace(/[\s()-]/g, '').replace(/^\+63(?=9)/, '0');
}

export function getSignedInAccount() {
  const id = localStorage.getItem(sessionKey);
  const account = activeAccounts().find((candidate) => accountId(candidate) === id);
  if (!account) return null;
  return accountProfile(readAccount(account));
}

export function signOut() {
  localStorage.removeItem(sessionKey);
}

async function digest(password) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Open FloodIntel over HTTPS or use http://localhost to sign in.');
  }
  const bytes = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function checkConnection(simulateFailure) {
  await new Promise((resolve) => setTimeout(resolve, 350));
  if (!navigator.onLine) throw new Error('You’re offline. Reconnect and try again.');
  if (simulateFailure) throw new Error('The demo service is unavailable. Turn off the failure simulation and retry.');
}

export async function signIn(identifier, password, simulateFailure) {
  await checkConnection(simulateFailure);
  const login = normalizePhone(identifier).toLowerCase();
  const hash = await digest(password);
  const account = activeAccounts().map(readAccount).find(({ email, phone }) => email === login || phone === login);
  if (!account || hash !== account.passwordHash) {
    throw new Error('The phone number, email address, or password is incorrect.');
  }
  localStorage.setItem(sessionKey, account.id);
  return accountProfile(account);
}

function reporterContact({ fullName, email, phone }) {
  const name = fullName.trim();
  const address = email.trim().toLowerCase();
  const number = normalizePhone(phone);
  if (!name) throw new Error('Enter your full name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw new Error('Enter a valid email address.');
  if (!/^09\d{9}$/.test(number)) throw new Error('Enter a Philippine mobile number, such as 09123456789.');
  return { fullName: name, email: address, phone: number };
}

function checkUniqueContact({ email, phone }, existing) {
  if (existing.some((account) => account.email === email)) throw new Error('That email address is already in use.');
  if (existing.some((account) => account.phone === phone)) throw new Error('That mobile number is already in use.');
}

function requireOfficer() {
  if (getSignedInAccount()?.role !== 'BDRRM Officer') throw new Error('Sign in as a BDRRM Officer to manage the team.');
}

export function listFieldReporters() {
  requireOfficer();
  return activeAccounts().map(readAccount).filter(({ role }) => role === 'Field Reporter').map(accountProfile);
}

export function listBarangayOfficers() {
  if (getSignedInAccount()?.role !== 'MDRRMO Officer') return [];
  return activeAccounts().map(readAccount).filter(({ role }) => role === 'BDRRM Officer').map(accountProfile);
}

export async function createFieldReporter({ fullName, email, phone, password }) {
  requireOfficer();
  const contact = reporterContact({ fullName, email, phone });
  if (password.length < 6) throw new Error('Enter at least 6 characters for the temporary password.');
  const initialHash = await digest(password);
  requireOfficer();
  const team = readTeam();
  checkUniqueContact(contact, activeAccounts(team).map(readAccount));
  const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
  team.created.push({ id: crypto.randomUUID(), ...contact, initialHash, avatarColor });
  localStorage.setItem(teamKey, JSON.stringify(team));
}

export function removeFieldReporter(id) {
  requireOfficer();
  const team = readTeam();
  const account = activeAccounts(team).find((candidate) => accountId(candidate) === id);
  if (!account || (account.role && account.role !== 'Field Reporter')) throw new Error('This Field Reporter is no longer on the team.');
  if (!account.id) team.removed.push(id);
  team.created = team.created.filter((candidate) => candidate.id !== id);
  localStorage.setItem(teamKey, JSON.stringify(team));
  localStorage.removeItem(resetKey(id));
  localStorage.removeItem(profileKey(id));
  localStorage.removeItem(passwordKey(id));
}

export async function updateAccountProfile(id, { fullName, email, phone, currentPassword, newPassword, confirmPassword }) {
  const fixture = activeAccounts().find((account) => accountId(account) === id);
  if (!fixture || localStorage.getItem(sessionKey) !== id) throw new Error('Sign in again to edit your profile.');
  const contact = reporterContact({ fullName, email, phone });

  let previousHash;
  let newHash;
  if (currentPassword || newPassword || confirmPassword) {
    if (!currentPassword) throw new Error('Enter your current password.');
    if (newPassword.length < 6) throw new Error('Enter at least 6 characters for the new password.');
    if (newPassword !== confirmPassword) throw new Error('The new passwords do not match.');
    [previousHash, newHash] = await Promise.all([digest(currentPassword), digest(newPassword)]);
  }

  const current = readAccount(fixture);
  if (getSignedInAccount()?.id !== id) throw new Error('Sign in again to edit your profile.');
  if (previousHash && current.passwordHash !== previousHash) throw new Error('The current password is incorrect.');
  const others = activeAccounts().filter((account) => accountId(account) !== id).map(readAccount);
  checkUniqueContact(contact, others);

  const updated = { id, role: current.role, ...contact, passwordHash: newHash ?? current.passwordHash };
  localStorage.setItem(profileKey(id), JSON.stringify(updated));
  if (current.email !== contact.email || newHash) localStorage.removeItem(resetKey(id));
  return accountProfile({ ...updated, avatarColor: current.avatarColor });
}

export async function requestPasswordReset(email, simulateFailure) {
  await checkConnection(simulateFailure);
  const address = email.trim().toLowerCase();
  const account = activeAccounts().map(readAccount).find((candidate) => candidate.email === address);
  if (!account) return null;
  const token = crypto.randomUUID();
  localStorage.setItem(resetKey(account.id), JSON.stringify({ token, expires: Date.now() + 30 * 60 * 1000 }));
  const url = new URL(window.location.href);
  url.hash = 'reset=' + token;
  return url.href;
}

function findResetAccount(token) {
  if (!token) return undefined;
  return activeAccounts().find((account) => {
    try {
      const reset = JSON.parse(localStorage.getItem(resetKey(accountId(account))));
      return reset?.token === token && reset.expires > Date.now();
    } catch {
      return false;
    }
  });
}

export function canResetPassword(token) {
  return Boolean(findResetAccount(token));
}

export async function updatePassword(token, password, simulateFailure) {
  await checkConnection(simulateFailure);
  if (password.length < 6) throw new Error('Enter at least 6 characters.');
  const hash = await digest(password);
  const account = findResetAccount(token);
  if (!account) throw new Error('This reset link is invalid or expired. Request a new link.');
  const id = accountId(account);
  localStorage.setItem(profileKey(id), JSON.stringify({ ...readAccount(account), passwordHash: hash }));
  localStorage.removeItem(resetKey(id));
  if (localStorage.getItem(sessionKey) === id) signOut();
}
