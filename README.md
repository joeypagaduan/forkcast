# Forkcast 2.0

Swipe to decide what to eat, solo or with your group. Created by whathappened.

- **Set up:** paste this into WSL (with the zip in your Windows Downloads folder):
  ```bash
  cd ~ && unzip -o "$(ls -t /mnt/c/Users/*/Downloads/forkcast-v2*.zip | head -1)" && cd forkcast-v2 && bash scripts/setup.sh
  ```
- **Publish changes:** `bash scripts/deploy.sh`
- **Preview locally:** `bash scripts/dev.sh`

Docs:
- [HANDOFF.md](HANDOFF.md): how it works, commands, troubleshooting, and full source
- [FEATURES.md](FEATURES.md): shareable features list and version log
- [SUNSET.md](SUNSET.md): moving from Forkcast 1.x and retiring it

```
web/            The app (GitHub Pages): index.html (screens), data.js (Firebase), icons
firestore.rules Who can read and write what
firebase.json   Firestore + anonymous sign-in settings
scripts/        setup.sh, deploy.sh, dev.sh, build-docs.mjs
```
