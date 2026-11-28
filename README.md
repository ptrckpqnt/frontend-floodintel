# FloodIntel frontend

The React demo opens with the authentication flow from the Figma draft. Signing in opens the workspace for the account's role.

## Frontend structure

- `src/main.jsx` mounts React and loads the stylesheets.
- `src/App.jsx` handles the session and chooses which screen to show.
- `src/features/auth/` contains sign-in, password reset, and the demo account service.
- `src/features/field-reporter/` contains the Field Reporter workspace, profile editor, flood report form, and report submission service.
- `src/styles/base.css` contains shared page and form styles. The authentication and Field Reporter styles live with their features.

- `src/features/bdrrmo/` contains the BDRRM Officer dashboard and its demo views.
- `src/features/mdrrmo/` contains the municipal map, Situation Reports, and Priority views.
- `src/components/WorkspaceSidebar.jsx` provides shared navigation and branding.

## Open in VS Code

1. Extract the ZIP and open the FloodIntel folder in VS Code.
2. Open **Terminal → New Terminal**. With Node.js 22.12+ installed, run:

   ```sh
   npm ci
   npm run dev
   ```

3. Open the local address shown in the terminal. Allow location access when testing the form. Localhost supports browser geolocation. Use HTTPS to test it from a hosted link on a phone.
4. To check the production build, run `npm run build`.

## Try authentication

1. Sign in with a sample Field Reporter’s registered email or mobile number and password. Close and reopen the app at the same address to check that you stay signed in. Select **Log Out** and reopen again to check that Sign In appears.
2. Try empty fields and an incorrect password to check the validation messages.
3. Select **Forgot password?**, enter a sample account’s registered email, and select **Send Reset Link**. Open **Reset Password** in the simulated email shown below the form. Enter matching passwords of at least six characters, update the password, and sign in again with the new password.

All bundled demo accounts start with the password `Floodinteldemo`. Sample sign-in and password changes are stored in the browser by account. Real authentication, email delivery, and account management require the Laravel backend.

## Try the Field Reporter workflow

- From Home, open **View All** to see My Reports or **Submit Flood Report** to open the form. On mobile, the camera-plus button also opens the form. On desktop, My Reports and Submit are available in the sidebar.
- Open **Profile** to log out. Reports and attached photos are stored in this browser. Submitted reports also appear in the BDRRMO Inbox for the assigned barangay when you switch accounts on the same site. The form uses centimeters for water level.

- Submit an empty form and check the required field messages.
- Enter water level and affected households, choose a sample image, and capture location.
- Submit the completed form and check the demo confirmation.
- Use synthetic data. The demo service does not upload the image or coordinates.

## Try the MDRRMO workspace

Sign in with the MDRRMO demo account using mobile number `09000000001` and its demo password. Submit a synthetic Field Reporter report with GPS coordinates, then use the BDRRMO account to accept it and include it in a SitRep endorsed to MDRRMO. Switch to the MDRRMO account at the same site address in the same browser to see the report on the map and in Situation Reports. The Priority view highlights evacuation needs, reported vulnerable residents, and the deepest reported locations.

To enable the map, copy `.env.example` to `.env.local` in the project root and set `VITE_MAPBOX_ACCESS_TOKEN` to a public Mapbox token starting with `pk.`. Restart Vite after editing the file. In Windows PowerShell, run `npm.cmd run dev` and open the local address it prints. Sign in as MDRRMO and select **Load map**. Mapbox initializes only after that click. The map opens over Apalit with a **Sample marker** and shows depth for endorsed reports with GPS coordinates.

The Mapbox basemap requires internet access and a WebGL 2 browser. The public token is included in the browser build. Shared reporting across devices requires a backend.

## San Vicente sample reports

The demo starts with five sample reports each for Mateo Reyes, Paolo Navarro, and Lara Mendoza. Twelve are included in three endorsed SitReps, two await BDRRMO review, and one needs correction. Lara's demo sign-in is `ninasantos@example.test` or `09000000008`, with password `Floodinteldemo`.

The scenarios and measurements are fictional. Locations use approximate pins around real landmarks in [San Vicente, Apalit](https://www.kapekulitan.region3.dilg.gov.ph/sikap-barangay-hub/lgus/apalit/ap-san-vicente/ap-geographic-san-vicente). Each sample report has its own generated flood illustration, bundled with the demo.

## Try offline field reporting

1. Run `npm run build` and `npm run preview`, then open the preview URL while online. The offline app cache is enabled in production builds on HTTPS and localhost.
2. Sign in as a Field Reporter. After the first online visit, go offline and reload the page. Create a report with a photo and select **Save offline**. Enter the general area even if your device cannot capture GPS offline.
3. Open **My Reports** to see the report marked **Pending sync**. Reconnect with the reporter workspace open to move it to the demo inbox in the same browser.

## Try offline BDRRMO endorsements

1. Open the production preview online and sign in as a BDRRM Officer. Use `noel.pangilinan@example.test` to try Tabuyuc’s sample report awaiting review. Go offline and reload to review reports saved in this browser.
2. Accept a report, create a SitRep, and select **Queue endorsement**. The SitRep shows **Pending sync**, and its reports are reserved for that SitRep.
3. Reconnect with the BDRRMO workspace open. The SitRep becomes **Endorsed**, and the linked reports become visible in the MDRRMO demo in this browser.

## Try offline MDRRMO viewing

Open the production preview and sign in as MDRRMO while online. Go offline to browse the last saved set of endorsed reports and Priority results. The live map and account changes require a connection. Reconnect to refresh the report list from this browser’s demo data.

First-time sign-in and password reset require a connection. Reports and photos remain in browser storage. Shared delivery across devices requires the Laravel backend.
