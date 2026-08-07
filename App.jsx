import { useState, useEffect, useRef } from "react";
import {
  Plane, Plus, Trash2, ChevronUp, ChevronDown, MapPin,
  RotateCcw, FolderPlus, Check, Sparkles, Loader2, Pencil, FileText,
  BedDouble, UtensilsCrossed, Ticket
} from "lucide-react";

const REGIONS = [
  { id: "rome", label: "Rome", color: "#B5533C" },
  { id: "tuscany", label: "Tuscany", color: "#4B5D3A" },
  { id: "florence", label: "Florence", color: "#B8862F" },
  { id: "travel", label: "Travel", color: "#8A7B5C" },
];
const NOTE_GROUPS = [
  { id: "general", label: "General", color: "#9FA8B3" },
  { id: "rome", label: "Rome", color: "#B5533C" },
  { id: "tuscany", label: "Tuscany", color: "#4B5D3A" },
  { id: "florence", label: "Florence", color: "#B8862F" },
];
const NOTE_GROUP_IDS = NOTE_GROUPS.map((g) => g.id);
const TABS = [
  { id: "itinerary", label: "Itinerary", icon: MapPin },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "hotels", label: "Hotels", icon: BedDouble },
  { id: "restaurants", label: "Restaurants", icon: UtensilsCrossed },
  { id: "experiences", label: "Experiences", icon: Ticket },
];
const regionOf = (id) => REGIONS.find((r) => r.id === id) || REGIONS[3];
const uid = () => Math.random().toString(36).slice(2, 9);
const it = (text) => ({ id: uid(), text, checked: false });
const day = (date, region, plan) => ({ id: uid(), date, region, plan, notes: "", organized: null });
const list = (title, region, items) => ({ id: uid(), title, region, items });
const booking = (region) => ({ id: uid(), name: "", region: region || "rome", when: "", confirmation: "", notes: "" });

const seedData = {
  flights: {
    outDate: "Thu, Nov 5, 2026", outTime: "5:25 PM", outRoute: "JFK \u2192 FCO",
    outArrDate: "Fri, Nov 6, 2026", outArrTime: "7:45 AM",
    retDate: "Sat, Nov 21, 2026", retTime: "1:00 PM", retRoute: "FCO \u2192 JFK",
    retArrTime: "5:02 PM",
  },
  days: [
    day("11/5", "travel", "Travel \u2014 overnight (red-eye) flight, ~8.5 hrs"),
    day("11/6", "rome", "Arrive Rome AM \u2014 chill day, food day"),
    day("11/7", "rome", "Rome \u2014 museum day"),
    day("11/8", "rome", "Rome \u2014 open"),
    day("11/9", "rome", "Rome \u2014 possible Naples/Pompeii day trip"),
    day("11/10", "rome", "Rome \u2014 depart AM or evening for Siena/Chiusi/Sarteano by train, rent a car"),
    day("11/11", "tuscany", "Tuscany day 1"),
    day("11/12", "tuscany", "Tuscany day 2"),
    day("11/13", "tuscany", "Tuscany day 3"),
    day("11/14", "tuscany", "Tuscany day 4"),
    day("11/15", "tuscany", "Tuscany day 5"),
    day("11/16", "florence", "Arrive Florence \u2014 Florence day 1"),
    day("11/17", "florence", "Florence day 2"),
    day("11/18", "florence", "Florence day 3"),
    day("11/19", "florence", "Florence day 4"),
    day("11/20", "florence", "Florence day 5 \u2014 depart PM for Rome"),
    day("11/21", "rome", "Rome \u2014 final day, departure flight home"),
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
};

const STORAGE_KEY = "italy-trip-planner-v1";

const REGION_FALLBACK_BY_TITLE = { "Things to eat": "rome", "Things to buy": "florence", "Places to visit": "rome" };
function migrate(loaded) {
  return {
    ...loaded,
    days: (loaded.days || []).map((d) => ({ notes: "", organized: null, ...d })),
    sections: (loaded.sections || []).map((s) => {
      const region = NOTE_GROUP_IDS.includes(s.region) ? s.region : REGION_FALLBACK_BY_TITLE[s.title] || "rome";
      return { ...s, region };
    }),
    bookings: {
      hotels: (loaded.bookings && loaded.bookings.hotels) || [],
      restaurants: (loaded.bookings && loaded.bookings.restaurants) || [],
      experiences: (loaded.bookings && loaded.bookings.experiences) || [],
    },
  };
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

  // Belt-and-suspenders: flush immediately (bypassing the debounce) any time
  // the tab is closed, refreshed, or backgrounded, so nothing typed in the
  // last moment before closing the site is ever lost.
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

function renderOrganized(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
      {lines.map((line, i) => {
        const clean = line.replace(/^[-*]\s*/, "");
        const m = clean.match(/^(\d{1,2}(:\d{2})?\s?(AM|PM|am|pm))\s*[\u2014\u2013:-]\s*(.*)$/);
        return (
          <li key={i} style={{ display: "flex", gap: 8, fontSize: 13, lineHeight: 1.45 }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8A7B5C", minWidth: 64, flexShrink: 0, paddingTop: 1 }}>
              {m ? m[1] : ""}
            </span>
            <span>{m ? m[4] : clean}</span>
          </li>
        );
      })}
    </ul>
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

function BookingsPanel({ category, itemNoun, whenLabel, confirmLabel, entries, onAdd, onUpdate, onDelete }) {
  const PAPER = "#F3ECDD", PAPER_TEXT = "#2B2118";
  return (
    <div>
      {NOTE_GROUPS.map((group) => {
        const groupEntries = entries.filter((b) => (b.region || "rome") === group.id);
        return (
          <div key={group.id} className="mb-9" style={{ borderTop: `1px solid ${group.color}33`, paddingTop: 18 }}>
            <GroupBadge group={group} />
            {groupEntries.length > 0 && (
              <div className="flex flex-col gap-2 mb-3">
                {groupEntries.map((b) => (
                  <div key={b.id} className="fx-row" style={{ background: PAPER, color: PAPER_TEXT, borderRadius: 10, borderLeft: `4px solid ${group.color}`, padding: "12px 14px" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Field value={b.name} onChange={(v) => onUpdate(category, b.id, "name", v)} placeholder={`${itemNoun} name`} className="fx-fraunces flex-1" style={{ fontSize: 14.5, fontWeight: 600, fontStyle: "italic" }} />
                      <select value={b.region || "rome"} onChange={(e) => onUpdate(category, b.id, "region", e.target.value)} style={{ fontSize: 10, background: "transparent", border: "none", color: group.color, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                        {NOTE_GROUPS.map((g) => (
                          <option key={g.id} value={g.id} style={{ color: "#2B2118" }}>{g.label}</option>
                        ))}
                      </select>
                      <button onClick={() => onDelete(category, b.id)} className="fx-actions shrink-0" title="Delete" aria-label="Delete">
                        <Trash2 size={13} color="#B5533C" />
                      </button>
                    </div>
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
                    <Field value={b.notes} onChange={(v) => onUpdate(category, b.id, "notes", v)} placeholder="Address, link, or notes" style={{ fontSize: 12, color: "#5A5245" }} />
                  </div>
                ))}
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

export default function App() {
  const [data, setData] = useState(seedData);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState("all");
  const [ui, setUi] = useState({});
  const [sectionOpen, setSectionOpen] = useState({});
  const [tab, setTab] = useState("itinerary");
  const status = useDebouncedSave(data, ready);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData(migrate(JSON.parse(raw)));
    } catch {
      // no saved data yet, or it was corrupted -- keep the seed itinerary
    } finally {
      setReady(true);
    }
  }, []);

  const updateFlights = (field, val) => setData((d) => ({ ...d, flights: { ...d.flights, [field]: val } }));

  const addDay = () => setData((d) => ({ ...d, days: [...d.days, day("", "rome", "")] }));
  const updateDay = (id, field, val) =>
    setData((d) => ({ ...d, days: d.days.map((x) => (x.id === id ? { ...x, [field]: val } : x)) }));
  const deleteDay = (id) => setData((d) => ({ ...d, days: d.days.filter((x) => x.id !== id) }));
  const moveDay = (id, dir) =>
    setData((d) => {
      const arr = [...d.days];
      const i = arr.findIndex((x) => x.id === id);
      const j = i + dir;
      if (j < 0 || j >= arr.length) return d;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...d, days: arr };
    });

  const addSection = (region) => setData((d) => ({ ...d, sections: [...d.sections, list("New list", region || "rome", [])] }));
  const updateSectionTitle = (id, val) =>
    setData((d) => ({ ...d, sections: d.sections.map((s) => (s.id === id ? { ...s, title: val } : s)) }));
  const updateSectionRegion = (id, region) =>
    setData((d) => ({ ...d, sections: d.sections.map((s) => (s.id === id ? { ...s, region } : s)) }));
  const deleteSection = (id) => setData((d) => ({ ...d, sections: d.sections.filter((s) => s.id !== id) }));

  const addItem = (sectionId) =>
    setData((d) => ({ ...d, sections: d.sections.map((s) => (s.id === sectionId ? { ...s, items: [...s.items, it("")] } : s)) }));
  const updateItem = (sectionId, itemId, val) =>
    setData((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id === sectionId ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, text: val } : i)) } : s
      ),
    }));
  const toggleItem = (sectionId, itemId) =>
    setData((d) => ({
      ...d,
      sections: d.sections.map((s) =>
        s.id === sectionId ? { ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, checked: !i.checked } : i)) } : s
      ),
    }));
  const deleteItem = (sectionId, itemId) =>
    setData((d) => ({
      ...d,
      sections: d.sections.map((s) => (s.id === sectionId ? { ...s, items: s.items.filter((i) => i.id !== itemId) } : s)),
    }));

  const addBooking = (category, region) =>
    setData((d) => ({ ...d, bookings: { ...d.bookings, [category]: [...d.bookings[category], booking(region)] } }));
  const updateBooking = (category, id, field, val) =>
    setData((d) => ({
      ...d,
      bookings: { ...d.bookings, [category]: d.bookings[category].map((b) => (b.id === id ? { ...b, [field]: val } : b)) },
    }));
  const deleteBooking = (category, id) =>
    setData((d) => ({ ...d, bookings: { ...d.bookings, [category]: d.bookings[category].filter((b) => b.id !== id) } }));

  const resetAll = () => {
    if (window.confirm("Reset the whole planner back to the original itinerary? This can't be undone.")) {
      setData(JSON.parse(JSON.stringify(seedData)));
      setUi({});
    }
  };

  const dayUi = (id) => ui[id] || { expanded: false, editing: false, loading: false, error: null };
  const patchUi = (id, patch) => setUi((prev) => ({ ...prev, [id]: { ...dayUi(id), ...patch } }));

  const isSectionOpen = (id) => sectionOpen[id] !== false;
  const toggleSection = (id) => setSectionOpen((prev) => ({ ...prev, [id]: !isSectionOpen(id) }));

  const toggleExpand = (d) => {
    const cur = dayUi(d.id);
    const willExpand = !cur.expanded;
    patchUi(d.id, {
      expanded: willExpand,
      editing: willExpand ? (cur.editing || !d.organized) : cur.editing,
      error: null,
    });
  };

  const organizeDay = async (id) => {
    const d = data.days.find((x) => x.id === id);
    if (!d || !(d.notes || "").trim()) return;
    patchUi(id, { loading: true, error: null });
    try {
      const res = await fetch("/api/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: d.notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "request failed");
      const text = (json.text || "").trim();
      if (!text) throw new Error("empty");
      setData((prev) => ({ ...prev, days: prev.days.map((x) => (x.id === id ? { ...x, organized: text } : x)) }));
      patchUi(id, { loading: false, editing: false, expanded: true });
    } catch {
      patchUi(id, { loading: false, error: "Couldn't organize that \u2014 try again." });
    }
  };

  const filteredDays = filter === "all" ? data.days : data.days.filter((d) => d.region === filter);

  const INK = "#1B2430";
  const PAPER = "#F3ECDD";
  const PAPER_TEXT = "#2B2118";
  const BRASS = "#C99A44";
  const MUTED = "#9FA8B3";

  return (
    <div style={{ background: INK, minHeight: "100vh" }}>
    <div style={{ color: PAPER, fontFamily: "'Inter', sans-serif", maxWidth: 980, margin: "0 auto", padding: "28px 20px 60px" }} className="w-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;1,500&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
        .fx-fraunces { font-family: 'Fraunces', serif; }
        .fx-row:hover .fx-actions { opacity: 1; }
        .fx-actions { opacity: 0.35; transition: opacity 0.15s; }
        input:focus-visible, button:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid ${BRASS}; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>

      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <h1 className="fx-fraunces" style={{ fontSize: 30, fontStyle: "italic", fontWeight: 500, margin: 0 }}>
            Rome &middot; Tuscany &middot; Florence
          </h1>
          <p style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>November 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 11, color: MUTED, fontFamily: "'IBM Plex Mono', monospace", minWidth: 70, textAlign: "right" }}>
            {status === "saving" ? "saving\u2026" : status === "saved" ? "all changes saved" : status === "error" ? "save failed" : ""}
          </span>
          <button onClick={resetAll} className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity" style={{ fontSize: 12, color: PAPER, border: `1px solid ${MUTED}55`, borderRadius: 8, padding: "6px 10px" }}>
            <RotateCcw size={13} /> Reset
          </button>
        </div>
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
              <Field value={data.flights[t.routeKey]} onChange={(v) => updateFlights(t.routeKey, v)} mono />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1" style={{ fontSize: 12 }}>
              <div>
                <div style={{ color: "#8A7B5C", fontSize: 10 }}>DEPARTS</div>
                <Field value={data.flights[t.dateKey]} onChange={(v) => updateFlights(t.dateKey, v)} />
                <Field value={data.flights[t.timeKey]} onChange={(v) => updateFlights(t.timeKey, v)} mono />
              </div>
              <div>
                <div style={{ color: "#8A7B5C", fontSize: 10 }}>ARRIVES</div>
                {t.arrDateKey && <Field value={data.flights[t.arrDateKey]} onChange={(v) => updateFlights(t.arrDateKey, v)} />}
                <Field value={data.flights[t.arrTimeKey]} onChange={(v) => updateFlights(t.arrTimeKey, v)} mono />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilter("all")} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 999, border: `1px solid ${filter === "all" ? BRASS : MUTED + "55"}`, color: filter === "all" ? BRASS : MUTED, background: "transparent" }}>
          All days
        </button>
        {REGIONS.map((r) => (
          <button key={r.id} onClick={() => setFilter(r.id)} className="flex items-center gap-1.5" style={{ fontSize: 12, padding: "5px 12px", borderRadius: 999, border: `1px solid ${filter === r.id ? r.color : MUTED + "55"}`, color: filter === r.id ? r.color : MUTED, background: "transparent" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: r.color, display: "inline-block" }} />
            {r.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 mb-3">
        {filteredDays.map((d) => {
          const realIdx = data.days.findIndex((x) => x.id === d.id);
          const region = regionOf(d.region);
          const u = dayUi(d.id);
          const label = d.organized ? "Itinerary" : d.notes ? "Draft itinerary" : "Write today's itinerary";
          const dotColor = d.organized ? BRASS : d.notes ? "#8A7B5C" : "transparent";
          return (
            <div key={d.id} className="fx-row" style={{ background: PAPER, color: PAPER_TEXT, borderRadius: 10, borderLeft: `4px solid ${region.color}` }}>
              <div className="flex items-start gap-3" style={{ padding: "10px 12px 8px 12px" }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#8A7B5C", width: 34, textAlign: "center", paddingTop: 3, flexShrink: 0 }}>
                  {String(realIdx + 1).padStart(2, "0")}
                </div>
                <div style={{ width: 58, flexShrink: 0, paddingTop: 2 }}>
                  <Field value={d.date} onChange={(v) => updateDay(d.id, "date", v)} placeholder="11/5" mono className="text-sm font-medium" />
                </div>
                <select value={d.region} onChange={(e) => updateDay(d.id, "region", e.target.value)} style={{ fontSize: 11, background: "transparent", color: region.color, border: "none", fontWeight: 600, width: 74, flexShrink: 0, paddingTop: 3, cursor: "pointer" }}>
                  {REGIONS.map((r) => (
                    <option key={r.id} value={r.id} style={{ color: "#2B2118" }}>{r.label}</option>
                  ))}
                </select>
                <textarea value={d.plan} onChange={(e) => updateDay(d.id, "plan", e.target.value)} placeholder="Quick summary" rows={1} className="flex-1 bg-transparent outline-none resize-none text-sm" style={{ color: PAPER_TEXT, lineHeight: 1.4, paddingTop: 2 }} />
                <div className="fx-actions flex items-center gap-0.5" style={{ paddingTop: 1 }}>
                  <IconBtn title="Move up" onClick={() => moveDay(d.id, -1)}><ChevronUp size={15} color="#8A7B5C" /></IconBtn>
                  <IconBtn title="Move down" onClick={() => moveDay(d.id, 1)}><ChevronDown size={15} color="#8A7B5C" /></IconBtn>
                  <IconBtn title="Delete day" danger onClick={() => deleteDay(d.id)}><Trash2 size={14} color="#B5533C" /></IconBtn>
                </div>
              </div>

              <div style={{ padding: "6px 12px 10px 12px", borderTop: "1px solid #8A7B5C22" }}>
                <button onClick={() => toggleExpand(d)} className="flex items-center gap-1.5" style={{ fontSize: 11.5, color: "#8A7B5C", fontWeight: 500 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                  <FileText size={12} />
                  {label}
                  {u.expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {u.expanded && (
                  u.editing || !d.organized ? (
                    <div className="mt-2">
                      <textarea
                        autoFocus
                        value={d.notes || ""}
                        onChange={(e) => updateDay(d.id, "notes", e.target.value)}
                        placeholder="Times, activities, reservations \u2014 just brain-dump what you're doing this day."
                        rows={5}
                        className="w-full bg-transparent outline-none resize-none text-sm"
                        style={{ color: PAPER_TEXT, lineHeight: 1.5, border: "1px dashed #8A7B5C55", borderRadius: 8, padding: "8px 10px" }}
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => organizeDay(d.id)}
                          disabled={!(d.notes || "").trim() || u.loading}
                          className="flex items-center gap-1.5"
                          style={{
                            fontSize: 12, fontWeight: 500, color: INK, background: BRASS, borderRadius: 8,
                            padding: "6px 12px", opacity: !(d.notes || "").trim() || u.loading ? 0.5 : 1,
                            cursor: !(d.notes || "").trim() || u.loading ? "default" : "pointer",
                          }}
                        >
                          {u.loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                          {u.loading ? "Organizing\u2026" : "Organize"}
                        </button>
                        {d.organized && (
                          <button onClick={() => patchUi(d.id, { editing: false })} style={{ fontSize: 12, color: "#8A7B5C" }}>
                            Cancel
                          </button>
                        )}
                      </div>
                      {u.error && <p style={{ color: "#B5533C", fontSize: 11.5, marginTop: 6 }}>{u.error}</p>}
                    </div>
                  ) : (
                    <div className="mt-2">
                      {renderOrganized(d.organized)}
                      <button onClick={() => patchUi(d.id, { editing: true })} className="flex items-center gap-1 mt-2.5 opacity-60 hover:opacity-100 transition-opacity" style={{ fontSize: 11.5, color: "#8A7B5C" }}>
                        <Pencil size={11} /> Edit notes
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={addDay} className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity" style={{ fontSize: 12.5, color: PAPER, border: `1px dashed ${MUTED}66`, borderRadius: 8, padding: "8px 14px", width: "100%", justifyContent: "center" }}>
        <Plus size={14} /> Add a day
      </button>
        </>
      )}

      {tab === "notes" && (
        <>
      {NOTE_GROUPS.map((group) => {
        const groupSections = data.sections.filter((s) => (s.region || "rome") === group.id);
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
                        <Field value={section.title} onChange={(v) => updateSectionTitle(section.id, v)} className="fx-fraunces" style={{ fontSize: 15, fontWeight: 600, fontStyle: "italic" }} />
                        <div className="flex items-center gap-1 shrink-0">
                          {section.items.length > 0 && (
                            <span style={{ fontSize: 10, color: "#8A7B5C", fontFamily: "'IBM Plex Mono', monospace" }}>{doneCount}/{section.items.length}</span>
                          )}
                          <button onClick={() => deleteSection(section.id)} title="Delete list" aria-label="Delete list" style={{ opacity: 0.35 }}>
                            <Trash2 size={13} color="#B5533C" />
                          </button>
                        </div>
                      </div>
                      {open && (
                        <>
                      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                        <span style={{ fontSize: 9.5, color: "#8A7B5C", marginRight: 2 }}>Move to:</span>
                        {NOTE_GROUPS.map((g) => {
                          const active = (section.region || "rome") === g.id;
                          return (
                            <button
                              key={g.id}
                              onClick={() => updateSectionRegion(section.id, g.id)}
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
                          <div key={item.id} className="fx-row flex items-center gap-2">
                            <Stamp checked={item.checked} onClick={() => toggleItem(section.id, item.id)} color={BRASS} />
                            <input value={item.text} onChange={(e) => updateItem(section.id, item.id, e.target.value)} placeholder="Add a note" className="flex-1 bg-transparent outline-none text-sm" style={{ color: PAPER_TEXT, textDecoration: item.checked ? "line-through" : "none", opacity: item.checked ? 0.55 : 1 }} />
                            <button onClick={() => deleteItem(section.id, item.id)} className="fx-actions" title="Delete item" aria-label="Delete item">
                              <Trash2 size={12} color="#B5533C" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => addItem(section.id)} className="flex items-center gap-1.5 mt-2 opacity-50 hover:opacity-90 transition-opacity" style={{ fontSize: 11.5, color: "#8A7B5C" }}>
                        <Plus size={12} /> Add item
                      </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button onClick={() => addSection(group.id)} className="flex items-center gap-2 opacity-55 hover:opacity-100 transition-opacity" style={{ fontSize: 12, color: PAPER, border: `1px dashed ${MUTED}55`, borderRadius: 8, padding: "7px 12px" }}>
              <FolderPlus size={13} /> Add a list to {group.label}
            </button>
          </div>
        );
      })}
        </>
      )}

      {tab === "hotels" && (
        <BookingsPanel
          category="hotels" itemNoun="Hotel" whenLabel="Check-in \u2013 check-out" confirmLabel="Confirmation #"
          entries={data.bookings.hotels} onAdd={addBooking} onUpdate={updateBooking} onDelete={deleteBooking}
        />
      )}
      {tab === "restaurants" && (
        <BookingsPanel
          category="restaurants" itemNoun="Restaurant" whenLabel="Date & time" confirmLabel="Reservation #"
          entries={data.bookings.restaurants} onAdd={addBooking} onUpdate={updateBooking} onDelete={deleteBooking}
        />
      )}
      {tab === "experiences" && (
        <BookingsPanel
          category="experiences" itemNoun="Experience" whenLabel="Date & time" confirmLabel="Confirmation #"
          entries={data.bookings.experiences} onAdd={addBooking} onUpdate={updateBooking} onDelete={deleteBooking}
        />
      )}
    </div>
    </div>
  );
}
