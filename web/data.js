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
