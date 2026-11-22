// The Laravel adapter can replace this function once the API contract is available.
export async function submitFloodReport(report, { simulateFailure = false } = {}) {
  await new Promise((resolve) => setTimeout(resolve, 450));
  if (simulateFailure) {
    throw new Error('The demo server could not receive this report. Try again.');
  }
  return { id: report.clientId, simulated: true };
}
