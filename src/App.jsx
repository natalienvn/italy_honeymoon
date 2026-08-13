import { useState, useEffect, useRef } from "react";
import {
  Plane, Plus, Trash2, ChevronUp, ChevronDown, MapPin,
  FolderPlus, Check, Sparkles, Loader2, FileText,
  BedDouble, UtensilsCrossed, Ticket, Download, Upload, AlertTriangle, FileUp, X,
  ArrowLeft, Tag, Bookmark, Folder, Search, Send
} from "lucide-react";

// ---------- constants & small factories ----------

const TRAVEL_LEG = { id: "travel", label: "Travel", color: "#8A7B5C" };
const GENERAL_LEG = { id: "general", label: "General", color: "#9FA8B3" };
const LEG_PALETTE = ["#B5533C", "#4B5D3A", "#B8862F", "#5B7B95", "#8B5A8C", "#6B8F71", "#A6763F", "#5C6BA6"];

const TABS = [
  { id: "itinerary", label: "Itinerary", icon: MapPin },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "hotels", label: "Hotels", icon: BedDouble },
  { id: "restaurants", label: "Restaurants", icon: UtensilsCrossed },
  { id: "experiences", label: "Experiences", icon: Ticket },
  { id: "import", label: "Import", icon: FileUp },
];

const uid = () => Math.random().toString(36).slice(2, 9);
const it = (text) => ({ id: uid(), text, checked: false });
const DEFAULT_DAY_COLUMN_LABELS = ["Hotel", "Restaurants", "Experiences", "Sights", "Travel"];
const dayColumn = (label) => ({ id: uid(), label });
const emptyCells = (columns) => Object.fromEntries((columns || []).map((c) => [c.id, ""]));
const day = (date, region, plan, columns) => ({
  id: uid(),
  date,
  region,
  plan,
  notes: "",
  cells: emptyCells(columns),
});
const list = (title, region, items) => ({ id: uid(), title, region, items });
const booking = (region) => ({ id: uid(), name: "", region: region || "general", when: "", confirmation: "", notes: "" });
const leg = (label, color) => ({ id: uid(), label, color });

const defaultFlights = () => ({
  outDate: "", outTime: "", outRoute: "", outArrDate: "", outArrTime: "",
  retDate: "", retTime: "", retRoute: "", retArrTime: "",
});

function makeTrip(name, dates) {
  const dayColumns = DEFAULT_DAY_COLUMN_LABELS.map((l) => dayColumn(l));
  return {
    id: uid(),
    name: name || "New trip",
    dates: dates || "",
    legs: [],
    flights: defaultFlights(),
    dayColumns,
    days: [],
    sections: [],
    bookings: { hotels: [], restaurants: [], experiences: [] },
    customTabs: [],
    bookingCategories: [],
  };
}

function makeFolder(name) {
  return { id: uid(), name: name || "New folder", trips: [] };
}

function makeItalyTrip() {
  const dayColumns = DEFAULT_DAY_COLUMN_LABELS.map((l) => dayColumn(l));
  return {
    id: "italy-trip",
    name: "Italy",
    dates: "November 2026",
    legs: [
      { id: "rome", label: "Rome", color: "#B5533C" },
      { id: "tuscany", label: "Tuscany", color: "#4B5D3A" },
      { id: "florence", label: "Florence", color: "#B8862F" },
    ],
    flights: {
      outDate: "Thu, Nov 5, 2026", outTime: "5:25 PM", outRoute: "JFK \u2192 FCO",
      outArrDate: "Fri, Nov 6, 2026", outArrTime: "7:45 AM",
      retDate: "Sat, Nov 21, 2026", retTime: "1:00 PM", retRoute: "FCO \u2192 JFK",
      retArrTime: "5:02 PM",
    },
    dayColumns,
    days: [
      day("11/5", "travel", "Travel \u2014 overnight (red-eye) flight, ~8.5 hrs", dayColumns),
      day("11/6", "rome", "Arrive Rome AM \u2014 chill day, food day", dayColumns),
      day("11/7", "rome", "Rome \u2014 museum day", dayColumns),
      day("11/8", "rome", "Rome \u2014 open", dayColumns),
      day("11/9", "rome", "Rome \u2014 possible Naples/Pompeii day trip", dayColumns),
      day("11/10", "rome", "Rome \u2014 depart AM or evening for Siena/Chiusi/Sarteano by train, rent a car", dayColumns),
      day("11/11", "tuscany", "Tuscany day 1", dayColumns),
      day("11/12", "tuscany", "Tuscany day 2", dayColumns),
      day("11/13", "tuscany", "Tuscany day 3", dayColumns),
      day("11/14", "tuscany", "Tuscany day 4", dayColumns),
      day("11/15", "tuscany", "Tuscany day 5", dayColumns),
      day("11/16", "florence", "Arrive Florence \u2014 Florence day 1", dayColumns),
      day("11/17", "florence", "Florence day 2", dayColumns),
      day("11/18", "florence", "Florence day 3", dayColumns),
      day("11/19", "florence", "Florence day 4", dayColumns),
      day("11/20", "florence", "Florence day 5 \u2014 depart PM for Rome", dayColumns),
      day("11/21", "rome", "Rome \u2014 final day, departure flight home", dayColumns),
    ],
    sections: [
      list("Top 5 must-sees", "rome", [it("Colosseum, Roman Forum and Palatine Hill"), it("Vatican Museums, Sistine Chapel and St. Peter's"), it("Pantheon"), it("Trevi Fountain"), it("Spanish Steps"), it("Maybe: Pompeii")]),
      list("Hidden gems", "rome", [it("Palazzo Altemps"), it("Palazzo Colonna"), it("Centrale Montemartini"), it("Capuchin Crypt"), it("Villa Doria Pamphili"), it("Catacombs")]),
      list("Things to eat", "rome", [it("Artichoke")]),
      list("Sarteano / Siena", "tuscany", [
        it("Stay in Sarteano, day-trip to Siena (1hr), Montepulciano (30min), Pienza (40min) \u2014 apartment available, send dates"),
        it("Or: 2 nights Siena + 2 nights Sarteano \u2014 Hotel Athena (3-star) or Grand Hotel Continental"),
        it("Siena Duomo \u2014 do the Porta del Cielo tour up to the rafters"),
        it("Ospedale di Santa Maria della Scala \u2014 former pilgrim hospital museum, across from Duomo"),
        it("Sarteano \u2014 11th-century castle, Etruscan tomb (Saturdays only, reservation)"),
        it("Monteverdi Tuscany \u2014 resort near Sarteano, go for dinner"),
        it("La Foce gardens \u2014 magnificent, summer chamber concerts w/ Alessio Bax"),
      ]),
      list("On the way to Rome", "tuscany", [it("Civita di Bagnoreggio \u2014 spend a few hours here")]),
      list("Sightseeing & food", "florence", [
        it("Accademia or Uffizi \u2014 skip-the-line ticket or go very early"),
        it("The Duomo \u2014 climb the dome (closed Nov 16\u201320, 2026)"),
        it("Basilica of Santa Croce \u2014 tombs of Galileo, Rossini"),
        it("Officina Profumo di Santa Maria Novella \u2014 historic pharmacy, pricey"),
        it("Bistecca fiorentina \u2014 huge, mostly-rare steak"),
        it("Lampredotto \u2014 tripe sandwich street food"),
      ]),
      list("Things to buy", "florence", []),
    ],
    bookings: { hotels: [], restaurants: [], experiences: [] },
    customTabs: [],
    bookingCategories: [],
  };
}

// ---------- storage & migration ----------

const STORAGE_KEY = "travel-planner-v1";
const LEGACY_STORAGE_KEY = "italy-trip-planner-v1";

// --- Legacy shapes, kept only so old saved data can be migrated forward. ---
const LEGACY_dayItem = (time, text) => ({ id: uid(), time: time || "", text: text || "", checked: false });
const LEGACY_daySection = (title, items) => ({ id: uid(), title, items: items || [] });
const LEGACY_DEFAULT_DAY_SECTION_TITLES = ["Hotel", "Restaurants", "Experiences", "Sights", "Travel"];

function migrateDayShape(d) {
  const hasSections = Array.isArray(d.sections) && d.sections.length > 0;
  let sections;
  if (hasSections) {
    sections = d.sections.map((s) => ({
      id: s.id || uid(),
      title: s.title || "Untitled",
      items: (s.items || []).map((i) => ({ id: i.id || uid(), time: i.time || "", text: i.text || "", checked: !!i.checked })),
    }));
  } else {
    sections = LEGACY_DEFAULT_DAY_SECTION_TITLES.map((t) => LEGACY_daySection(t));
    // Preserve any pre-existing freeform notes so this migration can never lose data --
    // it just surfaces as a section the user can review and redistribute if they want.
    const legacyText = ((d.organized || d.notes || "") + "").trim();
    if (legacyText) {
      const lines = legacyText
        .split("\n")
        .map((l) => l.replace(/^[-*]\s*/, "").trim())
        .filter(Boolean);
      if (lines.length) {
        sections.push(LEGACY_daySection("Notes (from before)", lines.map((l) => LEGACY_dayItem("", l))));
      }
    }
  }
  return {
    id: d.id || uid(),
    date: d.date || "",
    region: d.region || "travel",
    plan: d.plan || "",
    notes: d.notes || "",
    organized: d.organized || null,
    sections,
  };
}

// Converts the (legacy) per-day-sections shape into trip-wide spreadsheet
// columns + per-day cells. Every unique section title across every day
// becomes a column (defaults first, in order, then anything else found) so
// nothing typed under a custom or one-off section title is ever dropped.
function sectionedDaysToSpreadsheet(sectionedDays) {
  const colOrder = [];
  const keyToId = {};
  const ensureColumn = (rawTitle) => {
    const title = (rawTitle || "Notes").trim() || "Notes";
    const key = title.toLowerCase();
    if (!keyToId[key]) {
      const id = uid();
      keyToId[key] = id;
      colOrder.push({ id, label: title });
    }
    return keyToId[key];
  };
  LEGACY_DEFAULT_DAY_SECTION_TITLES.forEach((t) => ensureColumn(t));
  sectionedDays.forEach((d) => (d.sections || []).forEach((s) => ensureColumn(s.title)));

  const flatten = (items) =>
    (items || [])
      .map((i) => {
        const t = (i.time || "").trim();
        const txt = (i.text || "").trim();
        if (!t && !txt) return "";
        return t ? `${t} \u2014 ${txt}` : txt;
      })
      .filter(Boolean)
      .join("\n");

  const days = sectionedDays.map((d) => {
    const cells = {};
    colOrder.forEach((c) => (cells[c.id] = ""));
    (d.sections || []).forEach((s) => {
      const id = keyToId[(s.title || "Notes").trim().toLowerCase() || "notes"];
      const text = flatten(s.items);
      if (text) cells[id] = cells[id] ? `${cells[id]}\n${text}` : text;
    });
    return { id: d.id, date: d.date, region: d.region, plan: d.plan, notes: d.notes || "", cells };
  });

  return { columns: colOrder, days };
}


function migrateTripShape(t) {
  const legs = Array.isArray(t.legs) ? t.legs : [];
  const validIds = [...legs.map((l) => l.id), "general"];
  const fixSections = (secs) => (secs || []).map((s) => ({ ...s, region: validIds.includes(s.region) ? s.region : "general" }));

  let dayColumns, days;
  if (Array.isArray(t.dayColumns)) {
    // Already the spreadsheet shape -- keep columns as-is, just make sure every day has a cell for each.
    dayColumns = t.dayColumns.map((c) => ({ id: c.id || uid(), label: c.label || "Column" }));
    const colIds = dayColumns.map((c) => c.id);
    days = (t.days || []).map((d) => {
      const cells = {};
      colIds.forEach((id) => (cells[id] = (d.cells && d.cells[id]) || ""));
      return { id: d.id || uid(), date: d.date || "", region: d.region || "travel", plan: d.plan || "", notes: d.notes || "", cells };
    });
  } else {
    // Legacy shape (per-day sections, or even older raw notes) -- convert to spreadsheet columns.
    const sectioned = (t.days || []).map(migrateDayShape);
    const converted = sectionedDaysToSpreadsheet(sectioned);
    dayColumns = converted.columns;
    days = converted.days;
  }

  return {
    id: t.id || uid(),
    name: t.name || "Untitled trip",
    dates: t.dates || "",
    legs,
    flights: { ...defaultFlights(), ...(t.flights || {}) },
    dayColumns,
    days,
    sections: fixSections(t.sections),
    bookings: {
      hotels: (t.bookings && t.bookings.hotels) || [],
      restaurants: (t.bookings && t.bookings.restaurants) || [],
      experiences: (t.bookings && t.bookings.experiences) || [],
    },
    customTabs: (t.customTabs || []).map((ct) => ({
      id: ct.id || uid(),
      name: ct.name || "New tab",
      sections: fixSections(ct.sections),
    })),
    bookingCategories: (t.bookingCategories || []).map((bc) => ({
      id: bc.id || uid(),
      name: bc.name || "New category",
      entries: bc.entries || [],
    })),
  };
}

function migrateOldSingleTrip(old) {
  const legs = [
    { id: "rome", label: "Rome", color: "#B5533C" },
    { id: "tuscany", label: "Tuscany", color: "#4B5D3A" },
    { id: "florence", label: "Florence", color: "#B8862F" },
  ];
  return migrateTripShape({
    id: uid(),
    name: "Italy",
    dates: "November 2026",
    legs,
    flights: old.flights,
    days: old.days,
    sections: old.sections,
    bookings: old.bookings,
  });
}

const DEFAULT_FOLDER_NAME = "Natalie and Tristan";

function migrateFolderShape(f) {
  return {
    id: f.id || uid(),
    name: f.name || "New folder",
    trips: (f.trips || []).map(migrateTripShape),
  };
}

// Returns a valid { folders: [...] } root, or null if the input isn't recognizable.
function migrateRoot(loaded) {
  if (!loaded || typeof loaded !== "object") return null;
  if (Array.isArray(loaded.folders)) {
    return { folders: loaded.folders.map(migrateFolderShape) };
  }
  if (Array.isArray(loaded.trips)) {
    // Pre-folders save format: every existing trip lived at the root. Wrap
    // them all into one folder rather than dropping anything.
    return { folders: [{ id: uid(), name: DEFAULT_FOLDER_NAME, trips: loaded.trips.map(migrateTripShape) }] };
  }
  if (Array.isArray(loaded.days)) {
    // Even older pre-multi-trip save format: a single trip's data sitting at the root.
    return { folders: [{ id: uid(), name: DEFAULT_FOLDER_NAME, trips: [migrateOldSingleTrip(loaded)] }] };
  }
  return null;
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const migrated = migrateRoot(JSON.parse(raw));
      if (migrated) return migrated;
    }
  } catch {
    // fall through
  }
  try {
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const migrated = migrateRoot(JSON.parse(legacyRaw));
      if (migrated) return migrated;
    }
  } catch {
    // fall through
  }
  return { folders: [{ id: uid(), name: DEFAULT_FOLDER_NAME, trips: [makeItalyTrip()] }] };
}

function useDebouncedSave(data, ready) {
  const [status, setStatus] = useState("idle");
  const timer = useRef(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (!ready) return;
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, 400);
    return () => timer.current && clearTimeout(timer.current);
  }, [data, ready]);

  useEffect(() => {
    const flush = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataRef.current));
      } catch {
        // ignore
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return status;
}

// ---------- shared small components ----------

function Field({ value, onChange, placeholder, mono, className = "", style, ...props }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`bg-transparent outline-none w-full ${className}`}
      style={{
        fontFamily: mono ? "'IBM Plex Mono', monospace" : "inherit",
        color: "inherit",
        borderBottom: "1px dashed transparent",
        ...style,
      }}
      onFocus={(e) => (e.target.style.borderBottom = "1px dashed #C99A44")}
      onBlur={(e) => (e.target.style.borderBottom = "1px dashed transparent")}
      {...props}
    />
  );
}

function AutoNote({ value, onChange, placeholder, className = "", style, ...props }) {
  const ref = useRef(null);
  const resize = (el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };
  useEffect(() => {
    resize(ref.current);
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        resize(e.target);
      }}
      placeholder={placeholder}
      rows={1}
      className={`bg-transparent outline-none w-full resize-none ${className}`}
      style={{ color: "inherit", lineHeight: 1.45, overflow: "hidden", display: "block", ...style }}
      {...props}
    />
  );
}

function Stamp({ checked, onClick, color }) {
  return (
    <button
      onClick={onClick}
      aria-label={checked ? "Mark as not done" : "Mark as done"}
      className="shrink-0 flex items-center justify-center transition-transform"
      style={{
        width: 22, height: 22, borderRadius: "50%",
        border: `2px dashed ${checked ? color : "#8A7B5CAA"}`,
        background: checked ? color : "transparent",
        transform: checked ? "rotate(-8deg)" : "none",
        cursor: "pointer",
      }}
    >
      {checked && <Check size={12} strokeWidth={3} color="#F3ECDD" />}
    </button>
  );
}

function IconBtn({ onClick, title, children, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="shrink-0 flex items-center justify-center transition-opacity opacity-60 hover:opacity-100"
      style={{ width: 26, height: 26, borderRadius: 6, color: danger ? "#C77" : "#F3ECDD" }}
    >
      {children}
    </button>
  );
}


function GroupBadge({ group }) {
  return (
    <div
      className="inline-flex items-center gap-2 mb-4"
      style={{ background: `${group.color}22`, border: `1px solid ${group.color}66`, borderRadius: 999, padding: "5px 14px" }}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: group.color, display: "inline-block" }} />
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: "0.06em", fontWeight: 500, color: group.color }}>
        {group.label.toUpperCase()}
      </span>
    </div>
  );
}

// ---------- bookings (hotels / restaurants / experiences) ----------

function SearchAndCompare({ groupLabel, itemNoun, onAddResult }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [addedIdx, setAddedIdx] = useState({});

  const PAPER = "#F3ECDD", PAPER_TEXT = "#2B2118", BRASS = "#C99A44", MUTED = "#9FA8B3", INK = "#1B2430";
  const noun = (itemNoun || "option").toLowerCase();

  const runSearch = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setAddedIdx({});
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), category: itemNoun, place: groupLabel }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
      const list = Array.isArray(json.results) ? json.results : [];
      if (list.length === 0) {
        setError(`Didn't find good options for that \u2014 try a broader or more specific search.`);
        setLoading(false);
        return;
      }
      setResults(list);
    } catch (err) {
      setError((err && err.message) || "Search failed \u2014 try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity"
        style={{ fontSize: 12, color: "#F3ECDD", fontWeight: 500 }}
      >
        <Search size={13} /> Search &amp; compare {noun}s in {groupLabel}
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="mt-2" style={{ background: "rgba(0,0,0,0.18)", borderRadius: 10, padding: 12 }}>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runSearch();
              }}
              placeholder={`e.g. "boutique ${noun}s near the center, under $250/night"`}
              className="flex-1 outline-none text-sm"
              style={{ background: PAPER, color: PAPER_TEXT, borderRadius: 8, padding: "8px 10px", minWidth: 200 }}
            />
            <button
              onClick={runSearch}
              disabled={!query.trim() || loading}
              className="flex items-center gap-1.5"
              style={{
                fontSize: 12.5, fontWeight: 500, color: INK, background: BRASS, borderRadius: 8, padding: "8px 14px",
                opacity: !query.trim() || loading ? 0.5 : 1, cursor: !query.trim() || loading ? "default" : "pointer",
              }}
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
              {loading ? "Searching\u2026" : "Search"}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 mb-2" style={{ background: "#B5533C", color: "#F3ECDD", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
              <AlertTriangle size={13} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {results && (
            <div className="flex flex-col gap-2">
              {results.map((r, i) => (
                <div key={i} style={{ background: PAPER, color: PAPER_TEXT, borderRadius: 8, padding: 12 }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="fx-fraunces" style={{ fontSize: 14.5, fontWeight: 600, fontStyle: "italic" }}>{r.name || "Untitled"}</div>
                    <button
                      onClick={() => {
                        onAddResult(r);
                        setAddedIdx((a) => ({ ...a, [i]: true }));
                      }}
                      disabled={!!addedIdx[i]}
                      className="flex items-center gap-1 shrink-0"
                      style={{ fontSize: 11, fontWeight: 500, color: INK, background: BRASS, borderRadius: 6, padding: "4px 8px", opacity: addedIdx[i] ? 0.5 : 1 }}
                    >
                      {addedIdx[i] ? <Check size={11} /> : <Plus size={11} />} {addedIdx[i] ? "Added" : "Add"}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap" style={{ fontSize: 11, color: "#8A7B5C" }}>
                    {r.priceRange && <span>{r.priceRange}</span>}
                    {r.rating && <span>{r.priceRange ? "\u00b7 " : ""}{r.rating}</span>}
                  </div>
                  {r.summary && <p style={{ fontSize: 12.5, marginBottom: 8, lineHeight: 1.4 }}>{r.summary}</p>}
                  <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    {Array.isArray(r.pros) && r.pros.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: "#4B5D3A", fontWeight: 600, marginBottom: 2 }}>PROS</div>
                        <ul style={{ fontSize: 11.5, paddingLeft: 14, margin: 0 }}>
                          {r.pros.map((p, pi) => (
                            <li key={pi}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(r.cons) && r.cons.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: "#B5533C", fontWeight: 600, marginBottom: 2 }}>CONS</div>
                        <ul style={{ fontSize: 11.5, paddingLeft: 14, margin: 0 }}>
                          {r.cons.map((c, ci) => (
                            <li key={ci}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {r.sourceUrl && (
                    <a href={r.sourceUrl} target="_blank" rel="noreferrer" style={{ fontSize: 10.5, color: "#8A7B5C", marginTop: 6, display: "inline-block" }}>
                      Source &rarr;
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BookingsPanel({ category, itemNoun, whenLabel, confirmLabel, entries, noteGroups, onAdd, onUpdate, onDelete, onAddFromSearch, isOpen, onToggle }) {
  const PAPER = "#F3ECDD", PAPER_TEXT = "#2B2118";
  return (
    <div>
      {noteGroups.map((group) => {
        const groupEntries = entries.filter((b) => (b.region || "general") === group.id);
        return (
          <div key={group.id} className="mb-9" style={{ borderTop: `1px solid ${group.color}33`, paddingTop: 18 }}>
            <GroupBadge group={group} />
            <SearchAndCompare groupLabel={group.label} itemNoun={itemNoun} onAddResult={(r) => onAddFromSearch(category, group.id, r)} />
            {groupEntries.length > 0 && (
              <div className="flex flex-col gap-2 mb-3">
                {groupEntries.map((b) => {
                  const open = isOpen(b.id);
                  return (
                    <div key={b.id} className="fx-row" style={{ background: PAPER, color: PAPER_TEXT, borderRadius: 10, borderLeft: `4px solid ${group.color}`, padding: open ? "12px 14px" : "10px 14px" }}>
                      <div className="flex items-center gap-2" style={{ marginBottom: open ? 8 : 0 }}>
                        <button
                          onClick={() => onToggle(b.id)}
                          title={open ? "Collapse" : "Expand"}
                          aria-label={open ? "Collapse" : "Expand"}
                          className="shrink-0 flex items-center justify-center"
                          style={{ width: 18, height: 18 }}
                        >
                          {open ? <ChevronUp size={13} color="#8A7B5C" /> : <ChevronDown size={13} color="#8A7B5C" />}
                        </button>
                        <Field value={b.name} onChange={(v) => onUpdate(category, b.id, "name", v)} placeholder={`${itemNoun} name`} className="fx-fraunces flex-1" style={{ fontSize: 14.5, fontWeight: 600, fontStyle: "italic" }} />
                        <select value={b.region || "general"} onChange={(e) => onUpdate(category, b.id, "region", e.target.value)} style={{ fontSize: 10, background: "transparent", border: "none", color: group.color, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                          {noteGroups.map((g) => (
                            <option key={g.id} value={g.id} style={{ color: "#2B2118" }}>{g.label}</option>
                          ))}
                        </select>
                        <button onClick={() => onDelete(category, b.id)} className="fx-actions shrink-0" title="Delete" aria-label="Delete">
                          <Trash2 size={13} color="#B5533C" />
                        </button>
                      </div>
                      {open && (
                        <>
                          <div className="grid gap-x-4 gap-y-1" style={{ gridTemplateColumns: "1fr 1fr", fontSize: 12.5, marginBottom: 6 }}>
                            <div>
                              <div style={{ color: "#8A7B5C", fontSize: 9.5 }}>{whenLabel.toUpperCase()}</div>
                              <Field value={b.when} onChange={(v) => onUpdate(category, b.id, "when", v)} placeholder="Dates / time" />
                            </div>
                            <div>
                              <div style={{ color: "#8A7B5C", fontSize: 9.5 }}>{confirmLabel.toUpperCase()}</div>
                              <Field value={b.confirmation} onChange={(v) => onUpdate(category, b.id, "confirmation", v)} placeholder="Confirmation #" mono />
                            </div>
                          </div>
                          <AutoNote value={b.notes} onChange={(v) => onUpdate(category, b.id, "notes", v)} placeholder="Address, link, or notes" style={{ fontSize: 12, color: "#5A5245" }} />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <button onClick={() => onAdd(category, group.id)} className="flex items-center gap-2 opacity-55 hover:opacity-100 transition-opacity" style={{ fontSize: 12, color: "#F3ECDD", border: "1px dashed #9FA8B355", borderRadius: 8, padding: "7px 12px" }}>
              <Plus size={13} /> Add {itemNoun.toLowerCase()} to {group.label}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ---------- a group of lists, grouped by destination (used by Notes and by any custom tab) ----------

function NotesLikePanel({ sections, noteGroups, isSectionOpen, toggleSection, onAddSection, onUpdateTitle, onUpdateRegion, onDeleteSection, onAddItem, onUpdateItem, onToggleItem, onDeleteItem }) {
  const PAPER = "#F3ECDD", PAPER_TEXT = "#2B2118", BRASS = "#C99A44", PAPER_MUTED = "#9FA8B3";
  return (
    <>
      {noteGroups.map((group) => {
        const groupSections = sections.filter((s) => (s.region || "general") === group.id);
        return (
          <div key={group.id} className="mb-9" style={{ borderTop: `1px solid ${group.color}33`, paddingTop: 18 }}>
            <GroupBadge group={group} />

            {groupSections.length > 0 && (
              <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                {groupSections.map((section) => {
                  const doneCount = section.items.filter((i) => i.checked).length;
                  const open = isSectionOpen(section.id);
                  return (
                    <div key={section.id} style={{ background: PAPER, color: PAPER_TEXT, borderRadius: 12, borderLeft: `4px solid ${group.color}`, padding: open ? "14px 14px 10px" : "12px 14px" }}>
                      <div className="flex items-center gap-2" style={{ marginBottom: open ? 8 : 0 }}>
                        <button
                          onClick={() => toggleSection(section.id)}
                          title={open ? "Collapse list" : "Expand list"}
                          aria-label={open ? "Collapse list" : "Expand list"}
                          className="shrink-0 flex items-center justify-center"
                          style={{ width: 20, height: 20 }}
                        >
                          {open ? <ChevronUp size={14} color="#8A7B5C" /> : <ChevronDown size={14} color="#8A7B5C" />}
                        </button>
                        <Field value={section.title} onChange={(v) => onUpdateTitle(section.id, v)} className="fx-fraunces" style={{ fontSize: 15, fontWeight: 600, fontStyle: "italic" }} />
                        <div className="flex items-center gap-1 shrink-0">
                          {section.items.length > 0 && (
                            <span style={{ fontSize: 10, color: "#8A7B5C", fontFamily: "'IBM Plex Mono', monospace" }}>{doneCount}/{section.items.length}</span>
                          )}
                          <button onClick={() => onDeleteSection(section.id)} title="Delete list" aria-label="Delete list" style={{ opacity: 0.35 }}>
                            <Trash2 size={13} color="#B5533C" />
                          </button>
                        </div>
                      </div>
                      {open && (
                        <>
                          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                            <span style={{ fontSize: 9.5, color: "#8A7B5C", marginRight: 2 }}>Move to:</span>
                            {noteGroups.map((g) => {
                              const active = (section.region || "general") === g.id;
                              return (
                                <button
                                  key={g.id}
                                  onClick={() => onUpdateRegion(section.id, g.id)}
                                  disabled={active}
                                  style={{
                                    fontSize: 10, padding: "2px 9px", borderRadius: 999, fontWeight: 500,
                                    border: `1px solid ${active ? g.color : "#8A7B5C44"}`,
                                    background: active ? g.color : "transparent",
                                    color: active ? "#F3ECDD" : "#8A7B5C",
                                    cursor: active ? "default" : "pointer",
                                  }}
                                >
                                  {g.label}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex flex-col gap-1.5">
                            {section.items.map((item) => (
                              <div key={item.id} className="fx-row flex items-start gap-2">
                                <Stamp checked={item.checked} onClick={() => onToggleItem(section.id, item.id)} color={BRASS} />
                                <AutoNote value={item.text} onChange={(v) => onUpdateItem(section.id, item.id, v)} placeholder="Add a note" className="flex-1 text-sm" style={{ color: PAPER_TEXT, textDecoration: item.checked ? "line-through" : "none", opacity: item.checked ? 0.55 : 1, paddingTop: 1 }} />
                                <button onClick={() => onDeleteItem(section.id, item.id)} className="fx-actions" title="Delete item" aria-label="Delete item" style={{ marginTop: 2 }}>
                                  <Trash2 size={12} color="#B5533C" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <button onClick={() => onAddItem(section.id)} className="flex items-center gap-1.5 mt-2 opacity-50 hover:opacity-90 transition-opacity" style={{ fontSize: 11.5, color: "#8A7B5C" }}>
                            <Plus size={12} /> Add item
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button onClick={() => onAddSection(group.id)} className="flex items-center gap-2 opacity-55 hover:opacity-100 transition-opacity" style={{ fontSize: 12, color: "#F3ECDD", border: `1px dashed ${PAPER_MUTED}55`, borderRadius: 8, padding: "7px 12px" }}>
              <FolderPlus size={13} /> Add a list to {group.label}
            </button>
          </div>
        );
      })}
    </>
  );
}

// ---------- import (paste/upload -> parse -> review -> add) ----------

function ImportPanel({ legs, noteGroups, onApply }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [selections, setSelections] = useState({});
  const [added, setAdded] = useState(false);
  const fileInputRef = useRef(null);

  const PAPER = "#F3ECDD", PAPER_TEXT = "#2B2118", BRASS = "#C99A44", MUTED = "#9FA8B3", INK = "#1B2430";

  const readFile = (f) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      const textual = /\.(txt|md)$/i.test(f.name) || f.type === "text/plain";
      if (textual) {
        reader.onload = () => resolve({ name: f.name, mediaType: "text/plain", content: String(reader.result), isBinary: false });
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsText(f);
      } else {
        reader.onload = () => {
          const base64 = String(reader.result).split(",")[1] || "";
          resolve({ name: f.name, mediaType: f.type || "", content: base64, isBinary: true });
        };
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(f);
      }
    });

  const handleFileChange = async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const read = await readFile(f);
      setFile(read);
      setFileName(f.name);
      setError(null);
    } catch {
      setError("Couldn't read that file.");
    }
  };

  const clearFile = () => {
    setFile(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runParse = async () => {
    if (!text.trim() && !file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setAdded(false);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() || undefined, file: file || undefined, legs }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
      const r = json.result || {};
      const normalized = {
        flights: Array.isArray(r.flights) ? r.flights : [],
        hotels: Array.isArray(r.hotels) ? r.hotels : [],
        restaurants: Array.isArray(r.restaurants) ? r.restaurants : [],
        experiences: Array.isArray(r.experiences) ? r.experiences : [],
      };
      const total = normalized.flights.length + normalized.hotels.length + normalized.restaurants.length + normalized.experiences.length;
      if (total === 0) {
        setError("Didn't find any flights, hotels, restaurants, or experiences in that \u2014 try pasting more of the confirmation text.");
        setLoading(false);
        return;
      }
      setResult(normalized);
      const sel = {};
      normalized.flights.forEach((_, i) => (sel[`flights-${i}`] = true));
      normalized.hotels.forEach((_, i) => (sel[`hotels-${i}`] = true));
      normalized.restaurants.forEach((_, i) => (sel[`restaurants-${i}`] = true));
      normalized.experiences.forEach((_, i) => (sel[`experiences-${i}`] = true));
      setSelections(sel);
    } catch (err) {
      setError((err && err.message) || "Couldn't parse that \u2014 try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (key) => setSelections((s) => ({ ...s, [key]: !s[key] }));
  const selectedCount = Object.values(selections).filter(Boolean).length;

  const handleAdd = () => {
    onApply(result, selections);
    setAdded(true);
    setResult(null);
    setText("");
    clearFile();
  };

  const groupLabel = (id) => (noteGroups.find((g) => g.id === id) || noteGroups[0]).label;

  return (
    <div>
      <p style={{ color: MUTED, fontSize: 13, marginBottom: 16, maxWidth: 640 }}>
        Paste flight confirmations, hotel bookings, or any travel info below, or upload a file (PDF, Word doc,
        image, or plain text). Claude will pull out flights, hotels, restaurants, and experiences &mdash; you'll
        get a chance to review before anything is added.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste an email confirmation, itinerary, or any travel details here..."
        rows={6}
        className="w-full outline-none text-sm"
        style={{ background: PAPER, color: PAPER_TEXT, borderRadius: 10, padding: "12px 14px", lineHeight: 1.5, resize: "vertical", marginBottom: 10 }}
      />

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <input ref={fileInputRef} type="file" accept=".txt,.md,.pdf,.png,.jpg,.jpeg,.docx" onChange={handleFileChange} style={{ display: "none" }} />
        <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="flex items-center gap-1.5" style={{ fontSize: 12.5, color: "#F3ECDD", border: `1px dashed ${MUTED}66`, borderRadius: 8, padding: "7px 12px" }}>
          <FileUp size={14} /> Upload a file
        </button>
        {fileName && (
          <span className="flex items-center gap-1.5" style={{ fontSize: 12, color: MUTED }}>
            {fileName}
            <button onClick={clearFile} title="Remove file" aria-label="Remove file">
              <X size={13} color={MUTED} />
            </button>
          </span>
        )}
        <span style={{ fontSize: 11, color: MUTED }}>PDF, Word (.docx), image, or .txt/.md</span>
      </div>

      <button
        onClick={runParse}
        disabled={(!text.trim() && !file) || loading}
        className="flex items-center gap-1.5 mb-2"
        style={{
          fontSize: 13, fontWeight: 500, color: INK, background: BRASS, borderRadius: 8, padding: "8px 16px",
          opacity: (!text.trim() && !file) || loading ? 0.5 : 1,
          cursor: (!text.trim() && !file) || loading ? "default" : "pointer",
        }}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        {loading ? "Reading\u2026" : "Parse"}
      </button>

      {error && (
        <div className="flex items-center gap-2 mt-2 mb-2" style={{ background: "#B5533C", color: "#F3ECDD", borderRadius: 8, padding: "10px 14px", fontSize: 12.5 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {added && !result && (
        <div className="flex items-center gap-2 mt-4 mb-2" style={{ background: "#4B5D3A", color: "#F3ECDD", borderRadius: 8, padding: "10px 14px", fontSize: 12.5 }}>
          <Check size={14} style={{ flexShrink: 0 }} />
          <span>Added to your trip &mdash; check the Itinerary, Hotels, Restaurants, or Experiences tabs.</span>
        </div>
      )}

      {result && (
        <div className="mt-6">
          <p style={{ fontSize: 13, color: MUTED, marginBottom: 12 }}>
            Found {result.flights.length + result.hotels.length + result.restaurants.length + result.experiences.length} item(s). Uncheck anything you don't want, then add the rest.
          </p>

          {[
            { key: "flights", label: "Flights", items: result.flights },
            { key: "hotels", label: "Hotels", items: result.hotels },
            { key: "restaurants", label: "Restaurants", items: result.restaurants },
            { key: "experiences", label: "Experiences", items: result.experiences },
          ]
            .filter((g) => g.items.length > 0)
            .map((group) => (
              <div key={group.key} className="mb-4">
                <div style={{ fontSize: 11, color: MUTED, letterSpacing: "0.06em", marginBottom: 6 }}>{group.label.toUpperCase()}</div>
                <div className="flex flex-col gap-1.5">
                  {group.items.map((item, i) => {
                    const selKey = `${group.key}-${i}`;
                    const checked = !!selections[selKey];
                    const title =
                      group.key === "flights"
                        ? `${item.direction === "return" ? "Return" : "Outbound"}: ${item.route || "?"} \u2014 ${item.date || "?"} ${item.time || ""}`.trim()
                        : item.name || "Untitled";
                    const subtitle =
                      group.key === "flights"
                        ? [item.arrivalDate, item.arrivalTime].filter(Boolean).join(" ")
                        : [item.when, item.confirmation].filter(Boolean).join(" \u00b7 ");
                    return (
                      <label key={selKey} className="flex items-start gap-2" style={{ background: PAPER, color: PAPER_TEXT, borderRadius: 8, padding: "8px 10px", cursor: "pointer" }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleSelection(selKey)} style={{ marginTop: 3 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
                          {subtitle && <div style={{ fontSize: 11.5, color: "#8A7B5C" }}>{subtitle}</div>}
                          {item.region && group.key !== "flights" && (
                            <div style={{ fontSize: 10, color: "#8A7B5C", marginTop: 2 }}>{groupLabel(item.region)}</div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

          <button
            onClick={handleAdd}
            disabled={selectedCount === 0}
            className="flex items-center gap-1.5"
            style={{
              fontSize: 13, fontWeight: 500, color: INK, background: BRASS, borderRadius: 8, padding: "8px 16px",
              opacity: selectedCount === 0 ? 0.5 : 1,
              cursor: selectedCount === 0 ? "default" : "pointer",
            }}
          >
            <Check size={14} /> Add {selectedCount} item{selectedCount === 1 ? "" : "s"} to trip
          </button>
        </div>
      )}
    </div>
  );
}

// ---------- one trip's full planner (tabs: itinerary/notes/hotels/restaurants/experiences/import) ----------

// ---------- itinerary review + open-ended chat with web search ----------

function summarizeTrip(trip) {
  const legLabel = (id) => {
    const l = trip.legs.find((x) => x.id === id);
    if (l) return l.label;
    return id === "travel" ? "Travel" : "General";
  };
  const lines = [];
  lines.push(`Trip: ${trip.name}${trip.dates ? ` (${trip.dates})` : ""}`);
  if (trip.legs.length) lines.push(`Destinations: ${trip.legs.map((l) => l.label).join(", ")}`);
  if (trip.flights.outRoute || trip.flights.retRoute) {
    lines.push(
      `Flights: ${trip.flights.outRoute || "?"} on ${trip.flights.outDate || "an unset date"}; return ${trip.flights.retRoute || "?"} on ${trip.flights.retDate || "an unset date"}`
    );
  }
  if (trip.days.length) {
    lines.push("Day-by-day plan:");
    trip.days.forEach((d, i) => {
      const parts = [];
      if (d.plan) parts.push(d.plan);
      (trip.dayColumns || []).forEach((col) => {
        const text = (d.cells && d.cells[col.id] || "").trim();
        if (text) parts.push(`${col.label}: ${text.replace(/\n/g, "; ")}`);
      });
      const plan = parts.length ? parts.join(" | ") : "(nothing planned yet)";
      lines.push(`  Day ${i + 1}, ${d.date || "date TBD"} (${legLabel(d.region)}): ${plan}`);
    });
  } else {
    lines.push("No days added yet.");
  }
  const summarizeEntries = (list, noun) =>
    list.length
      ? `${noun}: ` + list.map((b) => `${b.name || "(unnamed)"}${b.region ? ` [${legLabel(b.region)}]` : ""}`).join("; ")
      : `${noun}: none booked yet.`;
  lines.push(summarizeEntries(trip.bookings.hotels, "Hotels"));
  lines.push(summarizeEntries(trip.bookings.restaurants, "Restaurants"));
  lines.push(summarizeEntries(trip.bookings.experiences, "Experiences"));
  (trip.bookingCategories || []).forEach((bc) => lines.push(summarizeEntries(bc.entries, bc.name || "Custom category")));
  if (trip.sections.length) {
    lines.push(
      "Saved lists/notes: " + trip.sections.map((s) => `"${s.title}" (${legLabel(s.region)}, ${s.items.length} item${s.items.length === 1 ? "" : "s"})`).join("; ")
    );
  }
  return lines.join("\n");
}

function SuggestionsPanel({ trip }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  const PAPER = "#F3ECDD", PAPER_TEXT = "#2B2118", BRASS = "#C99A44", MUTED = "#9FA8B3", INK = "#1B2430";

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setDraft("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, tripContext: summarizeTrip(trip) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
      const reply = (json.text || "").trim();
      if (!reply) throw new Error("No response \u2014 try again.");
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      setError((err && err.message) || "Something went wrong \u2014 try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-7">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 transition-opacity"
        style={{
          fontSize: 12.5, fontWeight: 500, padding: "8px 14px", borderRadius: 8,
          background: open ? BRASS : "transparent",
          color: open ? INK : PAPER,
          border: open ? "none" : `1px dashed ${MUTED}66`,
        }}
      >
        <Sparkles size={14} /> Suggestions
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {open && (
        <div className="mt-3" style={{ background: "rgba(0,0,0,0.18)", borderRadius: 12, padding: 14 }}>
          {messages.length === 0 && (
            <div className="mb-3">
              <p style={{ fontSize: 13, color: MUTED, marginBottom: 10, lineHeight: 1.5 }}>
                I'll look over your destinations, days, and what's already booked, then search the web &mdash;
                Reddit threads, review sites, travel blogs, anything relevant &mdash; for suggestions on what
                might be missing. You can also just ask a question below instead.
              </p>
              <button
                onClick={() =>
                  send(
                    "Please review my whole itinerary, point out any gaps (days with nothing planned, destinations with no restaurants or experiences booked, missing must-sees, etc.), and search the web for good, current suggestions to fill them in."
                  )
                }
                className="flex items-center gap-1.5"
                style={{ fontSize: 12.5, fontWeight: 500, color: INK, background: BRASS, borderRadius: 8, padding: "8px 14px" }}
              >
                <Sparkles size={13} /> Analyze my itinerary
              </button>
            </div>
          )}

          {messages.length > 0 && (
            <div ref={scrollRef} className="flex flex-col gap-3 mb-3" style={{ maxHeight: 440, overflowY: "auto" }}>
              {messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "88%",
                    background: m.role === "user" ? BRASS : PAPER,
                    color: m.role === "user" ? INK : PAPER_TEXT,
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 13,
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {m.content}
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: "flex-start", color: MUTED, fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
                  <Loader2 size={13} className="animate-spin" /> Thinking&hellip;
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 mb-2" style={{ background: "#B5533C", color: "#F3ECDD", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
              <AlertTriangle size={13} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send(draft);
              }}
              placeholder={messages.length === 0 ? "Or ask a question about your trip\u2026" : "Ask a follow-up\u2026"}
              disabled={loading}
              className="flex-1 outline-none text-sm"
              style={{ background: PAPER, color: PAPER_TEXT, borderRadius: 8, padding: "9px 11px" }}
            />
            <button
              onClick={() => send(draft)}
              disabled={!draft.trim() || loading}
              className="flex items-center justify-center"
              style={{ width: 36, height: 36, flexShrink: 0, color: INK, background: BRASS, borderRadius: 8, opacity: !draft.trim() || loading ? 0.5 : 1, cursor: !draft.trim() || loading ? "default" : "pointer" }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TripPlanner({ trip, updateTrip, onBack, onDeleteTrip }) {
  const [filter, setFilter] = useState("all");
  const [ui, setUi] = useState({});
  const [sectionOpen, setSectionOpen] = useState({});
  const [tab, setTab] = useState("itinerary");
  const [showAddTabMenu, setShowAddTabMenu] = useState(false);
  const [quickFillDayId, setQuickFillDayId] = useState(null);

  const dayRegions = [...trip.legs, TRAVEL_LEG];
  const noteGroups = [GENERAL_LEG, ...trip.legs];
  const noteGroupIds = noteGroups.map((g) => g.id);
  const regionOf = (id) => dayRegions.find((r) => r.id === id) || TRAVEL_LEG;

  const INK = "#1B2430";
  const PAPER = "#F3ECDD";
  const PAPER_TEXT = "#2B2118";
  const BRASS = "#C99A44";
  const MUTED = "#9FA8B3";

  const updateFlights = (field, val) => updateTrip((t) => ({ ...t, flights: { ...t.flights, [field]: val } }));

  const addLeg = () =>
    updateTrip((t) => ({ ...t, legs: [...t.legs, leg("New spot", LEG_PALETTE[t.legs.length % LEG_PALETTE.length])] }));
  const updateLeg = (id, field, val) =>
    updateTrip((t) => ({ ...t, legs: t.legs.map((l) => (l.id === id ? { ...l, [field]: val } : l)) }));
  const deleteLeg = (id) => {
    if (!window.confirm('Delete this destination? Days, notes, and bookings tagged with it will move to "Travel" / "General" instead.')) return;
    updateTrip((t) => ({
      ...t,
      legs: t.legs.filter((l) => l.id !== id),
      days: t.days.map((d) => (d.region === id ? { ...d, region: "travel" } : d)),
      sections: t.sections.map((s) => (s.region === id ? { ...s, region: "general" } : s)),
      bookings: {
        hotels: t.bookings.hotels.map((b) => (b.region === id ? { ...b, region: "general" } : b)),
        restaurants: t.bookings.restaurants.map((b) => (b.region === id ? { ...b, region: "general" } : b)),
        experiences: t.bookings.experiences.map((b) => (b.region === id ? { ...b, region: "general" } : b)),
      },
      customTabs: (t.customTabs || []).map((ct) => ({
        ...ct,
        sections: ct.sections.map((s) => (s.region === id ? { ...s, region: "general" } : s)),
      })),
      bookingCategories: (t.bookingCategories || []).map((bc) => ({
        ...bc,
        entries: bc.entries.map((b) => (b.region === id ? { ...b, region: "general" } : b)),
      })),
    }));
  };

  const addDay = () => updateTrip((t) => ({ ...t, days: [...t.days, day("", "travel", "", t.dayColumns)] }));
  const updateDay = (id, field, val) =>
    updateTrip((t) => ({ ...t, days: t.days.map((x) => (x.id === id ? { ...x, [field]: val } : x)) }));
  const updateDayCell = (dayId, columnId, val) =>
    updateTrip((t) => ({ ...t, days: t.days.map((d) => (d.id === dayId ? { ...d, cells: { ...d.cells, [columnId]: val } } : d)) }));
  const deleteDay = (id) => updateTrip((t) => ({ ...t, days: t.days.filter((x) => x.id !== id) }));
  const moveDay = (id, dir) =>
    updateTrip((t) => {
      const arr = [...t.days];
      const i = arr.findIndex((x) => x.id === id);
      const j = i + dir;
      if (j < 0 || j >= arr.length) return t;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...t, days: arr };
    });

  const addDayColumn = () =>
    updateTrip((t) => {
      const col = dayColumn("New column");
      return { ...t, dayColumns: [...t.dayColumns, col], days: t.days.map((d) => ({ ...d, cells: { ...d.cells, [col.id]: "" } })) };
    });
  const updateDayColumnLabel = (columnId, label) =>
    updateTrip((t) => ({ ...t, dayColumns: t.dayColumns.map((c) => (c.id === columnId ? { ...c, label } : c)) }));
  const deleteDayColumn = (columnId) => {
    if (!window.confirm("Delete this column from every day? This can't be undone.")) return;
    updateTrip((t) => ({
      ...t,
      dayColumns: t.dayColumns.filter((c) => c.id !== columnId),
      days: t.days.map((d) => {
        const cells = { ...d.cells };
        delete cells[columnId];
        return { ...d, cells };
      }),
    }));
  };

  const getScopedSections = (t, scope) =>
    scope === "notes" ? t.sections : ((t.customTabs || []).find((ct) => ct.id === scope) || {}).sections || [];
  const setScopedSections = (t, scope, updater) =>
    scope === "notes"
      ? { ...t, sections: updater(t.sections) }
      : { ...t, customTabs: (t.customTabs || []).map((ct) => (ct.id === scope ? { ...ct, sections: updater(ct.sections) } : ct)) };

  const addSection = (scope, region) => updateTrip((t) => setScopedSections(t, scope, (secs) => [...secs, list("New list", region || "general", [])]));
  const updateSectionTitle = (scope, id, val) =>
    updateTrip((t) => setScopedSections(t, scope, (secs) => secs.map((s) => (s.id === id ? { ...s, title: val } : s))));
  const updateSectionRegion = (scope, id, region) =>
    updateTrip((t) => setScopedSections(t, scope, (secs) => secs.map((s) => (s.id === id ? { ...s, region } : s))));
  const deleteSection = (scope, id) => updateTrip((t) => setScopedSections(t, scope, (secs) => secs.filter((s) => s.id !== id)));

  const addItem = (scope, sectionId) =>
    updateTrip((t) => setScopedSections(t, scope, (secs) => secs.map((s) => (s.id === sectionId ? { ...s, items: [...s.items, it("")] } : s))));
  const updateItem = (scope, sectionId, itemId, val) =>
    updateTrip((t) =>
      setScopedSections(t, scope, (secs) =>
        secs.map((s) => (s.id === sectionId ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, text: val } : i)) } : s))
      )
    );
  const toggleItem = (scope, sectionId, itemId) =>
    updateTrip((t) =>
      setScopedSections(t, scope, (secs) =>
        secs.map((s) => (s.id === sectionId ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)) } : s))
      )
    );
  const deleteItem = (scope, sectionId, itemId) =>
    updateTrip((t) =>
      setScopedSections(t, scope, (secs) => secs.map((s) => (s.id === sectionId ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s)))
    );

  const addCustomTab = () => {
    const newId = uid();
    updateTrip((t) => ({ ...t, customTabs: [...(t.customTabs || []), { id: newId, name: "New tab", sections: [] }] }));
    setTab(`custom:${newId}`);
  };
  const updateCustomTabName = (id, name) =>
    updateTrip((t) => ({ ...t, customTabs: (t.customTabs || []).map((ct) => (ct.id === id ? { ...ct, name } : ct)) }));
  const deleteCustomTab = (id) => {
    if (!window.confirm("Delete this tab and everything in it? This can't be undone.")) return;
    updateTrip((t) => ({ ...t, customTabs: (t.customTabs || []).filter((ct) => ct.id !== id) }));
    if (tab === `custom:${id}`) setTab("itinerary");
  };

  const FIXED_BOOKING_CATEGORIES = ["hotels", "restaurants", "experiences"];
  const getScopedBookings = (t, scope) =>
    FIXED_BOOKING_CATEGORIES.includes(scope) ? t.bookings[scope] : (((t.bookingCategories || []).find((bc) => bc.id === scope) || {}).entries || []);
  const setScopedBookings = (t, scope, updater) =>
    FIXED_BOOKING_CATEGORIES.includes(scope)
      ? { ...t, bookings: { ...t.bookings, [scope]: updater(t.bookings[scope]) } }
      : { ...t, bookingCategories: (t.bookingCategories || []).map((bc) => (bc.id === scope ? { ...bc, entries: updater(bc.entries) } : bc)) };

  const addBooking = (scope, region) => updateTrip((t) => setScopedBookings(t, scope, (entries) => [...entries, booking(region)]));
  const updateBooking = (scope, id, field, val) =>
    updateTrip((t) => setScopedBookings(t, scope, (entries) => entries.map((b) => (b.id === id ? { ...b, [field]: val } : b))));
  const deleteBooking = (scope, id) => updateTrip((t) => setScopedBookings(t, scope, (entries) => entries.filter((b) => b.id !== id)));

  const addBookingFromSearch = (scope, region, result) => {
    const notesParts = [];
    if (result.summary) notesParts.push(result.summary);
    if (result.priceRange) notesParts.push(`Price: ${result.priceRange}`);
    if (Array.isArray(result.pros) && result.pros.length) notesParts.push(`Pros: ${result.pros.join(", ")}`);
    if (Array.isArray(result.cons) && result.cons.length) notesParts.push(`Cons: ${result.cons.join(", ")}`);
    if (result.rating) notesParts.push(`Rating: ${result.rating}`);
    if (result.sourceUrl) notesParts.push(`Source: ${result.sourceUrl}`);
    updateTrip((t) =>
      setScopedBookings(t, scope, (entries) => [
        ...entries,
        {
          id: uid(),
          name: result.name || "",
          region,
          when: "",
          confirmation: "",
          notes: notesParts.join("\n\n"),
        },
      ])
    );
  };

  const addBookingCategory = () => {
    const newId = uid();
    updateTrip((t) => ({ ...t, bookingCategories: [...(t.bookingCategories || []), { id: newId, name: "New category", entries: [] }] }));
    setTab(`booking:${newId}`);
  };
  const updateBookingCategoryName = (id, name) =>
    updateTrip((t) => ({ ...t, bookingCategories: (t.bookingCategories || []).map((bc) => (bc.id === id ? { ...bc, name } : bc)) }));
  const deleteBookingCategory = (id) => {
    if (!window.confirm("Delete this category and everything in it? This can't be undone.")) return;
    updateTrip((t) => ({ ...t, bookingCategories: (t.bookingCategories || []).filter((bc) => bc.id !== id) }));
    if (tab === `booking:${id}`) setTab("itinerary");
  };

  const applyImportResults = (result, selections) => {
    if (!result) return;
    updateTrip((t) => {
      const nextFlights = { ...t.flights };
      (result.flights || []).forEach((f, i) => {
        if (!selections[`flights-${i}`]) return;
        if (f.direction === "return") {
          if (f.date) nextFlights.retDate = f.date;
          if (f.time) nextFlights.retTime = f.time;
          if (f.route) nextFlights.retRoute = f.route;
          if (f.arrivalTime) nextFlights.retArrTime = f.arrivalTime;
        } else {
          if (f.date) nextFlights.outDate = f.date;
          if (f.time) nextFlights.outTime = f.time;
          if (f.route) nextFlights.outRoute = f.route;
          if (f.arrivalDate) nextFlights.outArrDate = f.arrivalDate;
          if (f.arrivalTime) nextFlights.outArrTime = f.arrivalTime;
        }
      });

      const nextBookings = {
        hotels: [...t.bookings.hotels],
        restaurants: [...t.bookings.restaurants],
        experiences: [...t.bookings.experiences],
      };
      ["hotels", "restaurants", "experiences"].forEach((cat) => {
        (result[cat] || []).forEach((item, i) => {
          if (!selections[`${cat}-${i}`]) return;
          nextBookings[cat] = [
            ...nextBookings[cat],
            {
              id: uid(),
              name: item.name || "",
              region: noteGroupIds.includes(item.region) ? item.region : "general",
              when: item.when || "",
              confirmation: item.confirmation || "",
              notes: item.notes || "",
            },
          ];
        });
      });

      return { ...t, flights: nextFlights, bookings: nextBookings };
    });
  };

  const dayUi = (id) => ui[id] || { loading: false, error: null };
  const patchUi = (id, patch) => setUi((prev) => ({ ...prev, [id]: { ...dayUi(id), ...patch } }));

  const isSectionOpen = (id) => sectionOpen[id] !== false;
  const toggleSection = (id) => setSectionOpen((prev) => ({ ...prev, [id]: !isSectionOpen(id) }));

  const organizeDay = async (id) => {
    const d = trip.days.find((x) => x.id === id);
    if (!d || !(d.notes || "").trim()) return;
    patchUi(id, { loading: true, error: null });
    try {
      const res = await fetch("/api/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: d.notes, columnLabels: trip.dayColumns.map((c) => c.label) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
      const placements = Array.isArray(json.cells) ? json.cells : [];
      if (placements.length === 0) throw new Error("Didn't find anything to organize \u2014 try adding more detail.");
      updateTrip((t) => {
        let nextColumns = [...t.dayColumns];
        const cellUpdates = {};
        placements.forEach((p) => {
          const text = String(p.text || "").trim();
          if (!text) return;
          const idx = nextColumns.findIndex((c) => c.label.toLowerCase() === String(p.title || "").toLowerCase());
          let colId;
          if (idx >= 0) {
            colId = nextColumns[idx].id;
          } else {
            const col = dayColumn(p.title || "Notes");
            nextColumns = [...nextColumns, col];
            colId = col.id;
          }
          cellUpdates[colId] = cellUpdates[colId] ? `${cellUpdates[colId]}\n${text}` : text;
        });
        const addedColumnIds = nextColumns.filter((c) => !t.dayColumns.some((oc) => oc.id === c.id)).map((c) => c.id);
        return {
          ...t,
          dayColumns: nextColumns,
          days: t.days.map((x) => {
            const baseCells = { ...x.cells };
            addedColumnIds.forEach((cid) => {
              if (!(cid in baseCells)) baseCells[cid] = "";
            });
            if (x.id !== id) return { ...x, cells: baseCells };
            const cells = { ...baseCells };
            Object.keys(cellUpdates).forEach((cid) => {
              cells[cid] = cells[cid] ? `${cells[cid]}\n${cellUpdates[cid]}` : cellUpdates[cid];
            });
            return { ...x, cells };
          }),
        };
      });
      patchUi(id, { loading: false });
    } catch (err) {
      patchUi(id, { loading: false, error: (err && err.message) || "Couldn't organize that \u2014 try again." });
    }
  };

  const filteredDays = filter === "all" ? trip.days : trip.days.filter((d) => d.region === filter);

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 mb-4 opacity-70 hover:opacity-100 transition-opacity" style={{ fontSize: 12.5, color: PAPER }}>
        <ArrowLeft size={14} /> All trips
      </button>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div style={{ minWidth: 220 }}>
          <Field
            value={trip.name}
            onChange={(v) => updateTrip((t) => ({ ...t, name: v }))}
            className="fx-fraunces"
            placeholder="Trip name"
            style={{ fontSize: 28, fontStyle: "italic", fontWeight: 500 }}
          />
          <Field
            value={trip.dates}
            onChange={(v) => updateTrip((t) => ({ ...t, dates: v }))}
            placeholder="Dates (e.g. March 2027)"
            style={{ color: MUTED, fontSize: 13, marginTop: 4 }}
          />
        </div>
        <button onClick={onDeleteTrip} className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity" style={{ fontSize: 12, color: "#C77", border: "1px solid #B5533C55", borderRadius: 8, padding: "6px 10px" }}>
          <Trash2 size={13} /> Delete trip
        </button>
      </div>

      <div className="flex items-center gap-1.5 mb-6 flex-wrap">
        <span style={{ fontSize: 11, color: MUTED }}>Destinations:</span>
        {trip.legs.map((l) => (
          <span key={l.id} className="flex items-center gap-1" style={{ border: `1px solid ${l.color}88`, borderRadius: 999, padding: "3px 4px 3px 10px" }}>
            <Field value={l.label} onChange={(v) => updateLeg(l.id, "label", v)} style={{ fontSize: 12, color: l.color, width: 84 }} />
            <button onClick={() => deleteLeg(l.id)} title="Remove destination" aria-label="Remove destination" style={{ opacity: 0.5 }}>
              <X size={12} color={l.color} />
            </button>
          </span>
        ))}
        <button onClick={addLeg} className="flex items-center gap-1" style={{ fontSize: 12, color: PAPER, border: `1px dashed ${MUTED}66`, borderRadius: 999, padding: "4px 10px" }}>
          <Plus size={12} /> Add destination
        </button>
      </div>

      <div className="flex items-center gap-1.5 mb-7 flex-wrap" style={{ borderBottom: `1px solid ${MUTED}33`, paddingBottom: 12 }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 transition-opacity"
              style={{
                fontSize: 12.5, fontWeight: 500, padding: "7px 13px", borderRadius: 8,
                background: active ? BRASS : "transparent",
                color: active ? INK : PAPER,
                opacity: active ? 1 : 0.65,
              }}
            >
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
        {(trip.customTabs || []).map((ct) => {
          const active = tab === `custom:${ct.id}`;
          return (
            <button
              key={ct.id}
              onClick={() => setTab(`custom:${ct.id}`)}
              className="flex items-center gap-1.5 transition-opacity"
              style={{
                fontSize: 12.5, fontWeight: 500, padding: "7px 13px", borderRadius: 8,
                background: active ? BRASS : "transparent",
                color: active ? INK : PAPER,
                opacity: active ? 1 : 0.65,
              }}
            >
              <Tag size={14} /> {ct.name || "New tab"}
            </button>
          );
        })}
        {(trip.bookingCategories || []).map((bc) => {
          const active = tab === `booking:${bc.id}`;
          return (
            <button
              key={bc.id}
              onClick={() => setTab(`booking:${bc.id}`)}
              className="flex items-center gap-1.5 transition-opacity"
              style={{
                fontSize: 12.5, fontWeight: 500, padding: "7px 13px", borderRadius: 8,
                background: active ? BRASS : "transparent",
                color: active ? INK : PAPER,
                opacity: active ? 1 : 0.65,
              }}
            >
              <Bookmark size={14} /> {bc.name || "New category"}
            </button>
          );
        })}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowAddTabMenu((v) => !v)}
            title="Add a new tab"
            aria-label="Add a new tab"
            className="flex items-center justify-center opacity-55 hover:opacity-100 transition-opacity"
            style={{ width: 30, height: 30, borderRadius: 8, border: `1px dashed ${MUTED}66`, color: PAPER }}
          >
            <Plus size={14} />
          </button>
          {showAddTabMenu && (
            <div
              className="flex flex-col"
              style={{
                position: "absolute", top: "115%", left: 0, background: PAPER, borderRadius: 8,
                padding: 4, zIndex: 20, boxShadow: "0 6px 20px rgba(0,0,0,0.35)", minWidth: 240,
              }}
            >
              <button
                onClick={() => {
                  addCustomTab();
                  setShowAddTabMenu(false);
                }}
                className="text-left"
                style={{ fontSize: 12.5, color: PAPER_TEXT, padding: "8px 10px", borderRadius: 6 }}
              >
                <div style={{ fontWeight: 600 }}>List / checklist tab</div>
                <div style={{ fontSize: 11, color: "#8A7B5C" }}>Like Notes &mdash; freeform lists, grouped by destination</div>
              </button>
              <button
                onClick={() => {
                  addBookingCategory();
                  setShowAddTabMenu(false);
                }}
                className="text-left"
                style={{ fontSize: 12.5, color: PAPER_TEXT, padding: "8px 10px", borderRadius: 6 }}
              >
                <div style={{ fontWeight: 600 }}>Booking tab</div>
                <div style={{ fontSize: 11, color: "#8A7B5C" }}>Like Hotels &mdash; name, dates, confirmation #, notes</div>
              </button>
            </div>
          )}
        </div>
      </div>

      {tab === "itinerary" && (
        <>
          <div className="grid gap-3 mb-7" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {[
              { label: "Outbound", dateKey: "outDate", timeKey: "outTime", routeKey: "outRoute", arrDateKey: "outArrDate", arrTimeKey: "outArrTime" },
              { label: "Return", dateKey: "retDate", timeKey: "retTime", routeKey: "retRoute", arrTimeKey: "retArrTime" },
            ].map((t) => (
              <div key={t.label} style={{ background: PAPER, color: PAPER_TEXT, borderRadius: 12, padding: "14px 16px", position: "relative" }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.08em", color: "#8A7B5C" }}>
                    {t.label.toUpperCase()}
                  </span>
                  <Plane size={15} color={BRASS} style={{ transform: t.label === "Return" ? "rotate(180deg)" : "none" }} />
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 16, fontWeight: 500, marginBottom: 10 }}>
                  <Field value={trip.flights[t.routeKey]} onChange={(v) => updateFlights(t.routeKey, v)} mono placeholder="XXX \u2192 YYY" />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1" style={{ fontSize: 12 }}>
                  <div>
                    <div style={{ color: "#8A7B5C", fontSize: 10 }}>DEPARTS</div>
                    <Field value={trip.flights[t.dateKey]} onChange={(v) => updateFlights(t.dateKey, v)} placeholder="Date" />
                    <Field value={trip.flights[t.timeKey]} onChange={(v) => updateFlights(t.timeKey, v)} mono placeholder="Time" />
                  </div>
                  <div>
                    <div style={{ color: "#8A7B5C", fontSize: 10 }}>ARRIVES</div>
                    {t.arrDateKey && <Field value={trip.flights[t.arrDateKey]} onChange={(v) => updateFlights(t.arrDateKey, v)} placeholder="Date" />}
                    <Field value={trip.flights[t.arrTimeKey]} onChange={(v) => updateFlights(t.arrTimeKey, v)} mono placeholder="Time" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <SuggestionsPanel trip={trip} />

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <button onClick={() => setFilter("all")} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 999, border: `1px solid ${filter === "all" ? BRASS : MUTED + "55"}`, color: filter === "all" ? BRASS : MUTED, background: "transparent" }}>
              All days
            </button>
            {dayRegions.map((r) => (
              <button key={r.id} onClick={() => setFilter(r.id)} className="flex items-center gap-1.5" style={{ fontSize: 12, padding: "5px 12px", borderRadius: 999, border: `1px solid ${filter === r.id ? r.color : MUTED + "55"}`, color: filter === r.id ? r.color : MUTED, background: "transparent" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: r.color, display: "inline-block" }} />
                {r.label}
              </button>
            ))}
          </div>

          <div style={{ overflowX: "auto", borderRadius: 10, background: PAPER, marginBottom: 10 }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 780 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #8A7B5C33" }}>
                  <th style={{ padding: "7px 8px", fontSize: 10, color: "#8A7B5C", fontWeight: 600, textAlign: "center", width: 30 }}>#</th>
                  <th style={{ padding: "7px 8px", fontSize: 10, color: "#8A7B5C", fontWeight: 600, textAlign: "left", width: 68 }}>DATE</th>
                  <th style={{ padding: "7px 8px", fontSize: 10, color: "#8A7B5C", fontWeight: 600, textAlign: "left", width: 96 }}>WHERE</th>
                  <th style={{ padding: "7px 8px", fontSize: 10, color: "#8A7B5C", fontWeight: 600, textAlign: "left", minWidth: 150 }}>SUMMARY</th>
                  {trip.dayColumns.map((col) => (
                    <th key={col.id} style={{ padding: "7px 8px", fontSize: 10, color: "#8A7B5C", fontWeight: 600, textAlign: "left", minWidth: 170 }}>
                      <div className="flex items-center gap-1">
                        <Field
                          value={col.label}
                          onChange={(v) => updateDayColumnLabel(col.id, v)}
                          className="flex-1"
                          style={{ fontSize: 10, fontWeight: 600, color: "#8A7B5C", textTransform: "uppercase" }}
                        />
                        <button onClick={() => deleteDayColumn(col.id)} title="Delete column" aria-label="Delete column" style={{ opacity: 0.4, flexShrink: 0 }}>
                          <X size={10} color="#B5533C" />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th style={{ padding: "7px 4px", width: 30 }}>
                    <button onClick={addDayColumn} title="Add column" aria-label="Add column" style={{ opacity: 0.5 }}>
                      <Plus size={13} color="#8A7B5C" />
                    </button>
                  </th>
                  <th style={{ width: 76 }} />
                </tr>
              </thead>
              <tbody>
                {filteredDays.map((d) => {
                  const realIdx = trip.days.findIndex((x) => x.id === d.id);
                  const region = regionOf(d.region);
                  return (
                    <tr key={d.id} style={{ borderBottom: "1px solid #8A7B5C1c" }}>
                      <td style={{ padding: "6px 8px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#8A7B5C", textAlign: "center" }}>
                        {String(realIdx + 1).padStart(2, "0")}
                      </td>
                      <td style={{ padding: "6px 8px", borderLeft: `4px solid ${region.color}` }}>
                        <Field value={d.date} onChange={(v) => updateDay(d.id, "date", v)} placeholder="date" mono style={{ fontSize: 12.5, color: PAPER_TEXT }} />
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <select
                          value={d.region}
                          onChange={(e) => updateDay(d.id, "region", e.target.value)}
                          style={{ fontSize: 11.5, background: "transparent", color: region.color, border: "none", fontWeight: 600, cursor: "pointer", width: "100%" }}
                        >
                          {dayRegions.map((r) => (
                            <option key={r.id} value={r.id} style={{ color: "#2B2118" }}>{r.label}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <AutoNote value={d.plan} onChange={(v) => updateDay(d.id, "plan", v)} placeholder="Quick summary" style={{ fontSize: 12.5, color: PAPER_TEXT }} />
                      </td>
                      {trip.dayColumns.map((col) => (
                        <td key={col.id} style={{ padding: "6px 8px", borderLeft: "1px solid #8A7B5C14" }}>
                          <AutoNote
                            value={(d.cells && d.cells[col.id]) || ""}
                            onChange={(v) => updateDayCell(d.id, col.id, v)}
                            placeholder="\u2014"
                            style={{ fontSize: 12.5, color: PAPER_TEXT }}
                          />
                        </td>
                      ))}
                      <td />
                      <td style={{ padding: "6px 4px" }}>
                        <div className="fx-actions flex items-center gap-0.5">
                          <IconBtn title="Move up" onClick={() => moveDay(d.id, -1)}><ChevronUp size={14} color="#8A7B5C" /></IconBtn>
                          <IconBtn title="Move down" onClick={() => moveDay(d.id, 1)}><ChevronDown size={14} color="#8A7B5C" /></IconBtn>
                          <IconBtn title="Delete day" danger onClick={() => deleteDay(d.id)}><Trash2 size={13} color="#B5533C" /></IconBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button onClick={addDay} className="flex items-center gap-2 mb-5 opacity-70 hover:opacity-100 transition-opacity" style={{ fontSize: 12.5, color: PAPER, border: `1px dashed ${MUTED}66`, borderRadius: 8, padding: "8px 14px", width: "100%", justifyContent: "center" }}>
            <Plus size={14} /> Add a day
          </button>

          {trip.days.length > 0 && (
            <div style={{ background: "rgba(0,0,0,0.18)", borderRadius: 10, padding: 12 }}>
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={13} color={BRASS} />
                <span style={{ fontSize: 12.5, fontWeight: 500, color: PAPER }}>Quick-fill a day with AI</span>
              </div>
              <select
                value={quickFillDayId && trip.days.some((x) => x.id === quickFillDayId) ? quickFillDayId : trip.days[0].id}
                onChange={(e) => setQuickFillDayId(e.target.value)}
                className="mb-2"
                style={{ fontSize: 12, background: PAPER, color: PAPER_TEXT, border: "none", borderRadius: 6, padding: "6px 8px" }}
              >
                {trip.days.map((x, i) => (
                  <option key={x.id} value={x.id}>
                    Day {i + 1}{x.date ? ` \u2014 ${x.date}` : ""}
                  </option>
                ))}
              </select>
              {(() => {
                const targetId = quickFillDayId && trip.days.some((x) => x.id === quickFillDayId) ? quickFillDayId : trip.days[0].id;
                const targetDay = trip.days.find((x) => x.id === targetId);
                const u = dayUi(targetId);
                return (
                  <>
                    <textarea
                      value={targetDay.notes || ""}
                      onChange={(e) => updateDay(targetId, "notes", e.target.value)}
                      placeholder="Brain-dump times, activities, reservations here, then Organize to sort them into that day's columns."
                      rows={2}
                      className="w-full bg-transparent outline-none resize-none text-sm"
                      style={{ color: PAPER, lineHeight: 1.5, border: "1px dashed #F3ECDD44", borderRadius: 8, padding: "8px 10px", marginBottom: 8 }}
                    />
                    <button
                      onClick={() => organizeDay(targetId)}
                      disabled={!(targetDay.notes || "").trim() || u.loading}
                      className="flex items-center gap-1.5"
                      style={{
                        fontSize: 12, fontWeight: 500, color: INK, background: BRASS, borderRadius: 8,
                        padding: "6px 12px", opacity: !(targetDay.notes || "").trim() || u.loading ? 0.5 : 1,
                        cursor: !(targetDay.notes || "").trim() || u.loading ? "default" : "pointer",
                      }}
                    >
                      {u.loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                      {u.loading ? "Organizing\u2026" : "Organize into that day"}
                    </button>
                    {u.error && <p style={{ color: "#E39B8C", fontSize: 11.5, marginTop: 6 }}>{u.error}</p>}
                  </>
                );
              })()}
            </div>
          )}
        </>
      )}

      {tab === "notes" && (
        <NotesLikePanel
          sections={trip.sections}
          noteGroups={noteGroups}
          isSectionOpen={isSectionOpen}
          toggleSection={toggleSection}
          onAddSection={(region) => addSection("notes", region)}
          onUpdateTitle={(id, v) => updateSectionTitle("notes", id, v)}
          onUpdateRegion={(id, region) => updateSectionRegion("notes", id, region)}
          onDeleteSection={(id) => deleteSection("notes", id)}
          onAddItem={(sectionId) => addItem("notes", sectionId)}
          onUpdateItem={(sectionId, itemId, v) => updateItem("notes", sectionId, itemId, v)}
          onToggleItem={(sectionId, itemId) => toggleItem("notes", sectionId, itemId)}
          onDeleteItem={(sectionId, itemId) => deleteItem("notes", sectionId, itemId)}
        />
      )}

      {trip.customTabs &&
        trip.customTabs.map(
          (ct) =>
            tab === `custom:${ct.id}` && (
              <div key={ct.id}>
                <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
                  <Field
                    value={ct.name}
                    onChange={(v) => updateCustomTabName(ct.id, v)}
                    className="fx-fraunces"
                    placeholder="Tab name"
                    style={{ fontSize: 20, fontStyle: "italic", fontWeight: 500, maxWidth: 320 }}
                  />
                  <button onClick={() => deleteCustomTab(ct.id)} className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity" style={{ fontSize: 12, color: "#C77", border: "1px solid #B5533C55", borderRadius: 8, padding: "6px 10px" }}>
                    <Trash2 size={13} /> Delete tab
                  </button>
                </div>
                <NotesLikePanel
                  sections={ct.sections}
                  noteGroups={noteGroups}
                  isSectionOpen={isSectionOpen}
                  toggleSection={toggleSection}
                  onAddSection={(region) => addSection(ct.id, region)}
                  onUpdateTitle={(id, v) => updateSectionTitle(ct.id, id, v)}
                  onUpdateRegion={(id, region) => updateSectionRegion(ct.id, id, region)}
                  onDeleteSection={(id) => deleteSection(ct.id, id)}
                  onAddItem={(sectionId) => addItem(ct.id, sectionId)}
                  onUpdateItem={(sectionId, itemId, v) => updateItem(ct.id, sectionId, itemId, v)}
                  onToggleItem={(sectionId, itemId) => toggleItem(ct.id, sectionId, itemId)}
                  onDeleteItem={(sectionId, itemId) => deleteItem(ct.id, sectionId, itemId)}
                />
              </div>
            )
        )}

      {trip.bookingCategories &&
        trip.bookingCategories.map(
          (bc) =>
            tab === `booking:${bc.id}` && (
              <div key={bc.id}>
                <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
                  <Field
                    value={bc.name}
                    onChange={(v) => updateBookingCategoryName(bc.id, v)}
                    className="fx-fraunces"
                    placeholder="Category name"
                    style={{ fontSize: 20, fontStyle: "italic", fontWeight: 500, maxWidth: 320 }}
                  />
                  <button onClick={() => deleteBookingCategory(bc.id)} className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity" style={{ fontSize: 12, color: "#C77", border: "1px solid #B5533C55", borderRadius: 8, padding: "6px 10px" }}>
                    <Trash2 size={13} /> Delete category
                  </button>
                </div>
                <BookingsPanel
                  category={bc.id}
                  itemNoun={bc.name || "item"}
                  whenLabel="Date / time"
                  confirmLabel="Confirmation #"
                  entries={bc.entries}
                  noteGroups={noteGroups}
                  onAdd={addBooking}
                  onUpdate={updateBooking}
                  onDelete={deleteBooking}
                  onAddFromSearch={addBookingFromSearch}
                  isOpen={isSectionOpen}
                  onToggle={toggleSection}
                />
              </div>
            )
        )}

      {tab === "hotels" && (
        <BookingsPanel
          category="hotels" itemNoun="Hotel" whenLabel="Check-in \u2013 check-out" confirmLabel="Confirmation #"
          entries={trip.bookings.hotels} noteGroups={noteGroups} onAdd={addBooking} onUpdate={updateBooking} onDelete={deleteBooking}
          onAddFromSearch={addBookingFromSearch}
          isOpen={isSectionOpen} onToggle={toggleSection}
        />
      )}
      {tab === "restaurants" && (
        <BookingsPanel
          category="restaurants" itemNoun="Restaurant" whenLabel="Date & time" confirmLabel="Reservation #"
          entries={trip.bookings.restaurants} noteGroups={noteGroups} onAdd={addBooking} onUpdate={updateBooking} onDelete={deleteBooking}
          onAddFromSearch={addBookingFromSearch}
          isOpen={isSectionOpen} onToggle={toggleSection}
        />
      )}
      {tab === "experiences" && (
        <BookingsPanel
          category="experiences" itemNoun="Experience" whenLabel="Date & time" confirmLabel="Confirmation #"
          entries={trip.bookings.experiences} noteGroups={noteGroups} onAdd={addBooking} onUpdate={updateBooking} onDelete={deleteBooking}
          onAddFromSearch={addBookingFromSearch}
          isOpen={isSectionOpen} onToggle={toggleSection}
        />
      )}
      {tab === "import" && <ImportPanel legs={trip.legs} noteGroups={noteGroups} onApply={applyImportResults} />}
    </div>
  );
}

// ---------- home page: all trips ----------

function FolderView({ folder, onOpenTrip, onCreateTrip, onDeleteTrip, onRenameFolder, onBack, onDeleteFolder }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [dates, setDates] = useState("");

  const PAPER = "#F3ECDD", PAPER_TEXT = "#2B2118", BRASS = "#C99A44", MUTED = "#9FA8B3", INK = "#1B2430";

  const submit = () => {
    if (!name.trim()) return;
    onCreateTrip(name.trim(), dates.trim());
    setName("");
    setDates("");
    setShowForm(false);
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 mb-4 opacity-70 hover:opacity-100 transition-opacity" style={{ fontSize: 12.5, color: "#F3ECDD" }}>
        <ArrowLeft size={14} /> All folders
      </button>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <Field
          value={folder.name}
          onChange={onRenameFolder}
          className="fx-fraunces"
          placeholder="Folder name"
          style={{ fontSize: 28, fontStyle: "italic", fontWeight: 500, color: "#F3ECDD", minWidth: 220 }}
        />
        <button onClick={onDeleteFolder} className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity" style={{ fontSize: 12, color: "#C77", border: "1px solid #B5533C55", borderRadius: 8, padding: "6px 10px" }}>
          <Trash2 size={13} /> Delete folder
        </button>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {folder.trips.map((trip) => (
          <div key={trip.id} className="fx-row" style={{ position: "relative" }}>
            <button onClick={() => onOpenTrip(trip.id)} className="w-full text-left" style={{ background: PAPER, color: PAPER_TEXT, borderRadius: 12, padding: 16, display: "block" }}>
              <div className="flex items-center gap-1 mb-3" style={{ minHeight: 8 }}>
                {trip.legs.length > 0 ? (
                  trip.legs.map((l) => <span key={l.id} style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, display: "inline-block" }} />)
                ) : (
                  <span style={{ fontSize: 10.5, color: "#8A7B5C" }}>No destinations yet</span>
                )}
              </div>
              <div className="fx-fraunces" style={{ fontSize: 18, fontWeight: 600, fontStyle: "italic", marginBottom: 2 }}>{trip.name}</div>
              <div style={{ fontSize: 12, color: "#8A7B5C" }}>{trip.dates || "No dates yet"}</div>
              <div style={{ fontSize: 11, color: "#8A7B5C", marginTop: 10 }}>{trip.days.length} day{trip.days.length === 1 ? "" : "s"} planned</div>
            </button>
            <button onClick={() => onDeleteTrip(trip.id)} className="fx-actions" title="Delete trip" aria-label="Delete trip" style={{ position: "absolute", top: 12, right: 12 }}>
              <Trash2 size={13} color="#B5533C" />
            </button>
          </div>
        ))}

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="flex flex-col items-center justify-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
            style={{ border: `1px dashed ${MUTED}66`, borderRadius: 12, padding: 16, minHeight: 110, color: "#F3ECDD" }}
          >
            <Plus size={20} />
            <span style={{ fontSize: 13 }}>New trip</span>
          </button>
        ) : (
          <div style={{ background: PAPER, color: PAPER_TEXT, borderRadius: 12, padding: 16 }}>
            <Field value={name} onChange={setName} placeholder="Trip name (e.g. Japan)" className="mb-2" style={{ fontSize: 15, fontWeight: 600 }} autoFocus />
            <Field value={dates} onChange={setDates} placeholder="Dates (e.g. March 2027)" className="mb-3" style={{ fontSize: 12, color: "#8A7B5C" }} />
            <div className="flex items-center gap-2">
              <button onClick={submit} style={{ fontSize: 12, fontWeight: 500, color: INK, background: BRASS, borderRadius: 8, padding: "6px 12px" }}>
                Create
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setName("");
                  setDates("");
                }}
                style={{ fontSize: 12, color: "#8A7B5C" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HomeView({ folders, onOpen, onCreate, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");

  const PAPER = "#F3ECDD", PAPER_TEXT = "#2B2118", BRASS = "#C99A44", MUTED = "#9FA8B3", INK = "#1B2430";

  const submit = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
    setName("");
    setShowForm(false);
  };

  return (
    <div>
      <h1 className="fx-fraunces" style={{ fontSize: 30, fontStyle: "italic", fontWeight: 500, margin: 0 }}>Trip Planning</h1>
      <p style={{ color: MUTED, fontSize: 13, marginTop: 4, marginBottom: 24 }}>Organized by who's going.</p>

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {folders.map((folder) => {
          const tripCount = folder.trips.length;
          const dayCount = folder.trips.reduce((sum, t) => sum + t.days.length, 0);
          return (
            <div key={folder.id} className="fx-row" style={{ position: "relative" }}>
              <button onClick={() => onOpen(folder.id)} className="w-full text-left" style={{ background: PAPER, color: PAPER_TEXT, borderRadius: 12, padding: 16, display: "block" }}>
                <Folder size={18} color="#C99A44" style={{ marginBottom: 10 }} />
                <div className="fx-fraunces" style={{ fontSize: 18, fontWeight: 600, fontStyle: "italic", marginBottom: 2 }}>{folder.name}</div>
                <div style={{ fontSize: 12, color: "#8A7B5C" }}>{tripCount} trip{tripCount === 1 ? "" : "s"}</div>
                <div style={{ fontSize: 11, color: "#8A7B5C", marginTop: 10 }}>{dayCount} day{dayCount === 1 ? "" : "s"} planned</div>
              </button>
              <button onClick={() => onDelete(folder.id)} className="fx-actions" title="Delete folder" aria-label="Delete folder" style={{ position: "absolute", top: 12, right: 12 }}>
                <Trash2 size={13} color="#B5533C" />
              </button>
            </div>
          );
        })}

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="flex flex-col items-center justify-center gap-2 opacity-70 hover:opacity-100 transition-opacity"
            style={{ border: `1px dashed ${MUTED}66`, borderRadius: 12, padding: 16, minHeight: 110, color: PAPER }}
          >
            <Plus size={20} />
            <span style={{ fontSize: 13 }}>New folder</span>
          </button>
        ) : (
          <div style={{ background: PAPER, color: PAPER_TEXT, borderRadius: 12, padding: 16 }}>
            <Field value={name} onChange={setName} placeholder="Folder name (e.g. Mom & Dad)" className="mb-3" style={{ fontSize: 15, fontWeight: 600 }} autoFocus />
            <div className="flex items-center gap-2">
              <button onClick={submit} style={{ fontSize: 12, fontWeight: 500, color: INK, background: BRASS, borderRadius: 8, padding: "6px 12px" }}>
                Create
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setName("");
                }}
                style={{ fontSize: 12, color: "#8A7B5C" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- top-level app: folders of trips + persistence + backup ----------

export default function App() {
  const [data, setData] = useState(() => ({ folders: [{ id: uid(), name: DEFAULT_FOLDER_NAME, trips: [makeItalyTrip()] }] }));
  const [ready, setReady] = useState(false);
  const [folderId, setFolderId] = useState(null);
  const [tripId, setTripId] = useState(null);
  const status = useDebouncedSave(data, ready);

  useEffect(() => {
    setData(loadInitial());
    setReady(true);
  }, []);

  const updateFolder = (fid, fn) => setData((d) => ({ ...d, folders: d.folders.map((f) => (f.id === fid ? fn(f) : f)) }));
  const updateTrip = (fid, tid, fn) => updateFolder(fid, (f) => ({ ...f, trips: f.trips.map((t) => (t.id === tid ? fn(t) : t)) }));

  const createFolder = (name) => {
    const f = makeFolder(name);
    setData((d) => ({ ...d, folders: [...d.folders, f] }));
    setFolderId(f.id);
  };
  const deleteFolder = (fid) => {
    if (!window.confirm("Delete this folder and every trip inside it? This can't be undone.")) return;
    setData((d) => ({ ...d, folders: d.folders.filter((f) => f.id !== fid) }));
    setFolderId(null);
    setTripId(null);
  };

  const createTrip = (fid, name, dates) => {
    const t = makeTrip(name, dates);
    updateFolder(fid, (f) => ({ ...f, trips: [...f.trips, t] }));
    setTripId(t.id);
  };
  const deleteTrip = (fid, tid) => {
    if (!window.confirm("Delete this trip? This can't be undone.")) return;
    updateFolder(fid, (f) => ({ ...f, trips: f.trips.filter((t) => t.id !== tid) }));
    setTripId(null);
  };

  const importInputRef = useRef(null);
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trip-planning-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const importBackup = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const migrated = migrateRoot(parsed);
        if (!migrated) throw new Error("unrecognized shape");
        setData(migrated);
        setFolderId(null);
        setTripId(null);
      } catch {
        window.alert("That doesn't look like a valid backup file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const INK = "#1B2430";
  const PAPER = "#F3ECDD";
  const BRASS = "#C99A44";
  const MUTED = "#9FA8B3";

  const activeFolder = folderId ? data.folders.find((f) => f.id === folderId) : null;
  const activeTrip = activeFolder && tripId ? activeFolder.trips.find((t) => t.id === tripId) : null;

  return (
    <div style={{ background: INK, minHeight: "100vh" }}>
      <div style={{ color: PAPER, fontFamily: "'Inter', sans-serif", maxWidth: 980, margin: "0 auto", padding: "24px 20px 60px" }} className="w-full">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;1,500&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
          .fx-fraunces { font-family: 'Fraunces', serif; }
          .fx-row:hover .fx-actions { opacity: 1; }
          .fx-actions { opacity: 0.35; transition: opacity 0.15s; }
          input:focus-visible, button:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid ${BRASS}; outline-offset: 2px; }
          @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
        `}</style>

        <div className="flex items-center justify-end gap-2 mb-4 flex-wrap">
          <span style={{ fontSize: 11, color: MUTED, fontFamily: "'IBM Plex Mono', monospace", minWidth: 70, textAlign: "right" }}>
            {status === "saving" ? "saving\u2026" : status === "saved" ? "all changes saved" : status === "error" ? "save failed" : ""}
          </span>
          <button onClick={exportBackup} className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity" style={{ fontSize: 12, color: PAPER, border: `1px solid ${MUTED}55`, borderRadius: 8, padding: "6px 10px" }}>
            <Download size={13} /> Export backup
          </button>
          <input ref={importInputRef} type="file" accept="application/json" onChange={importBackup} style={{ display: "none" }} />
          <button onClick={() => importInputRef.current && importInputRef.current.click()} className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity" style={{ fontSize: 12, color: PAPER, border: `1px solid ${MUTED}55`, borderRadius: 8, padding: "6px 10px" }}>
            <Upload size={13} /> Import backup
          </button>
        </div>

        {status === "error" && (
          <div className="flex items-center gap-2 mb-5" style={{ background: "#B5533C", color: "#F3ECDD", borderRadius: 8, padding: "10px 14px", fontSize: 12.5 }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>
              Changes aren't saving in this browser right now &mdash; storage may be blocked or you're in a private/incognito
              window. Click <strong>Export backup</strong> to save a file you can re-import later, so nothing gets lost.
            </span>
          </div>
        )}

        {!folderId && <HomeView folders={data.folders} onOpen={setFolderId} onCreate={createFolder} onDelete={deleteFolder} />}

        {folderId && !tripId && activeFolder && (
          <FolderView
            folder={activeFolder}
            onOpenTrip={setTripId}
            onCreateTrip={(name, dates) => createTrip(folderId, name, dates)}
            onDeleteTrip={(tid) => deleteTrip(folderId, tid)}
            onRenameFolder={(name) => updateFolder(folderId, (f) => ({ ...f, name }))}
            onBack={() => setFolderId(null)}
            onDeleteFolder={() => deleteFolder(folderId)}
          />
        )}

        {folderId && !activeFolder && (
          <div>
            <p style={{ color: MUTED, fontSize: 13, marginBottom: 12 }}>That folder couldn't be found.</p>
            <button onClick={() => setFolderId(null)} className="flex items-center gap-1.5" style={{ fontSize: 12.5, color: PAPER, border: `1px solid ${MUTED}55`, borderRadius: 8, padding: "6px 10px" }}>
              <ArrowLeft size={13} /> All folders
            </button>
          </div>
        )}

        {folderId && tripId && activeTrip && (
          <TripPlanner
            trip={activeTrip}
            updateTrip={(fn) => updateTrip(folderId, tripId, fn)}
            onBack={() => setTripId(null)}
            onDeleteTrip={() => deleteTrip(folderId, tripId)}
          />
        )}

        {folderId && tripId && activeFolder && !activeTrip && (
          <div>
            <p style={{ color: MUTED, fontSize: 13, marginBottom: 12 }}>That trip couldn't be found.</p>
            <button onClick={() => setTripId(null)} className="flex items-center gap-1.5" style={{ fontSize: 12.5, color: PAPER, border: `1px solid ${MUTED}55`, borderRadius: 8, padding: "6px 10px" }}>
              <ArrowLeft size={13} /> Back to {activeFolder.name}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
