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
  'scripts/setup.sh', 'scripts/deploy.sh', 'scripts/dev.sh', 'scripts/build-docs.mjs'];
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
