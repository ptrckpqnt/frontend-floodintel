# FloodIntel Frontend Plan

**Status:** Authentication and Field Reporter are available in demo mode. See README.md for the current build and test instructions.

## Authentication

- Sign in with a phone number or email address and password. Keep the session across app closes and reopens. Log Out ends the session.
- Use **Send Reset Link** to request an email with a **Reset Password** button. The button opens the new-password form. After updating the password, return to Sign In.
- BDRRMO creates and manages Field Reporter accounts. MDRRMO creates and manages BDRRMO accounts.
- The demo uses sample Field Reporter accounts and a simulated reset email. Confirm real session behavior, role routing, and email delivery during Laravel integration.

## Goal

Build FloodIntel's React frontend from scratch. Use the evolving Figma Make draft as the design reference. Make the frontend demoable with sample data and keep its screens ready for later backend integration. The panel requires a PWA. The frontend should support offline use where it can work locally and always show connection status. The revised capstone paper requires the Field Reporter to queue reports offline and send them automatically when connectivity returns. Confirm the panel’s demo devices and browsers before testing.

Patrick owns frontend decisions and reviews each workflow in the browser. Codex can translate those decisions into code, run checks, and give Patrick a short way to try each change. The backend teammate can continue independently until the frontend is ready for handoff.

## Build order

| Stage | Work | How we know it is done |
| --- | --- | --- |
| 1. Plan the first workflow | Choose one screen and user action from the draft. Record what the user enters, sees, and does next. Mark unclear design details as open. | Patrick can describe the workflow and its expected result in a few sentences. |
| 2. Start the React project | After Patrick gives the go-ahead, set up React. Vite is the proposed starter. Add run and build commands to the project README. | The project runs locally and the production build succeeds. |
| 3. Build one end-to-end workflow with sample data | A flood report form is a suggested first workflow. Confirm fields from the design. Implement validation, submission progress, confirmation, and a retryable failure. | Patrick can try a valid submission, missing fields, and a simulated failure on a phone-sized screen. |
| 4. Expand the frontend | Repeat the same pattern for each agreed workflow. Record each screen's data needs and show relevant loading, empty, and error states. | Each selected workflow can be demoed in sample mode and reviewed against the draft. |
| 5. Verify PWA behavior | Agree on the panel demo expectations. Set up the manifest, icons, and service worker. Test installation and the agreed offline experience using a production build on a target device. | Installation and the agreed offline behavior are demonstrated. Test offline queueing, persistence across app restarts, ordered automatic sync, and duplicate prevention. |
| 6. Hand off and connect | Show the working frontend to the backend teammate. Compare the draft data needs with the real endpoints, authentication, payloads, and errors. Connect and test one workflow at a time. | A real request succeeds, real failures are shown clearly, and any differences from the draft are documented. |

## Offline reporting and connection status

Source: *REVISED_ Chapter I-III.pdf*, Chapter I (Field Reporter workflow and Scope and Limitations) and Chapter III (client-side mapping and latency testing).

| Situation | Frontend behavior | UI |
| --- | --- | --- |
| FloodIntel API responds | Accept reports and track server acknowledgments. | **Online** |
| Device loses its connection | Keep the Field Reporter available after the initial online setup. Store each report on the device, including water level, estimated affected households, photograph, GPS coordinates, and the original capture timestamp. | **Offline** · **Queued on this device** |
| Device has connectivity but the API is unreachable | Keep queued reports on the device and recheck API reachability. | **Server unavailable** |
| API becomes reachable | Automatically send queued reports in capture order. Keep each report queued until acknowledged. | **Online** · **Syncing** during upload · **Submitted** after acknowledgment |

- Put the connection indicator in a consistent location on mobile and desktop. Show **Checking connection** until the app verifies API reachability.
- Use a service worker to cache the app and supported MapLibre base layers. Use IndexedDB for persistent report records and photos. Preserve the observation timestamp during sync. Wait for a valid GPS reading or explain what the user needs to fix if positioning is unavailable.
- Attempt automatic sync while the app is open and when it reopens with connectivity. Treat sync while the app is closed as device- and browser-dependent until tested. If a server validation error requires user action, show the issue and keep the local record.
- At handoff, agree on how the Laravel API will acknowledge each report and recognize a stable client-generated report ID when a request is retried. The Command Center receives reports after sync. Acknowledgment means received, and MDRRMO validation is a separate step before map display.
- Test with two offline reports and photos. Reopen the app while offline, verify the queue and cached base layers, restore connectivity, and confirm both reports arrive once in capture order with their original timestamps. Simulate an API outage separately. Exclude offline-queued reports from the paper’s latency calculation.
- Chapter I also describes existing radio channels for total connectivity loss. The app’s queue preserves reports until delivery is possible.

## Keep screens ready for backend integration

- Screens call named functions such as `submitFloodReport()`. Keep data access outside components in a small service layer.
- Start with a sample implementation of each function. Simulate success, delays, and failures so the frontend can be tested independently. Use synthetic records only.
- When the API is available, add a real implementation behind the same functions. Translate the API's fields and error responses into the formats the UI expects. Keep a simple way to run the sample demo.
- Treat the frontend data shapes as proposals. A mismatch in data fields can often be handled in the service layer. A mismatch in required input, permissions, or workflow may require a UI change.
- In sample mode, label submissions as simulated. Once connected, show a report as submitted only after the server confirms it. Show pending reports separately and let sample mode simulate an API outage and recovery.

### Backend handoff notes

Add one row per workflow as it is built. An ERD can clarify relationships if available. Fill in real endpoint details at handoff.

| Workflow | Frontend action | Minimum data needed | Outcomes to show | Open questions |
| --- | --- | --- | --- | --- |
| Flood report submission (proposed) | `submitFloodReport()` | Form values, photo, and a confirmed report ID | Sending, success, validation error, network or server failure | Confirm the proposed contract with the Laravel team and choose the authentication mechanism |

### Proposed Laravel report endpoint

`POST /api/reports` accepts an authenticated Field Reporter's submission as `multipart/form-data`. Laravel derives the reporter and barangay from the authenticated account.

| Fields | Expected values |
| --- | --- |
| `general_area`, `landmark` | Required general area and optional landmark |
| `water_level_cm`, `water_flow` | Non-negative depth in centimeters and one of `Still`, `Slow`, or `Fast` |
| `estimated_affected_families`, `description` | Optional non-negative whole number and a required description of at least 10 characters |
| `evacuation_needed`, `accessible_by_rescue_boat`, `vulnerable_residents` | Boolean flags sent as `0` or `1`, and one of `None`, `Present`, or `Unknown` |
| `photo`, `captured_at` | Required image upload and the original device-recorded photo timestamp in ISO 8601 |
| `latitude`, `longitude` | Decimal coordinates submitted together. Both may be omitted for an offline report saved without a location fix. |

Laravel generates the official report `id`. The frontend uses the existing local submission UUID as a separate `Idempotency-Key` request header and reuses it for retries of the same submission. Laravel should enforce uniqueness for the authenticated reporter and retry key, and return the existing report ID if the original request already succeeded.

On first success, return HTTP `201` after saving the report and photo. A successful replay can return HTTP `200` with the same report ID.

```json
{
  "id": 482,
  "status": "Awaiting Review",
  "received_at": "2026-11-28T09:15:00Z"
}
```

The frontend keeps the report pending until it receives this acknowledgment. Validation errors should return HTTP `422` with field-level messages so the reporter can fix the submission. Network failures or retryable server errors leave the report queued with its photo and original timestamp.

## Work in VS Code with Codex

1. Create a folder named `FloodIntel` on your computer when you are ready. Download this Markdown file into it and keep the filename.
2. In VS Code, choose **File → Open Folder** and open that folder.
3. Install the official **Codex extension by OpenAI** from the Extensions panel. Open the Codex sidebar and sign in with your ChatGPT account. No separate Claude subscription is needed for this workflow. Codex usage depends on your ChatGPT plan. [OpenAI setup guide](https://developers.openai.com/codex/ide) · [Codex plan information](https://openai.com/codex/)
4. Open this Markdown file in VS Code and paste the starter prompt below into Codex. This file carries the relevant decisions from the planning chat into your local workspace.
5. When you authorize implementation, give Codex one task at a time. Ask it to explain which files changed, which checks ran, and how you can try the result. Open the app and review the behavior before moving on.

### Starter prompt for the planning phase

> Read FloodIntel-Frontend-Plan.md in this folder. Use this workspace and the information I provide in this conversation as the source of truth. We are still planning. Summarize the agreed decisions, then help me define the first workflow from my Figma draft. Wait for my instruction before creating the React app, installing packages, or editing files.

### Prompt to use when it is time to build

> Read FloodIntel-Frontend-Plan.md. Implement only [screen and action]. Use sample data through the service layer and show [expected success and failure behavior]. Run the relevant checks and tell me how to test it in my browser.

## Decisions to capture as we go

- First workflow and the Figma screen or screenshot that represents it.
- Target devices and browsers for the PWA demo, including automatic sync behavior.
- UI data assumptions and later changes agreed with the backend teammate.
