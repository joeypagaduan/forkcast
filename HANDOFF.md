# Forkcast HANDOFF (v2.0.1)

Everything needed to run, fix, or rebuild Forkcast. This file is regenerated on every deploy, so the source below always matches what's live.

| | |
|---|---|
| App | https://joeypagaduan.github.io/forkcast/ |
| Repo | https://github.com/joeypagaduan/forkcast |
| Firebase project | forkcast-bz89c (https://console.firebase.google.com/project/forkcast-bz89c) |
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

## Version log

### 2.0.1 (November 20, 2026)
- Profile photos: take a selfie or upload one in Settings > Profile; it shows in your groups and results
- Full screen on phones and tablets, and it stays that way (change it in Settings > Look)
- Bigger, bolder back arrow
- Clearer message when Firebase sign-in isn't set up yet

### 2.0 (November 19, 2026)
- Rebuilt on Firebase: everything loads faster and works through spotty connections
- Live results: matches appear the moment anyone submits, no refreshing
- No sign-up: each phone gets its own private ID automatically
- Group data is protected so only members can see their group

### 1.2 (November 19, 2026)
- Runs from GitHub Pages with its own web address and no Google banner
- Opens faster: your groups and sessions show right away from your last visit, then refresh
- Add Forkcast to your phone's home screen with its own app icon
- Invite links open straight into the group and tidy up the address bar

### 1.1 (November 19, 2026)
- Swipe sessions left or right to archive them, with an optional confirmation
- Sessions archive themselves after 72 hours; restore them from Settings, Archived
- Settings organized into sections
- Updated food list: new egg, Filipino, and Japanese curry options
- NYT Cooking recipe links on results
- Find it nearby buttons that open Google Maps or Apple Maps

### 1.0 (November 19, 2026)
- Swipe to decide what to eat, solo or with a group
- Groups you join by code or QR, with sessions by day and meal
- Matches and full results once everyone submits
- Themes, accent colors, text size, and animation settings

## Full source

Icons (web/*.png) aren't included as text. Everything else needed to rebuild Forkcast v2.0.1 is below.

### web/index.html

````html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Forkcast</title>
<meta name="theme-color" content="#FF5A5F">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Forkcast">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="preconnect" href="https://www.gstatic.com" crossorigin>
<link rel="preconnect" href="https://firestore.googleapis.com" crossorigin>
<script src="firebase-config.js"></script>
<style>
:root{
  --accent:#FF5A5F; --bg:#FFF8F2; --surface:#FFFFFF; --surface2:#F5ECE3; --text:#2B2118;
  --muted:#8A7B6E; --line:#EADFD5; --shadow:0 8px 28px rgba(80,40,10,.10); --r:20px;
  --yes:#1FA463; --no:#E5484D; font-size:16px;
}
html[data-theme=dark]{
  --bg:#15120F; --surface:#221D18; --surface2:#2D2620; --text:#F5EDE6; --muted:#A99B8D;
  --line:#3A322A; --shadow:0 8px 28px rgba(0,0,0,.45);
}
html[data-size=large]{font-size:18.5px}
html[data-motion=off] *{transition:none!important;animation:none!important}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:ui-rounded,"SF Pro Rounded",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  min-height:100vh;-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased}
button{font:inherit;color:inherit;cursor:pointer}
button:disabled{opacity:.35;cursor:default}
.wrap{max-width:480px;margin:0 auto;padding:max(14px,env(safe-area-inset-top)) 16px max(40px,calc(env(safe-area-inset-bottom) + 24px));min-height:100vh;min-height:100dvh;display:flex;flex-direction:column}
.back-btn{width:44px;height:44px;flex:none;border:none;background:none;padding:0;margin-left:-6px;display:grid;place-items:center;color:var(--text);border-radius:12px}
.back-btn svg{width:32px;height:32px}
.back-btn:active{background:var(--surface2)}
.me-btn{border:none;background:none;padding:0;flex:none;border-radius:50%}
.av{--s:32px;width:var(--s);height:var(--s);border-radius:50%;flex:none;display:inline-grid;place-items:center;overflow:hidden;
  color:#fff;font-weight:900;font-size:calc(var(--s) * .4);line-height:1;letter-spacing:.02em;vertical-align:middle}
.av img{width:100%;height:100%;object-fit:cover;display:block}
.me-btn .av{box-shadow:0 0 0 3px var(--surface),var(--shadow)}
.pchip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px 4px 4px}
.pf{display:flex;align-items:center;gap:16px;margin-bottom:18px}
.pf .av{box-shadow:var(--shadow)}
.pf-btns{display:flex;flex-direction:column;gap:8px;align-items:flex-start}
.pf-btns label{cursor:pointer}
.center{justify-content:center;text-align:center;gap:14px}
.topbar{display:flex;align-items:center;gap:10px;margin-bottom:14px;min-height:44px}
.topbar h1{flex:1;font-size:1.15rem;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.topbar .sub{display:block;font-size:.78rem;font-weight:600;color:var(--muted)}
.logo{width:44px;height:44px;border-radius:14px;background:var(--accent);display:grid;place-items:center;font-size:1.4rem;color:#fff;flex:none}
.icon-btn{width:44px;height:44px;flex:none;border-radius:14px;border:none;background:var(--surface);box-shadow:var(--shadow);font-size:1.25rem;display:grid;place-items:center}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px 18px;border-radius:16px;border:none;
  font-weight:800;font-size:1rem;background:var(--accent);color:#fff;transition:transform .12s}
.btn:active{transform:scale(.97)}
.btn.ghost{background:var(--surface2);color:var(--text)}
.btn.small{width:auto;padding:9px 14px;font-size:.88rem;border-radius:12px}
.btn.link{background:none;color:var(--muted);font-weight:700;font-size:.9rem}
.card{background:var(--surface);border-radius:var(--r);padding:16px;box-shadow:var(--shadow);margin-bottom:14px}
.label{font-size:.75rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin:4px 2px 10px}
h2{font-size:1.35rem;font-weight:800;line-height:1.2;margin-bottom:12px}
.muted{color:var(--muted)}
.gap{display:flex;flex-direction:column;gap:12px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.seg{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:4px;background:var(--surface2);padding:4px;border-radius:14px;margin-bottom:12px}
.seg button{border:none;background:none;padding:10px 4px;border-radius:11px;font-weight:700;font-size:.88rem;display:flex;flex-direction:column;align-items:center;gap:2px}
.seg button .e{font-size:1.25rem}
.seg button.on{background:var(--surface);box-shadow:0 2px 8px rgba(0,0,0,.08);color:var(--accent)}
.field{width:100%;padding:13px 14px;border-radius:14px;border:2px solid var(--line);background:var(--surface);color:var(--text);font:inherit;font-size:1rem;outline:none}
.field:focus{border-color:var(--accent)}
.field.code-in{text-transform:uppercase;letter-spacing:.3em;text-align:center;font-weight:800;font-size:1.3rem}
.row{display:flex;align-items:center;gap:10px}
.grow{flex:1;min-width:0}
.item{display:flex;align-items:center;gap:12px;padding:12px;border-radius:16px;background:var(--surface);box-shadow:var(--shadow);
  margin-bottom:10px;border:none;width:100%;text-align:left}
.item .t{font-weight:800}
.item .s{font-size:.85rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ico{width:46px;height:46px;border-radius:14px;background:var(--surface2);display:grid;place-items:center;font-size:1.5rem;flex:none}
.badge{font-size:.78rem;font-weight:800;padding:6px 10px;border-radius:99px;background:var(--accent);color:#fff;flex:none}
.badge.done{background:var(--surface2);color:var(--text)}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{font-size:.82rem;font-weight:700;padding:6px 10px;border-radius:99px;background:var(--surface2)}
.chip.ok{background:color-mix(in srgb,var(--yes) 18%,transparent);color:var(--yes)}
.empty{text-align:center;padding:22px 10px;color:var(--muted);font-weight:600}

/* Invite */
.invite{display:flex;gap:14px;align-items:center}
.qr{width:116px;height:116px;border-radius:14px;background:#fff;padding:6px;flex:none;border:1px solid var(--line)}
.code{font-size:1.9rem;font-weight:900;letter-spacing:.14em;margin:-4px 0 8px}

/* Food art: a plate on a gingham tablecloth */
.art{position:relative;overflow:hidden;container-type:size;
  background:
    linear-gradient(90deg,rgba(255,255,255,.16) 50%,transparent 50%),
    linear-gradient(rgba(255,255,255,.16) 50%,transparent 50%),
    linear-gradient(135deg,var(--c1),var(--c2));
  background-size:36px 36px,36px 36px,100% 100%}
.art::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,transparent 40%,rgba(0,0,0,.18));pointer-events:none}
.art .plate{position:absolute;left:50%;top:50%;width:64cqmin;height:64cqmin;transform:translate(-50%,-50%);border-radius:50%;
  background:radial-gradient(circle,#fff 0 54%,#f1ece6 55% 61%,#fff 62% 71%,#e7e0d8 72% 100%);
  box-shadow:0 14px 26px rgba(0,0,0,.28),inset 0 -5px 10px rgba(0,0,0,.06)}
.art .main{position:absolute;left:50%;top:50%;transform:translate(-50%,-54%);font-size:34cqmin;line-height:1;
  filter:drop-shadow(0 6px 5px rgba(0,0,0,.25))}
.art .acc{position:absolute;font-size:15cqmin;line-height:1;filter:drop-shadow(0 4px 4px rgba(0,0,0,.25))}
.art .a1{left:7%;top:8%;transform:rotate(-14deg)}
.art .a2{right:7%;bottom:8%;transform:rotate(12deg)}
.art.out{background:
    radial-gradient(circle at 20% 25%,rgba(255,255,255,.5) 0 1.5px,transparent 2px),
    radial-gradient(circle at 75% 15%,rgba(255,255,255,.4) 0 1.5px,transparent 2px),
    radial-gradient(circle at 85% 70%,rgba(255,255,255,.35) 0 1.5px,transparent 2px),
    linear-gradient(135deg,var(--c1),var(--c2));
  background-size:90px 90px,120px 120px,70px 70px,100% 100%}
.art.out .plate{background:radial-gradient(circle,rgba(255,255,255,.35),rgba(255,255,255,.08) 60%,transparent 70%);box-shadow:none}

/* Swipe */
.progress{height:6px;background:var(--surface2);border-radius:99px;overflow:hidden}
.progress i{display:block;height:100%;background:var(--accent);border-radius:99px;transition:width .3s}
.count{font-size:.8rem;font-weight:700;color:var(--muted);text-align:right;margin:6px 2px 8px}
.stack{position:relative;height:min(60vh,540px);min-height:380px;margin-bottom:18px}
.scard{position:absolute;inset:0;background:var(--surface);border-radius:28px;box-shadow:var(--shadow);overflow:hidden;
  display:flex;flex-direction:column;touch-action:none;user-select:none;-webkit-user-select:none;will-change:transform}
.scard.top{animation:rise .28s ease-out;cursor:grab}
.scard.next{transform:scale(.94) translateY(14px);opacity:.9}
@keyframes rise{from{transform:scale(.94) translateY(14px)}to{transform:none}}
.scard .art{flex:1}
.scard .info{padding:16px 20px 20px}
.scard .name{font-size:1.5rem;font-weight:900;line-height:1.15}
.scard .blurb{color:var(--muted);font-weight:600;margin-top:4px}
.stamp{position:absolute;top:22px;z-index:2;padding:6px 14px;border:4px solid;border-radius:12px;font-weight:900;font-size:1.5rem;
  letter-spacing:.06em;opacity:0;background:rgba(255,255,255,.92)}
.stamp.yes{left:18px;color:var(--yes);border-color:var(--yes);transform:rotate(-12deg)}
.stamp.no{right:18px;color:var(--no);border-color:var(--no);transform:rotate(12deg)}
.actions{display:flex;justify-content:center;align-items:center;gap:22px}
.round{width:70px;height:70px;border-radius:50%;border:none;background:var(--surface);box-shadow:var(--shadow);font-size:1.9rem;font-weight:900;
  display:grid;place-items:center;transition:transform .12s}
.round:active{transform:scale(.9)}
.round.no{color:var(--no)} .round.yes{color:var(--yes)}
.round.sm{width:50px;height:50px;font-size:1.2rem;color:var(--muted)}
.hint{text-align:center;color:var(--muted);font-weight:600;font-size:.88rem;margin-top:14px}

/* Results */
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}
.tile{border-radius:18px;overflow:hidden;background:var(--surface);box-shadow:var(--shadow)}
.tile .art{aspect-ratio:1}
.tile .tn{padding:9px 10px;font-weight:800;font-size:.9rem;line-height:1.2}
.tile.win{outline:4px solid var(--accent);transform:scale(1.03)}
.rank{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--line)}
.rank:last-child{border:none}
.rank .art{width:52px;height:52px;border-radius:14px;flex:none}
.bar{height:6px;background:var(--surface2);border-radius:99px;margin:6px 0 4px;overflow:hidden}
.bar i{display:block;height:100%;background:var(--accent)}
.big-emoji{font-size:3rem;line-height:1}
.rlink{display:flex;align-items:center;gap:8px;padding:12px 14px;border-radius:14px;background:var(--surface);border:2px solid var(--line);
  color:var(--text);text-decoration:none;font-weight:700;margin-bottom:8px;text-align:left}
.rlink.more{background:var(--surface2);border-color:transparent;color:var(--muted)}
.tile .rb,.rank .rb{font-size:.75rem;font-weight:800;color:var(--accent)}
.tile[data-act]{cursor:pointer}
.rank .rbtn{border:none;background:var(--surface2);border-radius:10px;padding:8px 10px;font-weight:800;font-size:.8rem;flex:none}

/* Modal, toast, busy bar */
#modal-root .back{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center;z-index:50;animation:fade .2s}
#modal-root .sheet{background:var(--bg);width:100%;max-width:480px;border-radius:24px 24px 0 0;padding:20px 18px max(28px,calc(env(safe-area-inset-bottom) + 16px));max-height:90vh;overflow:auto;animation:up .25s ease-out}
@keyframes fade{from{opacity:0}} @keyframes up{from{transform:translateY(40px);opacity:0}}
/* Swipe-to-archive rows */
.srow{position:relative;margin-bottom:10px;border-radius:16px;overflow:hidden;transition:height .25s,margin .25s,opacity .25s}
.srow .item{margin:0;position:relative;z-index:1;touch-action:pan-y;transition:transform .25s}
.srow .item.dragging{transition:none}
.srow .bg{position:absolute;inset:0;border-radius:16px;background:var(--surface2);display:flex;align-items:center;justify-content:space-between;
  padding:0 20px;font-weight:800;color:var(--muted);font-size:.9rem}
.srow.ready .bg{background:var(--accent);color:#fff}
.hint-sm{font-size:.8rem;color:var(--muted);font-weight:600;margin:-4px 2px 10px}
.archived-link{display:block;width:100%;margin-top:4px;text-align:center}
/* Settings toolbar */
.tabs{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;background:var(--surface2);padding:4px;border-radius:16px;margin:0 0 18px;position:sticky;top:-20px;z-index:2}
.tabs button{border:none;background:none;border-radius:12px;padding:8px 2px;font-weight:700;font-size:.76rem;display:flex;flex-direction:column;align-items:center;gap:2px;color:var(--muted)}
.tabs button .e{font-size:1.3rem}
.tabs button.on{background:var(--surface);color:var(--accent);box-shadow:0 2px 8px rgba(0,0,0,.08)}
.set-pane{min-height:300px}
.opt{display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:16px;border:2px solid var(--line);background:var(--surface);width:100%;text-align:left;margin-bottom:10px}
.opt.on{border-color:var(--accent)}
.opt .dot{width:20px;height:20px;border-radius:50%;border:2px solid var(--line);flex:none;margin-top:2px}
.opt.on .dot{border:6px solid var(--accent)}
.opt .t{font-weight:800} .opt .s{font-size:.85rem;color:var(--muted);font-weight:600;margin-top:2px}
.check{display:flex;align-items:center;gap:10px;font-weight:700;font-size:.92rem;margin:4px 0 14px}
.check input{width:20px;height:20px;accent-color:var(--accent)}
#toast button{background:none;border:none;color:var(--accent);font-weight:900;margin-left:12px;font-size:.92rem}
.swatches{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.sw{width:40px;height:40px;border-radius:50%;border:3px solid transparent;box-shadow:inset 0 0 0 3px var(--bg)}
.sw.on{border-color:var(--text)}
#toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);background:var(--text);color:var(--bg);padding:12px 18px;border-radius:14px;
  font-weight:700;font-size:.92rem;opacity:0;pointer-events:none;transition:.25s;z-index:60;max-width:90vw;text-align:center}
#toast.show{opacity:1;transform:translateX(-50%)}
#toast.has-act{pointer-events:auto}
#bar{position:fixed;top:0;left:0;height:3px;width:0;background:var(--accent);z-index:70;transition:width .4s,opacity .3s;opacity:0}
#bar.on{width:80%;opacity:1;transition:width 3s ease-out}
.skel{height:70px;border-radius:16px;background:var(--surface2);margin-bottom:10px;animation:pulse 1.2s infinite alternate}
@keyframes pulse{to{opacity:.5}}
.credit{text-align:center;font-size:.8rem;font-weight:700;color:var(--muted);margin-top:auto;padding-top:22px}
.about-head{text-align:center;padding:6px 0 4px}
.about-head .logo{margin:0 auto 10px;width:64px;height:64px;font-size:2rem;border-radius:20px}
.about-head h3{font-size:1.4rem;font-weight:900}
.ver{display:inline-block;margin-top:6px;font-size:.8rem;font-weight:800;padding:5px 10px;border-radius:99px;background:var(--surface2)}
.cl{margin:0 0 14px;padding-left:20px} .cl li{margin-bottom:6px;font-weight:600;font-size:.92rem}
.collage{display:flex;justify-content:center;gap:10px;margin-bottom:6px}
.collage .art{width:84px;height:84px;border-radius:22px;box-shadow:var(--shadow)}
.collage .art:nth-child(1){transform:rotate(-8deg)} .collage .art:nth-child(3){transform:rotate(8deg)}
.collage .art:nth-child(2){width:100px;height:100px;margin-top:-10px}
</style>
</head>
<body>
<div id="bar"></div>
<div id="app"></div>
<div id="modal-root"></div>
<div id="toast"></div>

<script type="module">
import { DB, ready, configured, watchResults, friendlyError } from './data.js';
(function () {
'use strict';

/* ============ Food catalog ============
   [id, name, meals (B L D S), style, main emoji, accent 1, accent 2, blurb] */
const APP_VERSION = '2.0.1';
const APP_CREDIT = 'whathappened';
const CHANGELOG = [
  ['2.0.1', ['Profile photos: take a selfie or upload one in Settings > Profile; it shows in your groups and results',
             'Full screen on phones and tablets, and it stays that way (change it in Settings > Look)',
             'Bigger, bolder back arrow',
             'Clearer message when Firebase sign-in isn\'t set up yet'], '2026-11-20'],
  ['2.0', ['Rebuilt on Firebase: everything loads faster and works through spotty connections',
           'Live results: matches appear the moment anyone submits, no refreshing',
           'No sign-up: each phone gets its own private ID automatically',
           'Group data is protected so only members can see their group'], '2026-11-19'],
  ['1.2', ['Runs from GitHub Pages with its own web address and no Google banner',
           'Opens faster: your groups and sessions show right away from your last visit, then refresh',
           'Add Forkcast to your phone\'s home screen with its own app icon',
           'Invite links open straight into the group and tidy up the address bar'], '2026-11-19'],
  ['1.1', ['Swipe sessions left or right to archive them, with an optional confirmation',
           'Sessions archive themselves after 72 hours; restore them from Settings, Archived',
           'Settings organized into sections',
           'Updated food list: new egg, Filipino, and Japanese curry options',
           'NYT Cooking recipe links on results',
           'Find it nearby buttons that open Google Maps or Apple Maps'], '2026-11-19'],
  ['1.0', ['Swipe to decide what to eat, solo or with a group',
           'Groups you join by code or QR, with sessions by day and meal',
           'Matches and full results once everyone submits',
           'Themes, accent colors, text size, and animation settings'], '2026-11-19']
];
function creditLine() {
  return '<p class="credit">Forkcast v' + APP_VERSION + ' · Created by ' + esc(APP_CREDIT) + '</p>';
}
const CATALOG = [
  ['leftovers','Leftovers','BLDS','comfort','🥡','🍴','♻️','Clear out the fridge first'],
  // Breakfast
  ['pancakes','Pancakes','B','brunch','🥞','🧈','🍓','Fluffy stack with butter and syrup'],
  ['waffles','Waffles','B','brunch','🧇','🍯','🫐','Crispy squares, all the toppings'],
  ['french-toast','French Toast','B','brunch','🍞','🥚','🍓','Cinnamon, powdered sugar, syrup'],
  ['eggs-bacon','Eggs & Bacon','B','brunch','🍳','🥓','☕','The diner classic at home'],
  ['breakfast-sausages','Breakfast Sausages','B','brunch','🌭','🍳','☕','Links or patties, browned and crispy'],
  ['fried-eggs','Fried Eggs','B','brunch','🍳','🧂','🍞','Sunny side up or over easy'],
  ['scrambled-eggs','Scrambled Eggs','B','brunch','🥚','🧈','🍞','Soft, buttery, ready in minutes'],
  ['cheesy-eggs','Cheesy Scrambled Eggs','B','brunch','🧀','🥚','🍞','Scrambled eggs with melty cheese'],
  ['omelette','Omelette','B','fresh','🥚','🧀','🫑','Fold in whatever is in the fridge'],
  ['breakfast-burritos','Breakfast Burritos','BL','mexican','🌯','🥚','🥔','Eggs, potatoes, cheese, salsa'],
  ['breakfast-tacos','Breakfast Tacos','B','mexican','🌮','🥚','🥑','Soft tortillas, eggs, chorizo'],
  ['chilaquiles','Chilaquiles','B','mexican','🥘','🌶️','🍳','Tortilla chips simmered in salsa'],
  ['bagels','Bagels','B','deli','🥯','🧀','☕','Cream cheese, lox, or egg and cheese'],
  ['avocado-toast','Avocado Toast','BL','fresh','🥑','🍞','🍳','Smashed avo, chili flakes, an egg'],
  ['breakfast-sandwich','Breakfast Sandwich','B','brunch','🥪','🥚','🥓','Egg, cheese, and meat on a muffin'],
  ['oatmeal','Oatmeal','B','fresh','🥣','🍌','🍯','Warm oats with fruit and honey'],
  ['cereal','Cereal','BS','brunch','🥛','🥣','🍓','Pour, crunch, done'],
  ['parfait','Yogurt Parfait','BS','fresh','🍓','🥛','🫐','Yogurt, granola, and berries'],
  ['smoothies','Smoothies','BS','fresh','🥤','🍌','🍓','Blend it and go'],
  ['silog','Silog Plate','BD','filipino','🍳','🍚','🧄','Garlic rice, egg, tapa or longganisa'],
  ['biscuits-gravy','Biscuits & Gravy','B','comfort','🥐','🧈','🍳','Flaky biscuits, peppery gravy'],
  ['hash-browns','Hash Browns','B','comfort','🥔','🧈','🍳','Golden, crispy shredded potatoes'],
  ['brinner','Breakfast for Dinner','D','brunch','🥞','🍳','🌙','Pancakes and eggs after dark'],
  // Lunch and dinner
  ['sandwiches','Sandwiches','L','deli','🥪','🥬','🧀','Build your own deli stack'],
  ['salad','Big Salad','LD','fresh','🥗','🥒','🍅','Greens loaded with toppings'],
  ['salad-wraps','Salad Wraps','LD','fresh','🥬','🥕','🍗','Crisp lettuce cups, fresh fillings'],
  ['quesadillas','Quesadillas','LDS','mexican','🫓','🧀','🌶️','Crispy tortillas, gooey cheese'],
  ['instant-ramen','Instant Ramen (Upgraded)','LDS','asian','🍜','🥚','🧅','Add an egg and green onion'],
  ['mac-cheese','Mac & Cheese','LD','comfort','🧀','🍝','🥓','Boxed or baked, always good'],
  ['burgers','Burgers','LD','american','🍔','🍟','🧅','Smash patties or the classic'],
  ['rice-bowls','Rice Bowls','LD','asian','🍚','🥑','🥢','Rice, protein, veggies, sauce'],
  ['soup','Soup Night','LD','comfort','🍲','🥖','🥕','Big pot and crusty bread'],
  ['nuggets','Chicken Nuggets & Fries','LDS','american','🍗','🍟','🥫','Air fryer comfort food'],
  ['mexican','Mexican','LD','mexican','🌮','🌶️','🥑','Tacos, enchiladas, burrito bowls'],
  ['taco-night','Taco Night','D','mexican','🌮','🧀','🍋','Build-your-own taco bar'],
  ['burritos','Burritos & Bowls','LD','mexican','🌯','🍚','🫘','Beans, rice, salsa, all wrapped'],
  ['enchiladas','Enchiladas','D','mexican','🫔','🧀','🌶️','Saucy, cheesy, baked'],
  ['nachos','Nachos','LDS','mexican','🧀','🌶️','🥑','Loaded sheet-pan nachos'],
  ['italian','Italian','LD','italian','🍝','🍅','🌿','Pasta, lasagna, chicken parm'],
  ['frozen-pizza','Frozen Pizza','LDS','american','🍕','❄️','🔥','Oven on, 15 minutes, done'],
  ['loaded-fries','Loaded Fries','LDS','american','🍟','🧀','🥓','Cheese, bacon, sauces, piled high'],
  ['indian','Indian','LD','indian','🍛','🫓','🌶️','Curry, dal, naan, basmati'],
  ['chinese','Chinese','LD','asian','🥡','🥢','🥦','Stir-fry, lo mein, orange chicken'],
  ['fried-rice','Fried Rice','LD','asian','🍚','🍳','🥢','Best use of day-old rice'],
  ['dumplings','Dumplings & Potstickers','LDS','asian','🥟','🥢','🧄','Pan-fried from the freezer'],
  ['thai','Thai','LD','asian','🥥','🍛','🌶️','Curry, pad thai, basil stir-fry'],
  ['japanese','Japanese','LD','asian','🍱','🍣','🥢','Teriyaki, katsu, sushi rolls'],
  ['japanese-curry','Japanese Curry','LD','asian','🍛','🍚','🥕','Thick, mild curry over rice'],
  ['korean','Korean','D','asian','🍲','🥩','🌶️','Bibimbap, bulgogi, kimchi stew'],
  ['filipino','Filipino','LD','filipino','🍗','🍚','🍜','Adobo, pancit, lumpia, sinigang'],
  ['chicken-adobo','Chicken Adobo','LD','filipino','🍗','🧄','🍚','Soy, vinegar, and garlic over rice'],
  ['sinigang','Sinigang','LD','filipino','🍲','🍅','🍋','Sour tamarind soup with pork'],
  ['vietnamese','Vietnamese','LD','asian','🍜','🌿','🍋','Pho, vermicelli bowls, spring rolls'],
  ['mediterranean','Mediterranean','LD','fresh','🥙','🫒','🧆','Gyros, falafel, hummus plates'],
  ['bbq','BBQ','D','american','🍖','🌽','🔥','Ribs, pulled pork, corn'],
  ['steak','Steak Night','D','american','🥩','🥔','🧈','Seared steak and potatoes'],
  ['roast-chicken','Roast Chicken & Veggies','D','comfort','🍗','🥕','🥔','Sheet-pan dinner, easy cleanup'],
  ['seafood','Seafood','D','fresh','🐟','🍤','🍋','Salmon, shrimp, fish tacos'],
  ['stir-fry','Stir Fry','LD','asian','🥦','🥢','🥩','Hot pan, veggies, protein, sauce'],
  ['freezer-meals','Freezer Meals','LD','american','🧊','🍽️','⏱️','Whatever is waiting in the freezer'],
  ['snack-plate','Snack Plate Dinner','LDS','snack','🍇','🧀','🥖','Cheese, crackers, fruit, cured meat'],
  // Snacks
  ['chips-dip','Chips & Dip','S','snack','🥔','🥑','🌶️','Guac, salsa, or French onion'],
  ['popcorn','Popcorn','S','snack','🍿','🧈','🧂','Buttery and movie-ready'],
  ['cheese-crackers','Cheese & Crackers','S','snack','🧀','🍘','🍇','Simple and snackable'],
  ['veggies-hummus','Veggies & Hummus','S','fresh','🥕','🥒','🫘','Crunchy and fresh'],
  ['fruit','Fresh Fruit','BS','fresh','🍉','🍍','🍇','Slice up whatever is ripe'],
  ['apples-pb','Apples & Peanut Butter','S','fresh','🍎','🥜','🍯','Crisp, sweet, filling'],
  ['cookies','Cookies','S','sweet','🍪','🥛','🍫','Fresh-baked or from the jar'],
  ['brownies','Brownies','S','sweet','🍫','🍦','🥛','A fudgy pan straight from the oven'],
  ['ice-cream','Ice Cream','S','sweet','🍦','🍒','🍫','Scoops, sundaes, or floats'],
  ['trail-mix','Trail Mix & Nuts','S','snack','🥜','🍫','🍇','Salty, sweet, grab a handful'],
  ['pretzels','Pretzels','S','snack','🥨','🧀','🍯','Soft or crunchy, with dip'],
  ['pizza-rolls','Pizza Rolls','S','american','🍕','🔥','🧀','Freezer bites, piping hot'],
  // Always last
  ['eat-out','Eat Out','BLDS','out','🍽️','🚗','✨','Nobody cooks, nobody cleans'],
  ['take-out','Get Take-out','BLDS','out','🛍️','🥡','🛵','Order in and stay comfy']
];
const PAL = {
  brunch:['#FFC24B','#FF7F3F'], mexican:['#F25C54','#F7B267'], italian:['#2E9E5B','#8FD694'],
  indian:['#F59E0B','#D9480F'], asian:['#C81D25','#FFB703'], filipino:['#FF8FA3','#FFC36B'],
  fresh:['#3FAE7A','#B5E3C4'], comfort:['#B5651D','#EDB06A'], american:['#E63946','#FF9F1C'],
  deli:['#8D6E63','#D7B49E'], snack:['#8E5CF7','#F15BB5'], sweet:['#FF7EB3','#FFC6A5'], out:['#1D3557','#4A7FB5']
};
/* ============ NYT Cooking links (results page only) ============
   q = search for "More on NYT Cooking"; r = hand-picked recipes [title, recipe path].
   Foods not listed here get no recipe links (Leftovers, Eat Out, Take-out, etc.). */
const NYT = 'https://cooking.nytimes.com/';
const RECIPES = {
  'pancakes': { q:'pancakes', r:[['Perfect Buttermilk Pancakes','1018180-perfect-buttermilk-pancakes'],['Everyday Pancakes','1893-everyday-pancakes']] },
  'waffles': { q:'waffles', r:[['Waffles','1017409-waffles'],['Simple Yeasted Waffles','1016179-simple-yeasted-waffles']] },
  'french-toast': { q:'french toast', r:[['French Toast','1023232-french-toast'],['Overnight French Toast','1019102-overnight-french-toast']] },
  'eggs-bacon': { q:'bacon and eggs', r:[['The Best Scrambled Eggs','1015676-the-best-scrambled-eggs']] },
  'breakfast-sausages': { q:'breakfast sausage' },
  'fried-eggs': { q:'fried eggs' },
  'scrambled-eggs': { q:'scrambled eggs', r:[['The Best Scrambled Eggs','1015676-the-best-scrambled-eggs'],['Extra-Creamy Scrambled Eggs','1021931-extra-creamy-scrambled-eggs']] },
  'cheesy-eggs': { q:'cheesy scrambled eggs', r:[['Velvety Scrambled Eggs','1023773-velvety-scrambled-eggs']] },
  'omelette': { q:'omelet' },
  'breakfast-burritos': { q:'breakfast burrito' },
  'breakfast-tacos': { q:'breakfast tacos' },
  'chilaquiles': { q:'chilaquiles', r:[['Chilaquiles Verdes','1024470-chilaquiles-verdes'],['Green Chilaquiles With Eggs','1017908-green-chilaquiles-with-eggs']] },
  'bagels': { q:'bagel' },
  'avocado-toast': { q:'avocado toast' },
  'breakfast-sandwich': { q:'breakfast sandwich' },
  'oatmeal': { q:'oatmeal' },
  'parfait': { q:'granola' },
  'smoothies': { q:'smoothie' },
  'silog': { q:'garlic fried rice' },
  'biscuits-gravy': { q:'biscuits and gravy' },
  'hash-browns': { q:'hash browns' },
  'brinner': { q:'breakfast for dinner', r:[['Perfect Buttermilk Pancakes','1018180-perfect-buttermilk-pancakes']] },
  'sandwiches': { q:'sandwich' },
  'salad': { q:'dinner salad' },
  'salad-wraps': { q:'lettuce wraps' },
  'quesadillas': { q:'quesadilla' },
  'instant-ramen': { q:'instant ramen' },
  'mac-cheese': { q:'mac and cheese', r:[['Stovetop Mac and Cheese','1025254-stovetop-mac-and-cheese']] },
  'burgers': { q:'burgers', r:[['Smash Burgers','1016595-smash-burgers'],['Oklahoma Onion Burgers','1023331-oklahoma-onion-burgers']] },
  'rice-bowls': { q:'rice bowl', r:[['Bibimbap','1024852-bibimbap']] },
  'soup': { q:'soup' },
  'nuggets': { q:'chicken nuggets' },
  'mexican': { q:'mexican', r:[['Chicken Enchiladas With Salsa Verde','1018153-chicken-enchiladas-with-salsa-verde'],['Chilaquiles Verdes','1024470-chilaquiles-verdes']] },
  'taco-night': { q:'tacos' },
  'burritos': { q:'burrito' },
  'enchiladas': { q:'enchiladas', r:[['Green Chicken Enchiladas','10447-green-chicken-enchiladas'],['Chicken Enchiladas With Salsa Verde','1018153-chicken-enchiladas-with-salsa-verde']] },
  'nachos': { q:'nachos' },
  'italian': { q:'italian pasta' },
  'loaded-fries': { q:'loaded fries' },
  'indian': { q:'indian', r:[['Meera Sodha’s Chicken Curry','1017746-meera-sodhas-chicken-curry']] },
  'chinese': { q:'chinese', r:[['Fried Rice','12177-fried-rice']] },
  'fried-rice': { q:'fried rice', r:[['Fried Rice','12177-fried-rice'],['Whatever You’ve Got Fried Rice','1020016-whatever-youve-got-fried-rice']] },
  'dumplings': { q:'dumplings' },
  'thai': { q:'thai', r:[['Pad Thai','1013121-pad-thai']] },
  'japanese': { q:'japanese', r:[['Chicken Katsu','1021957-chicken-katsu']] },
  'japanese-curry': { q:'japanese curry', r:[['Japanese Curry Brick','1020451-japanese-curry-brick']] },
  'korean': { q:'korean', r:[['Bibimbap','1024852-bibimbap']] },
  'filipino': { q:'filipino', r:[['Chicken Adobo','1025489-chicken-adobo'],['Pork Sinigang','1019216-pork-sinigang']] },
  'chicken-adobo': { q:'adobo', r:[['Chicken Adobo','1025489-chicken-adobo']] },
  'sinigang': { q:'sinigang', r:[['Pork Sinigang','1019216-pork-sinigang'],['Sinigang (Tamarind Broth With Pork and Vegetables)','1020493-sinigang-tamarind-broth-with-pork-and-vegetables']] },
  'vietnamese': { q:'vietnamese', r:[['Pressure Cooker Beef Pho','1017521-pressure-cooker-beef-pho']] },
  'mediterranean': { q:'mediterranean' },
  'bbq': { q:'pulled pork' },
  'steak': { q:'steak' },
  'roast-chicken': { q:'roast chicken', r:[['Sheet-Pan Roasted Chicken With Greens','1023814-sheet-pan-roasted-chicken-with-greens'],['Sheet-Pan Chicken With Sweet Potatoes and Fennel','1019861-sheet-pan-chicken-with-sweet-potatoes-and-fennel']] },
  'seafood': { q:'salmon', r:[['Roasted Dill Salmon','1020253-roasted-dill-salmon'],['Lemon Butter Salmon With Dill','1026765-lemon-butter-salmon-with-dill']] },
  'stir-fry': { q:'stir fry' },
  'snack-plate': { q:'snack board' },
  'chips-dip': { q:'dip' },
  'popcorn': { q:'popcorn' },
  'veggies-hummus': { q:'hummus' },
  'cookies': { q:'chocolate chip cookies', r:[['Chocolate Chip Cookies','1015819-chocolate-chip-cookies'],['Perfect Chocolate Chip Cookies','1021435-perfect-chocolate-chip-cookies']] },
  'brownies': { q:'brownies', r:[['Brownies','1024416-brownies'],['New Classic Brownies','1017218-new-classic-brownies']] },
  'ice-cream': { q:'ice cream' },
  'pretzels': { q:'soft pretzels' }
};
function recipeLinks(id) {
  const x = RECIPES[id]; if (!x) return '';
  const a = function (href, label, cls) {
    return '<a class="rlink' + (cls ? ' ' + cls : '') + '" href="' + href + '" target="_blank" rel="noopener">' + label + '</a>';
  };
  return '<div class="recipes"><div class="label" style="margin:14px 2px 8px">Cook it: NYT Cooking</div>' +
    (x.r || []).map(function (r) { return a(NYT + 'recipes/' + r[1], '📖 ' + esc(r[0])); }).join('') +
    a(NYT + 'search?q=' + encodeURIComponent(x.q), '🔎 More ' + esc(x.q) + ' recipes', 'more') + '</div>';
}
/* ============ Nearby restaurants (results page only) ============
   Opens a Maps search; the Maps app uses the phone's own location. No API key needed.
   Foods not listed (Leftovers, Cereal, Frozen Pizza, etc.) get no Maps button. */
const NEARBY = {
  'pancakes':'pancakes', 'waffles':'waffles', 'french-toast':'brunch', 'eggs-bacon':'breakfast diner',
  'breakfast-sausages':'breakfast diner', 'fried-eggs':'breakfast diner', 'scrambled-eggs':'breakfast diner',
  'cheesy-eggs':'breakfast diner', 'omelette':'omelette breakfast', 'breakfast-burritos':'breakfast burritos',
  'breakfast-tacos':'breakfast tacos', 'chilaquiles':'chilaquiles', 'bagels':'bagel shop', 'avocado-toast':'brunch cafe',
  'breakfast-sandwich':'breakfast sandwich', 'oatmeal':'breakfast cafe', 'parfait':'breakfast cafe', 'smoothies':'smoothie shop',
  'silog':'filipino breakfast silog', 'biscuits-gravy':'biscuits and gravy', 'hash-browns':'breakfast diner', 'brinner':'diner',
  'sandwiches':'sandwich shop', 'salad':'salad restaurant', 'salad-wraps':'lettuce wraps', 'quesadillas':'quesadillas',
  'instant-ramen':'ramen', 'mac-cheese':'mac and cheese', 'burgers':'burgers', 'rice-bowls':'rice bowls', 'soup':'soup restaurant',
  'nuggets':'chicken tenders', 'mexican':'mexican restaurant', 'taco-night':'tacos', 'burritos':'burritos', 'enchiladas':'enchiladas',
  'nachos':'nachos', 'italian':'italian restaurant', 'loaded-fries':'loaded fries', 'indian':'indian restaurant',
  'chinese':'chinese restaurant', 'fried-rice':'fried rice', 'dumplings':'dumplings', 'thai':'thai restaurant',
  'japanese':'japanese restaurant', 'japanese-curry':'japanese curry', 'korean':'korean restaurant', 'filipino':'filipino restaurant',
  'chicken-adobo':'filipino restaurant', 'sinigang':'filipino restaurant sinigang', 'vietnamese':'vietnamese pho',
  'mediterranean':'mediterranean restaurant', 'bbq':'bbq restaurant', 'steak':'steakhouse', 'roast-chicken':'rotisserie chicken',
  'seafood':'seafood restaurant', 'stir-fry':'stir fry', 'snack-plate':'wine bar small plates', 'chips-dip':'mexican restaurant chips and salsa',
  'cookies':'cookie shop', 'brownies':'bakery', 'ice-cream':'ice cream', 'pretzels':'soft pretzels', 'popcorn':'popcorn shop',
  'eat-out':'restaurants', 'take-out':'takeout'
};
function mapsUrl(q) {
  return settings.mapsApp === 'apple'
    ? 'https://maps.apple.com/?q=' + encodeURIComponent(q)
    : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q + ' near me');
}
function nearbyLinks(id) {
  const q = NEARBY[id]; if (!q) return '';
  const label = id === 'take-out' ? 'Takeout near me' : id === 'eat-out' ? 'Restaurants near me' : 'Find ' + q + ' near me';
  return '<div class="recipes"><div class="label" style="margin:14px 2px 8px">Eat it out: ' + (settings.mapsApp === 'apple' ? 'Apple Maps' : 'Google Maps') + '</div>' +
    '<a class="rlink" href="' + mapsUrl(q) + '" target="_blank" rel="noopener">📍 ' + esc(label) + '</a></div>';
}
function hasInfo(id) { return !!(RECIPES[id] || NEARBY[id]); }
function infoBadge(id) {
  const parts = [];
  if (RECIPES[id]) parts.push('📖 Recipes');
  if (NEARBY[id]) parts.push('📍 Nearby');
  return parts.length ? '<div class="rb">' + parts.join(' · ') + '</div>' : '';
}
const FOOD = {};
const FOODS = CATALOG.map(function (r) {
  const f = { id:r[0], name:r[1], m:r[2], cat:r[3], e:r[4], a1:r[5], a2:r[6], blurb:r[7] };
  FOOD[f.id] = f; return f;
});
const MEALS = [
  { k:'Breakfast', c:'B', e:'🍳' }, { k:'Lunch', c:'L', e:'🥪' },
  { k:'Dinner', c:'D', e:'🍝' }, { k:'Snack', c:'S', e:'🍿' }
];
const MEAL = {}; MEALS.forEach(function (m) { MEAL[m.k] = m; });
const ACCENTS = ['#FF5A5F','#FF8A00','#1FA463','#3A86FF','#8E5CF7','#E84393'];

/* ============ Utilities ============ */
const $ = function (s, r) { return (r || document).querySelector(s); };
const app = $('#app');
const BOOT = (function () {
  let join = '';
  try { join = (new URLSearchParams(location.search).get('join') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8); } catch (e) {}
  return { join: join, url: location.origin + location.pathname };
})();
if (BOOT.join && history.replaceState) { try { history.replaceState(null, '', BOOT.url); } catch (e) {} }

const mem = {};
const store = {
  get: function (k, d) {
    try { const v = localStorage.getItem('fc2_' + k); if (v !== null) return JSON.parse(v); } catch (e) {}
    return mem[k] !== undefined ? mem[k] : d;
  },
  set: function (k, v) { mem[k] = v; try { localStorage.setItem('fc2_' + k, JSON.stringify(v)); } catch (e) {} },
  del: function (k) { delete mem[k]; try { localStorage.removeItem('fc2_' + k); } catch (e) {} }
};
function rand(n) {
  const a = 'abcdefghijklmnopqrstuvwxyz0123456789'; let s = '';
  const buf = new Uint8Array(n); (window.crypto || window.msCrypto).getRandomValues(buf);
  for (let i = 0; i < n; i++) s += a[buf[i] % a.length];
  return s;
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}
function today() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function fmtDate(s) {
  const p = String(s).split('-').map(Number);
  if (p.length !== 3) return s;
  const d = new Date(p[0], p[1] - 1, p[2]);
  const label = d.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' });
  if (s === today()) return 'Today, ' + d.toLocaleDateString(undefined, { month:'short', day:'numeric' });
  return label;
}
function defaultMeal() {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  if (h < 10.5) return 'Breakfast';
  if (h < 15) return 'Lunch';
  if (h < 21) return 'Dinner';
  return 'Snack';
}
function sessionName(s) { return (MEAL[s.meal] ? MEAL[s.meal].e + ' ' : '') + s.label; }
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
function deckFor(meal) {
  const c = MEAL[meal] ? MEAL[meal].c : 'D';
  const main = shuffle(FOODS.filter(function (f) { return f.cat !== 'out' && f.m.indexOf(c) >= 0; }));
  return main.concat([FOOD['eat-out'], FOOD['take-out']]).map(function (f) { return f.id; });
}
function joinLink(code) {
  const base = BOOT.url || (location.origin + location.pathname);
  return base + '?join=' + encodeURIComponent(code);
}
function qrSrc(text) {
  return 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=' + encodeURIComponent(text);
}
function art(f, extra) {
  const p = PAL[f.cat] || PAL.comfort;
  return '<div class="art' + (f.cat === 'out' ? ' out' : '') + (extra ? ' ' + extra : '') + '" style="--c1:' + p[0] + ';--c2:' + p[1] + '">' +
    '<span class="acc a1">' + f.a1 + '</span><div class="plate"></div><span class="main">' + f.e + '</span>' +
    '<span class="acc a2">' + f.a2 + '</span></div>';
}

/* ============ User and settings ============ */
let user = store.get('user', null);
if (!user) {
  user = { id: '', name: '' };
  try { const old = JSON.parse(localStorage.getItem('fc_user') || 'null'); if (old && old.name) user.name = old.name; } catch (e) {}
  store.set('user', user);
}
let settings = Object.assign({ theme:'system', accent:ACCENTS[0], size:'normal', motion:'on', archiveConfirm:'ask', mapsApp:'google', fullscreen:'auto' }, store.get('settings', {}));
const darkMq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
function applySettings() {
  const r = document.documentElement;
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && darkMq && darkMq.matches);
  r.dataset.theme = dark ? 'dark' : 'light';
  r.dataset.size = settings.size;
  r.dataset.motion = settings.motion;
  r.style.setProperty('--accent', settings.accent);
}
if (darkMq && darkMq.addEventListener) darkMq.addEventListener('change', applySettings);
applySettings();
const reduced = function () { return settings.motion === 'off'; };

/* ============ Server calls ============ */
let busy = 0;
function setBusy(d) { busy = Math.max(0, busy + d); $('#bar').classList.toggle('on', busy > 0); }
/* All data goes through data.js (Firebase). */
const WRITES = ['createGroup', 'joinGroup', 'createSession', 'solo', 'submit', 'rename', 'leaveGroup', 'setArchive', 'setAvatar'];
function call(action, payload, quiet) {
  if (!configured) return Promise.reject(new Error('Forkcast isn\'t connected to Firebase yet. Run scripts/setup.sh.'));
  if (WRITES.indexOf(action) >= 0) dropCache('');
  if (!quiet) setBusy(1);
  return ready.then(function (uid) {
    if (user.id !== uid) { user.id = uid; store.set('user', user); }
    return DB[action](uid, String(user.name || 'Guest').slice(0, 30), payload || {});
  }).catch(function (e) { throw friendlyError(e); })
    .finally(function () { if (!quiet) setBusy(-1); });
}
function dropCache(prefix) {
  Object.keys(mem).forEach(function (k) { if (k.indexOf('cache_' + prefix) === 0) delete mem[k]; });
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.indexOf('fc2_cache_' + prefix) === 0) localStorage.removeItem(k);
    }
  } catch (e) {}
}
/* Show the last copy instantly, then refresh from the server. */
function cached(key, action, payload, render) {
  const k = 'cache_' + key;
  const old = store.get(k, null);
  if (old) render(old, true);
  return call(action, payload, !!old).then(function (fresh) {
    store.set(k, fresh);
    if (!old || JSON.stringify(old) !== JSON.stringify(fresh)) render(fresh, false);
    return fresh;
  });
}

/* ============ UI helpers ============ */
let toastTimer;
function toast(msg, actLabel, actFn) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.toggle('has-act', !!actLabel);
  if (actLabel) {
    const b = document.createElement('button'); b.textContent = actLabel;
    b.onclick = function (e) { e.stopPropagation(); t.classList.remove('show', 'has-act'); actFn(); };
    t.appendChild(b);
  }
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove('show', 'has-act'); }, actLabel ? 5000 : 2800);
}
/* ============ Profile photos ============ */
const AV = store.get('avatars', {});               // uid -> { photo, at }
function saveAV() { store.set('avatars', AV); }
function initials(n) {
  const parts = String(n || '?').trim().split(/\s+/);
  return ((parts[0] || '?')[0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
function avColor(id) {
  let h = 0; const t = String(id || 'x');
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 360;
  return 'hsl(' + h + ' 55% 52%)';
}
function avatar(uid, name, photoAt, size) {
  const a = AV[uid];
  const has = a && a.photo && (!photoAt || a.at >= photoAt);
  return '<span class="av" data-av="' + esc(uid || '') + '" data-at="' + (photoAt || 0) + '" style="--s:' + size + 'px;background:' + avColor(uid) + '">' +
    (has ? '<img src="' + a.photo + '" alt="">' : esc(initials(name))) + '</span>';
}
function paintAvatars() {
  document.querySelectorAll('.av[data-av]').forEach(function (el) {
    const a = AV[el.dataset.av];
    if (a && a.photo && !el.querySelector('img')) el.innerHTML = '<img src="' + a.photo + '" alt="">';
  });
}
function hydrateAvatars() {
  const need = {};
  document.querySelectorAll('.av[data-av]').forEach(function (el) {
    const id = el.dataset.av, at = Number(el.dataset.at) || 0, a = AV[id];
    if (id && at && (!a || a.at < at)) need[id] = true;
  });
  paintAvatars();
  const ids = Object.keys(need);
  if (!ids.length) return;
  call('avatars', { ids: ids }, true).then(function (res) {
    Object.keys(res).forEach(function (id) { AV[id] = res[id]; });
    saveAV(); paintAvatars();
  }).catch(function () {});
}
/* Square-crop and shrink a photo on the phone before upload (about 20 KB). */
function makeAvatar(file) {
  return new Promise(function (resolve, reject) {
    if (!file || !/^image\//.test(file.type || 'image/')) { reject(new Error('Pick a photo.')); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = function () {
      const S = 192, c = document.createElement('canvas'); c.width = c.height = S;
      const m = Math.min(img.naturalWidth, img.naturalHeight);
      c.getContext('2d').drawImage(img, (img.naturalWidth - m) / 2, (img.naturalHeight - m) / 2, m, m, 0, 0, S, S);
      URL.revokeObjectURL(url);
      let q = 0.82, out = c.toDataURL('image/jpeg', q);
      while (out.length > 120000 && q > 0.4) { q -= 0.15; out = c.toDataURL('image/jpeg', q); }
      resolve(out);
    };
    img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Couldn\'t read that photo. Try a JPG or PNG.')); };
    img.src = url;
  });
}
async function onPhotoPicked(e) {
  const f = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const photo = await makeAvatar(f);
    const r = await call('setAvatar', { photo: photo });
    user.photoAt = r.photoAt; store.set('user', user);
    AV[user.id] = { photo: photo, at: r.photoAt }; saveAV();
    toast('Photo saved');
    S.needsRefresh = true;
    showSettingsTab('profile');
  } catch (err) { toast(err.message); }
}

/* ============ Full screen ============ */
function fsActive() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement) ||
    !!(window.matchMedia && matchMedia('(display-mode: fullscreen)').matches);
}
function wantFs() {
  if (settings.fullscreen === 'off') return false;
  if (settings.fullscreen === 'on') return true;
  return !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);   // phones and tablets
}
function enterFs() {
  if (!wantFs() || fsActive()) return;
  const d = document.documentElement, fn = d.requestFullscreen || d.webkitRequestFullscreen;
  if (!fn) return;   // iPhone Safari: use Add to Home Screen instead
  try { const p = fn.call(d, { navigationUI: 'hide' }); if (p && p.catch) p.catch(function () {}); } catch (e) {}
}
function exitFs() {
  const fn = document.exitFullscreen || document.webkitExitFullscreen;
  if ((document.fullscreenElement || document.webkitFullscreenElement) && fn) { try { const p = fn.call(document); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
}
// Browsers only allow full screen after a tap, so the first tap enters it and any later tap re-enters it
// (for example after the Android back gesture or returning from Maps). Links and photo pickers are left alone.
document.addEventListener('click', function (e) {
  if (e.target.closest && e.target.closest('a[href], label, input, select, textarea')) return;
  enterFs();
}, true);

const BACK_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12H5"/><path d="M11 5l-7 7 7 7"/></svg>';
function top(title, back, sub) {
  return '<div class="topbar">' +
    (back ? '<button class="back-btn" data-act="back" data-to="' + esc(back) + '" aria-label="Back">' + BACK_ARROW + '</button>'
          : '<button class="me-btn" data-act="openProfile" aria-label="Your profile">' + avatar(user.id, user.name, user.photoAt || 0, 44) + '</button>') +
    '<h1>' + title + (sub ? '<span class="sub">' + sub + '</span>' : '') + '</h1>' +
    '<button class="icon-btn" data-act="settings" aria-label="Settings">⚙️</button></div>';
}
function shell(html) { app.innerHTML = '<div class="wrap">' + html + '</div>'; setTimeout(hydrateAvatars, 0); }
const segVals = {};
function seg(name, options, selected) {
  segVals[name] = selected;
  return '<div class="seg" data-seg="' + name + '">' + options.map(function (o) {
    return '<button data-act="seg" data-val="' + esc(o.v) + '" class="' + (o.v === selected ? 'on' : '') + '">' +
      (o.e ? '<span class="e">' + o.e + '</span>' : '') + esc(o.t) + '</button>';
  }).join('') + '</div>';
}
function mealSeg(name) {
  return seg(name, MEALS.map(function (m) { return { v:m.k, t:m.k, e:m.e }; }), defaultMeal());
}
function modal(html, onMount) {
  const root = $('#modal-root');
  root.innerHTML = '<div class="back" data-act="closeModal"><div class="sheet" role="dialog">' + html + '</div></div>';
  if (onMount) onMount(root);
  setTimeout(hydrateAvatars, 0);
}
function closeModal() {
  $('#modal-root').innerHTML = '';
  if (S.pendingArchive) { snapBack(S.pendingArchive.row); S.pendingArchive = null; }
  if (S.needsRefresh) { S.needsRefresh = false; go(current.view, current.arg); }
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('Link copied'); return; } catch (e) {}
  const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
  ta.remove();
  if (ok) toast('Link copied'); else modal('<h2>Invite link</h2><input class="field" readonly value="' + esc(text) + '" onclick="this.select()"><div style="height:12px"></div><button class="btn" data-act="closeModal">Done</button>');
}

/* ============ Router ============ */
let current = {};
let stopLive = null;
const VIEWS = {};
function go(view, arg) {
  if (stopLive) { stopLive(); stopLive = null; }
  current = { view: view, arg: arg };
  window.scrollTo(0, 0);
  Promise.resolve().then(function () { return VIEWS[view](arg); }).catch(function (e) {
    toast(e.message);
    if (view !== 'home' && user.name) setTimeout(function () { go('home'); }, 400);
  });
}

/* ============ Views ============ */
VIEWS.welcome = function () {
  const picks = ['pancakes', 'taco-night', 'ice-cream'].map(function (id) { return art(FOOD[id]); }).join('');
  app.innerHTML = '<div class="wrap center">' +
    '<div class="collage">' + picks + '</div>' +
    '<h2 style="font-size:2rem;margin:6px 0 0">Forkcast</h2>' +
    '<p class="muted" style="font-weight:600">Swipe through food ideas and find what everyone actually wants.</p>' +
    (BOOT.join ? '<p><span class="chip">Joining group ' + esc(BOOT.join) + '</span></p>' : '') +
    '<input class="field" id="nm" placeholder="Your first name" maxlength="30" autocomplete="given-name">' +
    '<button class="btn" data-act="saveName">Let\'s eat</button>' + creditLine() + '</div>';
  const nm = $('#nm'); nm.focus();
  nm.addEventListener('keydown', function (e) { if (e.key === 'Enter') ACT.saveName(); });
};

VIEWS.home = async function () {
  shell(top('Forkcast') +
    '<div class="card"><div class="label">Quick solo swipe</div>' +
    '<h2>Hungry, ' + esc(user.name) + '?</h2>' + mealSeg('soloMeal') +
    '<button class="btn" data-act="solo">Start swiping</button></div>' +
    '<div class="label">Your groups</div><div id="groups"><div class="skel"></div><div class="skel"></div></div>' +
    '<div class="two"><button class="btn ghost" data-act="newGroup">＋ New group</button>' +
    '<button class="btn ghost" data-act="joinGroup">Join with code</button></div>' + creditLine());
  await cached('home_' + user.id, 'home', {}, function (groups) {
    if (current.view !== 'home') return;
    renderGroups(groups);
  });
};
function renderGroups(groups) {
  const box = $('#groups'); if (!box) return;
  if (!groups.length) {
    box.innerHTML = '<div class="empty">No groups yet. Make one for your household or friends and share the code.</div>';
    return;
  }
  box.innerHTML = groups.map(function (g) {
    const sub = g.isSolo ? (g.sessionCount + ' solo session' + (g.sessionCount === 1 ? '' : 's'))
      : g.memberCount + ' member' + (g.memberCount === 1 ? '' : 's') +
        (g.latest ? ' · Last: ' + esc(g.latest.label) + ', ' + esc(fmtDate(g.latest.date)) : '');
    return '<button class="item" data-act="openGroup" data-id="' + esc(g.id) + '">' +
      '<div class="ico">' + (g.isSolo ? '🙋' : '👥') + '</div>' +
      '<div class="grow"><div class="t">' + esc(g.isSolo ? 'My solo sessions' : g.name) + '</div><div class="s">' + sub + '</div></div>' +
      (g.isSolo ? '' : '<span class="chip">' + esc(g.code) + '</span>') + '</button>';
  }).join('');
}

VIEWS.group = async function (id) {
  if (!store.get('cache_group_' + id, null)) shell(top('Loading…', 'home') + '<div class="skel" style="height:150px"></div><div class="skel"></div>');
  await cached('group_' + id, 'group', { groupId: id }, function (d) {
    if (current.view !== 'group' || current.arg !== id) return;
    if (document.querySelector('.srow .item.dragging') || $('#modal-root').innerHTML) { S.group = d; return; }
    renderGroup(d);
  });
};
function renderGroup(d) {
  const g = d.group;
  const link = joinLink(g.code);
  let html = top(esc(g.isSolo ? 'My solo sessions' : g.name), 'home', g.isSolo ? '' : d.members.length + ' member' + (d.members.length === 1 ? '' : 's'));
  if (!g.isSolo) {
    html += '<div class="card"><div class="invite">' +
      '<img class="qr" src="' + qrSrc(link) + '" alt="QR code to join ' + esc(g.name) + '">' +
      '<div class="grow"><div class="label" style="margin:0 0 4px">Invite code</div><div class="code">' + esc(g.code) + '</div>' +
      '<div class="row"><button class="btn small" data-act="share">Share</button>' +
      '<button class="btn small ghost" data-act="copyLink">Copy link</button></div></div></div>' +
      '<div class="chips" style="margin-top:12px">' + d.members.map(function (m) {
        return '<span class="chip pchip">' + avatar(m.userId, m.name, m.photoAt, 24) + esc(m.name) + (m.userId === user.id ? ' (you)' : '') + '</span>';
      }).join('') + '</div></div>';
  }
  html += '<div class="card"><div class="label">Start a new session</div>' + mealSeg('newMeal') +
    '<div class="row" style="margin-bottom:12px"><span style="font-weight:700">Day</span>' +
    '<input type="date" class="field grow" id="sdate" value="' + today() + '"></div>' +
    '<button class="btn" data-act="newSession">Start session</button></div>';
  html += '<div class="label">Sessions</div>';
  if (d.sessions.length) html += '<p class="hint-sm">Swipe a session left or right to archive it. Sessions archive on their own after 72 hours.</p>';
  html += '<div id="sessions">' + (d.sessions.length ? d.sessions.map(function (s) {
    const info = g.isSolo ? fmtDate(s.date) : fmtDate(s.date) + ' · ' + s.submittedCount + ' of ' + d.members.length + ' submitted';
    return '<div class="srow" data-sid="' + esc(s.id) + '" data-name="' + esc(s.label + ', ' + fmtDate(s.date)) + '">' +
      '<div class="bg"><span>📦 Archive</span><span>Archive 📦</span></div>' +
      '<button class="item" data-act="openSession" data-id="' + esc(s.id) + '" data-done="' + (s.mySubmitted ? 1 : 0) + '">' +
      '<div class="ico">' + (MEAL[s.meal] ? MEAL[s.meal].e : '🍽️') + '</div>' +
      '<div class="grow"><div class="t">' + esc(s.label) + '</div><div class="s">' + esc(info) + '</div></div>' +
      '<span class="badge ' + (s.mySubmitted ? 'done' : '') + '">' + (s.mySubmitted ? 'Results' : 'Swipe') + '</span></button></div>';
  }).join('') : '<div class="empty">No active sessions. Pick a meal above to start one.</div>') + '</div>';
  if (d.archivedCount) html += '<button class="btn link archived-link" data-act="openArchived">📦 ' + d.archivedCount + ' archived session' + (d.archivedCount === 1 ? '' : 's') + '</button>';
  if (!g.isSolo) html += '<button class="btn link" data-act="leaveGroup" style="margin-top:10px">Leave this group</button>';
  const y = window.scrollY;
  shell(html);
  window.scrollTo(0, y);
  S.group = d;
  document.querySelectorAll('.srow').forEach(attachRowSwipe);
}

/* ============ Swipe to archive ============ */
function attachRowSwipe(row) {
  const item = $('.item', row);
  let sx = 0, sy = 0, dx = 0, down = false, dragging = false;
  item.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    down = true; dragging = false; sx = e.clientX; sy = e.clientY; dx = 0; row.dataset.dragged = '';
  });
  item.addEventListener('pointermove', function (e) {
    if (!down) return;
    const mx = e.clientX - sx, my = e.clientY - sy;
    if (!dragging) {
      if (Math.abs(my) > 10 && Math.abs(my) > Math.abs(mx)) { down = false; return; }
      if (Math.abs(mx) < 10) return;
      dragging = true; item.classList.add('dragging');
      try { item.setPointerCapture(e.pointerId); } catch (_) {}
    }
    dx = mx;
    item.style.transform = 'translateX(' + dx + 'px)';
    row.classList.toggle('ready', Math.abs(dx) > row.offsetWidth * 0.35);
  });
  const end = function () {
    if (!down) return; down = false;
    if (!dragging) return;
    row.dataset.dragged = '1';
    item.classList.remove('dragging');
    if (Math.abs(dx) > row.offsetWidth * 0.35) {
      item.style.transform = 'translateX(' + (dx > 0 ? '110%' : '-110%') + ')';
      if (settings.archiveConfirm === 'ask') askArchive(row); else doArchive(row);
    } else snapBack(row);
  };
  item.addEventListener('pointerup', end);
  item.addEventListener('pointercancel', end);
}
function snapBack(row) {
  if (!row) return;
  const item = $('.item', row);
  row.classList.remove('ready');
  if (item) item.style.transform = '';
}
function askArchive(row) {
  modal('<h2>Archive this session?</h2><p class="muted" style="font-weight:600;margin:-6px 0 12px">' + esc(row.dataset.name) +
    '. It only disappears from your list. You can bring it back from Settings, Archived.</p>' +
    '<label class="check"><input type="checkbox" id="noask"> Don\'t ask me again</label>' +
    '<div class="two"><button class="btn ghost" data-act="closeModal">Cancel</button><button class="btn" data-act="confirmArchive">Archive</button></div>');
  S.pendingArchive = { row: row };
}
function collapse(row) {
  row.style.height = row.offsetHeight + 'px';
  requestAnimationFrame(function () { row.style.height = '0px'; row.style.marginBottom = '0px'; row.style.opacity = '0'; });
  setTimeout(function () { row.remove(); }, reduced() ? 0 : 260);
}
async function doArchive(row) {
  const sid = row.dataset.sid, gid = S.group.group.id;
  collapse(row);
  try {
    await call('setArchive', { sessionId: sid, archived: true }, true);
    toast('Session archived', 'Undo', function () {
      call('setArchive', { sessionId: sid, archived: false }).then(function () {
        if (current.view === 'group' && current.arg === gid) go('group', gid);
      }).catch(function (e) { toast(e.message); });
    });
    if (current.view === 'group' && current.arg === gid) refreshArchivedLink(1);
  } catch (e) { toast(e.message); go('group', gid); }
}
function refreshArchivedLink(delta) {
  S.group.archivedCount = (S.group.archivedCount || 0) + delta;
  let link = $('.archived-link');
  const n = S.group.archivedCount;
  if (!link && n > 0) {
    link = document.createElement('button'); link.className = 'btn link archived-link'; link.dataset.act = 'openArchived';
    $('#sessions').after(link);
  }
  if (link) link.textContent = '📦 ' + n + ' archived session' + (n === 1 ? '' : 's');
}

const S = {};

VIEWS.swipe = async function (sid) {
  shell(top('Loading…', 'home') + '<div class="skel" style="height:60vh;border-radius:28px"></div>');
  const d = await call('session', { sessionId: sid }, true);
  if (current.view !== 'swipe') return;
  S.session = d;
  let p = store.get('prog_' + sid, null);
  if (!p || !Array.isArray(p.order) || !p.order.every(function (id) { return FOOD[id]; })) {
    p = { order: deckFor(d.session.meal), i: 0, likes: {}, hist: [] };
  }
  S.prog = p;
  renderSwipe();
};
function backFor(d) { return d.group.isSolo ? 'home' : 'group:' + d.group.id; }
function saveProg() { store.set('prog_' + S.session.session.id, S.prog); }
function cardHtml(f, cls) {
  return '<div class="scard ' + cls + '" data-id="' + f.id + '">' +
    '<div class="stamp yes">YUM</div><div class="stamp no">NOPE</div>' + art(f) +
    '<div class="info"><div class="name">' + esc(f.name) + '</div><div class="blurb">' + esc(f.blurb) + '</div></div></div>';
}
function renderSwipe() {
  const d = S.session, p = S.prog, total = p.order.length;
  if (p.i >= total) { renderFinish(); return; }
  const f = FOOD[p.order[p.i]], nx = FOOD[p.order[p.i + 1]];
  shell(top(esc(sessionName(d.session)), backFor(d), esc(fmtDate(d.session.date)) + (d.group.isSolo ? '' : ' · ' + esc(d.group.name))) +
    '<div class="progress"><i style="width:' + (p.i / total * 100) + '%"></i></div>' +
    '<div class="count">' + (p.i + 1) + ' of ' + total + '</div>' +
    '<div class="stack">' + (nx ? cardHtml(nx, 'next') : '') + cardHtml(f, 'top') + '</div>' +
    '<div class="actions">' +
    '<button class="round no" data-act="no" aria-label="Nope">✕</button>' +
    '<button class="round sm" data-act="undo" aria-label="Undo"' + (p.hist.length ? '' : ' disabled') + '>↶</button>' +
    '<button class="round yes" data-act="yes" aria-label="Yum">♥</button></div>' +
    (store.get('hinted', false) ? '' : '<p class="hint">Swipe right if you\'d eat it, left if not.</p>'));
  attachDrag($('.scard.top'));
}
function attachDrag(card) {
  if (!card) return;
  let sx = 0, sy = 0, dx = 0, dy = 0, down = false;
  const yes = $('.stamp.yes', card), no = $('.stamp.no', card);
  card.addEventListener('pointerdown', function (e) {
    down = true; sx = e.clientX; sy = e.clientY; dx = dy = 0;
    card.style.animation = 'none'; card.style.transition = 'none';
    try { card.setPointerCapture(e.pointerId); } catch (_) {}
  });
  card.addEventListener('pointermove', function (e) {
    if (!down) return;
    dx = e.clientX - sx; dy = e.clientY - sy;
    card.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (dx / 14) + 'deg)';
    yes.style.opacity = Math.max(0, Math.min(1, dx / 90));
    no.style.opacity = Math.max(0, Math.min(1, -dx / 90));
  });
  const end = function () {
    if (!down) return; down = false;
    if (Math.abs(dx) > 90) { S.lastDy = dy; decide(dx > 0); return; }
    card.style.transition = 'transform .25s';
    card.style.transform = ''; yes.style.opacity = 0; no.style.opacity = 0;
  };
  card.addEventListener('pointerup', end);
  card.addEventListener('pointercancel', end);
}
function decide(like) {
  if (S.anim || !S.prog || S.prog.i >= S.prog.order.length) return;
  S.anim = true;
  const p = S.prog, id = p.order[p.i];
  p.likes[id] = like; p.hist.push(id); p.i++; saveProg();
  store.set('hinted', true);
  const card = $('.scard.top');
  if (card && !reduced()) {
    card.style.animation = 'none';
    card.style.transition = 'transform .3s ease-in';
    $('.stamp.' + (like ? 'yes' : 'no'), card).style.opacity = 1;
    card.style.transform = 'translate(' + ((like ? 1 : -1) * (window.innerWidth + 300)) + 'px,' + (S.lastDy || 0) + 'px) rotate(' + (like ? 28 : -28) + 'deg)';
  }
  S.lastDy = 0;
  setTimeout(function () { S.anim = false; renderSwipe(); }, reduced() ? 0 : 230);
}
function undo() {
  const p = S.prog; if (!p || !p.hist.length) return;
  const id = p.hist.pop(); delete p.likes[id]; p.i = Math.max(0, p.i - 1); saveProg(); renderSwipe();
}
function renderFinish() {
  const d = S.session, p = S.prog;
  const liked = p.order.filter(function (id) { return p.likes[id]; });
  shell(top(esc(sessionName(d.session)), backFor(d), esc(fmtDate(d.session.date))) +
    '<div class="card" style="text-align:center"><div class="big-emoji">🎉</div><h2 style="margin:8px 0 4px">All done!</h2>' +
    '<p class="muted" style="font-weight:600">You said yes to ' + liked.length + ' of ' + p.order.length + '.</p></div>' +
    (liked.length ? '<div class="label">Your yeses</div><div class="tiles" style="margin-bottom:16px">' + liked.map(function (id) {
      return '<div class="tile">' + art(FOOD[id]) + '<div class="tn">' + esc(FOOD[id].name) + '</div></div>';
    }).join('') + '</div>' : '<div class="empty">Nothing sounded good? You can start over or submit anyway.</div>') +
    '<div class="gap"><button class="btn" data-act="submit">Submit my picks</button>' +
    '<button class="btn ghost" data-act="undo">↶ Change last answer</button>' +
    '<button class="btn link" data-act="restart">Start over</button></div>');
}

VIEWS.results = async function (sid) {
  shell(top('Loading…', 'home') + '<div class="skel" style="height:200px"></div>');
  const d = await call('results', { sessionId: sid }, true);
  if (current.view !== 'results') return;
  renderResults(d);
  if (!d.group.isSolo) {
    const uid = await ready;
    stopLive = watchResults(uid, sid, function (n) {
      if (current.view === 'results' && current.arg === sid && JSON.stringify(n) !== JSON.stringify(S.results)) {
        const fresh = n.submitters.length > S.results.submitters.length;
        renderResults(n, true);
        if (fresh && !$('#modal-root').innerHTML) toast('New picks are in');
      }
    }, function () {});
  }
};
function renderResults(d, isRefresh) {
  S.results = d;
  const solo = d.group.isSolo;
  const back = solo ? 'group:' + d.group.id : 'group:' + d.group.id;
  const tile = function (id) {
    if (!FOOD[id]) return '';
    const has = hasInfo(id);
    return '<div class="tile"' + (has ? ' data-act="foodInfo" data-food="' + id + '"' : '') + '>' + art(FOOD[id]) +
      '<div class="tn">' + esc(FOOD[id].name) + infoBadge(id) + '</div></div>';
  };
  let html = top(esc(sessionName(d.session)), back, esc(fmtDate(d.session.date)) + (solo ? '' : ' · ' + esc(d.group.name)));
  const pickPool = d.matches.length ? d.matches : d.tally.slice(0, 3).map(function (t) { return t.id; });
  if (solo) {
    html += '<div class="card"><h2 style="margin:0">Your picks</h2><p class="muted" style="font-weight:600">' + d.myLikes.length + ' things sound good right now.</p></div>';
    html += d.myLikes.length ? '<div class="tiles" id="pool" style="margin-bottom:14px">' + d.myLikes.map(tile).join('') + '</div>' : '<div class="empty">You passed on everything. Maybe it\'s a take-out night?</div>';
  } else {
    html += '<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:10px"><div class="label" style="margin:0">' +
      d.submitters.length + ' of ' + (d.submitters.length + d.pending.length) + ' submitted</div>' +
      '<span class="chip ok">● Live</span></div><div class="chips">' +
      (d.people ? d.people.map(function (p) {
        return '<span class="chip pchip' + (p.done ? ' ok' : '') + '">' + avatar(p.userId, p.name, p.photoAt, 24) + (p.done ? '✓ ' : '⏳ ') + esc(p.name) + '</span>';
      }).join('') :
      d.submitters.map(function (n) { return '<span class="chip ok">✓ ' + esc(n) + '</span>'; }).join('') +
      d.pending.map(function (n) { return '<span class="chip">⏳ ' + esc(n) + '</span>'; }).join('')) + '</div></div>';
    if (d.submitters.length < 2) {
      html += '<div class="card" style="text-align:center"><div class="big-emoji">⏳</div><h2 style="margin:8px 0 4px">Waiting on the others</h2>' +
        '<p class="muted" style="font-weight:600">Matches show up here the moment someone else submits.</p></div>';
    } else if (d.matches.length) {
      html += '<div class="label">🎉 Everyone said yes to</div><div class="tiles" id="pool" style="margin-bottom:14px">' + d.matches.map(tile).join('') + '</div>';
    } else {
      html += '<div class="card" style="text-align:center"><div class="big-emoji">🤔</div><h2 style="margin:8px 0 4px">No perfect match yet</h2>' +
        '<p class="muted" style="font-weight:600">Here\'s what came closest.</p></div>';
    }
    if (d.submitters.length >= 2 && d.tally.length) {
      const max = d.submitters.length;
      html += '<div class="label">All the yeses</div><div class="card">' + d.tally.slice(0, 15).map(function (t) {
        const f = FOOD[t.id]; if (!f) return '';
        return '<div class="rank">' + art(f) + '<div class="grow"><div style="font-weight:800">' + esc(f.name) + '</div>' +
          '<div class="bar"><i style="width:' + (t.count / max * 100) + '%"></i></div>' +
          '<div class="muted" style="font-size:.8rem;font-weight:600">' + t.count + ' of ' + max + ': ' + esc(t.names.join(', ')) + '</div></div>' +
          (hasInfo(t.id) ? '<button class="rbtn" data-act="foodInfo" data-food="' + t.id + '" aria-label="Recipes and nearby places for ' + esc(f.name) + '">' + (RECIPES[t.id] ? '📖' : '') + (NEARBY[t.id] ? '📍' : '') + '</button>' : '') + '</div>';
      }).join('') + '</div>';
    }
  }
  const canPick = solo ? d.myLikes.length > 1 : (d.submitters.length >= 2 && pickPool.length > 1);
  html += '<div class="gap">' + (canPick ? '<button class="btn" data-act="pickOne">🎲 Can\'t decide? Pick one</button>' : '') +
    '<button class="btn ghost" data-act="redo">Change my picks</button></div>';
  const y = window.scrollY;
  shell(html);
  if (isRefresh) window.scrollTo(0, y);
}

/* ============ Actions ============ */
const ACT = {
  back: function (el) {
    const to = el.dataset.to || 'home';
    if (to.indexOf('group:') === 0) go('group', to.slice(6)); else go('home');
  },
  saveName: function () {
    const v = ($('#nm').value || '').trim();
    if (!v) { toast('Add your name so your group knows who\'s who.'); return; }
    user.name = v.slice(0, 30); store.set('user', user);
    if (BOOT.join) joinWith(BOOT.join); else go('home');
  },
  seg: function (el) {
    const box = el.closest('[data-seg]'); const name = box.dataset.seg;
    box.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b === el); });
    segVals[name] = el.dataset.val;
    if (SETTING_SEGS[name]) SETTING_SEGS[name](el.dataset.val);
  },
  solo: async function () {
    const s = await call('solo', { meal: segVals.soloMeal || defaultMeal(), date: today() });
    go('swipe', s.id);
  },
  newGroup: function () {
    modal('<h2>New group</h2><p class="muted" style="font-weight:600;margin:-6px 0 12px">Your household, roommates, friends. Groups stick around for future meals.</p>' +
      '<input class="field" id="gname" placeholder="Group name, like The Apartment" maxlength="40"><div style="height:12px"></div>' +
      '<button class="btn" data-act="createGroup">Create group</button>', function () { $('#gname').focus(); });
  },
  createGroup: async function () {
    const n = ($('#gname').value || '').trim();
    if (!n) { toast('Name your group first.'); return; }
    const g = await call('createGroup', { groupName: n });
    closeModal(); go('group', g.id);
  },
  joinGroup: function () {
    modal('<h2>Join a group</h2><p class="muted" style="font-weight:600;margin:-6px 0 12px">Type the 6-character code, or just scan the group\'s QR code with your phone camera.</p>' +
      '<input class="field code-in" id="jcode" placeholder="ABC123" maxlength="8" autocapitalize="characters"><div style="height:12px"></div>' +
      '<button class="btn" data-act="doJoin">Join</button>', function () { $('#jcode').focus(); });
  },
  doJoin: function () {
    const c = ($('#jcode').value || '').trim();
    if (!c) { toast('Enter a code.'); return; }
    closeModal(); joinWith(c);
  },
  openGroup: function (el) { go('group', el.dataset.id); },
  share: async function () {
    const g = S.group.group, link = joinLink(g.code);
    if (navigator.share) {
      try { await navigator.share({ title: 'Join ' + g.name + ' on Forkcast', text: 'Help pick what we eat. Code: ' + g.code, url: link }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    copyText(link);
  },
  copyLink: function () { copyText(joinLink(S.group.group.code)); },
  newSession: async function () {
    const date = ($('#sdate').value || today());
    const s = await call('createSession', { groupId: S.group.group.id, meal: segVals.newMeal || defaultMeal(), date: date });
    go('swipe', s.id);
  },
  openSession: function (el) { go(el.dataset.done === '1' ? 'results' : 'swipe', el.dataset.id); },
  leaveGroup: function () {
    modal('<h2>Leave ' + esc(S.group.group.name) + '?</h2><p class="muted" style="font-weight:600;margin:-6px 0 14px">You can rejoin any time with the code.</p>' +
      '<div class="two"><button class="btn ghost" data-act="closeModal">Stay</button><button class="btn" data-act="confirmLeave">Leave</button></div>');
  },
  confirmLeave: async function () {
    await call('leaveGroup', { groupId: S.group.group.id }); closeModal(); toast('You left the group.'); go('home');
  },
  yes: function () { decide(true); },
  no: function () { decide(false); },
  undo: function () { undo(); },
  restart: function () {
    S.prog = { order: deckFor(S.session.session.meal), i: 0, likes: {}, hist: [] }; saveProg(); renderSwipe();
  },
  submit: async function () {
    const p = S.prog, sid = S.session.session.id;
    const likes = p.order.filter(function (id) { return p.likes[id] === true; });
    const dislikes = p.order.filter(function (id) { return p.likes[id] === false; });
    await call('submit', { sessionId: sid, likes: likes, dislikes: dislikes });
    store.del('prog_' + sid);
    toast('Picks submitted');
    go('results', sid);
  },
  refresh: function () { go('results', S.results.session.id); },
  redo: function () { const sid = S.results.session.id; store.del('prog_' + sid); go('swipe', sid); },
  pickOne: function () {
    const d = S.results;
    const pool = d.group.isSolo ? d.myLikes : (d.matches.length ? d.matches : d.tally.slice(0, 3).map(function (t) { return t.id; }));
    const id = pool[Math.floor(Math.random() * pool.length)], f = FOOD[id];
    modal('<div style="text-align:center"><div class="label">Tonight it\'s</div>' +
      '<div class="tile" style="max-width:240px;margin:0 auto 14px">' + art(f) + '<div class="tn" style="font-size:1.2rem">' + esc(f.name) + '</div></div>' +
      '<div class="two"><button class="btn ghost" data-act="pickOne">Spin again</button><button class="btn" data-act="closeModal">Done</button></div></div>' +
      recipeLinks(id) + nearbyLinks(id));
  },
  foodInfo: function (el) {
    const f = FOOD[el.dataset.food]; if (!f) return;
    modal('<div class="tile" style="max-width:200px;margin:0 auto 10px">' + art(f) + '<div class="tn" style="font-size:1.15rem;text-align:center">' + esc(f.name) + '</div></div>' +
      recipeLinks(f.id) + nearbyLinks(f.id) + '<button class="btn ghost" data-act="closeModal" style="margin-top:6px">Close</button>');
  },
  settings: function () { openSettings(); },
  openProfile: function () { openSettings('profile'); },
  removePhoto: async function () {
    const r = await call('setAvatar', { photo: '' });
    user.photoAt = r.photoAt; store.set('user', user);
    AV[user.id] = { photo: '', at: 0 }; saveAV();
    toast('Photo removed'); S.needsRefresh = true; showSettingsTab('profile');
  },
  settingsTab: function (el) { showSettingsTab(el.dataset.tab); },
  openArchived: function () { openSettings('archived'); },
  openArchivedSession: function (el) {
    S.needsRefresh = false; closeModal();
    go(el.dataset.done === '1' ? 'results' : 'swipe', el.dataset.id);
  },
  archiveMode: function (el) {
    settings.archiveConfirm = el.dataset.val; store.set('settings', settings);
    document.querySelectorAll('.opt').forEach(function (b) { b.classList.toggle('on', b === el); });
  },
  confirmArchive: function () {
    const pa = S.pendingArchive; S.pendingArchive = null;
    const noask = $('#noask');
    if (noask && noask.checked) { settings.archiveConfirm = 'swipe'; store.set('settings', settings); }
    closeModal();
    if (pa) doArchive(pa.row);
  },
  unarchive: async function (el) {
    el.disabled = true;
    await call('setArchive', { sessionId: el.dataset.id, archived: false });
    const row = el.closest('[data-arch]'); if (row) row.remove();
    if (!document.querySelector('[data-arch]') && $('#archlist')) $('#archlist').innerHTML = '<div class="empty">Nothing archived yet.</div>';
    toast('Session is back in your list');
    S.needsRefresh = true;
  },
  saveSettings: async function () {
    const v = String(S.pendingName || '').trim().slice(0, 30);
    closeModal();
    if (v && v !== user.name) {
      user.name = v; store.set('user', user);
      try { await call('rename', {}); toast('Saved'); } catch (e) { toast(e.message); }
      go(current.view, current.arg);
    }
  },
  accent: function (el) {
    settings.accent = el.dataset.val; store.set('settings', settings); applySettings();
    document.querySelectorAll('.sw').forEach(function (b) { b.classList.toggle('on', b === el); });
  },
  closeModal: function (el, e) { if (e && e.target !== el) return; closeModal(); }
};
const SETTING_SEGS = {
  theme: function (v) { settings.theme = v; store.set('settings', settings); applySettings(); },
  size: function (v) { settings.size = v; store.set('settings', settings); applySettings(); },
  motion: function (v) { settings.motion = v; store.set('settings', settings); applySettings(); },
  maps: function (v) { settings.mapsApp = v; store.set('settings', settings); },
  fullscreen: function (v) { settings.fullscreen = v; store.set('settings', settings); if (wantFs()) enterFs(); else exitFs(); }
};
const SETTING_TABS = [
  { k:'profile', t:'Profile', e:'🙋' }, { k:'look', t:'Look', e:'🎨' },
  { k:'sessions', t:'Sessions', e:'🗂️' }, { k:'archived', t:'Archived', e:'📦' }, { k:'about', t:'About', e:'ℹ️' }
];
function openSettings(tab) {
  S.pendingName = user.name;
  modal('<h2>Settings</h2><div class="tabs" role="tablist">' + SETTING_TABS.map(function (t) {
    return '<button role="tab" data-act="settingsTab" data-tab="' + t.k + '"><span class="e">' + t.e + '</span>' + t.t + '</button>';
  }).join('') + '</div><div class="set-pane" id="setpane"></div>' +
  '<button class="btn" data-act="saveSettings" style="margin-top:8px">Done</button>');
  showSettingsTab(tab || 'profile');
}
function showSettingsTab(k) {
  document.querySelectorAll('.tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.tab === k); });
  const pane = $('#setpane'); if (!pane) return;
  if (k === 'profile') {
    const hasPhoto = !!(AV[user.id] && AV[user.id].photo);
    pane.innerHTML = '<div class="label">Profile photo</div><div class="pf">' + avatar(user.id, S.pendingName || user.name, user.photoAt || 0, 96) +
      '<div class="pf-btns">' +
      '<label class="btn small">📷 Take photo<input type="file" accept="image/*" capture="user" hidden data-photo></label>' +
      '<label class="btn small ghost">🖼️ Upload<input type="file" accept="image/*" hidden data-photo></label>' +
      (hasPhoto ? '<button class="btn link small" data-act="removePhoto" style="padding:4px 2px">Remove photo</button>' : '') +
      '</div></div>' +
      '<div class="label">Your name</div>' +
      '<input class="field" id="setname" maxlength="30" value="' + esc(S.pendingName) + '">' +
      '<p class="hint-sm" style="margin-top:8px">This is what your groups see next to your picks.</p>';
    $('#setname').addEventListener('input', function (e) { S.pendingName = e.target.value; });
    pane.querySelectorAll('input[data-photo]').forEach(function (inp) { inp.addEventListener('change', onPhotoPicked); });
  } else if (k === 'look') {
    pane.innerHTML = '<div class="label">Theme</div>' + seg('theme', [{ v:'light', t:'Light', e:'☀️' }, { v:'dark', t:'Dark', e:'🌙' }, { v:'system', t:'Auto', e:'🌓' }], settings.theme) +
      '<div class="label">Color</div><div class="swatches">' + ACCENTS.map(function (c) {
        return '<button class="sw' + (c === settings.accent ? ' on' : '') + '" style="background:' + c + '" data-act="accent" data-val="' + c + '" aria-label="Color ' + c + '"></button>';
      }).join('') + '</div>' +
      '<div class="label">Text size</div>' + seg('size', [{ v:'normal', t:'Regular' }, { v:'large', t:'Large' }], settings.size) +
      '<div class="label">Animations</div>' + seg('motion', [{ v:'on', t:'On' }, { v:'off', t:'Off' }], settings.motion) +
      '<div class="label">Full screen</div>' + seg('fullscreen', [{ v:'auto', t:'Phones & tablets' }, { v:'on', t:'Always' }, { v:'off', t:'Off' }], settings.fullscreen) +
      '<p class="hint-sm">Hides the browser bars after your first tap. On iPhone, add Forkcast to your home screen for full screen.</p>';
  } else if (k === 'sessions') {
    const opt = function (v, t, sub) {
      return '<button class="opt' + (settings.archiveConfirm === v ? ' on' : '') + '" data-act="archiveMode" data-val="' + v + '">' +
        '<span class="dot"></span><span><div class="t">' + t + '</div><div class="s">' + sub + '</div></span></button>';
    };
    pane.innerHTML = '<div class="label">When I swipe a session away</div>' +
      opt('ask', 'Ask me first', 'Show a confirmation every time before archiving.') +
      opt('swipe', 'Just archive it', 'One swipe archives it. You get a quick Undo.') +
      '<p class="hint-sm" style="margin-top:8px">Sessions also archive themselves 72 hours after they start. Archiving only affects your own list.</p>' +
      '<div class="label" style="margin-top:18px">Open nearby places in</div>' +
      seg('maps', [{ v:'google', t:'Google Maps', e:'🗺️' }, { v:'apple', t:'Apple Maps', e:'🧭' }], settings.mapsApp) +
      '<p class="hint-sm">Used by the 📍 buttons on results. Your Maps app finds places near you; Forkcast never sees your location.</p>';
  } else if (k === 'about') {
    pane.innerHTML = '<div class="about-head"><div class="logo">🍴</div><h3>Forkcast</h3>' +
      '<div class="muted" style="font-weight:600">Swipe to decide what to eat.</div>' +
      '<span class="ver">Version ' + APP_VERSION + '</span>' +
      '<p style="font-weight:700;margin-top:10px">Created by ' + esc(APP_CREDIT) + '</p></div>' +
      CHANGELOG.map(function (v) {
        return '<div class="label" style="margin-top:16px">' + (v[0] === APP_VERSION ? 'New in ' : 'Version ') + v[0] + (v[2] ? ' · ' + esc(fmtDate(v[2])) : '') + '</div>' +
          '<ul class="cl">' + v[1].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      }).join('') +
      '<p class="hint-sm">Recipe links go to NYT Cooking. Nearby searches open in your Maps app, which uses your location; Forkcast never sees it.</p>';
  } else if (k === 'archived') {
    pane.innerHTML = '<div class="label">Archived sessions</div><div id="archlist"><div class="skel"></div><div class="skel"></div></div>';
    call('archived', {}, true).then(function (list) {
      const box = $('#archlist'); if (!box) return;
      box.innerHTML = list.length ? list.map(function (s) {
        return '<div class="item" data-arch="' + esc(s.id) + '">' +
          '<div class="ico" data-act="openArchivedSession" data-id="' + esc(s.id) + '" data-done="' + (s.mySubmitted ? 1 : 0) + '" style="cursor:pointer">' + (MEAL[s.meal] ? MEAL[s.meal].e : '🍽️') + '</div>' +
          '<div class="grow" data-act="openArchivedSession" data-id="' + esc(s.id) + '" data-done="' + (s.mySubmitted ? 1 : 0) + '" style="cursor:pointer">' +
          '<div class="t">' + esc(s.label) + '</div>' +
          '<div class="s" style="white-space:normal">' + esc(s.groupName + ' · ' + fmtDate(s.date)) + '</div>' +
          '<div class="s">' + (s.auto ? 'Auto-archived' : 'Archived by you') + '</div></div>' +
          '<button class="btn small ghost" data-act="unarchive" data-id="' + esc(s.id) + '">Unarchive</button></div>';
      }).join('') : '<div class="empty">Nothing archived yet.</div>';
    }).catch(function (e) { const box = $('#archlist'); if (box) box.innerHTML = '<div class="empty">' + esc(e.message) + '</div>'; });
  }
}
async function joinWith(code) {
  try {
    const g = await call('joinGroup', { code: code });
    try { sessionStorage.setItem('fc2_joined', code); } catch (e) {}
    toast('You\'re in ' + g.name);
    go('group', g.id);
  } catch (e) { toast(e.message); go('home'); }
}

/* Event delegation */
document.addEventListener('click', function (e) {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const srow = el.closest('.srow');
  if (srow && srow.dataset.dragged) { srow.dataset.dragged = ''; return; }
  const fn = ACT[el.dataset.act];
  if (!fn) return;
  if (el.dataset.act === 'closeModal') { fn(el, e); return; }
  e.stopPropagation();
  Promise.resolve(fn(el, e)).catch(function (err) { toast(err.message); });
});
document.addEventListener('keydown', function (e) {
  if (current.view !== 'swipe' || $('#modal-root').innerHTML) return;
  if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.key === 'ArrowRight') decide(true);
  else if (e.key === 'ArrowLeft') decide(false);
  else if (e.key === 'Backspace' || e.key.toLowerCase() === 'z') undo();
});

/* Start */
let alreadyJoined = false;
try { alreadyJoined = sessionStorage.getItem('fc2_joined') === BOOT.join; } catch (e) {}
if (!user.name) go('welcome');
else if (BOOT.join && !alreadyJoined) joinWith(BOOT.join);
else go('home');
})();
</script>
</body>
</html>
````

### web/data.js

````js
/*
 * Forkcast 2.0 data layer (Firebase).
 * Same actions and return shapes the Apps Script backend used, so the screens
 * in index.html barely changed. Security lives in firestore.rules.
 *
 * Firestore layout
 *   groups/{groupId}        name, code, createdBy, createdAt, isSolo, memberIds[], members{uid:{name,joinedAt}}
 *   codes/{CODE}            groupId, createdBy            (invite codes; readable one at a time, never listed)
 *   sessions/{sessionId}    groupId, date, meal, snackNum, label, createdBy, createdAt, submittedBy[]
 *   sessions/{id}/submissions/{uid}   name, likes[], dislikes[], submittedAt
 *   users/{uid}             name, photoAt, archives{sessionId: 'archived'|'active'}
 *   avatars/{uid}           photo (small JPEG data URL, ~20 KB), updatedAt
 *                           members{uid:{..., photoAt}} tells others when to refetch a photo
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch, query, where, orderBy, limit,
  arrayUnion, arrayRemove, deleteField, onSnapshot, getCountFromServer
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const AUTO_ARCHIVE_MS = 72 * 3600 * 1000;
const cfg = window.FORKCAST_FIREBASE || {};

export const configured = !!(cfg.apiKey && cfg.projectId);
let db = null, auth = null;
export let ready = Promise.reject(new Error('Forkcast isn\'t connected to Firebase yet. Run scripts/setup.sh.'));
ready.catch(function () {});

if (configured) {
  const app = initializeApp(cfg);
  auth = getAuth(app);
  try {
    db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  } catch (e) {
    db = initializeFirestore(app, {});
  }
  ready = new Promise(function (resolve, reject) {
    onAuthStateChanged(auth, function (u) {
      if (u) resolve(u.uid);
      else signInAnonymously(auth).catch(reject);
    });
  });
}

/* ---------- helpers ---------- */
const nowIso = function () { return new Date().toISOString(); };
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function cleanName(n) { return String(n || '').replace(/[<>]/g, '').trim().slice(0, 30) || 'Guest'; }
function cleanIds(list) {
  return (Array.isArray(list) ? list : []).map(String).filter(function (x) { return /^[a-z0-9-]{1,40}$/.test(x); }).slice(0, 300);
}
function newCode() {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const b = new Uint8Array(6); crypto.getRandomValues(b);
  let c = ''; for (let i = 0; i < 6; i++) c += A[b[i] % A.length];
  return c;
}
function pubGroup(id, g) { return { id: id, name: g.name, code: g.code || '', isSolo: !!g.isSolo }; }
function pubSession(id, s) {
  return { id: id, groupId: s.groupId, date: s.date, meal: s.meal, snackNum: s.snackNum || 0, label: s.label, createdAt: s.createdAt };
}
function membersOf(g) {
  const m = g.members || {};
  return Object.keys(m).map(function (uid) {
    const x = m[uid] || {};
    return { userId: uid, name: x.name || 'Guest', joinedAt: x.joinedAt || '', photoAt: x.photoAt || 0 };
  })
    .sort(function (a, b) { return a.joinedAt.localeCompare(b.joinedAt); });
}
function sortSessions(a, b) {
  return String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt));
}
function isArchived(s, arch) {
  if (arch[s.id]) return arch[s.id] === 'archived';
  const t = Date.parse(s.createdAt);
  return !isNaN(t) && (Date.now() - t) > AUTO_ARCHIVE_MS;
}
async function myPhotoAt(uid) {
  try { const s = await getDoc(doc(db, 'users', uid)); return (s.exists() && s.data().photoAt) || 0; } catch (e) { return 0; }
}
function memberEntry(name, photoAt) {
  const e = { name: name, joinedAt: nowIso() };
  if (photoAt) e.photoAt = photoAt;
  return e;
}
async function myArchives(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return (snap.exists() && snap.data().archives) || {};
}
async function myGroups(uid) {
  const qs = await getDocs(query(collection(db, 'groups'), where('memberIds', 'array-contains', uid)));
  return qs.docs.map(function (d) { return { id: d.id, data: d.data() }; });
}
async function groupSessions(gid, n) {
  const qs = await getDocs(query(collection(db, 'sessions'), where('groupId', '==', gid), orderBy('createdAt', 'desc'), limit(n || 100)));
  return qs.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
}
async function loadGroup(gid, uid) {
  const snap = await getDoc(doc(db, 'groups', gid));
  if (!snap.exists()) throw new Error('That group no longer exists.');
  const g = snap.data();
  if (uid && (g.memberIds || []).indexOf(uid) < 0) throw new Error('You\'re not in this group. Ask for the invite code.');
  return g;
}
async function loadSession(sid) {
  const snap = await getDoc(doc(db, 'sessions', sid));
  if (!snap.exists()) throw new Error('That session no longer exists.');
  return Object.assign({ id: sid }, snap.data());
}
async function newSession(gid, uid, meal, date) {
  if (MEALS.indexOf(meal) < 0) throw new Error('Pick a meal.');
  date = /^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) ? String(date) : todayStr();
  let snackNum = 0, label = meal;
  if (meal === 'Snack') {
    const qs = await getDocs(query(collection(db, 'sessions'), where('groupId', '==', gid), where('date', '==', date), where('meal', '==', 'Snack')));
    snackNum = qs.size + 1;
    label = 'Snack #' + snackNum;
  }
  const ref = doc(collection(db, 'sessions'));
  const s = { groupId: gid, date: date, meal: meal, snackNum: snackNum, label: label, createdBy: uid, createdAt: nowIso(), submittedBy: [] };
  await setDoc(ref, s);
  return pubSession(ref.id, s);
}
function computeResults(uid, s, g, subsDocs) {
  const members = membersOf(g);
  const nameOf = {};
  members.forEach(function (m) { nameOf[m.userId] = m.name; });
  const subs = subsDocs.map(function (d) {
    const x = d.data();
    return { userId: d.id, name: nameOf[d.id] || x.name || 'Guest', likes: Array.isArray(x.likes) ? x.likes : [] };
  });
  const mine = subs.filter(function (x) { return x.userId === uid; })[0];
  if (!mine) throw new Error('Submit your picks to see the results.');
  const counts = {};
  subs.forEach(function (x) { x.likes.forEach(function (id) { (counts[id] = counts[id] || []).push(x.name); }); });
  const tally = Object.keys(counts)
    .map(function (id) { return { id: id, count: counts[id].length, names: counts[id] }; })
    .sort(function (a, b) { return b.count - a.count; });
  const done = {};
  subs.forEach(function (x) { done[x.userId] = true; });
  const photoOf = {};
  members.forEach(function (m) { photoOf[m.userId] = m.photoAt; });
  const waiting = members.filter(function (m) { return !done[m.userId]; });
  return {
    session: pubSession(s.id, s),
    group: pubGroup(s.groupId, g),
    submitters: subs.map(function (x) { return x.name; }),
    pending: waiting.map(function (m) { return m.name; }),
    people: subs.map(function (x) { return { userId: x.userId, name: x.name, photoAt: photoOf[x.userId] || 0, done: true }; })
      .concat(waiting.map(function (m) { return { userId: m.userId, name: m.name, photoAt: m.photoAt, done: false }; })),
    matches: tally.filter(function (t) { return t.count === subs.length; }).map(function (t) { return t.id; }),
    tally: tally,
    myLikes: mine.likes
  };
}

/* ---------- actions (same names as the old backend) ---------- */
export const DB = {
  async home(uid) {
    const groups = await myGroups(uid);
    const out = await Promise.all(groups.map(async function (x) {
      const g = x.data;
      const latest = (await groupSessions(x.id, 1))[0];
      let sessionCount = 0;
      if (g.isSolo) sessionCount = (await getCountFromServer(query(collection(db, 'sessions'), where('groupId', '==', x.id)))).data().count;
      return {
        id: x.id, name: g.name, code: g.code || '', isSolo: !!g.isSolo,
        memberCount: (g.memberIds || []).length, sessionCount: sessionCount,
        latest: latest ? pubSession(latest.id, latest) : null
      };
    }));
    return out.sort(function (a, b) {
      return ((b.latest && b.latest.createdAt) || '').localeCompare((a.latest && a.latest.createdAt) || '');
    });
  },

  async createGroup(uid, name, p) {
    const groupName = String(p.groupName || '').replace(/[<>]/g, '').trim().slice(0, 40);
    if (!groupName) throw new Error('Give your group a name.');
    const photoAt = await myPhotoAt(uid);
    for (let attempt = 0; attempt < 5; attempt++) {
      const ref = doc(collection(db, 'groups'));
      const code = newCode();
      const g = {
        name: groupName, code: code, createdBy: uid, createdAt: nowIso(), isSolo: false,
        memberIds: [uid], members: { [uid]: memberEntry(name, photoAt) }
      };
      const batch = writeBatch(db);
      batch.set(ref, g);
      batch.set(doc(db, 'codes', code), { groupId: ref.id, createdBy: uid });
      try { await batch.commit(); return pubGroup(ref.id, g); }
      catch (e) { if (!e || e.code !== 'permission-denied') throw e; } // code already taken: try another
    }
    throw new Error('Couldn\'t create the group. Try again.');
  },

  async joinGroup(uid, name, p) {
    const code = String(p.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!code) throw new Error('Enter a group code.');
    const cs = await getDoc(doc(db, 'codes', code));
    if (!cs.exists()) throw new Error('No group found with code ' + code + '.');
    const gid = cs.data().groupId;
    const ref = doc(db, 'groups', gid);
    let already = null;
    try { const s = await getDoc(ref); if (s.exists() && (s.data().memberIds || []).indexOf(uid) >= 0) already = s.data(); } catch (e) {}
    if (already) {
      if (((already.members || {})[uid] || {}).name !== name) await updateDoc(ref, { ['members.' + uid + '.name']: name });
    } else {
      await updateDoc(ref, { memberIds: arrayUnion(uid), ['members.' + uid]: memberEntry(name, await myPhotoAt(uid)) });
    }
    return pubGroup(gid, await loadGroup(gid, uid));
  },

  async group(uid, name, p) {
    const gid = p.groupId;
    const g = await loadGroup(gid, uid);
    const both = await Promise.all([groupSessions(gid, 100), myArchives(uid)]);
    const all = both[0].sort(sortSessions), arch = both[1];
    const sessions = all.filter(function (s) { return !isArchived(s, arch); }).slice(0, 60).map(function (s) {
      const by = s.submittedBy || [];
      return Object.assign(pubSession(s.id, s), { submittedCount: by.length, mySubmitted: by.indexOf(uid) >= 0 });
    });
    return {
      group: pubGroup(gid, g), members: membersOf(g), sessions: sessions,
      archivedCount: all.filter(function (s) { return isArchived(s, arch); }).length
    };
  },

  async createSession(uid, name, p) {
    await loadGroup(p.groupId, uid);
    return newSession(p.groupId, uid, p.meal, p.date);
  },

  async solo(uid, name, p) {
    const gid = 'solo_' + uid;
    const ref = doc(db, 'groups', gid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        name: 'Just me', code: '', createdBy: uid, createdAt: nowIso(), isSolo: true,
        memberIds: [uid], members: { [uid]: memberEntry(name, await myPhotoAt(uid)) }
      });
    }
    return newSession(gid, uid, p.meal, p.date);
  },

  async session(uid, name, p) {
    const s = await loadSession(p.sessionId);
    const g = await loadGroup(s.groupId, uid);
    const by = s.submittedBy || [];
    return { session: pubSession(s.id, s), group: pubGroup(s.groupId, g), members: membersOf(g), submittedCount: by.length, mySubmitted: by.indexOf(uid) >= 0 };
  },

  async submit(uid, name, p) {
    const s = await loadSession(p.sessionId);
    const batch = writeBatch(db);
    batch.set(doc(db, 'sessions', s.id, 'submissions', uid), {
      name: name, likes: cleanIds(p.likes), dislikes: cleanIds(p.dislikes), submittedAt: nowIso()
    });
    batch.update(doc(db, 'sessions', s.id), { submittedBy: arrayUnion(uid) });
    await batch.commit();
    return { saved: true };
  },

  async results(uid, name, p) {
    const s = await loadSession(p.sessionId);
    const g = await loadGroup(s.groupId, uid);
    if ((s.submittedBy || []).indexOf(uid) < 0) throw new Error('Submit your picks to see the results.');
    const qs = await getDocs(collection(db, 'sessions', s.id, 'submissions'));
    return computeResults(uid, s, g, qs.docs);
  },

  async rename(uid, name) {
    await setDoc(doc(db, 'users', uid), { name: name }, { merge: true });
    const groups = await myGroups(uid);
    await Promise.all(groups.map(function (x) {
      return updateDoc(doc(db, 'groups', x.id), { ['members.' + uid + '.name']: name });
    }));
    return { name: name };
  },

  async leaveGroup(uid, name, p) {
    await updateDoc(doc(db, 'groups', p.groupId), { memberIds: arrayRemove(uid), ['members.' + uid]: deleteField() });
    return { left: true };
  },

  async setArchive(uid, name, p) {
    await setDoc(doc(db, 'users', uid), { archives: { [p.sessionId]: p.archived ? 'archived' : 'active' } }, { merge: true });
    return { archived: !!p.archived };
  },

  /* Profile photo: a small JPEG data URL made on the phone, or '' to remove it. */
  async setAvatar(uid, name, p) {
    const photo = String(p.photo || '');
    const at = photo ? Date.now() : 0;
    if (photo) {
      if (!/^data:image\/jpeg;base64,/.test(photo) || photo.length > 140000) throw new Error('That photo is too large. Try another one.');
      await setDoc(doc(db, 'avatars', uid), { photo: photo, updatedAt: at });
    } else {
      try { await deleteDoc(doc(db, 'avatars', uid)); } catch (e) {}
    }
    await setDoc(doc(db, 'users', uid), { photoAt: at }, { merge: true });
    const groups = await myGroups(uid);
    await Promise.all(groups.map(function (x) {
      return updateDoc(doc(db, 'groups', x.id), { ['members.' + uid + '.photoAt']: at });
    }));
    return { photoAt: at };
  },

  /* Fetch photos for a list of user ids. Returns {uid: {photo, at}}. */
  async avatars(uid, name, p) {
    const ids = (Array.isArray(p.ids) ? p.ids : []).slice(0, 60);
    const out = {};
    await Promise.all(ids.map(async function (id) {
      try {
        const s = await getDoc(doc(db, 'avatars', id));
        out[id] = s.exists() ? { photo: s.data().photo, at: s.data().updatedAt || 0 } : { photo: '', at: 0 };
      } catch (e) {}
    }));
    return out;
  },

  async archived(uid) {
    const both = await Promise.all([myGroups(uid), myArchives(uid)]);
    const groups = both[0], arch = both[1];
    const lists = await Promise.all(groups.map(async function (x) {
      const ss = await groupSessions(x.id, 100);
      return ss.filter(function (s) { return isArchived(s, arch); }).map(function (s) {
        return Object.assign(pubSession(s.id, s), {
          groupName: x.data.isSolo ? 'Solo' : x.data.name,
          auto: !arch[s.id],
          mySubmitted: (s.submittedBy || []).indexOf(uid) >= 0
        });
      });
    }));
    return [].concat.apply([], lists).sort(sortSessions);
  }
};

/* Live results: calls onData every time anyone submits or the group changes. */
export function watchResults(uid, sessionId, onData, onError) {
  let s = null, g = null, subs = null;
  const unsubs = [];
  const emit = function () {
    if (!s || !g || !subs) return;
    try { onData(computeResults(uid, s, g, subs)); } catch (e) { onError && onError(e); }
  };
  unsubs.push(onSnapshot(doc(db, 'sessions', sessionId), function (snap) {
    if (!snap.exists()) return;
    const first = !s;
    s = Object.assign({ id: snap.id }, snap.data());
    if (first) {
      unsubs.push(onSnapshot(doc(db, 'groups', s.groupId), function (gs) { if (gs.exists()) { g = gs.data(); emit(); } }, onError));
      unsubs.push(onSnapshot(collection(db, 'sessions', sessionId, 'submissions'), function (qs) { subs = qs.docs; emit(); }, onError));
    }
  }, onError));
  return function () { unsubs.forEach(function (u) { try { u(); } catch (e) {} }); };
}

/* Friendlier error messages */
export function friendlyError(e) {
  const code = e && e.code;
  if (code === 'permission-denied') return new Error('You don\'t have access to that. Ask the group for its invite code.');
  if (code === 'unavailable') return new Error('Can\'t reach Forkcast right now. Check your connection.');
  if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation' || code === 'auth/configuration-not-found') {
    return new Error('Sign-in isn\'t turned on in Firebase yet. In the Firebase console: Authentication > Sign-in method > Anonymous > Enable.');
  }
  if (code === 'auth/network-request-failed') return new Error('Can\'t reach Forkcast right now. Check your connection.');
  return e instanceof Error ? e : new Error(String(e));
}
````

### web/firebase-config.js

````js
// Forkcast Firebase settings (written by scripts/setup.sh).
// These values are safe to publish: Firestore security rules protect the data.
window.FORKCAST_FIREBASE = {"projectId":"forkcast-bz89c","appId":"1:713672234916:web:0a154f1810c03554dbd331","storageBucket":"forkcast-bz89c.firebasestorage.app","apiKey":"AIzaSyBAUCVwjhFHEefiysAX-iSp2cRikcVZdSQ","authDomain":"forkcast-bz89c.firebaseapp.com","messagingSenderId":"713672234916","projectNumber":"713672234916","version":"2"};
````

### web/manifest.webmanifest

````json
{
  "name": "Forkcast",
  "short_name": "Forkcast",
  "description": "Swipe to decide what to eat, solo or with your group.",
  "start_url": "./",
  "scope": "./",
  "display": "fullscreen",
  "background_color": "#FFF8F2",
  "theme_color": "#FF5A5F",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "display_override": [
    "fullscreen",
    "standalone"
  ]
}
````

### firestore.rules

````js
rules_version = '2';

// Forkcast 2.0 security rules.
// Everyone signs in anonymously. You can only see groups you belong to,
// sessions in those groups, and other people's picks after you've submitted your own.
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() { return request.auth != null; }
    function me() { return request.auth.uid; }
    function groupOf(gid) { return get(/databases/$(database)/documents/groups/$(gid)).data; }
    function isMember(gid) { return signedIn() && me() in groupOf(gid).memberIds; }
    // True when the only id added to or removed from a list is your own.
    function onlyMeChanged(before, after) {
      return after.toSet().difference(before.toSet())
        .union(before.toSet().difference(after.toSet()))
        .hasOnly([me()]);
    }

    match /groups/{gid} {
      allow get: if signedIn() && (resource == null || me() in resource.data.memberIds);
      allow list: if signedIn() && me() in resource.data.memberIds;

      allow create: if signedIn()
        && request.resource.data.createdBy == me()
        && request.resource.data.memberIds == [me()]
        && request.resource.data.members.keys().hasOnly([me()])
        && request.resource.data.name is string
        && request.resource.data.name.size() > 0
        && request.resource.data.name.size() <= 40
        && ((gid == 'solo_' + me() && request.resource.data.isSolo == true)
            || (gid != 'solo_' + me() && request.resource.data.isSolo == false));

      // Join, leave, or rename yourself. Nobody can change anyone else's entry.
      allow update: if signedIn()
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['memberIds', 'members'])
        && onlyMeChanged(resource.data.memberIds, request.resource.data.memberIds)
        && request.resource.data.members.diff(resource.data.members).affectedKeys().hasOnly([me()])
        && (resource.data.isSolo != true || resource.data.createdBy == me());

      allow delete: if false;
    }

    // Invite codes: look one up if you know it; nobody can list them.
    match /codes/{code} {
      allow get: if signedIn();
      allow list: if false;
      allow create: if signedIn()
        && request.resource.data.createdBy == me()
        && getAfter(/databases/$(database)/documents/groups/$(request.resource.data.groupId)).data.createdBy == me()
        && getAfter(/databases/$(database)/documents/groups/$(request.resource.data.groupId)).data.code == code;
      allow update, delete: if false;
    }

    match /sessions/{sid} {
      allow get: if signedIn() && (resource == null || isMember(resource.data.groupId));
      allow list: if isMember(resource.data.groupId);

      allow create: if isMember(request.resource.data.groupId)
        && request.resource.data.createdBy == me()
        && request.resource.data.submittedBy == []
        && request.resource.data.meal in ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

      // The only change allowed: marking yourself as submitted.
      allow update: if isMember(resource.data.groupId)
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['submittedBy'])
        && onlyMeChanged(resource.data.submittedBy, request.resource.data.submittedBy);

      allow delete: if false;

      match /submissions/{uid} {
        // See everyone's picks only after you've submitted yours.
        allow read: if isMember(get(/databases/$(database)/documents/sessions/$(sid)).data.groupId)
          && exists(/databases/$(database)/documents/sessions/$(sid)/submissions/$(me()));
        allow create, update: if signedIn() && uid == me()
          && isMember(get(/databases/$(database)/documents/sessions/$(sid)).data.groupId)
          && request.resource.data.likes is list && request.resource.data.likes.size() <= 300
          && request.resource.data.dislikes is list && request.resource.data.dislikes.size() <= 300;
        allow delete: if false;
      }
    }

    // Profile photos: small JPEGs. Anyone signed in can view one if they know the person's id
    // (ids are only visible inside groups). Only you can change or remove yours.
    match /avatars/{uid} {
      allow read: if signedIn();
      allow create, update: if signedIn() && uid == me()
        && request.resource.data.photo is string
        && request.resource.data.photo.size() < 140000
        && request.resource.data.photo.matches('data:image/jpeg;base64,[A-Za-z0-9+/=]+')
        && request.resource.data.updatedAt is int;
      allow delete: if signedIn() && uid == me();
    }

    // Your own profile: name, photo version, and which sessions you archived.
    match /users/{uid} {
      allow read, write: if signedIn() && uid == me();
    }
  }
}
````

### firestore.indexes.json

````json
{
  "indexes": [
    {
      "collectionGroup": "sessions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "groupId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
````

### firebase.json

````json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "auth": {
    "providers": {
      "anonymous": true
    }
  }
}
````

### .github/workflows/pages.yml

````yaml
name: Publish Forkcast to GitHub Pages

on:
  push:
    branches: [main]
    paths: ['web/**', '.github/workflows/pages.yml']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: web
      - id: deployment
        uses: actions/deploy-pages@v4
````

### scripts/setup.sh

````bash
#!/usr/bin/env bash
# Forkcast 2.0 one-time setup (WSL).
# Easiest way to run it, from anywhere in WSL:
#   cd ~ && unzip -o "$(ls -t /mnt/c/Users/*/Downloads/forkcast-v2*.zip | head -1)" && cd forkcast-v2 && bash scripts/setup.sh
#
# What it does:
#   1. Checks your tools and installs the Firebase CLI if needed
#   2. Signs you in to Firebase and GitHub
#   3. Creates a Firebase project, a web app, and the Firestore database
#   4. Publishes the security rules and turns on anonymous sign-in
#   5. Writes web/firebase-config.js
#   6. Creates the GitHub repo, turns on GitHub Pages, and publishes the app
#
# Options (put them before the command):
#   FIREBASE_PROJECT=my-project-id   use a Firebase project you already made
#   REPO_NAME=forkcast               GitHub repo name (default: forkcast)
#   FIRESTORE_LOCATION=nam5          database location (default: nam5, United States)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
ENV_FILE="$ROOT/.forkcast.env"
REPO_NAME="${REPO_NAME:-forkcast}"
LOCATION="${FIRESTORE_LOCATION:-nam5}"

bold() { printf '\n\033[1m%s\033[0m\n' "$*"; }
info() { printf '  %s\n' "$*"; }
die()  { printf '\n\033[31mStopped:\033[0m %s\n' "$*" >&2; exit 1; }
pause() { read -r -p "  Press Enter when done... " _; }
save_env() {
  touch "$ENV_FILE"
  grep -v "^$1=" "$ENV_FILE" > "$ENV_FILE.tmp" || true
  echo "$1=$2" >> "$ENV_FILE.tmp" && mv "$ENV_FILE.tmp" "$ENV_FILE"
}
[ -f "$ENV_FILE" ] && source "$ENV_FILE"
FIREBASE_PROJECT="${FIREBASE_PROJECT:-}"
VERSION="$(grep -oE "APP_VERSION = '[^']+'" web/index.html | grep -oE "[0-9][0-9.]*")"

# ---------- 1. Tools ----------
bold "1/6  Checking tools"
command -v git >/dev/null  || die "git is missing. Run: sudo apt update && sudo apt install -y git"
command -v curl >/dev/null || die "curl is missing. Run: sudo apt install -y curl"
command -v node >/dev/null || die "Node.js is missing. Install Node 20+: https://github.com/nvm-sh/nvm (then: nvm install --lts)"
[ "$(node -p 'process.versions.node.split(".")[0]')" -ge 20 ] || die "Node 20 or newer is needed. Run: nvm install --lts"
command -v gh >/dev/null   || die "GitHub CLI (gh) is missing. Install: https://github.com/cli/cli/blob/trunk/docs/install_linux.md"
if ! command -v firebase >/dev/null; then
  info "Installing the Firebase CLI..."
  npm install -g firebase-tools || die "Couldn't install firebase-tools."
fi
info "node $(node -v), firebase $(firebase --version), $(gh --version | head -1)"
if [ -z "${BROWSER:-}" ] && command -v wslview >/dev/null; then export BROWSER=wslview; fi

# ---------- 2. Sign-ins ----------
bold "2/6  Signing in"
if ! firebase projects:list >/dev/null 2>&1; then
  info "Signing in to Firebase. If no browser opens, copy the link it prints into Chrome."
  firebase login || firebase login --no-localhost || die "Firebase sign-in didn't finish."
else
  info "Firebase: already signed in."
fi
if ! gh auth status >/dev/null 2>&1; then
  gh auth login -w -p https || die "GitHub sign-in didn't finish."
fi
OWNER="$(gh api user -q .login)"
info "GitHub: signed in as $OWNER."
[ -n "$(git config --global user.name || true)" ]  || { read -r -p "  Your name for git commits: " x; git config --global user.name "$x"; }
[ -n "$(git config --global user.email || true)" ] || { read -r -p "  Your email for git commits: " x; git config --global user.email "$x"; }

# ---------- 3. Firebase project, app, database ----------
bold "3/6  Setting up Firebase"
if [ -z "$FIREBASE_PROJECT" ]; then
  FIREBASE_PROJECT="forkcast-$(node -e 'const c="abcdefghijkmnpqrstuvwxyz23456789";let s="";for(const b of require("crypto").randomBytes(5))s+=c[b%c.length];console.log(s)')"
  info "Creating Firebase project $FIREBASE_PROJECT ..."
  firebase projects:create "$FIREBASE_PROJECT" --display-name "Forkcast" \
    || die "Couldn't create the project. You can make one at https://console.firebase.google.com and rerun with FIREBASE_PROJECT=<its id>."
fi
save_env FIREBASE_PROJECT "$FIREBASE_PROJECT"
printf '{\n  "projects": { "default": "%s" }\n}\n' "$FIREBASE_PROJECT" > .firebaserc

if [ -z "${FIREBASE_APP_ID:-}" ]; then
  info "Registering the Forkcast web app..."
  OUT="$(firebase apps:create WEB "Forkcast" --project "$FIREBASE_PROJECT" 2>&1)" || die "Couldn't create the web app: $OUT"
  FIREBASE_APP_ID="$(printf '%s' "$OUT" | grep -oE '1:[0-9]+:web:[0-9a-f]+' | head -1)"
  [ -n "$FIREBASE_APP_ID" ] || die "Couldn't read the app ID. Output was: $OUT"
fi
save_env FIREBASE_APP_ID "$FIREBASE_APP_ID"

info "Creating the Firestore database ($LOCATION)..."
firebase firestore:databases:create "(default)" --location "$LOCATION" --project "$FIREBASE_PROJECT" >/dev/null 2>&1 \
  && info "Database created." \
  || info "Database already exists (or create it once at https://console.firebase.google.com/project/$FIREBASE_PROJECT/firestore)."

# ---------- 4. Rules + anonymous sign-in ----------
bold "4/6  Publishing security rules and turning on anonymous sign-in"
if ! firebase deploy --only firestore,auth --project "$FIREBASE_PROJECT" --non-interactive; then
  info "Rules or sign-in didn't publish. Do these two clicks, then press Enter:"
  info "  1. https://console.firebase.google.com/project/$FIREBASE_PROJECT/firestore  (Create database, if asked)"
  info "  2. https://console.firebase.google.com/project/$FIREBASE_PROJECT/authentication/providers  (Anonymous > Enable)"
  pause
  firebase deploy --only firestore --project "$FIREBASE_PROJECT" --non-interactive || die "Rules still didn't publish."
fi

# ---------- 5. App config ----------
bold "5/6  Connecting the app to Firebase"
CONFIG_JSON="$(firebase apps:sdkconfig WEB "$FIREBASE_APP_ID" --project "$FIREBASE_PROJECT" --json 2>/dev/null \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const c=(j.result&&(j.result.sdkConfig||j.result))||{};process.stdout.write(JSON.stringify(c))}catch(e){}})')"
if [ -z "$CONFIG_JSON" ] || [ "$CONFIG_JSON" = "{}" ]; then
  CONFIG_JSON="$(firebase apps:sdkconfig WEB "$FIREBASE_APP_ID" --project "$FIREBASE_PROJECT" \
    | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const a=s.indexOf("{"),b=s.lastIndexOf("}");process.stdout.write(a>=0?JSON.stringify(JSON.parse(s.slice(a,b+1))):"")})')"
fi
echo "$CONFIG_JSON" | grep -q apiKey || die "Couldn't read the Firebase web config."
cat > web/firebase-config.js <<EOF
// Forkcast Firebase settings (written by scripts/setup.sh).
// These values are safe to publish: Firestore security rules protect the data.
window.FORKCAST_FIREBASE = $CONFIG_JSON;
EOF
info "Saved web/firebase-config.js"
info "Checking that sign-in works..."
until bash scripts/check-auth.sh; do
  info "Do the fix above in your browser, then press Enter to check again (or Ctrl+C to stop)."
  pause
done

# ---------- 6. GitHub ----------
bold "6/6  Publishing on GitHub Pages"
node scripts/build-docs.mjs
[ -d .git ] || git init -q -b main
git add -A
git commit -q -m "Forkcast v$VERSION" || true
if ! git remote get-url origin >/dev/null 2>&1; then
  if gh repo view "$OWNER/$REPO_NAME" >/dev/null 2>&1; then
    info "You already have a repo named $REPO_NAME (probably Forkcast 1.x)."
    read -r -p "  Rename it to $REPO_NAME-v1 and keep it as a backup? [Y/n] " ans
    if [ "${ans:-Y}" != "n" ] && [ "${ans:-Y}" != "N" ]; then
      gh repo rename "$REPO_NAME-v1" -R "$OWNER/$REPO_NAME" --yes || die "Rename failed. Rerun with REPO_NAME=forkcast2"
      info "Old version is now at https://github.com/$OWNER/$REPO_NAME-v1"
      sleep 3
    else
      REPO_NAME="$REPO_NAME-v2"; info "Using $REPO_NAME instead."
    fi
  fi
  gh repo create "$REPO_NAME" --public --source=. --remote=origin --description "Forkcast: swipe to decide what to eat" \
    || die "Couldn't create the GitHub repo."
fi
REPO_SLUG="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
save_env REPO_SLUG "$REPO_SLUG"
gh api -X POST "repos/$REPO_SLUG/pages" -f build_type=workflow >/dev/null 2>&1 \
  || gh api -X PUT "repos/$REPO_SLUG/pages" -f build_type=workflow >/dev/null 2>&1 \
  || info "Turn on Pages by hand: repo Settings > Pages > Source: GitHub Actions."
git push -u origin main
SITE="$(echo "https://${REPO_SLUG%%/*}.github.io/${REPO_SLUG##*/}/" | tr '[:upper:]' '[:lower:]')"
save_env SITE_URL "$SITE"
git add -A && git commit -q -m "Save setup info" && git push -q || true

bold "Done. Forkcast v$VERSION is publishing."
info "App:       $SITE   (live in about a minute; watch with: gh run watch)"
info "Repo:      https://github.com/$REPO_SLUG"
info "Firebase:  https://console.firebase.google.com/project/$FIREBASE_PROJECT"
info "Updates:   bash scripts/deploy.sh"
````

### scripts/deploy.sh

````bash
#!/usr/bin/env bash
# Publish Forkcast changes (WSL):
#   bash scripts/deploy.sh               rules + app + docs
#   bash scripts/deploy.sh --web         app + docs only (skip Firebase rules)
#   bash scripts/deploy.sh -m "note"     add a note to the commit
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
[ -f .forkcast.env ] || { echo "Run bash scripts/setup.sh first."; exit 1; }
source .forkcast.env

WEB_ONLY=0; MSG=""
while [ $# -gt 0 ]; do
  case "$1" in
    --web) WEB_ONLY=1 ;;
    -m) shift; MSG="${1:-}" ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
  shift
done

VERSION="$(grep -oE "APP_VERSION = '[^']+'" web/index.html | grep -oE "[0-9][0-9.]*")"
echo "Deploying Forkcast v$VERSION"
bash scripts/check-auth.sh || echo "  (Publishing anyway. The app won't load data until sign-in is fixed.)"

if [ "$WEB_ONLY" = "0" ]; then
  echo "  Publishing security rules and indexes..."
  firebase deploy --only firestore --project "$FIREBASE_PROJECT" --non-interactive
fi

echo "  Updating HANDOFF.md and FEATURES.md..."
node scripts/build-docs.mjs

git add -A
if git diff --cached --quiet; then
  echo "  Nothing new to publish."
else
  git commit -q -m "Forkcast v$VERSION${MSG:+: $MSG}"
  git push -q
  echo "  Pushed. GitHub Pages updates in about a minute (gh run watch)."
fi
echo "App: ${SITE_URL:-see Settings > Pages in your repo}"
````

### scripts/dev.sh

````bash
#!/usr/bin/env bash
# Preview Forkcast locally (WSL):  bash scripts/dev.sh
# Then open http://localhost:8080 in Chrome or Edge on Windows.
# It uses your real Firebase data.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PORT:-8080}"
echo "Forkcast preview: http://localhost:$PORT   (Ctrl+C to stop)"
python3 -m http.server "$PORT" --directory "$ROOT/web"
````

### scripts/check-auth.sh

````bash
#!/usr/bin/env bash
# Confirms Firebase anonymous sign-in works for this app (used by setup.sh and deploy.sh).
# Exits 0 if it works, 1 if not, with the exact console link to fix it.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEY="$(node -e 'const s=require("fs").readFileSync(process.argv[1],"utf8");const m=s.match(/"apiKey"\s*:\s*"([^"]+)"/);process.stdout.write(m?m[1]:"")' "$ROOT/web/firebase-config.js")"
PROJECT="$(node -e 'const s=require("fs").readFileSync(process.argv[1],"utf8");const m=s.match(/"projectId"\s*:\s*"([^"]+)"/);process.stdout.write(m?m[1]:"")' "$ROOT/web/firebase-config.js")"
if [ -z "$KEY" ]; then echo "  web/firebase-config.js is empty. Run: bash scripts/setup.sh"; exit 1; fi
RES="$(curl -s --max-time 20 -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$KEY" \
  -H 'Content-Type: application/json' -d '{"returnSecureToken":true}')"
if printf '%s' "$RES" | grep -q '"idToken"'; then
  echo "  Sign-in check: OK"
  exit 0
fi
REASON="$(printf '%s' "$RES" | grep -oE '"message": *"[^"]+"' | head -1 | sed 's/.*: *"//;s/"$//')"
echo "  Sign-in check FAILED (${REASON:-no answer})."
echo "  Fix: open https://console.firebase.google.com/project/$PROJECT/authentication/providers"
echo "       click Get started if you see it, then Anonymous > Enable > Save."
exit 1
````

### scripts/build-docs.mjs

````js
// Rebuilds HANDOFF.md and FEATURES.md from the app source.
// Runs automatically in setup.sh and deploy.sh:  node scripts/build-docs.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const html = read('web/index.html');
const version = (html.match(/APP_VERSION = '([^']+)'/) || [])[1] || '?';
const credit = (html.match(/APP_CREDIT = '([^']+)'/) || [])[1] || '';
const changelog = Function('return ' + html.match(/const CHANGELOG = (\[[\s\S]*?\n\]);/)[1])();
const foodCount = (html.split('const PAL')[0].match(/\n\s*\['[a-z0-9-]+','/g) || []).length;
const env = existsSync(new URL('../.forkcast.env', import.meta.url))
  ? Object.fromEntries(read('.forkcast.env').trim().split('\n').filter(Boolean).map(l => l.split(/=(.*)/s).slice(0, 2)))
  : {};
const fmt = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
const log = changelog.map(([v, items, date]) =>
  `### ${v}${date ? ' (' + fmt(date) + ')' : ''}\n` + items.map(i => `- ${i}`).join('\n')).join('\n\n');

// ---------- FEATURES.md (short, shareable) ----------
writeFileSync(new URL('../FEATURES.md', import.meta.url), `# Forkcast: Features and Updates

**Current version: ${version}**${credit ? ` · Created by ${credit}` : ''}
${env.SITE_URL ? `\nOpen it: ${env.SITE_URL}\n` : ''}
Can't decide what to eat? Everyone swipes through food ideas, and Forkcast shows what you all said yes to.

## What it does

- **Swipe to decide.** Right for yes, left for no. Works solo or with a group.
- **Groups that stick around.** Invite people with a 6-letter code or a QR code. Start a new session for each meal: Breakfast, Lunch, Dinner, or Snack #1, #2...
- **Live results.** Matches appear the moment everyone submits, plus a ranked list of every yes. Can't pick? Let Forkcast choose.
- **${foodCount} food ideas** suited to each meal, from pancakes and silog to taco night, chicken adobo, and loaded fries, plus Eat Out and Get Take-out.
- **Cook it or find it.** Results link to NYT Cooking recipes and open Google Maps or Apple Maps to find places nearby.
- **Tidy history.** Swipe old sessions away to archive them; they also archive themselves after 72 hours.
- **Your look.** Light, dark, or auto theme, six accent colors, larger text, and fewer animations.
- **No account needed.** Add it to your home screen on iPhone, iPad, or Android.

## Version log

${log}
`);

// ---------- HANDOFF.md (rebuild guide + full source) ----------
const files = ['web/index.html', 'web/data.js', 'web/firebase-config.js', 'web/manifest.webmanifest',
  'firestore.rules', 'firestore.indexes.json', 'firebase.json', '.github/workflows/pages.yml',
  'scripts/setup.sh', 'scripts/deploy.sh', 'scripts/dev.sh', 'scripts/check-auth.sh', 'scripts/build-docs.mjs'];
const lang = (f) => ({ html: 'html', js: 'js', mjs: 'js', json: 'json', webmanifest: 'json', rules: 'js', yml: 'yaml', sh: 'bash' })[f.split('.').pop()] || '';
const intro = read('scripts/handoff-intro.md')
  .replaceAll('{{VERSION}}', version)
  .replaceAll('{{SITE_URL}}', env.SITE_URL || '(set after setup)')
  .replaceAll('{{REPO}}', env.REPO_SLUG ? 'https://github.com/' + env.REPO_SLUG : '(set after setup)')
  .replaceAll('{{FIREBASE_PROJECT}}', env.FIREBASE_PROJECT || '(set after setup)');
const source = files.filter(f => existsSync(new URL('../' + f, import.meta.url)))
  .map(f => `### ${f}\n\n\`\`\`\`${lang(f)}\n${read(f).replace(/\s+$/, '')}\n\`\`\`\`\n`).join('\n');
writeFileSync(new URL('../HANDOFF.md', import.meta.url),
  intro + `\n## Version log\n\n${log}\n\n## Full source\n\nIcons (web/*.png) aren't included as text. Everything else needed to rebuild Forkcast v${version} is below.\n\n${source}`);
console.log(`Docs updated for v${version}: HANDOFF.md, FEATURES.md`);
````
