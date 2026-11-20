# Forkcast HANDOFF (v{{VERSION}})

Everything needed to run, fix, or rebuild Forkcast. This file is regenerated on every deploy, so the source below always matches what's live.

| | |
|---|---|
| App | {{SITE_URL}} |
| Repo | {{REPO}} |
| Firebase project | {{FIREBASE_PROJECT}} (https://console.firebase.google.com/project/{{FIREBASE_PROJECT}}) |
| Created by | whathappened |

## How it works

- **Front end:** `web/` is a static site on GitHub Pages. `index.html` holds the screens, food list, recipe links, and nearby links. `data.js` talks to Firebase.
- **Sign-in:** Firebase Anonymous Auth. Each browser gets its own private ID automatically, with no account. Clearing site data, or using a different browser or the home-screen app, counts as a new person (they just rejoin with the group code).
- **Data:** Cloud Firestore.
  - `groups/{id}` holds the name, invite code, members, and `memberIds`.
  - `codes/{CODE}` points an invite code to its group.
  - `sessions/{id}` holds the group, day, meal, label, and `submittedBy`.
  - `sessions/{id}/submissions/{uid}` holds each person's likes and dislikes.
  - `users/{uid}` holds the person's name, photo version, and archived sessions.
  - `avatars/{uid}` holds the profile photo, a small JPEG of about 20 KB. Photos live in Firestore because Firebase Storage needs the paid Blaze plan.
- **Security:** `firestore.rules`.
  - You only see groups you belong to.
  - You can only change your own name and membership.
  - You see other people's picks only after submitting your own.
- **Auto-archive:** sessions older than 72 hours are hidden in the app, unless that person unarchived them. Nothing is deleted.

## Setup (one line in WSL)

Put the zip in your Windows Downloads folder, then:

```bash
cd ~ && unzip -o "$(ls -t /mnt/c/Users/*/Downloads/forkcast-v2*.zip | head -1)" && cd forkcast-v2 && bash scripts/setup.sh
```

`setup.sh` installs the Firebase CLI if needed, signs you in to Firebase and GitHub, creates the Firebase project, web app, and database, publishes the rules, turns on anonymous sign-in, writes `web/firebase-config.js`, creates the GitHub repo, and turns on Pages.

Options: `FIREBASE_PROJECT=existing-id`, `REPO_NAME=name`, `FIRESTORE_LOCATION=nam5`.

## Everyday commands (from the forkcast-v2 folder)

| Do this | Run |
|---|---|
| Preview locally (real data) | `bash scripts/dev.sh` then open http://localhost:8080 |
| Publish everything | `bash scripts/deploy.sh` |
| Publish app only | `bash scripts/deploy.sh --web` |
| Add a commit note | `bash scripts/deploy.sh -m "new foods"` |
| Watch Pages publish | `gh run watch` |
| Rebuild these docs | `node scripts/build-docs.mjs` |
| Test Firebase sign-in | `bash scripts/check-auth.sh` |
| Install an update zip | `cd ~ && unzip -o "$(ls -t /mnt/c/Users/*/Downloads/forkcast-v2*-update.zip \| head -1)" && cd forkcast-v2 && bash scripts/deploy.sh` |

## Making changes

- **Version:** bump `APP_VERSION` in `web/index.html` and add a `CHANGELOG` entry (`['2.1', ['what changed'], 'YYYY-MM-DD']`). Every release gets a new number. The version shows on the opening screen, the home screen, Settings > About, and FEATURES.md.
- **Foods:** `CATALOG` in `web/index.html` (`[id, name, meals BLDS, style, emoji, accent, accent, blurb]`).
- **Recipe links:** `RECIPES` (NYT recipe path like `1025489-chicken-adobo`).
- **Nearby searches:** `NEARBY`.
- **Data shape changes:** if you rename a Firestore field or collection, update `data.js` and `firestore.rules` together, deploy without `--web`, and call it out in the CHANGELOG.

## Troubleshooting

- **"Forkcast isn't connected to Firebase yet":** `web/firebase-config.js` is empty. Run `bash scripts/setup.sh`.
- **Check sign-in from WSL:** `bash scripts/check-auth.sh`.
- **"Sign-in isn't turned on in Firebase yet" (raw error: auth/configuration-not-found):** Firebase console > Authentication > Sign-in method > Anonymous > Enable. Or run `firebase deploy --only auth`.
- **"You don't have access to that":** the person isn't in the group. Have them use the invite code or QR. If it happens to everyone, the rules didn't publish: `firebase deploy --only firestore`.
- **Firestore asks for an index:** the error message includes a link that creates it. Or run `firebase deploy --only firestore:indexes`.
- **Firebase sign-in from WSL doesn't open a browser:** `firebase login --no-localhost`, or `sudo apt install wslu && export BROWSER=wslview`.
- **The site didn't update:** `gh run watch`, or check the repo's Actions tab. Phones may cache the page; pull to refresh.
- **Downloads folder not found:** if Windows keeps Downloads in OneDrive, use the full path, for example `/mnt/c/Users/<you>/OneDrive/Downloads/forkcast-v2.0.zip`.
