// The Laravel adapter can replace this function once the API contract is available.
export async function submitFloodReport(report) {
  await new Promise((resolve) => setTimeout(resolve, 450));
  return { id: report.clientId, simulated: true };
}
