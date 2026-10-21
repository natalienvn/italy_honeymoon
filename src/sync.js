import { useState, useEffect, useRef, useCallback } from "react";

// ---------- three-way merge (never loses data) ----------
//
// base   = what this device last synced with the cloud
// local  = what is on this device now
// remote = what is in the cloud now
//
// Whichever side changed a thing wins for that thing. If both sides changed the very same
// field, the cloud's version stays in place (so every device converges on the same trip) and
// this device's version of that trip is kept as a separate "(other device copy)" trip, so
// nothing is ever thrown away.

const newId = () => Math.random().toString(36).slice(2, 9);

function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v).sort()) {
      if (v[k] !== undefined) out[k] = sortKeys(v[k]);
    }
    return out;
  }
  return v;
}
export const canon = (v) => JSON.stringify(sortKeys(v));
const same = (a, b) => canon(a) === canon(b);

const isPlainObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const isIdList = (v) => Array.isArray(v) && v.every((x) => isPlainObj(x) && typeof x.id === "string");

function mergeLists(b, l, r, both) {
  const bm = new Map(b.map((x) => [x.id, x]));
  const lm = new Map(l.map((x) => [x.id, x]));
  const rm = new Map(r.map((x) => [x.id, x]));
  const out = [];
  const seen = new Set();
  for (const id of [...r.map((x) => x.id), ...l.map((x) => x.id)]) {
    if (seen.has(id)) continue;
    seen.add(id);
    const B = bm.get(id);
    const L = lm.get(id);
    const R = rm.get(id);
    if (L && R) out.push(both(B, L, R));
    else if (L) {
      // gone from the cloud: it was deleted there, unless it's new here or was edited here
      if (B && same(B, L)) continue;
      out.push(L);
    } else if (R) {
      if (B && same(B, R)) continue;
      out.push(R);
    }
  }
  return out;
}

function merge(B, L, R, st) {
  if (same(L, R)) return L;
  if (B !== undefined && same(B, L)) return R;
  if (B !== undefined && same(B, R)) return L;
  if (isIdList(L) && isIdList(R)) {
    return mergeLists(isIdList(B) ? B : [], L, R, (b, l, r) => merge(b, l, r, st));
  }
  if (isPlainObj(L) && isPlainObj(R)) {
    const Bo = isPlainObj(B) ? B : {};
    const out = {};
    for (const k of new Set([...Object.keys(L), ...Object.keys(R)])) {
      const v = merge(Bo[k], L[k], R[k], st);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  st.conflict = true;
  return R;
}

function mergeTrips(b, l, r) {
  const extras = [];
  const out = mergeLists(b, l, r, (bt, lt, rt) => {
    const st = { conflict: false };
    const m = merge(bt, lt, rt, st);
    if (st.conflict) extras.push({ ...lt, id: newId(), name: `${lt.name || "Trip"} (other device copy)` });
    return m;
  });
  return [...out, ...extras];
}

export function mergeRoot(base, local, remote) {
  const b = base && Array.isArray(base.folders) ? base.folders : [];
  const folders = mergeLists(b, local.folders, remote.folders, (bf, lf, rf) => {
    const st = { conflict: false };
    const name = merge(bf && bf.name, lf.name, rf.name, st);
    return { ...rf, ...lf, name, trips: mergeTrips((bf && bf.trips) || [], lf.trips || [], rf.trips || []) };
  });
  return { ...local, folders };
}

// Is this just the untouched starter data? (compare ignoring generated ids)
function stripIds(v) {
  if (Array.isArray(v)) return v.map(stripIds);
  if (v && typeof v === "object") {
    const out = {};
    for (const k of Object.keys(v)) if (k !== "id") out[k] = stripIds(v[k]);
    return out;
  }
  return v;
}
export const looksLikeStarter = (data, starter) => canon(stripIds(data)) === canon(stripIds(starter));

// ---------- device storage for sync settings ----------

const CFG_KEY = "travel-planner-sync";
const BASE_KEY = "travel-planner-sync-base";
const PREBACKUP_KEY = "travel-planner-prebackup";

function readCfg() {
  try {
    const c = JSON.parse(localStorage.getItem(CFG_KEY) || "null");
    if (c && typeof c.code === "string" && c.code) return { code: c.code, rev: Number(c.rev) || 0 };
  } catch {
    // ignore
  }
  return null;
}
function writeCfg(c) {
  try {
    if (c) localStorage.setItem(CFG_KEY, JSON.stringify(c));
    else localStorage.removeItem(CFG_KEY);
  } catch {
    // ignore
  }
}
function readBase() {
  try {
    const s = localStorage.getItem(BASE_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}
function writeBase(d) {
  try {
    if (d) localStorage.setItem(BASE_KEY, JSON.stringify(d));
    else localStorage.removeItem(BASE_KEY);
  } catch {
    // ignore
  }
}

export const normalizeCode = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, "");

export function generateCode() {
  const alphabet = "abcdefghjkmnpqrstvwxyz23456789";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (x) => alphabet[x % alphabet.length]).join("");
  return chars.match(/.{4}/g).join("-");
}

// A link like https://yoursite.vercel.app/#sync=abcd-... turns sync on for whatever device opens it.
function adoptCodeFromLink() {
  try {
    const m = /[#&]sync=([^&]+)/.exec(window.location.hash || "");
    if (!m) return null;
    const code = normalizeCode(decodeURIComponent(m[1]));
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    return code.length >= 8 ? code : null;
  } catch {
    return null;
  }
}

async function callApi(body) {
  let res;
  try {
    res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    const e = new Error("offline");
    e.kind = "offline";
    throw e;
  }
  let json = null;
  try {
    json = await res.json();
  } catch {
    // not JSON (for example, the API isn't deployed on this host)
  }
  if (res.status === 409 && json) return { conflict: true, ...json };
  if (!res.ok) {
    const e = new Error((json && json.message) || `Sync failed (${res.status})`);
    e.kind = json && json.error === "not_configured" ? "not_configured" : res.status === 404 ? "no_api" : "error";
    throw e;
  }
  return json;
}

// ---------- the hook ----------
//
// data/setData: the app's trip data. ready: true once local data has been loaded.
// isStarter: true if this device only has the untouched starter data (so the cloud copy should win).
// migrate: turns whatever came from the cloud into the current data shape.

export function useCloudSync({ data, setData, ready, isStarter, migrate }) {
  const [cfg, setCfg] = useState(() => {
    const fromLink = adoptCodeFromLink();
    if (fromLink) {
      const existing = readCfg();
      if (!existing || existing.code !== fromLink) {
        const c = { code: fromLink, rev: 0 };
        writeCfg(c);
        writeBase(null);
        return c;
      }
      return existing;
    }
    return readCfg();
  });
  const [state, setState] = useState(cfg ? "syncing" : "off");
  const [message, setMessage] = useState("");
  const [lastSynced, setLastSynced] = useState(null);

  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;
  const dataRef = useRef(data);
  dataRef.current = data;
  const starterRef = useRef(isStarter);
  const loadedRef = useRef(null);
  const busy = useRef(false);
  const again = useRef(false);
  const migrateRef = useRef(migrate);
  migrateRef.current = migrate;
  const setDataRef = useRef(setData);
  setDataRef.current = setData;

  // Once the person changes anything, this is no longer just the starter copy.
  useEffect(() => {
    if (!ready) return;
    if (loadedRef.current === null) {
      loadedRef.current = data;
      starterRef.current = isStarter;
    } else if (data !== loadedRef.current) {
      starterRef.current = false;
    }
  }, [data, ready, isStarter]);

  const syncOnce = useCallback(async () => {
    const c = cfgRef.current;
    if (!c) return;
    let handedOver = null; // the cloud copy the server sent back with a conflict; use it instead of asking again
    let lastDetail = "";
    for (let attempt = 0; attempt < 8; attempt++) {
      const local = dataRef.current;
      const pulled = handedOver || (await callApi({ action: "pull", code: c.code }));
      handedOver = null;
      const remote = pulled.data ? migrateRef.current(pulled.data) : null;
      if (!cfgRef.current || cfgRef.current.code !== c.code) return; // code changed while we were talking to the server

      if (!remote) {
        if (starterRef.current) {
          setMessage("Nothing is saved under this code yet. If your trips are on another device, turn sync on there first.");
          return;
        }
      } else {
        setMessage("");
      }

      let target;
      if (!remote) target = local;
      else if (starterRef.current) target = remote;
      else target = mergeRoot(readBase(), local, remote);

      if (canon(target) !== canon(local)) {
        if (dataRef.current !== local) continue; // you typed while we were syncing; redo with the newer data
        if (!starterRef.current) {
          try {
            localStorage.setItem(PREBACKUP_KEY, JSON.stringify({ at: new Date().toISOString(), data: local }));
          } catch {
            // ignore
          }
        }
        dataRef.current = target;
        starterRef.current = false;
        setDataRef.current(target);
      }

      if (remote && canon(target) === canon(remote)) {
        writeBase(target);
        writeCfg({ code: c.code, rev: pulled.rev });
        setLastSynced(new Date());
        return;
      }

      const pushed = await callApi({ action: "push", code: c.code, baseRev: pulled.rev, data: target });
      if (pushed.conflict) {
        // someone saved in between (or the server disagreed): merge against the copy it just sent
        lastDetail = ` (cloud revision ${pushed.rev}, mine ${pulled.rev})`;
        handedOver = { rev: pushed.rev, data: pushed.data };
        continue;
      }
      writeBase(target);
      writeCfg({ code: c.code, rev: pushed.rev });
      setLastSynced(new Date());
      return;
    }
    throw Object.assign(new Error("Couldn't finish syncing after several tries." + lastDetail), { kind: "error" });
  }, []);

  const run = useCallback(async () => {
    if (!cfgRef.current) return;
    if (busy.current) {
      again.current = true;
      return;
    }
    busy.current = true;
    try {
      do {
        again.current = false;
        setState("syncing");
        try {
          await syncOnce();
          setState("synced");
        } catch (e) {
          setMessage(e.kind === "offline" ? "" : e.message || "Sync problem");
          setState(e.kind === "offline" ? "offline" : e.kind || "error");
        }
      } while (again.current);
    } finally {
      busy.current = false;
    }
  }, [syncOnce]);

  // Sync right after load and whenever the code changes.
  useEffect(() => {
    if (ready && cfg) run();
  }, [ready, cfg && cfg.code, run]); // eslint-disable-line react-hooks/exhaustive-deps

  // Push shortly after every edit.
  useEffect(() => {
    if (!ready || !cfg) return;
    if (loadedRef.current === null || data === loadedRef.current) return;
    const t = setTimeout(run, 1200);
    return () => clearTimeout(t);
  }, [data, ready, cfg && cfg.code, run]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pick up changes from other devices.
  useEffect(() => {
    if (!cfg) return;
    const onVisible = () => document.visibilityState === "visible" && run();
    const onOnline = () => run();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onOnline);
    const iv = setInterval(() => document.visibilityState === "visible" && run(), 60000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onOnline);
      clearInterval(iv);
    };
  }, [cfg && cfg.code, run]); // eslint-disable-line react-hooks/exhaustive-deps

  const enable = useCallback((rawCode) => {
    const code = normalizeCode(rawCode);
    if (code.length < 8) return false;
    const existing = readCfg();
    if (!existing || existing.code !== code) {
      writeBase(null);
      writeCfg({ code, rev: 0 });
    }
    setMessage("");
    setState("syncing");
    setCfg(readCfg());
    return true;
  }, []);

  const disable = useCallback(() => {
    writeCfg(null);
    writeBase(null);
    setCfg(null);
    setState("off");
    setMessage("");
  }, []);

  return { state, message, lastSynced, code: cfg ? cfg.code : null, enable, disable, syncNow: run };
}
