# FloodIntel frontend

The React demo opens with the authentication flow from the Figma draft. Signing in opens the Field Reporter form, which uses a provisional layout and water level unit (centimeters).

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

1. Sign in with `reporter@example.com` or `09170000000` and the initial password `FloodDemo123`. Close and reopen the app at the same address to check that you stay signed in. Select **Log Out** and reopen again to check that Sign In appears.
2. Try empty fields, an incorrect password, and **Simulate a server failure**. Turn the simulation off to retry.
3. Select **Forgot password?**, enter `reporter@example.com`, and select **Send Reset Link**. Open **Reset Password** in the simulated email shown below the form. Enter matching passwords of at least six characters, update the password, and sign in again with the new password.

Authentication and password changes are stored in the browser for the synthetic demo account. Clear this site's data to restore the initial password. Real authentication, email delivery, and account management require the Laravel backend.

## Try the Field Reporter workflow

- Submit an empty form and check the required field messages.
- Enter water level and affected households, choose a sample image, and capture location.
- Turn on **Simulate a server failure**, submit, and check the error. Turn it off and retry. The confirmation is a demo response.
- Use synthetic data. The demo service does not upload the image or coordinates.

The offline queue, connection indicator, PWA installation, hosting, and Laravel integration are later milestones. See [FloodIntel-Frontend-Plan.md](FloodIntel-Frontend-Plan.md).

For Codex in VS Code: “Read the plan and README. Review this first milestone, then help me implement and test the offline queue and connection indicator for the Field Reporter workflow.”
