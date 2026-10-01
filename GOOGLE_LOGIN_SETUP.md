# QuickChat — Real Google Login Setup

The app code now uses Firebase Authentication with the real Google provider. It no longer contains the fake account picker or hardcoded Google emails.

## 1. Open the correct Firebase project

Project ID:

`quickchat-b43d0`

Open Firebase Console and select this project.

## 2. Enable Google Sign-In

Firebase Console → Authentication → Sign-in method → Google → Enable → choose a support email → Save.

## 3. Add your website domain

Firebase Console → Authentication → Settings → Authorized domains → Add domain.

Add the exact domain where QuickChat is running, for example:

- `localhost` for local development if needed
- your Vercel production domain
- your custom domain if you have one

Do not add a domain that you do not control.

## 4. Firestore rules

The project contains an updated `firestore.rules` file. Deploy these rules from the Firebase CLI after checking the chat/matchmaking data model:

`firebase deploy --only firestore:rules`

Do not use the old rules that contain `allow read, write: if true;` in production.

## 5. Install dependencies on the machine where you run the project

The ZIP intentionally does NOT include `node_modules`. Run:

`npm install`

Then:

`npm run dev`

## 6. Test Google login

1. Open the app.
2. Click **Sign in with Google**.
3. The real Google account chooser should open.
4. Select a real Google account.
5. Firebase Authentication should create/sign in the user.
6. Firestore should create/update `users/{Firebase UID}`.
7. Refresh the page. The user should remain signed in.
8. Open Profile → Sign Out. Firebase should sign the user out.
9. Sign in again and verify the same Firebase UID/profile is reused.

## Important security note

The original ZIP contained a `.env.local` file with a Vercel OIDC token. That file has intentionally been excluded from the cleaned ZIP. If that token was active or shared anywhere, revoke/rotate it in Vercel and create a fresh token when needed.


## Guest Login
Enable Firebase Console → Authentication → Sign-in method → Anonymous. The app uses Firebase `signInAnonymously()`; it does not create a fake local guest account. Guest users receive a real Firebase UID and their profile is stored under `users/{uid}`.
