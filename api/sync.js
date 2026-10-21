import { createHash } from "node:crypto";

// Cloud sync. One JSON document per sync code, stored in a private Vercel Blob store.
// The sync code is hashed, so it is never used as a file name.
//
//   POST { action: "pull", code }                    -> { rev, data }       (rev 0 / data null if nothing saved yet)
//   POST { action: "push", code, baseRev, data }     -> { rev }   or 409 { rev, data } if someone else saved first
//
// Every time a save replaces older data, the older data is kept as "previous.json",
// plus one dated snapshot per day, so a bad merge can always be recovered.

const MAX_BYTES = 4 * 1024 * 1024;

function keyFor(code) {
  return createHash("sha256").update("travel-planner:" + code).digest("hex").slice(0, 40);
}

async function streamToString(stream) {
  return await new Response(stream).text();
}

// Real storage, backed by Vercel Blob. Swapped out for an in-memory fake in tests.
export function blobStorage() {
  let sdk;
  const load = async () => (sdk ||= await import("@vercel/blob"));
  return {
    async read(pathname) {
      const { get } = await load();
      const r = await get(pathname, { access: "private", useCache: false });
      if (!r || r.statusCode === 404 || !r.stream) return null;
      return { text: await streamToString(r.stream), etag: r.blob && r.blob.etag };
    },
    // ifMatch: etag string to require; undefined = overwrite freely; null = must not exist
    async write(pathname, text, { ifMatch, createOnly } = {}) {
      const { put, BlobPreconditionFailedError } = await load();
      try {
        const opts = { access: "private", contentType: "application/json", cacheControlMaxAge: 60 };
        if (createOnly) opts.allowOverwrite = false;
        else opts.allowOverwrite = true;
        if (ifMatch) opts.ifMatch = ifMatch;
        await put(pathname, text, opts);
        return { ok: true };
      } catch (e) {
        if (e instanceof BlobPreconditionFailedError || (e && /already exists|precondition/i.test(String(e.message)))) {
          return { ok: false, conflict: true };
        }
        throw e;
      }
    },
  };
}

function countTrips(data) {
  try {
    return data.folders.reduce((n, f) => n + (f.trips ? f.trips.length : 0), 0);
  } catch {
    return 0;
  }
}

export function makeHandler(getStorage) {
  return async function handler(req, res) {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    const body = req.body || {};
    const { action, code, baseRev, data } = body;
    if (typeof code !== "string" || code.trim().length < 8) {
      res.status(400).json({ error: "bad_code", message: "Sync code must be at least 8 characters." });
      return;
    }
    const storage = getStorage();
    const key = keyFor(code.trim());
    const current = `sync/${key}/current.json`;

    try {
      const existing = await storage.read(current);
      let doc = null;
      if (existing) {
        try {
          doc = JSON.parse(existing.text);
        } catch {
          doc = null;
        }
      }

      if (action === "pull") {
        res.status(200).json({ rev: doc ? doc.rev : 0, data: doc ? doc.data : null });
        return;
      }

      if (action === "push") {
        if (!data || !Array.isArray(data.folders)) {
          res.status(400).json({ error: "bad_data", message: "Nothing valid to save." });
          return;
        }
        const serverRev = doc ? doc.rev : 0;
        if (serverRev !== (Number(baseRev) || 0)) {
          res.status(409).json({ rev: serverRev, data: doc ? doc.data : null });
          return;
        }
        const next = { rev: serverRev + 1, savedAt: new Date().toISOString(), data };
        const text = JSON.stringify(next);
        if (text.length > MAX_BYTES) {
          res.status(413).json({ error: "too_big", message: "Data is too large to sync." });
          return;
        }

        // Keep what we're about to replace.
        if (existing) {
          await storage.write(`sync/${key}/previous.json`, existing.text);
          if (doc && countTrips(doc.data) > 0) {
            const day = new Date().toISOString().slice(0, 10);
            await storage.write(`sync/${key}/snapshot-${day}.json`, existing.text, { createOnly: true });
          }
        }

        let w = await storage.write(current, text, existing ? { ifMatch: existing.etag } : { createOnly: true });
        const parse = (r) => {
          try {
            return r ? JSON.parse(r.text) : null;
          } catch {
            return null;
          }
        };
        if (!w.ok) {
          const again = await storage.read(current);
          const d2 = parse(again);
          if (existing && d2 && d2.rev === serverRev) {
            // The revision hasn't moved, so nobody else saved: the ETag check was a false alarm. Write plainly.
            w = await storage.write(current, text, {});
          }
          if (!w.ok) {
            res.status(409).json({ rev: d2 ? d2.rev : 0, data: d2 ? d2.data : null });
            return;
          }
        }
        res.status(200).json({ rev: next.rev });
        return;
      }

      res.status(400).json({ error: "bad_action" });
    } catch (e) {
      const msg = e && e.message ? String(e.message) : "unknown";
      const notConfigured = /token|store|BLOB|credentials|unauthor|not found.*store/i.test(msg);
      res.status(notConfigured ? 503 : 500).json({
        error: notConfigured ? "not_configured" : "server_error",
        message: notConfigured
          ? "Cloud storage isn't connected to this project yet."
          : "Sync server error: " + msg.slice(0, 200),
      });
    }
  };
}

export default makeHandler(() => blobStorage());
