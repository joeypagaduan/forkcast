# Moving from Forkcast 1.x to 2.0

Forkcast 2.0 is a separate, independent build. Nothing in it touches the old version, so 1.x keeps working as a backup the whole time.

**Groups and history don't carry over.** 2.0 starts fresh, and re-creating a group takes under a minute. Old sessions stay in your "Forkcast Data" Google Sheet.

## Phase 1: Set up 2.0 (about 10 minutes)

1. Save `forkcast-v2.0.zip` to your Windows Downloads folder.
2. Paste this into WSL:
   ```bash
   cd ~ && unzip -o "$(ls -t /mnt/c/Users/*/Downloads/forkcast-v2*.zip | head -1)" && cd forkcast-v2 && bash scripts/setup.sh
   ```
3. Follow the prompts: Firebase sign-in, then GitHub sign-in. It will tell you if anything needs a click in your browser.
4. **If you ran the 1.2 GitHub version:** setup sees your existing `forkcast` repo and asks to rename it `forkcast-v1`. Say yes.
   - 2.0 then takes over the `joeypagaduan.github.io/forkcast/` address, so old bookmarks open the new app.
   - 1.2 keeps running at `/forkcast-v1/`.
5. When it says **Done**, wait about a minute, then open the app address it prints.

## Phase 2: Test it yourself (about 5 minutes)

On your phone:
1. Open the new address and enter your name.
2. Do a quick solo swipe and check the results.
3. Create your real group, for example "The Apartment".
4. Open the group on your iPad (scan the QR), join, and start a Dinner session.
5. Submit on one device and watch the other update live (the "● Live" badge).
6. Optional: add it to your home screen.
   - iPhone or iPad: Share > Add to Home Screen.
   - Android: menu > Add to Home screen.
   - Note: the home-screen app counts as a new device, so rejoin your group from it with the code.

If anything fails, the old version is still running. Copy the error and send it to Claude.

## Phase 3: Move everyone over

1. Send the new link, or show the QR code from the group screen, to everyone who used Forkcast.
2. Everyone enters their name once and joins with the code or QR.
3. Use 2.0 for real meals for about a week. The old version stays untouched.

## Phase 4: Retire 1.x (keep it as a backup)

Do the steps for whichever old versions you set up.

### If you used the Apps Script version (1.0 or 1.1, made in the Apps Script editor)

1. Open https://script.google.com and open the Forkcast project.
2. Click **Deploy > Manage deployments**.
3. Select the web app deployment and click **Archive**. The old link stops working, but the code and the "Forkcast Data" sheet stay in your Drive. To bring it back: **Deploy > New deployment**.
4. Optional, after a month or so: download a copy of the "Forkcast Data" sheet (File > Download > Excel), then delete it if you don't want it.

### If you used the GitHub version (1.2)

From the old project folder (usually `~/forkcast`):

```bash
cd ~/forkcast
source .forkcast.env
cd apps-script && clasp list-deployments    # shows the API deployment
clasp delete-deployment "$DEPLOYMENT_ID"    # turns the 1.2 API off (code stays in the project)
cd ~
gh repo archive joeypagaduan/forkcast-v1 --yes   # makes the old repo read-only (reversible in repo Settings)
```

Optional: turn off its Pages site in GitHub. Open the `forkcast-v1` repo, go to Settings > Pages, and click **Unpublish site**.

### Clean up your WSL folders (optional)

```bash
mv ~/forkcast ~/forkcast-v1-backup   # keep the 1.2 folder, renamed so it's clearly the old one
```

## Undo

- **Bring back the Apps Script version:** in the Apps Script editor, click Deploy > New deployment > Web app.
- **Bring back the 1.2 repo:**
  1. On GitHub, unarchive it under Settings > Danger Zone.
  2. Republish its API:
     ```bash
     cd ~/forkcast-v1-backup && bash scripts/setup.sh
     ```
- **Firebase 2.0 can be paused** by deleting the project in the Firebase console. Only do this if you're going back to 1.x for good.
