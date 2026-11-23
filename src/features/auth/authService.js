// Client-side fixtures for the demo. Laravel will own production authentication.
const accounts = [
  { fullName: 'Mark Jason Patron', email: 'markjasonpatron@gmail.com', phone: '09000000001', initialHash: '332380e74195a60f4df62aef6b1869540492112ab00217322ede4dea1926dbcc' },
  { fullName: 'Patrick Pioquinto', email: 'patrickpioquinto@gmail.com', phone: '09000000004', role: 'BDRRM Officer', initialHash: 'c5f71e11073a7245bb5ce15fcb72a9d66a069e5e0bb1d6790dd95344ab8e66b2' },
  { fullName: 'Aljon Ken Fernandez', email: 'aljonkenfernandez@gmail.com', phone: '09000000003', initialHash: '5e2c3e9e303da226b679cb0b67fa008055654c3121a5cdd0810c7e3c5aa3edd4' },
];

const sessionKey = 'floodintel.demo.reporter.session';
const passwordKey = (email) => `floodintel.demo.password.${email}`;
const resetKey = (email) => `floodintel.demo.reset.${email}`;
const profileKey = (id) => `floodintel.demo.profile.${id}`;

function readAccount(account) {
  const id = account.email;
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(profileKey(id)));
  } catch {
    saved = null;
  }
  return {
    id,
    role: account.role ?? 'Field Reporter',
    fullName: saved?.fullName ?? account.fullName,
    email: saved?.email ?? account.email,
    phone: saved?.phone ?? account.phone,
    passwordHash: saved?.passwordHash ?? localStorage.getItem(passwordKey(id)) ?? account.initialHash,
  };
}

function accountProfile({ id, fullName, email, phone, role }) {
  return { id, fullName, email, phone, role, barangay: 'Paligui' };
}

function normalizePhone(phone) {
  return phone.trim().replace(/^\+63(?=9)/, '0');
}

export function getSignedInAccount() {
  const id = localStorage.getItem(sessionKey);
  const account = accounts.find((candidate) => candidate.email === id);
  if (!account) return null;
  return accountProfile(readAccount(account));
}

export function signOut() {
  localStorage.removeItem(sessionKey);
}

async function digest(password) {
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
  const account = accounts.map(readAccount).find(({ email, phone }) => email === login || phone === login);
  if (!account || hash !== account.passwordHash) {
    throw new Error('The phone number, email address, or password is incorrect.');
  }
  localStorage.setItem(sessionKey, account.id);
  return accountProfile(account);
}

export async function updateReporterProfile(id, { fullName, email, phone, currentPassword, newPassword, confirmPassword }) {
  const fixture = accounts.find((account) => account.email === id);
  if (!fixture || fixture.role === 'BDRRM Officer' || localStorage.getItem(sessionKey) !== id) throw new Error('Sign in again to edit your profile.');
  const name = fullName.trim();
  const address = email.trim().toLowerCase();
  const number = normalizePhone(phone);
  if (!name) throw new Error('Enter your full name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw new Error('Enter a valid email address.');
  if (!/^09\d{9}$/.test(number)) throw new Error('Enter a Philippine mobile number, such as 09123456789.');

  let previousHash;
  let newHash;
  if (currentPassword || newPassword || confirmPassword) {
    if (!currentPassword) throw new Error('Enter your current password.');
    if (newPassword.length < 6) throw new Error('Enter at least 6 characters for the new password.');
    if (newPassword !== confirmPassword) throw new Error('The new passwords do not match.');
    [previousHash, newHash] = await Promise.all([digest(currentPassword), digest(newPassword)]);
  }

  const current = readAccount(fixture);
  if (localStorage.getItem(sessionKey) !== id) throw new Error('Sign in again to edit your profile.');
  if (previousHash && current.passwordHash !== previousHash) throw new Error('The current password is incorrect.');
  const others = accounts.filter((account) => account.email !== id).map(readAccount);
  if (others.some((account) => account.email === address)) throw new Error('That email address is already in use.');
  if (others.some((account) => account.phone === number)) throw new Error('That mobile number is already in use.');

  const updated = { id, role: current.role, fullName: name, email: address, phone: number, passwordHash: newHash ?? current.passwordHash };
  localStorage.setItem(profileKey(id), JSON.stringify(updated));
  if (current.email !== address || newHash) localStorage.removeItem(resetKey(id));
  return accountProfile(updated);
}

export async function requestPasswordReset(email, simulateFailure) {
  await checkConnection(simulateFailure);
  const address = email.trim().toLowerCase();
  const account = accounts.map(readAccount).find((candidate) => candidate.email === address);
  if (!account) return null;
  const token = crypto.randomUUID();
  localStorage.setItem(resetKey(account.id), JSON.stringify({ token, expires: Date.now() + 30 * 60 * 1000 }));
  const url = new URL(window.location.href);
  url.hash = 'reset=' + token;
  return url.href;
}

function findResetAccount(token) {
  if (!token) return undefined;
  return accounts.find(({ email }) => {
    try {
      const reset = JSON.parse(localStorage.getItem(resetKey(email)));
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
  localStorage.setItem(profileKey(account.email), JSON.stringify({ ...readAccount(account), passwordHash: hash }));
  localStorage.removeItem(resetKey(account.email));
  if (localStorage.getItem(sessionKey) === account.email) signOut();
}
