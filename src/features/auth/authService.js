import { demoAccounts as accounts, demoBarangay } from './demoAccounts.js';

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
  // Profiles written by older demos also stored a copy of the original contact details.
  const oldName = !saved?.contactVersion && saved?.fullName === account.previousName;
  const oldPhone = !saved?.contactVersion && saved?.phone === account.previousPhone;
  return {
    id,
    role: account.role ?? 'Field Reporter',
    barangay: account.barangay ?? demoBarangay,
    avatarColor: avatarColorFor(account),
    fullName: oldName ? account.fullName : saved?.fullName ?? account.fullName,
    email: saved?.email ?? account.email,
    phone: oldPhone ? account.phone : saved?.phone ?? account.phone,
    passwordHash: saved?.passwordHash ?? localStorage.getItem(passwordKey(id)) ?? account.initialHash,
  };
}

function accountProfile({ id, fullName, email, phone, role, avatarColor, barangay }) {
  return { id, fullName, email, phone, role, avatarColor, barangay };
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

function requireOfficer(role) {
  const manager = getSignedInAccount();
  if (manager?.role !== role) throw new Error(`Sign in with a ${role} account to manage the team.`);
  return manager;
}

export function listFieldReporters() {
  const manager = requireOfficer('BDRRM Officer');
  return activeAccounts().map(readAccount)
    .filter(({ role, barangay }) => role === 'Field Reporter' && barangay === manager.barangay)
    .map(accountProfile);
}

export function listBarangayOfficers() {
  if (getSignedInAccount()?.role !== 'MDRRMO Officer') return [];
  return activeAccounts().map(readAccount).filter(({ role }) => role === 'BDRRM Officer').map(accountProfile);
}

export function createFieldReporter(values) {
  return createTeamAccount(values, 'Field Reporter', 'BDRRM Officer');
}

export function createBarangayOfficer(values) {
  return createTeamAccount(values, 'BDRRM Officer', 'MDRRMO Officer');
}

async function createTeamAccount({ fullName, email, phone, password }, role, managerRole) {
  const manager = requireOfficer(managerRole);
  const contact = reporterContact({ fullName, email, phone });
  if (password.length < 6) throw new Error('Enter at least 6 characters for the temporary password.');
  const initialHash = await digest(password);
  if (requireOfficer(managerRole).id !== manager.id) throw new Error('Sign in again to create an account.');
  const team = readTeam();
  checkUniqueContact(contact, activeAccounts(team).map(readAccount));
  const avatarColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];
  const barangay = role === 'Field Reporter' ? manager.barangay : demoBarangay;
  team.created.push({ id: crypto.randomUUID(), ...contact, role, barangay, initialHash, avatarColor });
  localStorage.setItem(teamKey, JSON.stringify(team));
}

export function removeFieldReporter(id) {
  removeTeamAccount(id, 'Field Reporter', 'BDRRM Officer');
}

export function removeBarangayOfficer(id) {
  removeTeamAccount(id, 'BDRRM Officer', 'MDRRMO Officer');
}

function removeTeamAccount(id, role, managerRole) {
  const manager = requireOfficer(managerRole);
  const team = readTeam();
  const account = activeAccounts(team).find((candidate) => accountId(candidate) === id);
  if (!account || (account.role ?? 'Field Reporter') !== role ||
    (role === 'Field Reporter' && (account.barangay ?? demoBarangay) !== manager.barangay)) {
    throw new Error(`This ${role} is no longer on the team.`);
  }
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
  localStorage.setItem(profileKey(id), JSON.stringify({ ...updated, contactVersion: 2 }));
  if (current.email !== contact.email || newHash) localStorage.removeItem(resetKey(id));
  return accountProfile({ ...updated, avatarColor: current.avatarColor, barangay: current.barangay });
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
  localStorage.setItem(profileKey(id), JSON.stringify({ ...readAccount(account), passwordHash: hash, contactVersion: 2 }));
  localStorage.removeItem(resetKey(id));
  if (localStorage.getItem(sessionKey) === id) signOut();
}
