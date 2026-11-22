export const demoEmail = 'reporter@example.com';
export const demoPhone = '09170000000';
export const demoPassword = 'FloodDemo123';

const sessionKey = 'floodintel.demo.session';
const passwordKey = 'floodintel.demo.password';
const resetKey = 'floodintel.demo.reset';

export function isSignedIn() {
  return localStorage.getItem(sessionKey) === demoEmail;
}

export function hasUpdatedPassword() {
  return localStorage.getItem(passwordKey) !== null;
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
  const account = identifier.trim().toLowerCase();
  const expected = localStorage.getItem(passwordKey) ?? await digest(demoPassword);
  if (![demoEmail, demoPhone].includes(account) || await digest(password) !== expected) {
    throw new Error('The phone number, email address, or password is incorrect.');
  }
  localStorage.setItem(sessionKey, demoEmail);
}

export async function requestPasswordReset(email, simulateFailure) {
  await checkConnection(simulateFailure);
  // Stand-in for the email delivery step, available only for the synthetic account.
  if (email.trim().toLowerCase() !== demoEmail) return null;
  const token = crypto.randomUUID();
  localStorage.setItem(resetKey, JSON.stringify({ token, expires: Date.now() + 30 * 60 * 1000 }));
  const url = new URL(window.location.href);
  url.hash = 'reset=' + token;
  return url.href;
}

export function canResetPassword(token) {
  try {
    const reset = JSON.parse(localStorage.getItem(resetKey));
    return Boolean(token && reset?.token === token && reset.expires > Date.now());
  } catch {
    return false;
  }
}

export async function updatePassword(token, password, simulateFailure) {
  await checkConnection(simulateFailure);
  if (password.length < 6) throw new Error('Enter at least 6 characters.');
  const hash = await digest(password);
  if (!canResetPassword(token)) throw new Error('This reset link is invalid or expired. Request a new link.');
  localStorage.removeItem(resetKey);
  localStorage.setItem(passwordKey, hash);
  signOut();
}
