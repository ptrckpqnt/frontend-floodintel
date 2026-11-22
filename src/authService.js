// Client-side fixtures for the demo. Laravel will own production authentication.
const accounts = [
  { fullName: 'Mark Jason Patron', email: 'markjasonpatron@gmail.com', phone: '09000000001', initialHash: '332380e74195a60f4df62aef6b1869540492112ab00217322ede4dea1926dbcc' },
  { fullName: 'Jeremy Ortega', email: 'jeremyortega@gmail.com', phone: '09000000002', initialHash: '464b035251edede494de26c675b39d73ffc5d9e599c8c0d83ded783c1eab979d' },
  { fullName: 'Aljon Ken Fernandez', email: 'aljonkenfernandez@gmail.com', phone: '09000000003', initialHash: '5e2c3e9e303da226b679cb0b67fa008055654c3121a5cdd0810c7e3c5aa3edd4' },
];

const sessionKey = 'floodintel.demo.reporter.session';
const passwordKey = (email) => `floodintel.demo.password.${email}`;
const resetKey = (email) => `floodintel.demo.reset.${email}`;

export function getSignedInReporter() {
  const email = localStorage.getItem(sessionKey);
  const account = accounts.find((candidate) => candidate.email === email);
  if (!account) return null;
  return { fullName: account.fullName, email, phone: account.phone, role: 'Field Reporter', barangay: 'Paligui' };
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
  const login = identifier.trim().toLowerCase();
  const account = accounts.find(({ email, phone }) => email === login || phone === login);
  if (!account || await digest(password) !== (localStorage.getItem(passwordKey(account.email)) ?? account.initialHash)) {
    throw new Error('The phone number, email address, or password is incorrect.');
  }
  localStorage.setItem(sessionKey, account.email);
  return getSignedInReporter();
}

export async function requestPasswordReset(email, simulateFailure) {
  await checkConnection(simulateFailure);
  const address = email.trim().toLowerCase();
  if (!accounts.some((account) => account.email === address)) return null;
  const token = crypto.randomUUID();
  localStorage.setItem(resetKey(address), JSON.stringify({ token, expires: Date.now() + 30 * 60 * 1000 }));
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
  localStorage.setItem(passwordKey(account.email), hash);
  localStorage.removeItem(resetKey(account.email));
  if (localStorage.getItem(sessionKey) === account.email) signOut();
}
