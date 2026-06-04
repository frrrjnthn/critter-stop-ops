import { useState, useEffect, useCallback } from "react";

// ── Supabase client (no package needed — direct REST calls) ───────────────────
const SUPABASE_URL = "https://gxshnagrbipphhktijkb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4c2huYWdyYmlwcGhoa3RpamtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MDA2MjIsImV4cCI6MjA5NDI3NjYyMn0.aZtiWP0ok13Dhyq4NWisxJP_806U6GJty-IXJJY-CAI";

const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": "Bearer " + SUPABASE_KEY,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
};

async function sb(table, params = "") {
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + table + params, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function sbPost(table, body) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + table, {
    method: "POST", headers, body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function sbPatch(table, id, body) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?id=eq." + id, {
    method: "PATCH", headers, body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function sbDelete(table, id) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?id=eq." + id, {
    method: "DELETE", headers
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

// ── Supabase Storage helpers ─────────────────────────────────────────────────
const storageHeaders = {
  "apikey": SUPABASE_KEY,
  "Authorization": "Bearer " + SUPABASE_KEY
};

async function sbStorageUpload(bucket, path, file) {
  const res = await fetch(SUPABASE_URL + "/storage/v1/object/" + bucket + "/" + path, {
    method: "POST",
    headers: { ...storageHeaders, "Content-Type": file.type || "application/octet-stream" },
    body: file
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function sbStorageSignedUrl(bucket, path, expiresIn = 3600) {
  const res = await fetch(SUPABASE_URL + "/storage/v1/object/sign/" + bucket + "/" + path, {
    method: "POST",
    headers: { ...storageHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn })
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  // Supabase returns { signedURL: "/object/sign/..." } (some versions use signedUrl)
  const rel = data.signedURL || data.signedUrl;
  if (!rel) throw new Error("No signed URL returned");
  return SUPABASE_URL + "/storage/v1" + rel;
}

async function sbStorageDelete(bucket, path) {
  const res = await fetch(SUPABASE_URL + "/storage/v1/object/" + bucket + "/" + path, {
    method: "DELETE", headers: storageHeaders
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

function formatFileSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function fileIcon(mime) {
  if (!mime) return "📄";
  if (mime.startsWith("image/")) return "🖼";
  if (mime === "application/pdf") return "📕";
  if (mime.includes("word") || mime.includes("document")) return "📘";
  if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv")) return "📗";
  return "📄";
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#0E1117;color:#E8EDF5;font-size:14px}
.app{display:flex;min-height:100vh}
.login{position:fixed;inset:0;background:#0E1117;display:flex;align-items:center;justify-content:center;padding:20px;z-index:100}
.login-card{background:#161B25;border:1px solid #2A3348;border-radius:16px;padding:28px;width:100%;max-width:420px}
.login-logo{display:flex;align-items:center;gap:12px;margin-bottom:22px;justify-content:center}
.login-logo-icon{width:44px;height:44px;background:#22C55E;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px}
.login-logo-text{font-size:18px;font-weight:600;letter-spacing:-.02em}
.login-logo-sub{font-size:10px;color:#8A95A8;font-family:'DM Mono',monospace}
.login-label{font-size:10px;font-weight:600;color:#8A95A8;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px}
.user-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;max-height:380px;overflow-y:auto;margin-bottom:4px}
.user-btn{background:#1E2535;border:1.5px solid #2A3348;border-radius:9px;padding:9px 8px;cursor:pointer;text-align:center;transition:all .15s;font-family:'DM Sans',sans-serif}
.user-btn:hover{border-color:#344060;background:#252D40}
.user-btn.sel{border-color:#22C55E;background:#22C55E15}
.user-btn-name{font-size:12px;font-weight:500;color:#E8EDF5}
.user-btn-role{font-size:10px;color:#8A95A8;margin-top:2px}
.user-btn-role.mgr{color:#22C55E}
.pin-section{text-align:center}
.pin-back{background:none;border:none;color:#8A95A8;font-size:12px;cursor:pointer;margin-bottom:12px;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:4px}
.pin-back:hover{color:#E8EDF5}
.pin-who{font-size:14px;font-weight:500;margin-bottom:3px}
.pin-sub{font-size:11px;color:#8A95A8;margin-bottom:14px}
.pin-dots{display:flex;gap:10px;justify-content:center;margin-bottom:10px}
.pin-dot{width:14px;height:14px;border-radius:50%;border:2px solid #344060;background:transparent;transition:all .15s}
.pin-dot.f{background:#22C55E;border-color:#22C55E}
.pin-dot.e{background:#EF4444;border-color:#EF4444}
.pin-error{color:#EF4444;font-size:11px;min-height:16px;margin-bottom:8px}
.pin-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:10px}
.pin-key{background:#1E2535;border:1px solid #2A3348;border-radius:9px;padding:13px 8px;font-size:18px;font-weight:500;cursor:pointer;text-align:center;transition:all .12s;font-family:'DM Mono',monospace;color:#E8EDF5}
.pin-key:hover{background:#252D40;border-color:#344060}
.pin-key:active{background:#344060}
.pin-hint{font-size:10px;color:#4A5568;text-align:center}
.sidebar{width:220px;min-width:220px;background:#161B25;border-right:1px solid #2A3348;display:flex;flex-direction:column;height:100vh;position:sticky;top:0;overflow-y:auto}
.sb-logo{padding:16px 14px 12px;border-bottom:1px solid #2A3348;display:flex;align-items:center;gap:10px}
.sb-logo-icon{width:30px;height:30px;background:#22C55E;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:15px}
.sb-logo-text{font-size:13px;font-weight:600}
.sb-logo-sub{font-size:10px;color:#8A95A8;font-family:'DM Mono',monospace}
.sb-section{padding:12px 8px 4px}
.sb-section-label{font-size:10px;font-weight:500;color:#4A5568;letter-spacing:.08em;text-transform:uppercase;padding:0 8px;margin-bottom:3px}
.nav-item{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:6px;cursor:pointer;color:#8A95A8;font-size:13px;transition:all .15s;margin-bottom:1px;border:1px solid transparent}
.nav-item:hover{background:#1E2535;color:#E8EDF5}
.nav-item.active{background:#22C55E15;color:#22C55E;border-color:#22C55E25;font-weight:500}
.nav-badge{margin-left:auto;background:#EF4444;color:#fff;font-size:10px;font-weight:600;padding:1px 5px;border-radius:8px;font-family:'DM Mono',monospace}
.nav-badge.amber{background:#F59E0B}
.sb-footer{margin-top:auto;padding:10px 8px;border-top:1px solid #2A3348}
.user-pill{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:6px}
.avatar{width:26px;height:26px;border-radius:50%;background:#A855F7;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:#fff;flex-shrink:0}
.signout-btn{width:100%;background:transparent;border:1px solid #2A3348;border-radius:6px;padding:6px;font-size:12px;color:#8A95A8;cursor:pointer;margin-bottom:8px;font-family:'DM Sans',sans-serif;transition:all .15s}
.signout-btn:hover{border-color:#EF4444;color:#EF4444}
.main{flex:1;overflow-y:auto;padding:24px 28px;max-width:1280px}
.page-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px}
.page-title{font-size:20px;font-weight:600;letter-spacing:-.02em}
.page-sub{font-size:13px;color:#8A95A8;margin-top:3px}
.stat-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:9px;margin-bottom:18px}
.stat-card{background:#161B25;border:1px solid #2A3348;border-radius:9px;padding:13px 15px}
.stat-label{font-size:10px;color:#8A95A8;font-weight:500;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px}
.stat-value{font-size:24px;font-weight:600;font-family:'DM Mono',monospace;letter-spacing:-.02em}
.table-wrap{background:#161B25;border:1px solid #2A3348;border-radius:9px;overflow:hidden;margin-bottom:16px}
.table-head{display:flex;align-items:center;justify-content:space-between;padding:11px 15px;border-bottom:1px solid #2A3348}
.table-title{font-size:13px;font-weight:600}
table{width:100%;border-collapse:collapse}
th{font-size:10px;font-weight:500;color:#8A95A8;text-transform:uppercase;letter-spacing:.06em;padding:8px 14px;text-align:left;border-bottom:1px solid #2A3348;background:#1E2535}
td{padding:9px 14px;font-size:13px;border-bottom:1px solid #2A3348}
tr:last-child td{border-bottom:none}
tr:hover td{background:#1E2535;cursor:pointer}
.badge{display:inline-flex;align-items:center;padding:2px 7px;border-radius:12px;font-size:11px;font-weight:500;font-family:'DM Mono',monospace;white-space:nowrap}
.badge.green{background:#22C55E18;color:#22C55E}
.badge.red{background:#EF444418;color:#EF4444}
.badge.amber{background:#F59E0B18;color:#F59E0B}
.badge.blue{background:#3B82F618;color:#3B82F6}
.badge.purple{background:#A855F718;color:#A855F7}
.badge.gray{background:#2A334820;color:#8A95A8}
.btn{display:inline-flex;align-items:center;gap:5px;padding:6px 13px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;border:none;font-family:'DM Sans',sans-serif;transition:all .15s}
.btn-primary{background:#22C55E;color:#0E1117}
.btn-primary:hover{background:#16A34A}
.btn-ghost{background:transparent;color:#8A95A8;border:1px solid #2A3348}
.btn-ghost:hover{background:#1E2535;color:#E8EDF5}
.btn-red{background:#EF444418;color:#EF4444;border:1px solid #EF444430}
.tabs{display:flex;gap:2px;background:#161B25;border:1px solid #2A3348;border-radius:9px;padding:3px;width:fit-content;margin-bottom:16px;flex-wrap:wrap}
.tab-btn{padding:5px 14px;border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;border:none;background:transparent;color:#8A95A8;font-family:'DM Sans',sans-serif;transition:all .15s}
.tab-btn.active{background:#252D40;color:#E8EDF5}
.alert{background:#EF444410;border:1px solid #EF444428;border-radius:8px;padding:10px 13px;margin-bottom:14px;font-size:13px;color:#EF4444}
.alert.amber{background:#F59E0B10;border-color:#F59E0B28;color:#F59E0B}
.alert.blue{background:#3B82F610;border-color:#3B82F628;color:#3B82F6}
.alert.green{background:#22C55E10;border-color:#22C55E28;color:#22C55E}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px}
.modal{background:#161B25;border:1px solid #344060;border-radius:13px;width:100%;max-width:700px;max-height:90vh;overflow-y:auto}
.modal-sm{max-width:440px}
.modal-top{padding:16px 20px;border-bottom:1px solid #2A3348;display:flex;align-items:center;justify-content:space-between}
.modal-title{font-size:16px;font-weight:600}
.modal-close{background:#1E2535;border:1px solid #2A3348;color:#8A95A8;width:28px;height:28px;border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px}
.modal-close:hover{color:#E8EDF5}
.modal-body{padding:16px 20px}
.form-group{display:flex;flex-direction:column;gap:4px;margin-bottom:12px}
.form-label{font-size:10px;font-weight:500;color:#8A95A8;text-transform:uppercase;letter-spacing:.06em}
.form-input{background:#1E2535;border:1px solid #2A3348;border-radius:6px;padding:8px 10px;color:#E8EDF5;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;width:100%}
.form-input:focus{border-color:#344060}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:11px}
.branch-bar{display:flex;align-items:center;gap:10px;background:#161B25;border:1px solid #2A3348;border-radius:9px;padding:9px 14px;margin-bottom:18px}
.branch-label{font-size:11px;font-weight:500;color:#8A95A8;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap}
.branch-select{background:#1E2535;border:1px solid #344060;border-radius:6px;padding:5px 10px;color:#E8EDF5;font-size:13px;outline:none;cursor:pointer}
.empty-state{text-align:center;padding:40px 20px;color:#8A95A8;font-size:13px}
.loading{text-align:center;padding:40px;color:#8A95A8;font-size:13px}
.mod-card{background:#1E2535;border:1px solid #2A3348;border-radius:8px;padding:13px}
.mod-card-title{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:#8A95A8;margin-bottom:9px;display:flex;align-items:center;gap:5px}
.kv{display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #2A3348;font-size:12px}
.kv:last-child{border-bottom:none}
.kv-key{color:#8A95A8}
.kv-val{font-weight:500;font-family:'DM Mono',monospace;font-size:11px;color:#E8EDF5}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#22C55E;color:#0E1117;padding:10px 20px;border-radius:24px;font-size:13px;font-weight:600;z-index:500;white-space:nowrap;transition:opacity .3s}
.toast.error{background:#EF4444;color:white}
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const BASE_BRANCHES = ["DFW","OKC","ATX","CStat","Office"];
const DEPARTMENTS = ["Pest","Wildlife","Insulation","Project Manager","Office"];

// Parse YYYY-MM-DD date-only strings as LOCAL dates (not UTC).
// Postgres DATE values come over the wire as "YYYY-MM-DD"; if you pass that to
// new Date() it gets parsed as UTC midnight, which shows as the day before in
// US timezones. This helper avoids that.
function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  // If it already contains a time component (e.g. ISO timestamp), let Date handle it
  if (typeof dateStr === "string" && dateStr.length === 10 && dateStr[4] === "-") {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(dateStr);
}

function formatLocalDate(dateStr, opts = { month: "short", day: "numeric", year: "numeric" }) {
  const d = parseLocalDate(dateStr);
  return d ? d.toLocaleDateString("en-US", opts) : "—";
}

// Records a driver change in truck_driver_history. Closes out any open record
// for that truck (sets unassigned_at = now), then if newEmployeeId provided
// opens a new one. Failures are logged but don't block the main op since
// history is secondary to the actual assignment.
async function recordDriverChange(truckId, newEmployeeId, newEmployeeName, actorId, notes) {
  try {
    // Close out the current open assignment for this truck (if any)
    await fetch(SUPABASE_URL + "/rest/v1/truck_driver_history?truck_id=eq." + truckId + "&unassigned_at=is.null", {
      method: "PATCH",
      headers: { ...headers, "Prefer": "return=minimal" },
      body: JSON.stringify({ unassigned_at: new Date().toISOString() })
    });
    // Open a new assignment record if there's a new driver
    if (newEmployeeId) {
      await sbPost("truck_driver_history", {
        truck_id: truckId,
        employee_id: newEmployeeId,
        driver_name: newEmployeeName || null,
        assigned_by: actorId || null,
        notes: notes || null
      });
    }
  } catch (err) {
    // History failure shouldn't block the assignment
    console.warn("Failed to record driver change:", err);
  }
}

// The 6-way branch filter: DFW splits into three by department, others stay as-is
const BRANCH_OPTIONS = [
  { value: "DFW|Pest",       label: "DFW Pest" },
  { value: "DFW|Wildlife",   label: "DFW Wildlife" },
  { value: "DFW|Insulation", label: "DFW Insulation" },
  { value: "OKC",            label: "OKC" },
  { value: "ATX",            label: "ATX" },
  { value: "CStat",          label: "CStat" },
  { value: "Office",         label: "Office" },
];

// Compose "DFW|Pest" style key from a row that has branch + (optional) department
function branchKey(row) {
  if (!row?.branch) return "";
  if (row.branch === "DFW" && row.department) return "DFW|" + row.department;
  return row.branch;
}

// Display label like "DFW · Pest" or just "OKC"
function branchLabel(row) {
  if (!row?.branch) return "—";
  if (row.branch === "DFW" && row.department) return "DFW · " + row.department;
  return row.branch;
}

// Filter helper — match a row against a selected BRANCH_OPTIONS value (or "All")
function matchBranchFilter(row, filter) {
  if (!filter || filter === "All") return true;
  return branchKey(row) === filter;
}

function Badge({ color = "gray", children }) {
  return <span className={"badge " + color}>{children}</span>;
}
function Btn({ variant = "ghost", onClick, children, style, disabled }) {
  return <button className={"btn btn-" + variant} onClick={onClick} style={style} disabled={disabled}>{children}</button>;
}
function BranchBar({ value, onChange, disabled }) {
  return (
    <div className="branch-bar">
      <span className="branch-label">Branch</span>
      <select className="branch-select" value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
        <option value="All">All branches</option>
        {BRANCH_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
      </select>
    </div>
  );
}
function statusColor(s) {
  return s === "active" ? "green" : s === "onboarding" ? "blue" : s === "inactive" ? "red" : "gray";
}
function accessColor(a) {
  return a === "super_admin" ? "purple" : a === "manager" ? "green" : a === "lead" ? "blue" : "gray";
}
function accessLabel(a) {
  return a === "super_admin" ? "Super Admin" : a === "manager" ? "Manager" : a === "lead" ? "Lead" : "Employee";
}
function deptColor(d) {
  return d === "Pest" ? "amber" : d === "Wildlife" ? "green" : d === "Insulation" ? "blue"
       : d === "Project Manager" ? "purple" : d === "Office" ? "gray" : "gray";
}

// ── Sorting ──────────────────────────────────────────────────────────────────
// useSortableData: pass rows + a default sort. Returns { rows, sortKey, sortDir, requestSort }.
// `accessor` can be a string key or a function row -> value.
function useSortableData(rows, defaultKey, defaultDir = "asc") {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState(defaultDir);
  const [accessors, setAccessors] = useState({}); // optional override map

  function requestSort(key, accessor) {
    if (accessor) setAccessors(prev => ({ ...prev, [key]: accessor }));
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sortedRows = (() => {
    if (!sortKey) return rows;
    const acc = accessors[sortKey] || ((r) => r?.[sortKey]);
    const out = [...rows].sort((a, b) => {
      const av = acc(a);
      const bv = acc(b);
      // null/undefined go to the bottom regardless of direction
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).toLowerCase().localeCompare(String(bv).toLowerCase());
    });
    return sortDir === "desc" ? out.reverse() : out;
  })();

  return { rows: sortedRows, sortKey, sortDir, requestSort };
}

function SortableTh({ sortState, sortKey, accessor, children, style }) {
  const active = sortState.sortKey === sortKey;
  const arrow = !active ? "↕" : sortState.sortDir === "asc" ? "↑" : "↓";
  return (
    <th
      onClick={() => sortState.requestSort(sortKey, accessor)}
      style={{cursor:"pointer",userSelect:"none",...(style||{})}}
      title="Click to sort"
    >
      <span style={{display:"inline-flex",alignItems:"center",gap:5}}>
        {children}
        <span style={{fontSize:9,color:active?"#22C55E":"#4A5568",fontWeight:active?700:400}}>{arrow}</span>
      </span>
    </th>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, []);
  return <div className={"toast" + (type === "error" ? " error" : "")}>{msg}</div>;
}

// ── Login ─────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    sb("employees", "?select=id,name,pin_hash,branch,access_level,status&status=neq.inactive&order=name")
      .then(data => { setEmployees(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = employees.filter(e =>
    !search || e.name.toLowerCase().includes(search.toLowerCase())
  );

  function selectUser(e) { setSelected(e); setPin(""); setError(""); }

  function pressKey(d) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === selected.pin_hash) {
          onLogin(selected);
        } else {
          setShake(true);
          setError("Incorrect PIN. Try again.");
          setTimeout(() => { setPin(""); setShake(false); }, 900);
        }
      }, 120);
    }
  }

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🦎</div>
          <div>
            <div className="login-logo-text">Critter Stop</div>
            <div className="login-logo-sub">OPS PLATFORM</div>
          </div>
        </div>
        {!selected ? (
          <>
            <div className="login-label">Who are you?</div>
            <div style={{marginBottom:10}}>
              <input className="form-input" placeholder="Search name..." value={search}
                onChange={e => setSearch(e.target.value)} style={{marginBottom:0}} />
            </div>
            {loading ? <div className="loading">Loading employees...</div> : (
              <div className="user-grid">
                {filtered.map(u => (
                  <div key={u.id} className={"user-btn"+(selected?.id===u.id?" sel":"")} onClick={() => selectUser(u)}>
                    <div className="user-btn-name">{u.name}</div>
                    <div className={"user-btn-role"+(u.access_level!=="employee"?" mgr":"")}>
                      {u.access_level !== "employee" ? "⚙ " + accessLabel(u.access_level) : u.branch}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="pin-section">
            <button className="pin-back" onClick={() => { setSelected(null); setPin(""); setError(""); }}>← Back</button>
            <div className="pin-who">Hi, {selected.name.split(" ")[0]}!</div>
            <div className="pin-sub">{accessLabel(selected.access_level)} · {selected.branch}</div>
            <div className="pin-dots">
              {[0,1,2,3].map(i => (
                <div key={i} className={"pin-dot"+(i < pin.length ? (shake ? " e" : " f") : "")} />
              ))}
            </div>
            <div className="pin-error">{error}</div>
            <div className="pin-pad">
              {["1","2","3","4","5","6","7","8","9"].map(d => (
                <div key={d} className="pin-key" onClick={() => pressKey(d)}>{d}</div>
              ))}
              <div className="pin-key" style={{fontSize:12,color:"#8A95A8"}} onClick={() => { setPin(""); setError(""); }}>Clear</div>
              <div className="pin-key" onClick={() => pressKey("0")}>0</div>
              <div className="pin-key" style={{fontSize:15,color:"#8A95A8"}} onClick={() => setPin(p => p.slice(0,-1))}>⌫</div>
            </div>
            <div className="pin-hint">Default PIN: 0000</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ user, employees, trucks, inventory, shops }) {
  const totalEmp = employees.length;
  const onboarding = employees.filter(e => e.status === "onboarding").length;
  const oilIssues = trucks.filter(t => t.next_oil_miles && t.mileage >= t.next_oil_miles - 500).length;
  const regIssues = trucks.filter(t => {
    if (!t.reg_expires) return false;
    return parseLocalDate(t.reg_expires) < new Date();
  }).length;

  // Items needing reorder: inventory rows where quantity <= reorder_threshold (and threshold is set)
  const reorderRows = (inventory || []).filter(r => r.reorder_threshold != null && r.quantity <= r.reorder_threshold);
  const reorderByLocation = {}; // location_id → count
  for (const r of reorderRows) {
    reorderByLocation[r.location_id] = (reorderByLocation[r.location_id] || 0) + 1;
  }

  // Build map of shop_id → branchKey for grouping
  const shopBranchKey = {};
  for (const s of (shops || [])) {
    shopBranchKey[s.id] = s.department ? `${s.branch}|${s.department}` : s.branch;
  }

  function reorderCountForBranch(branchValue) {
    // branchValue is a BRANCH_OPTIONS key like "DFW|Pest" or "OKC"
    let total = 0;
    // Sum reorders for all shops belonging to this branch+dept combo
    for (const [shopId, key] of Object.entries(shopBranchKey)) {
      if (key === branchValue) total += (reorderByLocation[shopId] || 0);
    }
    // Plus trucks belonging to that branch+dept
    const matchingTrucks = trucks.filter(t => branchKey(t) === branchValue);
    for (const t of matchingTrucks) total += (reorderByLocation[t.id] || 0);
    return total;
  }

  function reorderCountForDept(dept) {
    // Sum reorders for shops + trucks where department matches
    let total = 0;
    for (const s of (shops || [])) {
      if (s.department === dept) total += (reorderByLocation[s.id] || 0);
    }
    const matchingTrucks = trucks.filter(t => t.department === dept);
    for (const t of matchingTrucks) total += (reorderByLocation[t.id] || 0);
    return total;
  }

  return (
    <div>
      <div className="stat-row">
        {[
          { label:"Total employees", value: totalEmp, color:"#E8EDF5" },
          { label:"Onboarding", value: onboarding, color:"#3B82F6" },
          { label:"Total trucks", value: trucks.length, color:"#E8EDF5" },
          { label:"Oil service due", value: oilIssues, color: oilIssues > 0 ? "#EF4444" : "#22C55E" },
          { label:"Reg expired", value: regIssues, color: regIssues > 0 ? "#F59E0B" : "#22C55E" },
          { label:"Items to reorder", value: reorderRows.length, color: reorderRows.length > 0 ? "#F59E0B" : "#22C55E" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{color: s.color}}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <div className="table-wrap" style={{marginBottom:0}}>
          <div className="table-head"><span className="table-title">Branch overview</span></div>
          <table>
            <thead><tr><th>Branch</th><th>Employees</th><th>Trucks</th><th>To reorder</th></tr></thead>
            <tbody>
              {BRANCH_OPTIONS.map(opt => {
                // Match employees + trucks by branchKey (handles DFW|Pest etc.)
                const bEmp = employees.filter(e => branchKey(e) === opt.value);
                const bTruck = trucks.filter(t => branchKey(t) === opt.value);
                const reorderCount = reorderCountForBranch(opt.value);
                return (
                  <tr key={opt.value}>
                    <td><strong>{opt.label}</strong></td>
                    <td>{bEmp.length}</td>
                    <td>{bTruck.length}</td>
                    <td>{reorderCount > 0 ? <Badge color="amber">{reorderCount}</Badge> : <Badge color="green">Clear</Badge>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="table-wrap" style={{marginBottom:0}}>
          <div className="table-head"><span className="table-title">Department overview</span></div>
          <table>
            <thead><tr><th>Department</th><th>Employees</th><th>Trucks</th><th>To reorder</th></tr></thead>
            <tbody>
              {DEPARTMENTS.map(d => {
                const dEmp = employees.filter(e => e.department === d);
                const dTruck = trucks.filter(t => t.department === d);
                const reorderCount = reorderCountForDept(d);
                return (
                  <tr key={d}>
                    <td><Badge color={deptColor(d)}>{d}</Badge></td>
                    <td>{dEmp.length}</td>
                    <td>{dTruck.length}</td>
                    <td>{reorderCount > 0 ? <Badge color="amber">{reorderCount}</Badge> : <Badge color="green">Clear</Badge>}</td>
                  </tr>
                );
              })}
              <tr>
                <td style={{color:"#8A95A8"}}>No department</td>
                <td>{employees.filter(e => !e.department).length}</td>
                <td>{trucks.filter(t => !t.department).length}</td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── People ────────────────────────────────────────────────────────────────────
function People({ user, employees, setEmployees, onProfile, showToast }) {
  const [branch, setBranch] = useState(user.access_level === "super_admin" || user.access_level === "manager" ? "All" : user.branch);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [addOpen, setAddOpen] = useState(false);

  async function reload() {
    try {
      const e = await sb("employees", "?select=*&order=name");
      setEmployees(e);
    } catch (err) { showToast("Error refreshing: " + (err.message || err), "error"); }
  }

  const list = employees.filter(e =>
    (branch === "All" || e.branch === branch) &&
    (statusFilter === "All" || e.status === statusFilter) &&
    (!q || e.name.toLowerCase().includes(q.toLowerCase()))
  );
  const sort = useSortableData(list, "name");

  return (
    <div>
      <BranchBar value={branch} onChange={setBranch} disabled={user.access_level === "employee"} />
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:8,background:"#1E2535",border:"1px solid #2A3348",borderRadius:6,padding:"6px 11px",minWidth:200}}>
          <span style={{color:"#4A5568"}}>⌕</span>
          <input style={{background:"none",border:"none",outline:"none",color:"#E8EDF5",fontSize:13,flex:1,fontFamily:"DM Sans,sans-serif"}}
            placeholder="Search name..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className="branch-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="All">All statuses</option>
          <option value="active">Active</option>
          <option value="onboarding">Onboarding</option>
          <option value="inactive">Inactive</option>
        </select>
        {(user.access_level === "super_admin" || user.access_level === "manager") && (
          <Btn variant="primary" onClick={() => setAddOpen(true)}>+ Add employee</Btn>
        )}
      </div>
      <div className="table-wrap">
        <div className="table-head">
          <span className="table-title">Employees ({list.length})</span>
        </div>
        <table>
          <thead><tr>
            <SortableTh sortState={sort} sortKey="name">Name</SortableTh>
            <SortableTh sortState={sort} sortKey="branch">Branch</SortableTh>
            <SortableTh sortState={sort} sortKey="start_date">Start date</SortableTh>
            <SortableTh sortState={sort} sortKey="access_level">Access</SortableTh>
            <SortableTh sortState={sort} sortKey="status">Status</SortableTh>
          </tr></thead>
          <tbody>
            {sort.rows.length === 0 ? (
              <tr><td colSpan={5}><div className="empty-state">No employees found</div></td></tr>
            ) : sort.rows.map(e => (
              <tr key={e.id} onClick={() => onProfile(e)}>
                <td><strong>{e.name}</strong></td>
                <td>{e.branch}</td>
                <td style={{color:"#8A95A8",fontSize:12}}>{formatLocalDate(e.start_date)}</td>
                <td><Badge color={accessColor(e.access_level)}>{accessLabel(e.access_level)}</Badge></td>
                <td><Badge color={statusColor(e.status)}>{e.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {addOpen && <AddEmployeeModal onClose={() => setAddOpen(false)} onSaved={reload} showToast={showToast} />}
    </div>
  );
}

// ── HR Tables (sortable) ─────────────────────────────────────────────────────
function HROnboardingTable({ list, onProfile, onAdd }) {
  const sort = useSortableData(list, "name");
  return (
    <div className="table-wrap">
      <div className="table-head"><span className="table-title">Active onboarding ({list.length})</span><Btn variant="primary" onClick={onAdd}>+ Add employee</Btn></div>
      <table>
        <thead><tr>
          <SortableTh sortState={sort} sortKey="name">Employee</SortableTh>
          <SortableTh sortState={sort} sortKey="branch">Branch</SortableTh>
          <SortableTh sortState={sort} sortKey="start_date">Start date</SortableTh>
          <SortableTh sortState={sort} sortKey="access_level">Access level</SortableTh>
          <SortableTh sortState={sort} sortKey="status">Status</SortableTh>
        </tr></thead>
        <tbody>
          {sort.rows.length === 0 ? (
            <tr><td colSpan={5}><div className="empty-state">✓ No active onboarding for this branch</div></td></tr>
          ) : sort.rows.map(e => (
            <tr key={e.id} onClick={() => onProfile(e)}>
              <td><strong>{e.name}</strong></td><td>{e.branch}</td>
              <td>{formatLocalDate(e.start_date)}</td>
              <td><Badge color={accessColor(e.access_level)}>{accessLabel(e.access_level)}</Badge></td>
              <td><Badge color="blue">Onboarding</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HRAllEmployeesTable({ list, onProfile }) {
  const sort = useSortableData(list, "name");
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>
          <SortableTh sortState={sort} sortKey="name">Employee</SortableTh>
          <SortableTh sortState={sort} sortKey="branch">Branch</SortableTh>
          <SortableTh sortState={sort} sortKey="start_date">Start date</SortableTh>
          <SortableTh sortState={sort} sortKey="access_level">Access</SortableTh>
          <SortableTh sortState={sort} sortKey="status">Status</SortableTh>
        </tr></thead>
        <tbody>
          {sort.rows.map(e => (
            <tr key={e.id} onClick={() => onProfile(e)}>
              <td><strong>{e.name}</strong></td><td>{e.branch}</td>
              <td style={{color:"#8A95A8",fontSize:12}}>{formatLocalDate(e.start_date)}</td>
              <td><Badge color={accessColor(e.access_level)}>{accessLabel(e.access_level)}</Badge></td>
              <td><Badge color={statusColor(e.status)}>{e.status}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── HR ────────────────────────────────────────────────────────────────────────
function HR({ user, employees, setEmployees, onProfile, showToast }) {
  const [branch, setBranch] = useState(user.branch === "All" ? "All" : user.branch);
  const [tab, setTab] = useState("onboarding");
  const [addOpen, setAddOpen] = useState(false);
  const list = employees.filter(e => branch === "All" || e.branch === branch);
  const onboarding = list.filter(e => e.status === "onboarding");

  async function reload() {
    try {
      const e = await sb("employees", "?select=*&order=name");
      setEmployees(e);
    } catch (err) { showToast("Error refreshing: " + (err.message || err), "error"); }
  }

  return (
    <div>
      <BranchBar value={branch} onChange={setBranch} disabled={user.access_level === "employee"} />
      <div className="stat-row">
        {[
          {label:"Employees",value:list.length,color:"#E8EDF5"},
          {label:"Onboarding",value:onboarding.length,color:"#3B82F6"},
          {label:"Active",value:list.filter(e=>e.status==="active").length,color:"#22C55E"},
          {label:"Inactive",value:list.filter(e=>e.status==="inactive").length,color:"#8A95A8"},
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="tabs">
        {[["onboarding","Onboarding"],["all","All employees"],["documents","Documents"]].map(([t,l]) => (
          <button key={t} className={"tab-btn"+(tab===t?" active":"")} onClick={()=>setTab(t)}>{l}</button>
        ))}
      </div>
      {tab === "onboarding" && (
        <HROnboardingTable list={onboarding} onProfile={onProfile} onAdd={() => setAddOpen(true)} />
      )}
      {tab === "all" && (
        <HRAllEmployeesTable list={list} onProfile={onProfile} />
      )}
      {tab === "documents" && (
        <div className="alert blue">📄 Document storage is configured in Supabase Storage. Click any employee profile to upload documents for that person.</div>
      )}
      {addOpen && <AddEmployeeModal onClose={() => setAddOpen(false)} onSaved={reload} showToast={showToast} />}
    </div>
  );
}

// ── Callout Modal ─────────────────────────────────────────────────────────────
function CalloutModal({ form, setForm, isManager, user, employees, branch, onClose, onSubmit }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm">
        <div className="modal-top">
          <div>
            <div className="modal-title">Log a call-out</div>
            <div style={{fontSize:12,color:"#8A95A8",marginTop:3}}>
              For payroll tracking. This is logged by a manager, not the employee.
            </div>
          </div>
          <div className="modal-close" onClick={onClose}>✕</div>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Employee</label>
            <select className="form-input" value={form.employee_id}
              onChange={e => setForm(f => ({...f, employee_id: e.target.value}))}>
              <option value="">Select employee...</option>
              {(isManager ? employees.filter(e => branch === "All" || e.branch === branch) : [user])
                .sort((a,b) => a.name.localeCompare(b.name))
                .map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.branch})</option>
                ))}
            </select>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={form.start_date}
                onChange={e => setForm(f => ({...f, start_date: e.target.value}))} />
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Type</label>
              <select className="form-input" value={form.callout_type}
                onChange={e => setForm(f => ({...f, callout_type: e.target.value}))}>
                <option value="sick">Sick</option>
                <option value="personal">Personal</option>
                <option value="family">Family emergency</option>
                <option value="no_show">No-show</option>
                <option value="late">Late</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reason / notes</label>
            <textarea className="form-input" rows={3} value={form.reason}
              onChange={e => setForm(f => ({...f, reason: e.target.value}))}
              placeholder="What did they say? Any context for payroll." />
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            <label style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#1E2535",border:"1px solid #2A3348",borderRadius:6,cursor:"pointer",fontSize:13}}>
              <input type="checkbox" checked={form.paid}
                onChange={e => setForm(f => ({...f, paid: e.target.checked}))} />
              Paid? (counts as paid time off vs unpaid)
            </label>
            <label style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#1E2535",border:"1px solid #2A3348",borderRadius:6,cursor:"pointer",fontSize:13}}>
              <input type="checkbox" checked={form.coverage_found}
                onChange={e => setForm(f => ({...f, coverage_found: e.target.checked}))} />
              Coverage was found
            </label>
            <label style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#1E2535",border:"1px solid #2A3348",borderRadius:6,cursor:"pointer",fontSize:13}}>
              <input type="checkbox" checked={form.called_in_on_time}
                onChange={e => setForm(f => ({...f, called_in_on_time: e.target.checked}))} />
              Called in on time (uncheck for late call-in)
            </label>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn style={{flex:1}} onClick={onClose}>Cancel</Btn>
            <Btn variant="primary" style={{flex:1}} onClick={onSubmit}>Save call-out</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Time Off ──────────────────────────────────────────────────────────────────
function TimeOff({ user, employees, showToast }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("requests");
  const [branch, setBranch] = useState(user.branch === "All" ? "All" : user.branch);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee_id:"", type:"pto_request", start_date:"", end_date:"", reason:"", notes:"", callout_type:"sick", paid:false, coverage_found:false, called_in_on_time:true });

  const isManager = ["super_admin","manager","lead"].includes(user.access_level);

  useEffect(() => {
    sb("time_off", "?select=*,employee:employees(name,branch)&order=created_at.desc")
      .then(data => { setRequests(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function submitRequest() {
    if (!form.employee_id || !form.start_date) { showToast("Please fill required fields", "error"); return; }
    try {
      // For callouts: end_date defaults to start_date if blank (single-day callout)
      const payload = {
        employee_id: form.employee_id,
        type: form.type,
        start_date: form.start_date,
        end_date: form.end_date || form.start_date,
        reason: form.reason,
        notes: form.notes,
        status: "pending"
      };
      // Attach callout-specific fields if it's a callout
      if (form.type === "callout") {
        payload.callout_type = form.callout_type;
        payload.paid = form.paid;
        payload.coverage_found = form.coverage_found;
        payload.called_in_on_time = form.called_in_on_time;
        payload.status = "logged"; // callouts don't need approval
      }
      const newReq = await sbPost("time_off", payload);
      const emp = employees.find(e => e.id === form.employee_id);
      setRequests(prev => [{ ...newReq[0], employee: emp }, ...prev]);
      setShowForm(false);
      setForm({ employee_id:"", type:"pto_request", start_date:"", end_date:"", reason:"", notes:"", callout_type:"sick", paid:false, coverage_found:false, called_in_on_time:true });
      showToast(form.type === "callout" ? "Call-out logged" : "Request submitted");
    } catch (err) { showToast("Error: " + (err.message || err), "error"); }
  }

  async function updateStatus(id, status) {
    try {
      const payload = { status };
      if (status === "approved" || status === "denied") payload.approved_by = user.id;
      await sbPatch("time_off", id, payload);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      const msgs = { approved: "Request approved", denied: "Request denied", cancelled: "Request cancelled", pending: "Request reopened" };
      showToast(msgs[status] || "Status updated");
    } catch (err) { showToast("Error updating request: " + (err.message || err), "error"); }
  }

  async function cancelRequest(r) {
    if (!window.confirm(`Cancel ${r.employee?.name || "this"}'s ${r.type === "callout" ? "callout" : "time off"} request${r.start_date ? " for " + r.start_date : ""}?`)) return;
    return updateStatus(r.id, "cancelled");
  }

  const filtered = requests.filter(r => {
    if (!matchBranchFilter(r.employee, branch)) return false;
    if (!isManager && r.employee_id !== user.id) return false;
    return true;
  });

  const pending = filtered.filter(r => r.status === "pending");
  const callouts = filtered.filter(r => r.type === "callout");
  // Sort hooks — run on every render to keep order consistent
  const sortPending = useSortableData(pending, "start_date", "desc");
  const sortAllReq  = useSortableData(filtered, "start_date", "desc");
  const sortCallout = useSortableData(callouts, "start_date", "desc");

  return (
    <div>
      {isManager && <BranchBar value={branch} onChange={setBranch} />}
      <div className="tabs">
        {([["requests","Requests"],["callouts","Callout log"],["calendar","Calendar"]]
            .concat(isManager ? [["overtime","Overtime"]] : [])
         ).map(([t,l]) => (
          <button key={t} className={"tab-btn"+(tab===t?" active":"")} onClick={()=>setTab(t)}>{l}</button>
        ))}
      </div>

      {tab === "requests" && (
        <div>
          {pending.length > 0 && <div className="alert amber">⏳ {pending.length} request{pending.length>1?"s":""} pending approval</div>}
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
            <Btn variant="primary" onClick={() => setShowForm(true)}>+ Request time off</Btn>
          </div>
          {loading ? <div className="loading">Loading...</div> : (
            <>
              {pending.length > 0 && (
                <div className="table-wrap" style={{marginBottom:16}}>
                  <div className="table-head"><span className="table-title">Pending approval</span></div>
                  <table>
                    <thead><tr>
                      <SortableTh sortState={sortPending} sortKey="employee_name" accessor={r => r.employee?.name || ""}>Employee</SortableTh>
                      <SortableTh sortState={sortPending} sortKey="branch" accessor={r => r.employee?.branch || ""}>Branch</SortableTh>
                      <SortableTh sortState={sortPending} sortKey="start_date">Dates</SortableTh>
                      <SortableTh sortState={sortPending} sortKey="reason">Reason</SortableTh>
                      <SortableTh sortState={sortPending} sortKey="type">Type</SortableTh>
                      {isManager && <th>Action</th>}
                    </tr></thead>
                    <tbody>
                      {sortPending.rows.map(r => {
                        const isMine = r.employee_id === user.id;
                        const canCancel = isManager || isMine;
                        return (
                        <tr key={r.id}>
                          <td><strong>{r.employee?.name || "Unknown"}</strong></td>
                          <td>{r.employee?.branch}</td>
                          <td>{formatLocalDate(r.start_date)}{r.end_date && r.end_date !== r.start_date ? " → " + formatLocalDate(r.end_date) : ""}</td>
                          <td>{r.reason || "—"}</td>
                          <td><Badge color={r.type==="callout"?"red":"blue"}>{r.type==="callout"?"Callout":"Time Off"}</Badge></td>
                          {isManager && (
                            <td>
                              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                                <Btn variant="primary" style={{padding:"3px 9px",fontSize:11}} onClick={() => updateStatus(r.id,"approved")}>✓ Approve</Btn>
                                <Btn variant="red" style={{padding:"3px 9px",fontSize:11}} onClick={() => updateStatus(r.id,"denied")}>✕ Deny</Btn>
                                {canCancel && <Btn style={{padding:"3px 9px",fontSize:11}} onClick={() => cancelRequest(r)}>Cancel</Btn>}
                              </div>
                            </td>
                          )}
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="table-wrap">
                <div className="table-head"><span className="table-title">All requests</span></div>
                <table>
                  <thead><tr>
                    <SortableTh sortState={sortAllReq} sortKey="employee_name" accessor={r => r.employee?.name || ""}>Employee</SortableTh>
                    <SortableTh sortState={sortAllReq} sortKey="branch" accessor={r => r.employee?.branch || ""}>Branch</SortableTh>
                    <SortableTh sortState={sortAllReq} sortKey="start_date">Dates</SortableTh>
                    <SortableTh sortState={sortAllReq} sortKey="reason">Reason</SortableTh>
                    <SortableTh sortState={sortAllReq} sortKey="status">Status</SortableTh>
                    <SortableTh sortState={sortAllReq} sortKey="type">Type</SortableTh>
                    <th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {sortAllReq.rows.length === 0 ? (
                      <tr><td colSpan={7}><div className="empty-state">No requests yet</div></td></tr>
                    ) : sortAllReq.rows.map(r => {
                      const isMine = r.employee_id === user.id;
                      const canCancel = (isManager || isMine) && r.status !== "cancelled" && r.status !== "denied";
                      return (
                      <tr key={r.id}>
                        <td><strong>{r.employee?.name || "Unknown"}</strong></td>
                        <td>{r.employee?.branch}</td>
                        <td style={{fontSize:12,color:"#8A95A8"}}>{formatLocalDate(r.start_date)}{r.end_date && r.end_date !== r.start_date ? " → " + formatLocalDate(r.end_date) : ""}</td>
                        <td>{r.reason || "—"}</td>
                        <td><Badge color={r.status==="approved"?"green":r.status==="denied"?"red":r.status==="cancelled"?"gray":"amber"}>{r.status}</Badge></td>
                        <td><Badge color={r.type==="callout"?"red":"blue"}>{r.type==="callout"?"Callout":"Time Off"}</Badge></td>
                        <td>
                          {canCancel && <Btn style={{padding:"3px 9px",fontSize:11}} onClick={() => cancelRequest(r)}>Cancel</Btn>}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {showForm && form.type === "callout" && (
        <CalloutModal
          form={form}
          setForm={setForm}
          isManager={isManager}
          user={user}
          employees={employees}
          branch={branch}
          onClose={() => setShowForm(false)}
          onSubmit={submitRequest}
        />
      )}
      {showForm && form.type !== "callout" && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal modal-sm">
            <div className="modal-top">
              <div className="modal-title">Request time off</div>
              <div className="modal-close" onClick={() => setShowForm(false)}>✕</div>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Employee</label>
                <select className="form-input" value={form.employee_id} onChange={e => setForm(f => ({...f, employee_id: e.target.value}))}>
                  <option value="">Select employee...</option>
                  {(isManager ? employees.filter(e => branch === "All" || e.branch === branch) : [user]).map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start date</label>
                  <input type="date" className="form-input" value={form.start_date} onChange={e => setForm(f => ({...f, start_date: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">End date</label>
                  <input type="date" className="form-input" value={form.end_date} onChange={e => setForm(f => ({...f, end_date: e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <input type="text" className="form-input" placeholder="Vacation, medical, personal..." value={form.reason} onChange={e => setForm(f => ({...f, reason: e.target.value}))} />
              </div>
              <div style={{display:"flex",gap:8}}>
                <Btn style={{flex:1}} onClick={() => setShowForm(false)}>Cancel</Btn>
                <Btn variant="primary" style={{flex:1}} onClick={submitRequest}>Submit</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "callouts" && (
        <div className="table-wrap">
          <div className="table-head">
            <span className="table-title">Callout log ({callouts.length})</span>
            <Btn variant="primary" onClick={() => { setForm(f => ({...f, type:"callout"})); setShowForm(true); }}>+ Log callout</Btn>
          </div>
          <table>
            <thead><tr>
              <SortableTh sortState={sortCallout} sortKey="employee_name" accessor={r => r.employee?.name || ""}>Employee</SortableTh>
              <SortableTh sortState={sortCallout} sortKey="branch" accessor={r => r.employee?.branch || ""}>Branch</SortableTh>
              <SortableTh sortState={sortCallout} sortKey="start_date">Date</SortableTh>
              <SortableTh sortState={sortCallout} sortKey="reason">Reason</SortableTh>
              <SortableTh sortState={sortCallout} sortKey="notice_given">Notice</SortableTh>
              <SortableTh sortState={sortCallout} sortKey="status">Status</SortableTh>
            </tr></thead>
            <tbody>
              {sortCallout.rows.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state">No callouts logged yet</div></td></tr>
              ) : sortCallout.rows.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.employee?.name}</strong></td>
                  <td>{r.employee?.branch}</td>
                  <td style={{fontSize:12,color:"#8A95A8"}}>{r.start_date}</td>
                  <td>{r.reason || "—"}</td>
                  <td><Badge color={r.notice_given==="no_notice"?"red":r.notice_given==="same_day"?"amber":"green"}>{r.notice_given?.replace("_"," ") || "—"}</Badge></td>
                  <td><Badge color={r.status==="approved"?"green":r.status==="denied"?"red":"amber"}>{r.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "calendar" && (() => {
        const today = new Date();
        const cyear = today.getFullYear();
        const cmonth = today.getMonth(); // 0-indexed
        const firstDay = new Date(cyear, cmonth, 1);
        const lastDay = new Date(cyear, cmonth + 1, 0);
        const startWeekday = firstDay.getDay(); // 0 = Sun
        const daysInMonth = lastDay.getDate();
        // Build cells: blank leading + each day
        const cells = [...Array(startWeekday).fill(null), ...Array.from({length: daysInMonth}, (_,i) => i+1)];
        // Helper: parse date-only string as local-noon to avoid timezone shifts
        function parseLocalDate(dateStr) {
          if (!dateStr) return null;
          // dateStr is YYYY-MM-DD; parse explicitly as local
          const [y, m, d] = dateStr.split("-").map(Number);
          return new Date(y, m - 1, d); // local midnight
        }
        // For a given day-of-month, find approved requests whose date range covers it
        function reqsForDay(day) {
          const target = new Date(cyear, cmonth, day);
          return filtered.filter(r => {
            if (r.status !== "approved" && r.status !== "logged") return false;
            const start = parseLocalDate(r.start_date);
            const end = parseLocalDate(r.end_date || r.start_date);
            if (!start || !end) return false;
            return target >= start && target <= end;
          });
        }
        const monthLabel = today.toLocaleDateString("en-US",{month:"long",year:"numeric"});
        return (
          <div>
            <div className="alert blue">📅 Calendar view — {monthLabel} · approved time off and callouts for {branch === "All" ? "all branches" : branch}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                <div key={d} style={{textAlign:"center",fontSize:10,color:"#4A5568",padding:"4px 0",fontWeight:500}}>{d}</div>
              ))}
              {cells.map((d, i) => {
                const dayReqs = d ? reqsForDay(d) : [];
                const isToday = d && d === today.getDate();
                return (
                  <div key={i} style={{
                    minHeight:60,
                    background: isToday ? "#22C55E18" : "#1E2535",
                    border: "1px solid " + (isToday ? "#22C55E" : "#2A3348"),
                    borderRadius:6, padding:5, opacity: d ? 1 : .25
                  }}>
                    <div style={{fontSize:11,fontWeight:isToday?700:500,color: isToday ? "#22C55E" : "#8A95A8",marginBottom:3}}>{d}</div>
                    {dayReqs.map((r,j) => (
                      <div key={j} style={{fontSize:10,padding:"2px 5px",borderRadius:4,background:r.type==="callout"?"#EF444418":"#3B82F618",color:r.type==="callout"?"#EF4444":"#3B82F6",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {r.employee?.name?.split(" ")[0]}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {tab === "overtime" && isManager && (
        <OvertimeTab user={user} employees={employees} branch={branch} showToast={showToast} />
      )}
    </div>
  );
}

// ── Overtime tab (inside TimeOff) ────────────────────────────────────────────
function OvertimeTab({ user, employees, branch, showToast }) {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [empFilter, setEmpFilter] = useState("All");
  const [periodStart, setPeriodStart] = useState(() => {
    // Default to first day of current month
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0,10);
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0,10);
  });

  async function load() {
    setLoading(true);
    try {
      const data = await sb("shifts",
        `?select=*,employee:employees(name,branch,department)&shift_date=gte.${periodStart}&shift_date=lte.${periodEnd}&order=shift_date.desc`);
      setShifts(data);
    } catch (err) { showToast("Error loading shifts: " + (err.message || err), "error"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [periodStart, periodEnd]); // eslint-disable-line

  async function removeShift(s) {
    if (!window.confirm(`Delete this shift entry (${s.employee?.name || "?"}, ${s.shift_date}, ${s.hours}h)?`)) return;
    try {
      await sbDelete("shifts", s.id);
      showToast("Shift removed");
      load();
    } catch (err) { showToast("Error: " + (err.message || err), "error"); }
  }

  // Filter by branch + employee
  const filtered = shifts.filter(s =>
    matchBranchFilter(s.employee, branch) &&
    (empFilter === "All" || s.employee_id === empFilter)
  );

  // Aggregate per employee: total hours, regular hours (≤40/wk), overtime hours (>40/wk)
  // Group by employee, then by ISO week (year + week number)
  function isoWeekKey(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    // Move to nearest Thursday (ISO week trick)
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2,"0")}`;
  }

  const perEmployee = {};
  for (const s of filtered) {
    const eid = s.employee_id;
    if (!perEmployee[eid]) {
      perEmployee[eid] = { name: s.employee?.name || "—", branch: s.employee?.branch, dept: s.employee?.department, total: 0, regular: 0, ot: 0, weeks: {} };
    }
    perEmployee[eid].total += parseFloat(s.hours) || 0;
    const wk = isoWeekKey(s.shift_date);
    perEmployee[eid].weeks[wk] = (perEmployee[eid].weeks[wk] || 0) + (parseFloat(s.hours) || 0);
  }
  // Compute regular vs OT per week
  for (const eid of Object.keys(perEmployee)) {
    const emp = perEmployee[eid];
    for (const wk of Object.keys(emp.weeks)) {
      const wkHours = emp.weeks[wk];
      emp.regular += Math.min(wkHours, 40);
      emp.ot      += Math.max(wkHours - 40, 0);
    }
  }
  const employeeRows = Object.entries(perEmployee)
    .map(([eid, e]) => ({ eid, ...e }))
    .sort((a,b) => b.total - a.total);

  const totalAllHours = employeeRows.reduce((sum, e) => sum + e.total, 0);
  const totalAllOT    = employeeRows.reduce((sum, e) => sum + e.ot, 0);

  // Sort hooks
  const sortEmpSummary = useSortableData(employeeRows, "total", "desc");
  const sortShifts     = useSortableData(filtered, "shift_date", "desc");

  return (
    <div>
      <div className="alert blue" style={{marginBottom:14}}>
        ⏱ Overtime calculated per ISO week (Mon–Sun). Hours above 40 per week count as OT. {filtered.length} shifts logged this period.
      </div>

      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <div className="form-group" style={{marginBottom:0}}>
          <label className="form-label" style={{fontSize:10}}>Period start</label>
          <input className="form-input" type="date" value={periodStart}
            onChange={e => setPeriodStart(e.target.value)} style={{padding:"6px 9px"}} />
        </div>
        <div className="form-group" style={{marginBottom:0}}>
          <label className="form-label" style={{fontSize:10}}>Period end</label>
          <input className="form-input" type="date" value={periodEnd}
            onChange={e => setPeriodEnd(e.target.value)} style={{padding:"6px 9px"}} />
        </div>
        <div className="form-group" style={{marginBottom:0,flex:1,minWidth:160}}>
          <label className="form-label" style={{fontSize:10}}>Filter by employee</label>
          <select className="form-input" value={empFilter}
            onChange={e => setEmpFilter(e.target.value)} style={{padding:"6px 9px"}}>
            <option value="All">All employees</option>
            {employees
              .filter(e => matchBranchFilter(e, branch))
              .sort((a,b) => a.name.localeCompare(b.name))
              .map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <Btn variant="primary" onClick={() => { setEditing(null); setShowAdd(true); }}>+ Log shift</Btn>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:14}}>
        <KpiTile label="Total hours" value={totalAllHours.toFixed(1)} color="#3B82F6" />
        <KpiTile label="Overtime hours" value={totalAllOT.toFixed(1)} color="#F59E0B" />
        <KpiTile label="People worked" value={employeeRows.length} color="#22C55E" />
        <KpiTile label="Shifts logged" value={filtered.length} color="#A855F7" />
      </div>

      {/* Summary by employee */}
      <div className="table-wrap" style={{marginBottom:16}}>
        <div className="table-head"><span className="table-title">Summary by employee</span></div>
        <table>
          <thead><tr>
            <SortableTh sortState={sortEmpSummary} sortKey="name">Employee</SortableTh>
            <SortableTh sortState={sortEmpSummary} sortKey="branch">Branch</SortableTh>
            <SortableTh sortState={sortEmpSummary} sortKey="total">Total hours</SortableTh>
            <SortableTh sortState={sortEmpSummary} sortKey="regular">Regular</SortableTh>
            <SortableTh sortState={sortEmpSummary} sortKey="ot">Overtime</SortableTh>
          </tr></thead>
          <tbody>
            {sortEmpSummary.rows.length === 0 ? (
              <tr><td colSpan={5}><div className="empty-state">No shifts logged for this period</div></td></tr>
            ) : sortEmpSummary.rows.map(e => (
              <tr key={e.eid}>
                <td><strong>{e.name}</strong></td>
                <td style={{fontSize:12}}>{branchLabel({branch:e.branch, department:e.dept})}</td>
                <td style={{fontFamily:"monospace"}}>{e.total.toFixed(1)}</td>
                <td style={{fontFamily:"monospace",color:"#8A95A8"}}>{e.regular.toFixed(1)}</td>
                <td style={{fontFamily:"monospace"}}>{e.ot > 0 ? <Badge color="amber">{e.ot.toFixed(1)} h</Badge> : <span style={{color:"#8A95A8"}}>0</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail: every shift row */}
      <div className="table-wrap">
        <div className="table-head"><span className="table-title">Shift entries ({filtered.length})</span></div>
        {loading ? <div className="loading">Loading...</div> : (
          <table>
            <thead><tr>
              <SortableTh sortState={sortShifts} sortKey="shift_date">Date</SortableTh>
              <SortableTh sortState={sortShifts} sortKey="employee_name" accessor={s => s.employee?.name || ""}>Employee</SortableTh>
              <SortableTh sortState={sortShifts} sortKey="start_time">Start</SortableTh>
              <SortableTh sortState={sortShifts} sortKey="end_time">End</SortableTh>
              <SortableTh sortState={sortShifts} sortKey="hours" accessor={s => parseFloat(s.hours)}>Hours</SortableTh>
              <th>Notes</th>
              <SortableTh sortState={sortShifts} sortKey="logger_name">Logged by</SortableTh>
              <th>Actions</th>
            </tr></thead>
            <tbody>
              {sortShifts.rows.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state">No shifts in this period — click "+ Log shift" to add one</div></td></tr>
              ) : sortShifts.rows.map(s => (
                <tr key={s.id}>
                  <td style={{fontSize:12}}>{formatLocalDate(s.shift_date, {weekday:"short",month:"short",day:"numeric"})}</td>
                  <td><strong>{s.employee?.name || "—"}</strong></td>
                  <td style={{fontFamily:"monospace",fontSize:11}}>{s.start_time ? s.start_time.slice(0,5) : "—"}</td>
                  <td style={{fontFamily:"monospace",fontSize:11}}>{s.end_time ? s.end_time.slice(0,5) : "—"}</td>
                  <td style={{fontFamily:"monospace"}}>{parseFloat(s.hours).toFixed(2)}</td>
                  <td style={{fontSize:11,color:"#8A95A8",maxWidth:240}}>{s.notes || "—"}</td>
                  <td style={{fontSize:11,color:"#8A95A8"}}>{s.logger_name || "—"}</td>
                  <td>
                    <div style={{display:"flex",gap:6}}>
                      <Btn onClick={() => { setEditing(s); setShowAdd(true); }}>Edit</Btn>
                      <Btn variant="red" onClick={() => removeShift(s)}>Delete</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <ShiftModal
          shift={editing}
          user={user}
          employees={employees}
          branch={branch}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          onSaved={() => { setShowAdd(false); setEditing(null); load(); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ── Shift Add/Edit Modal ─────────────────────────────────────────────────────
function ShiftModal({ shift, user, employees, branch, onClose, onSaved, showToast }) {
  const isEdit = !!shift;

  // Auto-compute hours from start/end if both provided
  function computeHours(start, end) {
    if (!start || !end) return null;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let mins = (eh*60 + em) - (sh*60 + sm);
    if (mins < 0) mins += 24*60; // overnight shift
    return Math.round(mins/60 * 100) / 100;
  }

  const [form, setForm] = useState({
    employee_id: shift?.employee_id || "",
    shift_date: shift?.shift_date || new Date().toISOString().slice(0,10),
    start_time: shift?.start_time ? shift.start_time.slice(0,5) : "",
    end_time: shift?.end_time ? shift.end_time.slice(0,5) : "",
    hours: shift?.hours ? String(shift.hours) : "",
    notes: shift?.notes || ""
  });
  const [hoursManuallyEdited, setHoursManuallyEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  function update(k, v) {
    setForm(prev => {
      const next = { ...prev, [k]: v };
      // Auto-fill hours when both times present, unless user manually overrode hours
      if ((k === "start_time" || k === "end_time") && !hoursManuallyEdited) {
        const h = computeHours(k === "start_time" ? v : prev.start_time, k === "end_time" ? v : prev.end_time);
        if (h !== null) next.hours = String(h);
      }
      if (k === "hours") setHoursManuallyEdited(true);
      return next;
    });
  }

  async function save() {
    if (!form.employee_id) { showToast("Select an employee", "error"); return; }
    if (!form.shift_date) { showToast("Pick a date", "error"); return; }
    if (!form.hours || isNaN(parseFloat(form.hours)) || parseFloat(form.hours) <= 0) {
      showToast("Hours must be a positive number", "error"); return;
    }
    setSaving(true);
    try {
      const payload = {
        employee_id: form.employee_id,
        shift_date: form.shift_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        hours: parseFloat(form.hours),
        notes: form.notes.trim() || null,
        logged_by: user.id,
        logger_name: user.name
      };
      if (isEdit) await sbPatch("shifts", shift.id, payload);
      else await sbPost("shifts", payload);
      showToast(isEdit ? "Shift updated" : "Shift logged");
      onSaved();
    } catch (err) { showToast("Error: " + (err.message || err), "error"); }
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:480}}>
        <div className="modal-top">
          <div>
            <div className="modal-title">{isEdit ? "Edit shift" : "+ Log shift"}</div>
            <div style={{fontSize:12,color:"#8A95A8",marginTop:3}}>
              {isEdit ? "Update shift details" : "Record a worked shift for overtime tracking"}
            </div>
          </div>
          <div className="modal-close" onClick={onClose}>✕</div>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Employee *</label>
            <select className="form-input" value={form.employee_id}
              onChange={e => update("employee_id", e.target.value)}>
              <option value="">Select employee...</option>
              {employees
                .filter(e => e.status !== "inactive")
                .filter(e => matchBranchFilter(e, branch))
                .sort((a,b) => a.name.localeCompare(b.name))
                .map(e => <option key={e.id} value={e.id}>{e.name} ({branchLabel(e)})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input className="form-input" type="date" value={form.shift_date}
              onChange={e => update("shift_date", e.target.value)} />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Start time</label>
              <input className="form-input" type="time" value={form.start_time}
                onChange={e => update("start_time", e.target.value)} />
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">End time</label>
              <input className="form-input" type="time" value={form.end_time}
                onChange={e => update("end_time", e.target.value)} />
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Hours *</label>
              <input className="form-input" type="number" step="0.25" min="0" value={form.hours}
                onChange={e => update("hours", e.target.value)}
                style={{fontFamily:"monospace"}}
                placeholder="0.00" />
            </div>
          </div>
          <div style={{fontSize:11,color:"#8A95A8",marginTop:-6,marginBottom:10}}>
            Hours auto-calculate from start/end times — override manually if needed.
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} value={form.notes}
              onChange={e => update("notes", e.target.value)}
              placeholder="Job site, special circumstances..." />
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn style={{flex:1}} onClick={onClose} disabled={saving}>Cancel</Btn>
            <Btn variant="primary" style={{flex:1}} onClick={save} disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save changes" : "Log shift"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inventory ─────────────────────────────────────────────────────────────────
// Shop & truck inventory with Load Truck / Return / Add Stock / Adjust flows.
// Uses existing `inventory` (product_id, location_type, location_id, quantity)
// and `inventory_transactions` tables created by the standalone dashboard.
function Inventory({ user, products, trucks, employees, shops, showToast }) {
  const [tab, setTab] = useState("shops");
  const [inventory, setInventory] = useState([]);
  const [loadingInv, setLoadingInv] = useState(true);
  const [history, setHistory] = useState([]);
  const [branchFilter, setBranchFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");
  const [q, setQ] = useState("");
  const [moveModal, setMoveModal] = useState(null); // { action, ... }

  const isManager = ["super_admin","manager","lead"].includes(user.access_level);

  async function loadInventory() {
    setLoadingInv(true);
    try {
      const data = await sb("inventory", "?select=*,product:products(name,category,unit_cost,unit_of_measure)");
      setInventory(data);
    } catch (err) { showToast("Error loading inventory: " + (err.message || err), "error"); }
    setLoadingInv(false);
  }

  async function loadHistory() {
    try {
      const data = await sb("inventory_transactions",
        "?select=*,product:products(name,category),employee:employees(name)&order=created_at.desc&limit=200");
      setHistory(data);
    } catch (err) { showToast("Error loading history: " + (err.message || err), "error"); }
  }

  useEffect(() => { loadInventory(); }, []); // eslint-disable-line
  useEffect(() => { if (tab === "history") loadHistory(); }, [tab]); // eslint-disable-line

  // Build location maps for fast lookup, keyed by shop UUID
  const activeShops = (shops || []).filter(s => s.active);
  const shopLocations = {};
  for (const s of activeShops) {
    shopLocations[s.id] = {
      shop: s,
      label: s.name,
      branchKey: s.department ? `${s.branch}|${s.department}` : s.branch,
      items: 0,
      value: 0,
      products: {}
    };
  }
  for (const row of inventory) {
    if (row.location_type === "shop" && row.quantity > 0) {
      const key = row.location_id;
      if (!shopLocations[key]) {
        // Stale row pointing to a deactivated/deleted shop — still display under a placeholder
        shopLocations[key] = { shop: null, label: "(Unknown shop)", branchKey: "", items: 0, value: 0, products: {} };
      }
      shopLocations[key].items += row.quantity;
      shopLocations[key].value += (row.quantity * (row.product?.unit_cost || 0));
      shopLocations[key].products[row.product_id] = row;
    }
  }

  // truckLocations: truck.id → { truck, products }
  const truckLocations = {};
  for (const t of trucks) {
    truckLocations[t.id] = { truck: t, items: 0, value: 0, products: {} };
  }
  for (const row of inventory) {
    if (row.location_type === "truck" && row.quantity > 0 && truckLocations[row.location_id]) {
      truckLocations[row.location_id].items += row.quantity;
      truckLocations[row.location_id].value += (row.quantity * (row.product?.unit_cost || 0));
      truckLocations[row.location_id].products[row.product_id] = row;
    }
  }

  const filteredShops = Object.entries(shopLocations).filter(([_, s]) =>
    branchFilter === "All" || s.branchKey === branchFilter
  );
  const filteredTrucks = Object.entries(truckLocations).filter(([_, t]) =>
    matchBranchFilter(t.truck, branchFilter) &&
    (!q || t.truck.truck_number?.toString().toLowerCase().includes(q.toLowerCase()) ||
      t.truck.assigned_employee?.name?.toLowerCase().includes(q.toLowerCase()))
  );

  function openMove(action) {
    if (!isManager && action !== "usage") {
      showToast("Only managers and leads can perform this action", "error");
      return;
    }
    setMoveModal({ action });
  }

  return (
    <div>
      <div className="alert blue" style={{marginBottom:14}}>
        📦 Inventory across shops and trucks · {products.filter(p => p.active).length} active products · {Object.keys(shopLocations).length} shops · {trucks.length} trucks
      </div>

      <div className="tabs" style={{marginBottom:14}}>
        {[["shops","Shops"],["trucks","Trucks"],["log","Log Move"],["history","History"],["order","Order"],["reports","Reports"]].map(([t,l]) => (
          <button key={t} className={"tab-btn"+(tab===t?" active":"")} onClick={()=>setTab(t)}>{l}</button>
        ))}
      </div>

      {/* Shops tab */}
      {tab === "shops" && (
        <div>
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
            <select className="branch-select" value={branchFilter} onChange={e=>setBranchFilter(e.target.value)}>
              <option value="All">All branches</option>
              {BRANCH_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
            {isManager && <div style={{flex:1}} />}
            {isManager && <Btn variant="primary" onClick={() => openMove("add_stock")}>+ Add shop stock</Btn>}
          </div>
          {loadingInv ? <div className="loading">Loading...</div> : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
              {filteredShops.map(([key, shop]) => (
                <div key={key} className="mod-card" style={{cursor:"pointer"}}
                  onClick={() => setMoveModal({ action: "view_shop", location: key, label: shop.label })}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                    <div style={{fontSize:14,fontWeight:600}}>🏪 {shop.label}</div>
                    <Badge color={shop.items > 0 ? "green" : "gray"}>{shop.items > 0 ? `${shop.items} items` : "Empty"}</Badge>
                  </div>
                  <div style={{fontSize:11,color:"#8A95A8",marginTop:4}}>
                    {Object.keys(shop.products).length} SKUs · ${shop.value.toFixed(2)} value
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trucks tab */}
      {tab === "trucks" && (
        <div>
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
            <select className="branch-select" value={branchFilter} onChange={e=>setBranchFilter(e.target.value)}>
              <option value="All">All branches</option>
              {BRANCH_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
            <div style={{flex:1,minWidth:180,display:"flex",alignItems:"center",gap:8,background:"#1E2535",border:"1px solid #2A3348",borderRadius:6,padding:"6px 11px"}}>
              <span style={{color:"#4A5568"}}>⌕</span>
              <input style={{background:"none",border:"none",outline:"none",color:"#E8EDF5",fontSize:13,flex:1,fontFamily:"DM Sans,sans-serif"}} placeholder="Search by truck # or driver..." value={q} onChange={e=>setQ(e.target.value)} />
            </div>
            {isManager && <Btn variant="primary" onClick={() => openMove("load_truck")}>+ Load truck</Btn>}
          </div>
          {loadingInv ? <div className="loading">Loading...</div> : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
              {filteredTrucks.length === 0 ? (
                <div className="empty-state" style={{gridColumn:"1/-1"}}>No trucks match the current filter</div>
              ) : filteredTrucks.map(([id, t]) => (
                <div key={id} className="mod-card" style={{cursor:"pointer"}}
                  onClick={() => setMoveModal({ action: "view_truck", location: id, label: `Truck #${t.truck.truck_number}` })}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                    <div style={{fontSize:14,fontWeight:600}}>🚛 #{t.truck.truck_number}</div>
                    <Badge color={t.items > 0 ? "green" : "gray"}>{t.items > 0 ? `${t.items} items` : "Empty"}</Badge>
                  </div>
                  <div style={{fontSize:11,color:"#8A95A8"}}>
                    {t.truck.assigned_employee?.name || "Unassigned"} · {branchLabel(t.truck)}
                  </div>
                  {t.items > 0 && (
                    <div style={{fontSize:11,color:"#8A95A8",marginTop:2}}>
                      {Object.keys(t.products).length} SKUs · ${t.value.toFixed(2)} value
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Log Move tab — quick action buttons */}
      {tab === "log" && (
        <div>
          <div className="alert blue" style={{marginBottom:14}}>
            ✏ Quick inventory moves. {isManager ? "Choose an action below." : "Only the 'Log usage' action is available to employees."}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>
            {isManager && (
              <>
                <div className="mod-card" style={{cursor:"pointer"}} onClick={() => openMove("load_truck")}>
                  <div style={{fontSize:22,marginBottom:6}}>🚛</div>
                  <div style={{fontSize:13,fontWeight:600}}>Load truck</div>
                  <div style={{fontSize:11,color:"#8A95A8",marginTop:3}}>Move stock from shop to a truck</div>
                </div>
                <div className="mod-card" style={{cursor:"pointer"}} onClick={() => openMove("return")}>
                  <div style={{fontSize:22,marginBottom:6}}>↩</div>
                  <div style={{fontSize:13,fontWeight:600}}>Return to shop</div>
                  <div style={{fontSize:11,color:"#8A95A8",marginTop:3}}>Pull stock off a truck back to shop</div>
                </div>
                <div className="mod-card" style={{cursor:"pointer"}} onClick={() => openMove("add_stock")}>
                  <div style={{fontSize:22,marginBottom:6}}>📥</div>
                  <div style={{fontSize:13,fontWeight:600}}>Add shop stock</div>
                  <div style={{fontSize:11,color:"#8A95A8",marginTop:3}}>Receive a delivery into a shop</div>
                </div>
                <div className="mod-card" style={{cursor:"pointer"}} onClick={() => openMove("adjust")}>
                  <div style={{fontSize:22,marginBottom:6}}>⚠</div>
                  <div style={{fontSize:13,fontWeight:600}}>Adjust / write-off</div>
                  <div style={{fontSize:11,color:"#8A95A8",marginTop:3}}>Correct quantities or write off damaged stock</div>
                </div>
                <div className="mod-card" style={{cursor:"pointer"}} onClick={() => openMove("distributor_purchase")}>
                  <div style={{fontSize:22,marginBottom:6}}>🏬</div>
                  <div style={{fontSize:13,fontWeight:600}}>Distributor purchase</div>
                  <div style={{fontSize:11,color:"#8A95A8",marginTop:3}}>Tech bought direct from distributor → adds to their truck</div>
                </div>
              </>
            )}
            <div className="mod-card" style={{cursor:"pointer"}} onClick={() => openMove("usage")}>
              <div style={{fontSize:22,marginBottom:6}}>📊</div>
              <div style={{fontSize:13,fontWeight:600}}>Log usage</div>
              <div style={{fontSize:11,color:"#8A95A8",marginTop:3}}>Record product used on a job</div>
            </div>
          </div>
        </div>
      )}

      {/* History tab */}
      {tab === "history" && (
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
            <div className="alert blue" style={{margin:0,flex:1,minWidth:200}}>
              🕓 Last 200 inventory transactions across all branches and trucks.
            </div>
            <Btn variant="primary" onClick={() => downloadHistoryCSV(history, shops, trucks)}>↓ Download CSV</Btn>
          </div>
          <InventoryHistoryTable history={history} shops={shops} trucks={trucks} />
        </div>
      )}

      {tab === "order" && (
        <OrderTab user={user} products={products} employees={employees} showToast={showToast} />
      )}

      {tab === "reports" && (
        <InventoryReports user={user} products={products} trucks={trucks} employees={employees} shops={shops} showToast={showToast} />
      )}

      {moveModal && (
        <InventoryMoveModal
          modal={moveModal}
          inventory={inventory}
          products={products}
          trucks={trucks}
          shops={shops}
          shopLocations={shopLocations}
          truckLocations={truckLocations}
          user={user}
          onClose={() => setMoveModal(null)}
          onSaved={() => { loadInventory(); if (tab === "history") loadHistory(); setMoveModal(null); }}
          showToast={showToast}
          catFilter={catFilter}
          setCatFilter={setCatFilter}
        />
      )}
    </div>
  );
}

// ── Inventory History Table (sortable) ───────────────────────────────────────
function InventoryHistoryTable({ history, shops, trucks }) {
  // Group by batch_id; rows without a batch_id are treated as their own "batch of 1"
  const groups = (function() {
    const map = new Map();
    for (const tx of history) {
      const key = tx.batch_id || ("__single_" + tx.id);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(tx);
    }
    // Build summary rows
    return Array.from(map.values()).map(rows => {
      const first = rows[0];
      const totalQty = rows.reduce((s, r) => s + (r.quantity || 0), 0);
      // Find total cost (only first row has it for distributor purchases)
      const totalCost = rows.reduce((s, r) => s + (parseFloat(r.total_cost) || 0), 0);
      return {
        batch_id: first.batch_id || first.id,
        is_batch: !!first.batch_id && rows.length > 1,
        created_at: first.created_at,
        action: first.action,
        from_location: first.from_location,
        to_location: first.to_location,
        employee: first.employee,
        employee_name: first.employee?.name || "",
        vendor: first.vendor,
        invoice_number: first.invoice_number,
        total_cost: totalCost > 0 ? totalCost : null,
        notes: first.notes,
        row_count: rows.length,
        rows: rows,
        product_name: rows.length === 1 ? (first.product?.name || "") : `${rows.length} products`,
        quantity_display: rows.length === 1 ? (first.quantity || 0) : totalQty
      };
    });
  })();

  const sort = useSortableData(groups, "created_at", "desc");
  const [expanded, setExpanded] = useState({});

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function locName(locId) {
    if (!locId) return "—";
    const shop = (shops || []).find(s => s.id === locId);
    if (shop) return shop.name;
    const truck = (trucks || []).find(t => t.id === locId);
    if (truck) return `Truck #${truck.truck_number}`;
    return locId; // fallback to raw ID if not resolved
  }

  return (
    <div className="table-wrap">
      <table>
        <thead><tr>
          <SortableTh sortState={sort} sortKey="created_at">Date</SortableTh>
          <SortableTh sortState={sort} sortKey="action">Action</SortableTh>
          <SortableTh sortState={sort} sortKey="product_name">Items</SortableTh>
          <SortableTh sortState={sort} sortKey="quantity_display">Qty</SortableTh>
          <SortableTh sortState={sort} sortKey="from_location">From → To</SortableTh>
          <SortableTh sortState={sort} sortKey="employee_name">By</SortableTh>
          <th>Notes</th>
        </tr></thead>
        <tbody>
          {sort.rows.length === 0 ? (
            <tr><td colSpan={7}><div className="empty-state">No transactions yet</div></td></tr>
          ) : sort.rows.flatMap(g => {
            const main = (
              <tr key={g.batch_id} style={g.is_batch ? {cursor:"pointer"} : {}}
                onClick={g.is_batch ? () => toggleExpand(g.batch_id) : undefined}>
                <td style={{fontSize:11,color:"#8A95A8"}}>{new Date(g.created_at).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</td>
                <td>
                  <Badge color={g.action === "load_truck" ? "blue" : g.action === "return" ? "amber" : g.action === "usage" ? "green" : g.action === "adjust" ? "red" : g.action === "distributor_purchase" ? "purple" : "gray"}>{g.action}</Badge>
                </td>
                <td>
                  {g.is_batch ? (
                    <span>
                      <span style={{fontSize:10,marginRight:4,color:"#22C55E"}}>{expanded[g.batch_id] ? "▼" : "▶"}</span>
                      <strong>📦 Batch · {g.row_count} products</strong>
                    </span>
                  ) : (
                    <strong>{g.product_name || "—"}</strong>
                  )}
                </td>
                <td style={{fontFamily:"monospace"}}>{g.quantity_display}</td>
                <td style={{fontSize:11,color:"#8A95A8"}}>{locName(g.from_location)} → {locName(g.to_location)}</td>
                <td style={{fontSize:12}}>{g.employee?.name || "—"}</td>
                <td style={{fontSize:11,color:"#8A95A8",maxWidth:240}}>
                  {g.action === "distributor_purchase" && g.vendor && (
                    <div style={{color:"#A855F7",fontSize:11,fontWeight:600}}>🏬 {g.vendor}{g.invoice_number ? ` · #${g.invoice_number}` : ""}{g.total_cost ? ` · $${g.total_cost.toFixed(2)}` : ""}</div>
                  )}
                  {g.notes || (g.action === "distributor_purchase" ? "" : "—")}
                </td>
              </tr>
            );
            if (g.is_batch && expanded[g.batch_id]) {
              const childRows = g.rows.map((tx, i) => (
                <tr key={g.batch_id + "-" + i} style={{background:"rgba(34,197,94,0.04)"}}>
                  <td style={{paddingLeft:24,fontSize:10,color:"#4A5568"}}>↳</td>
                  <td></td>
                  <td style={{fontSize:12}}>{tx.product?.name || "—"}</td>
                  <td style={{fontFamily:"monospace",fontSize:12}}>{tx.quantity}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              ));
              return [main, ...childRows];
            }
            return [main];
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Order tab (inside Inventory) — tech submits a need; manager consolidates ─
function OrderTab({ user, products, employees, showToast }) {
  const [subtab, setSubtab] = useState("submit");
  const isManager = ["super_admin","manager","lead"].includes(user.access_level);

  return (
    <div>
      <div className="tabs" style={{marginBottom:14}}>
        <button className={"tab-btn"+(subtab==="submit"?" active":"")} onClick={()=>setSubtab("submit")}>📋 Submit Request</button>
        {isManager && (
          <button className={"tab-btn"+(subtab==="manager"?" active":"")} onClick={()=>setSubtab("manager")}>📦 Manager View</button>
        )}
      </div>
      {subtab === "submit"  && <OrderSubmit  user={user} products={products} employees={employees} showToast={showToast} />}
      {subtab === "manager" && isManager && <OrderManager user={user} products={products} showToast={showToast} />}
    </div>
  );
}

// ── Order: technician submits a request ──────────────────────────────────────
function OrderSubmit({ user, products, employees, showToast }) {
  const [name, setName] = useState(user?.id || "");
  const [weekNeeded, setWeekNeeded] = useState(() => {
    // Default to next Monday
    const d = new Date();
    const dow = d.getDay() || 7;
    d.setDate(d.getDate() + (8 - dow));
    return d.toISOString().slice(0,10);
  });
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([]); // [{ product_id, quantity, notes }]
  const [pickProduct, setPickProduct] = useState("");
  const [pickQty, setPickQty] = useState(1);
  const [recent, setRecent] = useState([]);
  const [saving, setSaving] = useState(false);

  async function loadRecent() {
    if (!user?.id) return;
    try {
      const data = await sb("orders",
        `?requester_id=eq.${user.id}&select=*,items:order_items(*,product:products(name))&order=created_at.desc&limit=10`);
      setRecent(data);
    } catch (err) { /* silent */ }
  }
  useEffect(() => { loadRecent(); }, []); // eslint-disable-line

  function addItem() {
    if (!pickProduct) { showToast("Select a product first", "error"); return; }
    const qty = parseInt(pickQty, 10);
    if (!qty || qty < 1) { showToast("Quantity must be at least 1", "error"); return; }
    // Merge into existing line if same product
    const existing = items.findIndex(i => i.product_id === pickProduct);
    if (existing >= 0) {
      const next = [...items];
      next[existing] = { ...next[existing], quantity: next[existing].quantity + qty };
      setItems(next);
    } else {
      setItems(prev => [...prev, { product_id: pickProduct, quantity: qty, notes: "" }]);
    }
    setPickProduct("");
    setPickQty(1);
  }

  function removeItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  function updateItemQty(idx, q) {
    const qty = parseInt(q, 10);
    if (isNaN(qty) || qty < 1) return;
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: qty } : it));
  }

  async function submitOrder() {
    if (!name) { showToast("Pick your name", "error"); return; }
    if (items.length === 0) { showToast("Add at least one product", "error"); return; }
    const emp = employees.find(e => e.id === name) || user;
    setSaving(true);
    try {
      const created = await sbPost("orders", {
        requester_id: name,
        requester_name: emp?.name || "Unknown",
        week_needed: weekNeeded,
        notes: notes.trim() || null
      });
      const order = Array.isArray(created) ? created[0] : created;
      // Insert items
      for (const it of items) {
        await sbPost("order_items", {
          order_id: order.id,
          product_id: it.product_id,
          quantity: it.quantity,
          notes: it.notes || null
        });
      }
      showToast("Order request submitted");
      setItems([]); setNotes("");
      loadRecent();
    } catch (err) { showToast("Error: " + (err.message || err), "error"); }
    setSaving(false);
  }

  // Estimated total based on unit_cost
  const estTotal = items.reduce((sum, it) => {
    const p = products.find(p => p.id === it.product_id);
    return sum + ((p?.unit_cost || 0) * it.quantity);
  }, 0);

  return (
    <div>
      <div className="alert blue" style={{marginBottom:14}}>
        📋 Tell us what you need for the week. Submissions go to your manager for ordering.
      </div>

      <div className="mod-card" style={{marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:600,color:"#8A95A8",textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>My Info</div>
        <div className="form-group">
          <label className="form-label">Your name</label>
          <select className="form-input" value={name} onChange={e => setName(e.target.value)}>
            <option value="">Select your name...</option>
            {employees.filter(e => e.status !== "inactive").sort((a,b)=>a.name.localeCompare(b.name)).map(e => (
              <option key={e.id} value={e.id}>{e.name} ({branchLabel(e)})</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Week needed <span style={{color:"#8A95A8"}}>(select the week start)</span></label>
          <input className="form-input" type="date" value={weekNeeded}
            onChange={e => setWeekNeeded(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Notes <span style={{color:"#8A95A8"}}>(optional)</span></label>
          <textarea className="form-input" rows={2} value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. running low on these, need before Thursday..." />
        </div>
      </div>

      <div className="mod-card" style={{marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:600,color:"#8A95A8",textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>Products Needed</div>
        <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"flex-end"}}>
          <div style={{flex:1}}>
            <select className="form-input" value={pickProduct} onChange={e => setPickProduct(e.target.value)}>
              <option value="">Select product...</option>
              {products.filter(p => p.active).sort((a,b)=>a.name.localeCompare(b.name)).map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
              ))}
            </select>
          </div>
          <input className="form-input" type="number" min="1" value={pickQty}
            style={{width:70,fontFamily:"monospace",textAlign:"center"}}
            onChange={e => setPickQty(e.target.value)} />
          <Btn variant="primary" onClick={addItem}>+</Btn>
        </div>
        {items.length === 0 ? (
          <div style={{padding:"12px 0",fontSize:13,color:"#8A95A8",textAlign:"center"}}>No products added yet</div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {items.map((it, idx) => {
              const p = products.find(p => p.id === it.product_id);
              return (
                <div key={idx} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#1E2535",border:"1px solid #2A3348",borderRadius:6}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500}}>{p?.name || "—"}</div>
                    <div style={{fontSize:11,color:"#8A95A8",marginTop:2}}>{p?.category} · ${(p?.unit_cost || 0).toFixed(2)} {p?.unit_of_measure ? "/ " + p.unit_of_measure : ""}</div>
                  </div>
                  <input type="number" min="1" value={it.quantity}
                    onChange={e => updateItemQty(idx, e.target.value)}
                    style={{width:60,padding:"4px 6px",background:"#0F1623",border:"1px solid #2A3348",borderRadius:4,color:"#E8EDF5",fontFamily:"monospace",textAlign:"center",fontSize:13}} />
                  <span style={{fontSize:11,color:"#8A95A8",width:60,textAlign:"right",fontFamily:"monospace"}}>${((p?.unit_cost || 0) * it.quantity).toFixed(2)}</span>
                  <Btn variant="red" onClick={() => removeItem(idx)}>×</Btn>
                </div>
              );
            })}
            <div style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",marginTop:4,fontSize:13}}>
              <span style={{color:"#8A95A8"}}>Estimated total ({items.length} item{items.length===1?"":"s"})</span>
              <strong style={{fontFamily:"monospace"}}>${estTotal.toFixed(2)}</strong>
            </div>
          </div>
        )}
      </div>

      <Btn variant="primary" style={{width:"100%",padding:"12px"}} onClick={submitOrder} disabled={saving || items.length === 0}>
        {saving ? "Submitting..." : "Submit Order Request"}
      </Btn>

      {recent.length > 0 && (
        <div style={{marginTop:24}}>
          <div style={{fontSize:11,fontWeight:600,color:"#8A95A8",textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>My Recent Requests</div>
          {recent.map(o => (
            <div key={o.id} className="mod-card" style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div>
                  <strong>{o.requester_name}</strong>
                  <div style={{fontSize:11,color:"#8A95A8",marginTop:2}}>
                    Week of {new Date(o.week_needed + "T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})} · Submitted {new Date(o.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
                  </div>
                </div>
                <Badge color={o.status === "pending" ? "amber" : o.status === "ordered" ? "blue" : o.status === "received" ? "green" : "gray"}>{o.status}</Badge>
              </div>
              {o.items && o.items.length > 0 && (
                <div style={{borderTop:"1px solid #2A3348",paddingTop:8,marginTop:8}}>
                  {o.items.map(it => (
                    <div key={it.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"3px 0"}}>
                      <span>{it.product?.name || "—"}</span>
                      <span style={{fontFamily:"monospace",color:"#8A95A8"}}>{it.adj_quantity ?? it.quantity} ea</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Order: manager view — consolidate all techs' requests for a week ──────────
function OrderManager({ user, products, showToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekFilter, setWeekFilter] = useState("");
  const [allWeeks, setAllWeeks] = useState([]);

  async function load() {
    setLoading(true);
    try {
      const data = await sb("orders",
        "?select=*,items:order_items(*,product:products(id,name,category,unit_cost,unit_of_measure))&order=week_needed.desc,created_at.desc&status=in.(pending,ordered)");
      setOrders(data);
      // Build week list
      const weeks = Array.from(new Set(data.map(o => o.week_needed))).sort().reverse();
      setAllWeeks(weeks);
      if (!weekFilter && weeks.length > 0) setWeekFilter(weeks[0]);
    } catch (err) { showToast("Error loading orders: " + (err.message || err), "error"); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  const weekOrders = orders.filter(o => !weekFilter || o.week_needed === weekFilter);

  // Build consolidated product totals across all orders for this week
  const consolidated = {}; // product_id → { product, qty, adjQty, requesters }
  for (const o of weekOrders) {
    for (const it of (o.items || [])) {
      const pid = it.product_id;
      if (!consolidated[pid]) {
        consolidated[pid] = { product: it.product, qty: 0, adjQty: 0, requesters: new Set(), customAdj: false };
      }
      consolidated[pid].qty    += it.quantity;
      consolidated[pid].adjQty += (it.adj_quantity ?? it.quantity);
      consolidated[pid].requesters.add(o.requester_name);
    }
  }
  const consolidatedRows = Object.entries(consolidated).map(([pid, v]) => ({
    product_id: pid,
    product: v.product,
    qty: v.qty,
    adjQty: v.adjQty,
    requesters: [...v.requesters]
  }));
  consolidatedRows.sort((a,b) => (a.product?.name || "").localeCompare(b.product?.name || ""));

  const [adjustments, setAdjustments] = useState({}); // product_id → adjusted qty for this session
  function setAdj(pid, qty) {
    setAdjustments(prev => ({ ...prev, [pid]: qty }));
  }

  // For displaying the adjusted total
  const totalEst = consolidatedRows.reduce((sum, r) => {
    const adj = adjustments[r.product_id] !== undefined ? parseInt(adjustments[r.product_id], 10) || 0 : r.adjQty;
    return sum + (adj * (r.product?.unit_cost || 0));
  }, 0);

  async function markAllOrdered() {
    if (!window.confirm(`Mark all ${weekOrders.length} requests for this week as 'ordered'?`)) return;
    try {
      for (const o of weekOrders) {
        if (o.status === "pending") {
          await sbPatch("orders", o.id, {
            status: "ordered",
            ordered_at: new Date().toISOString(),
            ordered_by: user.id
          });
        }
      }
      showToast("Marked as ordered");
      load();
    } catch (err) { showToast("Error: " + (err.message || err), "error"); }
  }

  function clearWeek() {
    if (!weekFilter) return;
    if (!window.confirm("Clear (cancel) all pending requests for this week?")) return;
    (async () => {
      try {
        for (const o of weekOrders) {
          if (o.status === "pending") {
            await sbPatch("orders", o.id, { status: "cancelled" });
          }
        }
        showToast("Week cleared");
        load();
      } catch (err) { showToast("Error: " + (err.message || err), "error"); }
    })();
  }

  // Print/Share: open a new window with a print-friendly view
  function printOrder() {
    if (consolidatedRows.length === 0) { showToast("Nothing to print", "error"); return; }
    const date = weekFilter ? new Date(weekFilter + "T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) : "All weeks";
    const requesters = [...new Set(weekOrders.map(o => o.requester_name))].join(", ");
    let rows = "";
    let total = 0;
    for (const r of consolidatedRows) {
      const adj = adjustments[r.product_id] !== undefined ? parseInt(adjustments[r.product_id], 10) || 0 : r.adjQty;
      const cost = adj * (r.product?.unit_cost || 0);
      total += cost;
      rows += `<tr><td>${r.product?.name || "—"}</td><td>${adj} ${r.product?.unit_of_measure || "ea"}</td><td style="text-align:right">$${cost.toFixed(2)}</td></tr>`;
    }
    const html = `<!doctype html><html><head><title>Critter Stop — Order Request</title>
<style>
  body{font-family:Arial,sans-serif;padding:30px;color:#1a1a18;font-size:13px;}
  h1{color:#1a6b3c;margin-bottom:4px;font-size:18px;}
  .meta{font-size:11px;color:#666;margin-bottom:18px;}
  table{width:100%;border-collapse:collapse;}
  th{text-align:left;background:#f4f4f0;padding:8px;border-bottom:2px solid #1a6b3c;font-size:11px;text-transform:uppercase;letterspacing:.05em;color:#1a6b3c;}
  td{padding:8px;border-bottom:1px solid #e5e5e0;}
  .total{text-align:right;color:#1a6b3c;font-weight:bold;font-size:14px;margin-top:14px;}
  .footer{margin-top:30px;font-size:10px;color:#888;border-top:1px solid #e5e5e0;padding-top:10px;}
</style></head><body>
<h1>Critter Stop — Order Request</h1>
<div class="meta">Week of <strong>${date}</strong><br/>Requested by: ${requesters}<br/>Generated: ${new Date().toLocaleString()}</div>
<table>
  <thead><tr><th>Product</th><th>Quantity</th><th style="text-align:right">Est. Cost</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="total">Estimated Total: $${total.toFixed(2)}</div>
<div class="footer">Prices are estimates based on last known costs. Confirm pricing with vendor at time of order. This order covers ${consolidatedRows.length} products from ${weekOrders.length} request${weekOrders.length===1?"":"s"}.</div>
<script>window.onload=()=>window.print();</script>
</body></html>`;
    const win = window.open("", "_blank");
    if (!win) { showToast("Pop-up blocked — allow pop-ups for this site", "error"); return; }
    win.document.write(html);
    win.document.close();
  }

  return (
    <div>
      <div className="alert blue" style={{marginBottom:14}}>
        📦 Consolidated order across all techs for the selected week. Adjust quantities before exporting.
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <div className="form-group" style={{marginBottom:0}}>
          <label className="form-label" style={{fontSize:10}}>Filter by week</label>
          <select className="form-input" value={weekFilter} onChange={e => setWeekFilter(e.target.value)} style={{padding:"6px 9px"}}>
            <option value="">All weeks</option>
            {allWeeks.map(w => (
              <option key={w} value={w}>Week of {new Date(w + "T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</option>
            ))}
          </select>
        </div>
        <div style={{flex:1}} />
        <Btn variant="red" onClick={clearWeek}>Clear Week</Btn>
        <Btn variant="primary" onClick={printOrder}>🖨 Print / Share</Btn>
        <Btn onClick={markAllOrdered}>Mark Ordered</Btn>
      </div>

      {loading ? <div className="loading">Loading...</div> : weekOrders.length === 0 ? (
        <div className="empty-state">No pending order requests for this week</div>
      ) : (
        <>
          <div className="mod-card" style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:600,color:"#8A95A8",textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>
              Consolidated Order — {weekFilter ? "Week of " + new Date(weekFilter + "T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric"}) : "All weeks"}
              <span style={{color:"#8A95A8",marginLeft:8,fontWeight:400}}>· {weekOrders.length} request{weekOrders.length===1?"":"s"} from {[...new Set(weekOrders.map(o=>o.requester_name))].length} techs</span>
            </div>
            <div className="table-wrap" style={{marginBottom:0}}>
              <table>
                <thead><tr><th>Product</th><th>Requesters</th><th>Requested</th><th>Adj. quantity</th><th style={{textAlign:"right"}}>Est. cost</th></tr></thead>
                <tbody>
                  {consolidatedRows.map(r => {
                    const adj = adjustments[r.product_id] !== undefined ? adjustments[r.product_id] : r.adjQty;
                    const cost = (parseInt(adj,10) || 0) * (r.product?.unit_cost || 0);
                    return (
                      <tr key={r.product_id}>
                        <td><strong>{r.product?.name || "—"}</strong><div style={{fontSize:10,color:"#8A95A8",marginTop:2}}>{r.product?.category}</div></td>
                        <td style={{fontSize:11,color:"#8A95A8"}}>{r.requesters.join(", ")}</td>
                        <td style={{fontFamily:"monospace"}}>{r.qty} {r.product?.unit_of_measure || ""}</td>
                        <td>
                          <input type="number" min="0" value={adj}
                            onChange={e => setAdj(r.product_id, e.target.value)}
                            style={{width:80,padding:"4px 8px",background:"#0F1623",border:"1px solid #2A3348",borderRadius:4,color:"#E8EDF5",fontFamily:"monospace",textAlign:"center",fontSize:13}} />
                        </td>
                        <td style={{textAlign:"right",fontFamily:"monospace"}}>${cost.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr><td colSpan={4} style={{textAlign:"right",fontWeight:600,fontSize:13,paddingTop:10}}>Estimated Total</td><td style={{textAlign:"right",fontFamily:"monospace",fontWeight:700,fontSize:14,paddingTop:10}}>${totalEst.toFixed(2)}</td></tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div style={{fontSize:11,fontWeight:600,color:"#8A95A8",textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>Individual Requests</div>
          {weekOrders.map(o => (
            <div key={o.id} className="mod-card" style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div>
                  <strong>{o.requester_name}</strong>
                  <div style={{fontSize:11,color:"#8A95A8",marginTop:2}}>
                    Submitted {new Date(o.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
                    {o.notes && <span> · {o.notes}</span>}
                  </div>
                </div>
                <Badge color={o.status === "pending" ? "amber" : o.status === "ordered" ? "blue" : "gray"}>{o.status}</Badge>
              </div>
              {o.items && o.items.length > 0 && (
                <div style={{borderTop:"1px solid #2A3348",paddingTop:8,marginTop:8}}>
                  {o.items.map(it => (
                    <div key={it.id} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"3px 0"}}>
                      <span>{it.product?.name || "—"}</span>
                      <span style={{fontFamily:"monospace",color:"#8A95A8"}}>{it.quantity} {it.product?.unit_of_measure || "ea"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── CSV download helpers ─────────────────────────────────────────────────────
function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
    return "\"" + s.replace(/"/g, '""') + "\"";
  }
  return s;
}

function downloadCSV(filename, headers, rows) {
  const lines = [headers.map(csvEscape).join(",")];
  for (const r of rows) lines.push(r.map(csvEscape).join(","));
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function locationLabel(locationId, shops, trucks) {
  if (!locationId) return "—";
  const shop = (shops || []).find(s => s.id === locationId);
  if (shop) return shop.name;
  const truck = (trucks || []).find(t => t.id === locationId);
  if (truck) return `Truck #${truck.truck_number}`;
  return locationId;
}

function downloadHistoryCSV(history, shops, trucks) {
  const rows = history.map(tx => [
    new Date(tx.created_at).toISOString(),
    tx.action || "",
    tx.product?.name || "",
    tx.product?.category || "",
    tx.quantity,
    locationLabel(tx.from_location, shops, trucks),
    locationLabel(tx.to_location, shops, trucks),
    tx.employee?.name || "",
    tx.vendor || "",
    tx.invoice_number || "",
    tx.total_cost || "",
    (tx.notes || "").replace(/\n/g, " ")
  ]);
  const headers = ["Date","Action","Product","Category","Quantity","From","To","By","Vendor","Invoice #","Total cost ($)","Notes"];
  downloadCSV(`inventory_history_${new Date().toISOString().slice(0,10)}.csv`, headers, rows);
}

// ── Inventory Reports tab ────────────────────────────────────────────────────
function InventoryReports({ user, products, trucks, employees, shops, showToast }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0,10);
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0,10);
  });

  async function load() {
    setLoading(true);
    try {
      const data = await sb("inventory_transactions",
        `?select=*,product:products(name,category,unit_cost,unit_of_measure),employee:employees(name,branch,department)&created_at=gte.${periodStart}T00:00:00&created_at=lte.${periodEnd}T23:59:59&order=created_at.desc`);
      setHistory(data);
    } catch (err) { showToast("Error loading reports: " + (err.message || err), "error"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [periodStart, periodEnd]); // eslint-disable-line

  // Usage transactions = anything that consumed product (usage action, plus load_truck if you want "what was loaded")
  // We'll focus on `usage` as the primary report, plus a Load Summary for what was moved out of shops.
  const usageTx = history.filter(tx => tx.action === "usage");
  const loadTx  = history.filter(tx => tx.action === "load_truck");
  const distTx  = history.filter(tx => tx.action === "distributor_purchase");

  // Aggregate: by product
  const byProduct = {};
  for (const tx of usageTx) {
    const pid = tx.product_id;
    if (!byProduct[pid]) byProduct[pid] = { product: tx.product, qty: 0, cost: 0 };
    byProduct[pid].qty += (tx.quantity || 0);
    byProduct[pid].cost += (tx.quantity || 0) * (tx.product?.unit_cost || 0);
  }
  const byProductRows = Object.entries(byProduct).map(([pid, v]) => ({ product_id: pid, ...v }));
  byProductRows.sort((a, b) => b.cost - a.cost);
  const sortByProduct = useSortableData(byProductRows, "cost", "desc");

  // Aggregate: by technician (employee)
  const byTech = {};
  for (const tx of usageTx) {
    if (!tx.employee_id) continue;
    const eid = tx.employee_id;
    if (!byTech[eid]) byTech[eid] = { employee: tx.employee, count: 0, qty: 0, cost: 0 };
    byTech[eid].count += 1;
    byTech[eid].qty += (tx.quantity || 0);
    byTech[eid].cost += (tx.quantity || 0) * (tx.product?.unit_cost || 0);
  }
  const byTechRows = Object.entries(byTech).map(([eid, v]) => ({ employee_id: eid, ...v }));
  byTechRows.sort((a, b) => b.cost - a.cost);
  const sortByTech = useSortableData(byTechRows, "cost", "desc");

  // Aggregate: distributor purchases by vendor
  const byVendor = {};
  for (const tx of distTx) {
    const v = tx.vendor || "(no vendor)";
    if (!byVendor[v]) byVendor[v] = { vendor: v, count: 0, qty: 0, cost: 0 };
    byVendor[v].count += 1;
    byVendor[v].qty += (tx.quantity || 0);
    byVendor[v].cost += parseFloat(tx.total_cost) || 0;
  }
  const byVendorRows = Object.values(byVendor).sort((a, b) => b.cost - a.cost);
  const sortByVendor = useSortableData(byVendorRows, "cost", "desc");

  // Totals
  const totalUsageCost = byProductRows.reduce((s, r) => s + r.cost, 0);
  const totalUsageQty  = byProductRows.reduce((s, r) => s + r.qty, 0);
  const totalDistCost  = byVendorRows.reduce((s, r) => s + r.cost, 0);

  function downloadByProduct() {
    const rows = sortByProduct.rows.map(r => [
      r.product?.name || "—",
      r.product?.category || "",
      r.qty,
      r.product?.unit_of_measure || "",
      r.cost.toFixed(2)
    ]);
    downloadCSV(`usage_by_product_${periodStart}_to_${periodEnd}.csv`,
      ["Product","Category","Quantity used","Unit","Total cost ($)"], rows);
  }
  function downloadByTech() {
    const rows = sortByTech.rows.map(r => [
      r.employee?.name || "—",
      r.employee?.branch || "",
      r.employee?.department || "",
      r.count,
      r.qty,
      r.cost.toFixed(2)
    ]);
    downloadCSV(`usage_by_tech_${periodStart}_to_${periodEnd}.csv`,
      ["Technician","Branch","Department","Transactions","Total quantity","Total cost ($)"], rows);
  }
  function downloadByVendor() {
    const rows = sortByVendor.rows.map(r => [
      r.vendor, r.count, r.qty, r.cost.toFixed(2)
    ]);
    downloadCSV(`distributor_purchases_${periodStart}_to_${periodEnd}.csv`,
      ["Vendor","Purchases","Items","Total spent ($)"], rows);
  }
  function downloadAllTx() {
    downloadHistoryCSV(history, shops, trucks);
  }

  return (
    <div>
      <div className="alert blue" style={{marginBottom:14}}>
        📊 Aggregated inventory reports for the selected period. Download any view as CSV for spreadsheets, accounting, or further analysis.
      </div>

      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"flex-end"}}>
        <div className="form-group" style={{marginBottom:0}}>
          <label className="form-label" style={{fontSize:10}}>Period start</label>
          <input className="form-input" type="date" value={periodStart}
            onChange={e => setPeriodStart(e.target.value)} style={{padding:"6px 9px"}} />
        </div>
        <div className="form-group" style={{marginBottom:0}}>
          <label className="form-label" style={{fontSize:10}}>Period end</label>
          <input className="form-input" type="date" value={periodEnd}
            onChange={e => setPeriodEnd(e.target.value)} style={{padding:"6px 9px"}} />
        </div>
        <div style={{flex:1}} />
        <Btn variant="primary" onClick={downloadAllTx}>↓ All transactions CSV</Btn>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginBottom:14}}>
        <KpiTile label="Usage transactions" value={usageTx.length} color="#22C55E" />
        <KpiTile label="Total quantity used" value={totalUsageQty.toFixed(1)} color="#3B82F6" />
        <KpiTile label="Total usage cost" value={"$" + totalUsageCost.toFixed(2)} color="#F59E0B" />
        <KpiTile label="Distributor spend" value={"$" + totalDistCost.toFixed(2)} color="#A855F7" />
      </div>

      {loading ? <div className="loading">Loading reports...</div> : (
        <>
          <div className="table-wrap" style={{marginBottom:16}}>
            <div className="table-head">
              <span className="table-title">Usage by product ({byProductRows.length})</span>
              <Btn onClick={downloadByProduct}>↓ CSV</Btn>
            </div>
            <table>
              <thead><tr>
                <SortableTh sortState={sortByProduct} sortKey="name" accessor={r => r.product?.name || ""}>Product</SortableTh>
                <SortableTh sortState={sortByProduct} sortKey="category" accessor={r => r.product?.category || ""}>Category</SortableTh>
                <SortableTh sortState={sortByProduct} sortKey="qty">Quantity used</SortableTh>
                <SortableTh sortState={sortByProduct} sortKey="cost">Total cost</SortableTh>
              </tr></thead>
              <tbody>
                {sortByProduct.rows.length === 0 ? (
                  <tr><td colSpan={4}><div className="empty-state">No usage logged for this period</div></td></tr>
                ) : sortByProduct.rows.map(r => (
                  <tr key={r.product_id}>
                    <td><strong>{r.product?.name || "—"}</strong></td>
                    <td><Badge color="gray">{r.product?.category || "—"}</Badge></td>
                    <td style={{fontFamily:"monospace"}}>{r.qty} {r.product?.unit_of_measure || ""}</td>
                    <td style={{fontFamily:"monospace"}}>${r.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-wrap" style={{marginBottom:16}}>
            <div className="table-head">
              <span className="table-title">Usage by technician ({byTechRows.length})</span>
              <Btn onClick={downloadByTech}>↓ CSV</Btn>
            </div>
            <table>
              <thead><tr>
                <SortableTh sortState={sortByTech} sortKey="name" accessor={r => r.employee?.name || ""}>Technician</SortableTh>
                <SortableTh sortState={sortByTech} sortKey="branch" accessor={r => r.employee?.branch || ""}>Branch</SortableTh>
                <SortableTh sortState={sortByTech} sortKey="department" accessor={r => r.employee?.department || ""}>Dept</SortableTh>
                <SortableTh sortState={sortByTech} sortKey="count">Transactions</SortableTh>
                <SortableTh sortState={sortByTech} sortKey="qty">Items used</SortableTh>
                <SortableTh sortState={sortByTech} sortKey="cost">Total cost</SortableTh>
              </tr></thead>
              <tbody>
                {sortByTech.rows.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state">No tech usage logged for this period</div></td></tr>
                ) : sortByTech.rows.map(r => (
                  <tr key={r.employee_id}>
                    <td><strong>{r.employee?.name || "—"}</strong></td>
                    <td>{r.employee?.branch || "—"}</td>
                    <td>{r.employee?.department ? <Badge color={deptColor(r.employee.department)}>{r.employee.department}</Badge> : "—"}</td>
                    <td style={{fontFamily:"monospace"}}>{r.count}</td>
                    <td style={{fontFamily:"monospace"}}>{r.qty}</td>
                    <td style={{fontFamily:"monospace"}}>${r.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-wrap">
            <div className="table-head">
              <span className="table-title">Distributor purchases ({byVendorRows.length})</span>
              <Btn onClick={downloadByVendor}>↓ CSV</Btn>
            </div>
            <table>
              <thead><tr>
                <SortableTh sortState={sortByVendor} sortKey="vendor">Vendor</SortableTh>
                <SortableTh sortState={sortByVendor} sortKey="count">Purchases</SortableTh>
                <SortableTh sortState={sortByVendor} sortKey="qty">Items</SortableTh>
                <SortableTh sortState={sortByVendor} sortKey="cost">Total spent</SortableTh>
              </tr></thead>
              <tbody>
                {sortByVendor.rows.length === 0 ? (
                  <tr><td colSpan={4}><div className="empty-state">No distributor purchases logged for this period</div></td></tr>
                ) : sortByVendor.rows.map(r => (
                  <tr key={r.vendor}>
                    <td><strong>{r.vendor}</strong></td>
                    <td style={{fontFamily:"monospace"}}>{r.count}</td>
                    <td style={{fontFamily:"monospace"}}>{r.qty}</td>
                    <td style={{fontFamily:"monospace"}}>${r.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Inventory Move Modal ─────────────────────────────────────────────────────
function InventoryMoveModal({ modal, inventory, products, trucks, shops, shopLocations, truckLocations, user, onClose, onSaved, showToast, catFilter, setCatFilter }) {
  const action = modal.action;
  const isView = action === "view_shop" || action === "view_truck";

  const [form, setForm] = useState({
    from_location: "",
    to_location:   "",
    product_id: "",
    quantity: 1,
    notes: "",
    vendor: "",
    invoice_number: "",
    total_cost: ""
  });
  const [saving, setSaving] = useState(false);

  function update(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  // View modes: just show what's at the location, no form
  if (isView) {
    const loc = action === "view_shop" ? shopLocations[modal.location] : truckLocations[modal.location];
    const productRows = loc ? Object.values(loc.products) : [];
    productRows.sort((a, b) => (a.product?.name || "").localeCompare(b.product?.name || ""));
    const canEdit = ["super_admin","manager","lead"].includes(user.access_level);
    const belowThresh = productRows.filter(r => r.reorder_threshold != null && r.quantity <= r.reorder_threshold);
    async function updateThreshold(rowId, newValue) {
      try {
        const v = newValue === "" ? null : parseInt(newValue, 10);
        if (newValue !== "" && (isNaN(v) || v < 0)) { showToast("Threshold must be a positive number", "error"); return; }
        await sbPatch("inventory", rowId, { reorder_threshold: v });
        onSaved();
      } catch (err) { showToast("Error: " + (err.message || err), "error"); }
    }
    return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal" style={{maxWidth:640, maxHeight:"90vh", overflowY:"auto"}}>
          <div className="modal-top">
            <div>
              <div className="modal-title">{action === "view_shop" ? "🏪" : "🚛"} {modal.label}</div>
              <div style={{fontSize:12,color:"#8A95A8",marginTop:3}}>
                {productRows.length} SKUs · {loc?.items || 0} items · ${(loc?.value || 0).toFixed(2)} value
                {belowThresh.length > 0 && <span style={{color:"#F59E0B",marginLeft:8}}>· ⚠ {belowThresh.length} below reorder threshold</span>}
              </div>
            </div>
            <div className="modal-close" onClick={onClose}>✕</div>
          </div>
          <div className="modal-body">
            {productRows.length === 0 ? (
              <div className="empty-state">No inventory at this location</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Product</th><th>Category</th><th>Qty</th><th>Reorder at</th><th>Value</th></tr></thead>
                  <tbody>
                    {productRows.map(r => {
                      const below = r.reorder_threshold != null && r.quantity <= r.reorder_threshold;
                      return (
                        <tr key={r.id} style={below ? {background:"rgba(245,158,11,0.05)"} : {}}>
                          <td><strong>{r.product?.name || "—"}</strong>{below && <span style={{color:"#F59E0B",fontSize:10,marginLeft:6}}>⚠ reorder</span>}</td>
                          <td><Badge color="gray">{r.product?.category || "—"}</Badge></td>
                          <td style={{fontFamily:"monospace"}}>{r.quantity} {r.product?.unit_of_measure || ""}</td>
                          <td>
                            {canEdit ? (
                              <input type="number" min="0" defaultValue={r.reorder_threshold ?? ""}
                                onBlur={(e) => {
                                  const newVal = e.target.value;
                                  const oldVal = r.reorder_threshold == null ? "" : String(r.reorder_threshold);
                                  if (newVal !== oldVal) updateThreshold(r.id, newVal);
                                }}
                                placeholder="—"
                                style={{width:60,padding:"3px 6px",background:"#0F1623",border:"1px solid #2A3348",borderRadius:4,color:"#E8EDF5",fontFamily:"monospace",textAlign:"center",fontSize:12}} />
                            ) : (
                              <span style={{fontFamily:"monospace",color:"#8A95A8"}}>{r.reorder_threshold ?? "—"}</span>
                            )}
                          </td>
                          <td style={{fontFamily:"monospace",fontSize:11,color:"#8A95A8"}}>${(r.quantity * (r.product?.unit_cost || 0)).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {canEdit && (
              <div style={{fontSize:11,color:"#8A95A8",marginTop:8,fontStyle:"italic"}}>
                Tip: set a reorder threshold to trigger Dashboard alerts when stock falls to or below that number. Leave blank to disable.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Cart mode: collect multiple products before submit ──────────────────────
  return (
    <InventoryCartModal
      action={action}
      products={products}
      trucks={trucks}
      shops={shops}
      inventory={inventory}
      user={user}
      onClose={onClose}
      onSaved={onSaved}
      showToast={showToast}
    />
  );
}

// ── Inventory Cart Modal (multi-product entry) ───────────────────────────────
function InventoryCartModal({ action, products, trucks, shops, inventory, user, onClose, onSaved, showToast }) {
  const [destination, setDestination] = useState({ from: "", to: "" });
  // Cart: [{ key, product_id, quantity }]
  const [cart, setCart] = useState([]);
  const [pickProduct, setPickProduct] = useState("");
  const [pickQty, setPickQty] = useState(1);
  const [catFilter, setCatFilter] = useState("All");
  const [search, setSearch] = useState("");
  // Distributor-purchase only
  const [vendor, setVendor] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const shopOptions = (shops || []).filter(s => s.active).map(s => ({
    value: s.id,
    label: s.name + (s.branch ? " — " + (s.department ? s.branch + " · " + s.department : s.branch) : "")
  }));
  const truckOptions = trucks.map(t => ({
    value: t.id,
    label: `Truck #${t.truck_number} · ${t.assigned_employee?.name || "Unassigned"}`
  }));

  const titles = {
    load_truck:           "🚛 Load truck",
    return:               "↩ Return to shop",
    add_stock:            "📥 Add shop stock",
    adjust:               "⚠ Adjust / write-off",
    usage:                "📊 Log product usage",
    distributor_purchase: "🏬 Distributor purchase"
  };
  const titleHint = {
    load_truck:           "Move multiple items from a shop to a truck in one batch",
    return:               "Pull multiple items off a truck back to a shop",
    add_stock:            "Receive multiple items into a shop (e.g. a Veseris delivery)",
    adjust:               "Correct quantities or write off damaged/lost stock at a single location",
    usage:                "Record multiple products used on a job",
    distributor_purchase: "Tech bought multiple items direct from a distributor — captures vendor + invoice + total cost"
  };

  // Determine field labels based on action
  const fromLabel = action === "load_truck" ? "From shop" :
                    action === "return"     ? "From truck" :
                    null;
  const toLabel   = action === "load_truck" ? "To truck" :
                    action === "return"     ? "To shop" :
                    action === "add_stock"  ? "To shop" :
                    action === "distributor_purchase" ? "Goes to truck" :
                    null;
  const singleLabel = action === "adjust" ? "Adjust at" :
                      action === "usage" ? "Used from" :
                      null;

  // What options does each picker show?
  function optionsFor(slot) {
    // slot: "from" or "to" or "single"
    if (action === "load_truck")  return slot === "from" ? shopOptions  : truckOptions;
    if (action === "return")      return slot === "from" ? truckOptions : shopOptions;
    if (action === "add_stock")   return slot === "to"   ? shopOptions  : [];
    if (action === "distributor_purchase") return slot === "to" ? truckOptions : [];
    if (action === "adjust" || action === "usage") {
      // Combined shop+truck picker for single-slot actions
      return [...shopOptions, ...truckOptions];
    }
    return [];
  }

  // Build the filtered product list for the picker
  const cats = ["All","Pest","Wildlife","Rodent","Mosquito","Termite","Insulation"];
  const filteredProducts = products
    .filter(p => p.active)
    .filter(p => catFilter === "All" || p.category === catFilter)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => a.name.localeCompare(b.name));

  // Helper: what does the source location look like? (For destination breakdown messages)
  function isShopId(id) { return (shops || []).some(s => s.id === id); }

  function addToCart() {
    if (!pickProduct) { showToast("Select a product", "error"); return; }
    const qty = parseInt(pickQty, 10);
    if (!qty || qty < 1) { showToast("Quantity must be at least 1", "error"); return; }
    // Merge with existing line if same product
    const existing = cart.findIndex(c => c.product_id === pickProduct);
    if (existing >= 0) {
      const next = [...cart];
      next[existing] = { ...next[existing], quantity: next[existing].quantity + qty };
      setCart(next);
    } else {
      setCart(prev => [...prev, { key: Date.now() + Math.random(), product_id: pickProduct, quantity: qty }]);
    }
    setPickProduct("");
    setPickQty(1);
  }

  function removeCartItem(key) {
    setCart(prev => prev.filter(c => c.key !== key));
  }

  function updateCartQty(key, q) {
    const qty = parseInt(q, 10);
    if (isNaN(qty) || qty < 1) return;
    setCart(prev => prev.map(c => c.key === key ? { ...c, quantity: qty } : c));
  }

  function quickAddProduct(p) {
    const existing = cart.findIndex(c => c.product_id === p.id);
    if (existing >= 0) {
      const next = [...cart];
      next[existing] = { ...next[existing], quantity: next[existing].quantity + 1 };
      setCart(next);
    } else {
      setCart(prev => [...prev, { key: Date.now() + Math.random(), product_id: p.id, quantity: 1 }]);
    }
  }

  // Compute totals
  const totalQty = cart.reduce((s, c) => s + c.quantity, 0);
  const estCost  = cart.reduce((s, c) => {
    const p = products.find(p => p.id === c.product_id);
    return s + (p?.unit_cost || 0) * c.quantity;
  }, 0);

  async function submitBatch() {
    if (cart.length === 0) { showToast("Add at least one product", "error"); return; }

    // Validate destination
    let fromType = null, fromId = null, toType = null, toId = null;
    if (action === "load_truck") {
      if (!destination.from || !destination.to) { showToast("Select both shop and truck", "error"); return; }
      fromType = "shop"; fromId = destination.from;
      toType   = "truck"; toId   = destination.to;
    } else if (action === "return") {
      if (!destination.from || !destination.to) { showToast("Select both truck and shop", "error"); return; }
      fromType = "truck"; fromId = destination.from;
      toType   = "shop";  toId   = destination.to;
    } else if (action === "add_stock") {
      if (!destination.to) { showToast("Select a shop", "error"); return; }
      toType = "shop"; toId = destination.to;
    } else if (action === "distributor_purchase") {
      if (!destination.to) { showToast("Select a truck", "error"); return; }
      toType = "truck"; toId = destination.to;
    } else if (action === "adjust" || action === "usage") {
      if (!destination.from) { showToast("Select a location", "error"); return; }
      const isShop = isShopId(destination.from);
      fromType = isShop ? "shop" : "truck"; fromId = destination.from;
    }

    setSaving(true);
    try {
      // One batch_id ties all rows together for the History grouping
      const batchId = (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : (Date.now() + "-" + Math.random()).toString();

      // Helper: get/upsert inventory row
      async function adjustQuantity(locType, locId, productId, delta) {
        const existing = inventory.find(r =>
          r.location_type === locType && r.location_id === locId && r.product_id === productId
        );
        if (existing) {
          const newQty = (existing.quantity || 0) + delta;
          if (newQty < 0) {
            const p = products.find(p => p.id === productId);
            throw new Error(`Not enough ${p?.name || "stock"} at this location (have ${existing.quantity}, need ${-delta})`);
          }
          await sbPatch("inventory", existing.id, { quantity: newQty, updated_at: new Date().toISOString() });
        } else {
          if (delta < 0) {
            const p = products.find(p => p.id === productId);
            throw new Error(`No ${p?.name || "stock"} exists at this location to subtract from`);
          }
          await sbPost("inventory", {
            product_id: productId,
            location_type: locType,
            location_id: locId,
            quantity: delta
          });
        }
      }

      // For distributor_purchase, the total cost gets attributed to the FIRST tx row
      // (so it shows on the consolidated batch line); subsequent rows in the batch have 0.
      const totalCostNum = parseFloat(totalCost);
      const hasDistMeta = action === "distributor_purchase";

      for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        const qty = item.quantity;
        // Move stock
        if (fromType && fromId) await adjustQuantity(fromType, fromId, item.product_id, -qty);
        if (toType   && toId)   await adjustQuantity(toType,   toId,   item.product_id, +qty);

        // Build transaction row
        const txPayload = {
          product_id: item.product_id,
          employee_id: user.id,
          action: action,
          quantity: qty,
          from_location: fromId || null,
          to_location: toId || null,
          notes: notes || null,
          batch_id: batchId
        };
        if (hasDistMeta) {
          // Vendor + invoice are batch-level — attached to every row for easy filtering,
          // but the dollar cost lands only on the first row to avoid double-counting.
          txPayload.vendor = vendor.trim() || null;
          txPayload.invoice_number = invoiceNumber.trim() || null;
          if (i === 0 && !isNaN(totalCostNum)) txPayload.total_cost = totalCostNum;
        }
        await sbPost("inventory_transactions", txPayload);
      }

      showToast(`Batch logged — ${cart.length} item${cart.length === 1 ? "" : "s"}`);
      onSaved();
    } catch (err) {
      showToast("Error: " + (err.message || err), "error");
    }
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:680, maxHeight:"92vh", display:"flex", flexDirection:"column"}}>
        <div className="modal-top">
          <div>
            <div className="modal-title">{titles[action]}</div>
            <div style={{fontSize:12,color:"#8A95A8",marginTop:3}}>{titleHint[action]}</div>
          </div>
          <div className="modal-close" onClick={onClose}>✕</div>
        </div>

        <div className="modal-body" style={{overflowY:"auto", flex:1}}>
          {/* Destination / source picker */}
          <div className="mod-card" style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:600,color:"#8A95A8",textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>1 · Where</div>

            {fromLabel && (
              <div className="form-group">
                <label className="form-label">{fromLabel} *</label>
                <select className="form-input" value={destination.from}
                  onChange={e => setDestination(d => ({ ...d, from: e.target.value }))}>
                  <option value="">— Select —</option>
                  {optionsFor("from").map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}
            {toLabel && (
              <div className="form-group">
                <label className="form-label">{toLabel} *</label>
                <select className="form-input" value={destination.to}
                  onChange={e => setDestination(d => ({ ...d, to: e.target.value }))}>
                  <option value="">— Select —</option>
                  {optionsFor("to").map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}
            {singleLabel && (
              <div className="form-group">
                <label className="form-label">{singleLabel} *</label>
                <select className="form-input" value={destination.from}
                  onChange={e => setDestination(d => ({ ...d, from: e.target.value }))}>
                  <option value="">— Select location —</option>
                  <optgroup label="Shops">
                    {shopOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </optgroup>
                  <optgroup label="Trucks">
                    {truckOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </optgroup>
                </select>
              </div>
            )}

            {/* Distributor purchase extra fields */}
            {action === "distributor_purchase" && (
              <>
                <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:10,marginBottom:10}}>
                  <div className="form-group" style={{marginBottom:0}}>
                    <label className="form-label">Vendor / distributor</label>
                    <input className="form-input" value={vendor}
                      onChange={e => setVendor(e.target.value)}
                      placeholder="e.g. Veseris, Target Specialty" />
                  </div>
                  <div className="form-group" style={{marginBottom:0}}>
                    <label className="form-label">Invoice / receipt #</label>
                    <input className="form-input" value={invoiceNumber}
                      onChange={e => setInvoiceNumber(e.target.value)}
                      style={{fontFamily:"monospace"}}
                      placeholder="optional" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Total cost paid ($) <span style={{color:"#8A95A8"}}>— for the whole batch</span></label>
                  <input className="form-input" type="number" step="0.01" min="0" value={totalCost}
                    onChange={e => setTotalCost(e.target.value)}
                    style={{fontFamily:"monospace"}}
                    placeholder="What the tech actually paid (incl. tax)" />
                </div>
              </>
            )}

            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Batch notes <span style={{color:"#8A95A8"}}>(applies to all items)</span></label>
              <input className="form-input" value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="PO number, job site, reason..." />
            </div>
          </div>

          {/* Product picker */}
          <div className="mod-card" style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:600,color:"#8A95A8",textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>2 · Products</div>

            <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:160,display:"flex",alignItems:"center",gap:8,background:"#1E2535",border:"1px solid #2A3348",borderRadius:6,padding:"6px 11px"}}>
                <span style={{color:"#4A5568"}}>⌕</span>
                <input style={{background:"none",border:"none",outline:"none",color:"#E8EDF5",fontSize:13,flex:1,fontFamily:"DM Sans,sans-serif"}}
                  placeholder="Search products..." value={search} onChange={e=>setSearch(e.target.value)} />
              </div>
            </div>

            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
              {cats.map(c => (
                <button key={c}
                  onClick={() => setCatFilter(c)}
                  style={{
                    padding:"4px 10px",borderRadius:4,fontSize:11,fontWeight:600,cursor:"pointer",
                    border:"1px solid " + (catFilter===c ? "#22C55E" : "#2A3348"),
                    background: catFilter===c ? "rgba(34,197,94,0.15)" : "transparent",
                    color: catFilter===c ? "#22C55E" : "#8A95A8"
                  }}>{c}</button>
              ))}
            </div>

            {/* Manual add row (select + qty + add) */}
            <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}}>
              <select className="form-input" value={pickProduct} onChange={e => setPickProduct(e.target.value)} style={{flex:1}}>
                <option value="">Select product to add...</option>
                {filteredProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.category}) — ${(p.unit_cost || 0).toFixed(2)} / {p.unit_of_measure || "ea"}</option>
                ))}
              </select>
              <input className="form-input" type="number" min="1" value={pickQty}
                onChange={e => setPickQty(e.target.value)}
                style={{width:60, fontFamily:"monospace", textAlign:"center"}} />
              <Btn variant="primary" onClick={addToCart}>+ Add</Btn>
            </div>

            {/* Quick-add chips for top filtered products */}
            {(catFilter !== "All" || search) && filteredProducts.length > 0 && filteredProducts.length <= 30 && (
              <div style={{marginTop:8}}>
                <div style={{fontSize:10,color:"#8A95A8",marginBottom:5,textTransform:"uppercase",letterSpacing:0.5}}>Quick add</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {filteredProducts.slice(0, 20).map(p => (
                    <button key={p.id} onClick={() => quickAddProduct(p)}
                      style={{
                        padding:"4px 9px",fontSize:11,borderRadius:4,cursor:"pointer",
                        background:"#1E2535",border:"1px solid #2A3348",color:"#E8EDF5"
                      }}>
                      + {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cart contents */}
          <div className="mod-card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:600,color:"#8A95A8",textTransform:"uppercase",letterSpacing:0.5}}>
                3 · Cart ({cart.length} item{cart.length===1?"":"s"})
              </div>
              {cart.length > 0 && (
                <Btn onClick={() => setCart([])} style={{fontSize:11,padding:"3px 8px"}}>Clear all</Btn>
              )}
            </div>

            {cart.length === 0 ? (
              <div style={{padding:"16px 0",fontSize:13,color:"#8A95A8",textAlign:"center",fontStyle:"italic"}}>
                No items added yet — pick products above and click + Add
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {cart.map(item => {
                  const p = products.find(p => p.id === item.product_id);
                  const lineCost = (p?.unit_cost || 0) * item.quantity;
                  return (
                    <div key={item.key} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#1E2535",border:"1px solid #2A3348",borderRadius:6}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:500}}>{p?.name || "—"}</div>
                        <div style={{fontSize:11,color:"#8A95A8",marginTop:2}}>
                          {p?.category} · ${(p?.unit_cost || 0).toFixed(2)} / {p?.unit_of_measure || "ea"}
                        </div>
                      </div>
                      <button onClick={() => updateCartQty(item.key, item.quantity - 1)} disabled={item.quantity <= 1}
                        style={{padding:"4px 9px",borderRadius:4,background:"#2A3348",border:"none",color:"#E8EDF5",cursor:"pointer",fontSize:13,fontWeight:600}}>−</button>
                      <input type="number" min="1" value={item.quantity}
                        onChange={e => updateCartQty(item.key, e.target.value)}
                        style={{width:55,padding:"4px 6px",background:"#0F1623",border:"1px solid #2A3348",borderRadius:4,color:"#E8EDF5",fontFamily:"monospace",textAlign:"center",fontSize:13}} />
                      <button onClick={() => updateCartQty(item.key, item.quantity + 1)}
                        style={{padding:"4px 9px",borderRadius:4,background:"#2A3348",border:"none",color:"#E8EDF5",cursor:"pointer",fontSize:13,fontWeight:600}}>+</button>
                      <span style={{fontSize:11,color:"#8A95A8",width:65,textAlign:"right",fontFamily:"monospace"}}>${lineCost.toFixed(2)}</span>
                      <button onClick={() => removeCartItem(item.key)}
                        style={{padding:"4px 8px",borderRadius:4,background:"transparent",border:"1px solid #EF4444",color:"#EF4444",cursor:"pointer",fontSize:11}}>×</button>
                    </div>
                  );
                })}
                <div style={{display:"flex",justifyContent:"space-between",padding:"10px 12px 4px",marginTop:4,fontSize:13,borderTop:"1px solid #2A3348"}}>
                  <span style={{color:"#8A95A8"}}>{totalQty} item{totalQty===1?"":"s"} total</span>
                  <strong style={{fontFamily:"monospace"}}>${estCost.toFixed(2)} <span style={{fontSize:10,color:"#8A95A8",fontWeight:400}}>est.</span></strong>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{display:"flex",gap:8,padding:"14px 18px",borderTop:"1px solid #2A3348"}}>
          <Btn style={{flex:1}} onClick={onClose} disabled={saving}>Cancel</Btn>
          <Btn variant="primary" style={{flex:2}} onClick={submitBatch} disabled={saving || cart.length === 0}>
            {saving ? "Submitting..." : `Submit batch (${cart.length})`}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── Equipment Checkout ───────────────────────────────────────────────────────
function EquipmentPage({ user, employees, showToast }) {
  const [tab, setTab] = useState("checkout");
  const [equipment, setEquipment] = useState([]);
  const [checkouts, setCheckouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingEquip, setEditingEquip] = useState(null);
  const [coForm, setCoForm] = useState({ equipment_id: "", expected_return: "", notes: "" });

  const isManager = ["super_admin","manager","lead"].includes(user.access_level);

  async function load() {
    setLoading(true);
    try {
      const [eq, co] = await Promise.all([
        sb("equipment", "?select=*&order=name"),
        sb("equipment_checkouts",
          "?select=*,equipment:equipment(name,category),employee:employees(name)&order=checked_out_at.desc")
      ]);
      setEquipment(eq);
      setCheckouts(co);
    } catch (err) { showToast("Error loading equipment: " + (err.message || err), "error"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  // Available equipment (active + not currently checked out)
  const checkedOutIds = new Set(checkouts.filter(c => !c.checked_in_at).map(c => c.equipment_id));
  const available = equipment.filter(e => e.active && !checkedOutIds.has(e.id));
  const currentlyOut = checkouts.filter(c => !c.checked_in_at);
  const closedCheckouts = checkouts.filter(c => !!c.checked_in_at);

  // Sortable data hooks — must run on every render in same order
  const sortCheckedOut = useSortableData(currentlyOut, "checked_out_at", "desc");
  const sortCheckIn    = useSortableData(currentlyOut, "checked_out_at", "desc");
  const sortLog        = useSortableData(checkouts, "checked_out_at", "desc");
  const sortEquipMgr   = useSortableData(equipment, "name");

  async function checkOut() {
    if (!coForm.equipment_id) { showToast("Select equipment", "error"); return; }
    try {
      await sbPost("equipment_checkouts", {
        equipment_id: coForm.equipment_id,
        employee_id: user.id,
        employee_name: user.name,
        expected_return: coForm.expected_return || null,
        notes: coForm.notes || null
      });
      showToast("Equipment checked out");
      setCoForm({ equipment_id: "", expected_return: "", notes: "" });
      load();
    } catch (err) { showToast("Check out failed: " + (err.message || err), "error"); }
  }

  async function checkIn(co, returnNotes) {
    try {
      await sbPatch("equipment_checkouts", co.id, {
        checked_in_at: new Date().toISOString(),
        return_notes: returnNotes || null
      });
      showToast("Equipment checked back in");
      load();
    } catch (err) { showToast("Check in failed: " + (err.message || err), "error"); }
  }

  async function removeEquip(eq) {
    if (!window.confirm(`Remove "${eq.name}" from equipment list? This cannot be undone.`)) return;
    try {
      await sbDelete("equipment", eq.id);
      showToast("Equipment removed");
      load();
    } catch (err) { showToast("Remove failed: " + (err.message || err), "error"); }
  }

  return (
    <div>
      <div className="alert blue" style={{marginBottom:14}}>
        🔧 Check out & check in shared tools, traps, ladders, etc. {equipment.filter(e => e.active).length} items registered · {currentlyOut.length} currently out
      </div>

      <div className="tabs" style={{marginBottom:14}}>
        {[["checkout","Check Out"],["checkin","Check In"],["log","Log"]].concat(isManager ? [["manage","Manage Equipment"]] : []).map(([t,l]) => (
          <button key={t} className={"tab-btn"+(tab===t?" active":"")} onClick={()=>setTab(t)}>{l}</button>
        ))}
      </div>

      {/* Check Out tab */}
      {tab === "checkout" && (
        <div>
          <div className="mod-card" style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:600,color:"#8A95A8",textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>Checking out as: {user.name}</div>
            <div className="form-group">
              <label className="form-label">Equipment item *</label>
              <select className="form-input" value={coForm.equipment_id}
                onChange={e => setCoForm(f => ({...f, equipment_id: e.target.value}))}>
                <option value="">Select equipment...</option>
                {available.sort((a,b) => a.name.localeCompare(b.name)).map(e => (
                  <option key={e.id} value={e.id}>{e.name}{e.category ? ` (${e.category})` : ""}{e.serial_number ? ` · S/N ${e.serial_number}` : ""}</option>
                ))}
              </select>
              {available.length === 0 && !loading && (
                <div style={{fontSize:11,color:"#F59E0B",marginTop:6}}>No equipment currently available — all items are either checked out or inactive.</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Expected return</label>
              <input className="form-input" type="date" value={coForm.expected_return}
                onChange={e => setCoForm(f => ({...f, expected_return: e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-input" rows={2} value={coForm.notes}
                onChange={e => setCoForm(f => ({...f, notes: e.target.value}))}
                placeholder="Job site, purpose..." />
            </div>
            <Btn variant="primary" style={{width:"100%"}} onClick={checkOut} disabled={!coForm.equipment_id}>Check Out</Btn>
          </div>

          <div style={{fontSize:11,fontWeight:600,color:"#8A95A8",textTransform:"uppercase",letterSpacing:0.5,marginBottom:10}}>Currently checked out ({currentlyOut.length})</div>
          {loading ? <div className="loading">Loading...</div> : currentlyOut.length === 0 ? (
            <div className="empty-state">No equipment currently checked out</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <SortableTh sortState={sortCheckedOut} sortKey="equipment_name" accessor={c => c.equipment?.name || ""}>Equipment</SortableTh>
                  <SortableTh sortState={sortCheckedOut} sortKey="employee_name" accessor={c => c.employee_name || c.employee?.name || ""}>Checked out by</SortableTh>
                  <SortableTh sortState={sortCheckedOut} sortKey="checked_out_at">Date out</SortableTh>
                  <SortableTh sortState={sortCheckedOut} sortKey="expected_return">Expected back</SortableTh>
                  <th>Notes</th>
                </tr></thead>
                <tbody>
                  {sortCheckedOut.rows.map(co => {
                    const overdue = co.expected_return && parseLocalDate(co.expected_return) < new Date();
                    return (
                      <tr key={co.id}>
                        <td><strong>{co.equipment?.name || "—"}</strong></td>
                        <td>{co.employee_name || co.employee?.name || "—"}</td>
                        <td style={{fontSize:12}}>{new Date(co.checked_out_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</td>
                        <td>{co.expected_return ? <Badge color={overdue?"red":"blue"}>{new Date(co.expected_return).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</Badge> : <span style={{color:"#8A95A8"}}>—</span>}</td>
                        <td style={{fontSize:11,color:"#8A95A8"}}>{co.notes || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Check In tab */}
      {tab === "checkin" && (
        <div>
          {loading ? <div className="loading">Loading...</div> : currentlyOut.length === 0 ? (
            <div className="empty-state">Nothing to check back in</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <SortableTh sortState={sortCheckIn} sortKey="equipment_name" accessor={c => c.equipment?.name || ""}>Equipment</SortableTh>
                  <SortableTh sortState={sortCheckIn} sortKey="employee_name" accessor={c => c.employee_name || c.employee?.name || ""}>Checked out by</SortableTh>
                  <SortableTh sortState={sortCheckIn} sortKey="checked_out_at">Date out</SortableTh>
                  <SortableTh sortState={sortCheckIn} sortKey="expected_return">Expected back</SortableTh>
                  <th>Actions</th>
                </tr></thead>
                <tbody>
                  {sortCheckIn.rows.map(co => {
                    const overdue = co.expected_return && parseLocalDate(co.expected_return) < new Date();
                    return (
                      <tr key={co.id}>
                        <td><strong>{co.equipment?.name || "—"}</strong></td>
                        <td>{co.employee_name || co.employee?.name || "—"}</td>
                        <td style={{fontSize:12}}>{new Date(co.checked_out_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</td>
                        <td>{co.expected_return ? <Badge color={overdue?"red":"blue"}>{new Date(co.expected_return).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</Badge> : <span style={{color:"#8A95A8"}}>—</span>}</td>
                        <td>
                          <Btn variant="primary" onClick={() => {
                            const notes = window.prompt("Return notes (optional, e.g. 'damaged tip', 'missing battery'):", "");
                            if (notes !== null) checkIn(co, notes);
                          }}>Check In</Btn>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Log tab */}
      {tab === "log" && (
        <div>
          <div className="alert blue" style={{marginBottom:14}}>
            🕓 Last {checkouts.length} checkout events.
          </div>
          {loading ? <div className="loading">Loading...</div> : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <SortableTh sortState={sortLog} sortKey="equipment_name" accessor={c => c.equipment?.name || ""}>Equipment</SortableTh>
                  <SortableTh sortState={sortLog} sortKey="employee_name" accessor={c => c.employee_name || c.employee?.name || ""}>Person</SortableTh>
                  <SortableTh sortState={sortLog} sortKey="checked_out_at">Out</SortableTh>
                  <SortableTh sortState={sortLog} sortKey="checked_in_at">Back</SortableTh>
                  <SortableTh sortState={sortLog} sortKey="status" accessor={c => c.checked_in_at ? "Returned" : "Out"}>Status</SortableTh>
                  <th>Notes</th>
                </tr></thead>
                <tbody>
                  {sortLog.rows.length === 0 ? (
                    <tr><td colSpan={6}><div className="empty-state">No checkout history yet</div></td></tr>
                  ) : sortLog.rows.map(co => (
                    <tr key={co.id}>
                      <td><strong>{co.equipment?.name || "—"}</strong></td>
                      <td>{co.employee_name || co.employee?.name || "—"}</td>
                      <td style={{fontSize:12}}>{new Date(co.checked_out_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</td>
                      <td style={{fontSize:12}}>{co.checked_in_at ? new Date(co.checked_in_at).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "—"}</td>
                      <td>{co.checked_in_at ? <Badge color="green">Returned</Badge> : <Badge color="amber">Out</Badge>}</td>
                      <td style={{fontSize:11,color:"#8A95A8",maxWidth:220}}>
                        {co.notes || "—"}
                        {co.return_notes && <div style={{marginTop:2}}>↩ {co.return_notes}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Manage Equipment tab — managers only */}
      {tab === "manage" && isManager && (
        <div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
            <Btn variant="primary" onClick={() => { setEditingEquip(null); setShowAdd(true); }}>+ Add equipment</Btn>
          </div>
          {loading ? <div className="loading">Loading...</div> : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <SortableTh sortState={sortEquipMgr} sortKey="name">Name</SortableTh>
                  <SortableTh sortState={sortEquipMgr} sortKey="category">Category</SortableTh>
                  <SortableTh sortState={sortEquipMgr} sortKey="serial_number">Serial #</SortableTh>
                  <SortableTh sortState={sortEquipMgr} sortKey="branch">Branch</SortableTh>
                  <SortableTh sortState={sortEquipMgr} sortKey="status" accessor={eq => checkedOutIds.has(eq.id) ? "Out" : "Available"}>Status</SortableTh>
                  <SortableTh sortState={sortEquipMgr} sortKey="active">Active</SortableTh>
                  <th>Actions</th>
                </tr></thead>
                <tbody>
                  {sortEquipMgr.rows.length === 0 ? (
                    <tr><td colSpan={7}><div className="empty-state">No equipment registered yet — click "+ Add equipment"</div></td></tr>
                  ) : sortEquipMgr.rows.map(eq => {
                    const isOut = checkedOutIds.has(eq.id);
                    return (
                      <tr key={eq.id}>
                        <td><strong>{eq.name}</strong></td>
                        <td>{eq.category || "—"}</td>
                        <td style={{fontFamily:"monospace",fontSize:11}}>{eq.serial_number || "—"}</td>
                        <td>{eq.branch || "—"}</td>
                        <td>{isOut ? <Badge color="amber">Checked out</Badge> : <Badge color="green">Available</Badge>}</td>
                        <td>{eq.active ? <Badge color="green">Active</Badge> : <Badge color="gray">Inactive</Badge>}</td>
                        <td>
                          <div style={{display:"flex",gap:6}}>
                            <Btn onClick={() => { setEditingEquip(eq); setShowAdd(true); }}>Edit</Btn>
                            <Btn variant="red" onClick={() => removeEquip(eq)} disabled={isOut}>Remove</Btn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showAdd && (
        <EquipmentModal
          equipment={editingEquip}
          onClose={() => { setShowAdd(false); setEditingEquip(null); }}
          onSaved={() => { setShowAdd(false); setEditingEquip(null); load(); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ── Equipment Add/Edit Modal ─────────────────────────────────────────────────
function EquipmentModal({ equipment, onClose, onSaved, showToast }) {
  const isEdit = !!equipment;
  const [form, setForm] = useState({
    name: equipment?.name || "",
    category: equipment?.category || "",
    serial_number: equipment?.serial_number || "",
    branch: equipment?.branch || "DFW",
    notes: equipment?.notes || "",
    active: equipment?.active ?? true
  });
  const [saving, setSaving] = useState(false);

  function update(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function save() {
    if (!form.name.trim()) { showToast("Name is required", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim() || null,
        serial_number: form.serial_number.trim() || null,
        branch: form.branch || null,
        notes: form.notes.trim() || null,
        active: form.active
      };
      if (isEdit) await sbPatch("equipment", equipment.id, payload);
      else await sbPost("equipment", payload);
      showToast(isEdit ? "Equipment updated" : "Equipment added");
      onSaved();
    } catch (err) { showToast("Error: " + (err.message || err), "error"); }
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:460}}>
        <div className="modal-top">
          <div><div className="modal-title">{isEdit ? "Edit equipment" : "+ Add equipment"}</div></div>
          <div className="modal-close" onClick={onClose}>✕</div>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" value={form.name}
              onChange={e => update("name", e.target.value)} autoFocus
              placeholder="e.g. 24ft Extension Ladder" />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Category</label>
              <input className="form-input" value={form.category}
                onChange={e => update("category", e.target.value)}
                placeholder="Ladder, Trap, Tool..." />
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Branch</label>
              <select className="form-input" value={form.branch}
                onChange={e => update("branch", e.target.value)}>
                {BASE_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Serial number</label>
            <input className="form-input" value={form.serial_number}
              onChange={e => update("serial_number", e.target.value)}
              style={{fontFamily:"monospace"}} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} value={form.notes}
              onChange={e => update("notes", e.target.value)} />
          </div>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,cursor:"pointer",marginBottom:14}}>
            <input type="checkbox" checked={form.active}
              onChange={e => update("active", e.target.checked)} />
            Active (available for checkout)
          </label>
          <div style={{display:"flex",gap:8}}>
            <Btn style={{flex:1}} onClick={onClose} disabled={saving}>Cancel</Btn>
            <Btn variant="primary" style={{flex:1}} onClick={save} disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save" : "Add equipment"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Fleet ─────────────────────────────────────────────────────────────────────
function Fleet({ user, trucks, setTrucks, employees, setEmployees, showToast }) {
  const [branch, setBranch] = useState(user.branch === "All" ? "All" : user.branch);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [truckModalOpen, setTruckModalOpen] = useState(false);
  const [truckEditing, setTruckEditing] = useState(null);

  async function reloadTrucks() {
    try {
      const t = await sb("trucks", "?select=*,assigned_employee:employees(name)&order=truck_number");
      setTrucks(t);
      const e = await sb("employees", "?select=*&order=name");
      setEmployees(e);
    } catch (err) { showToast("Error refreshing: " + (err.message || err), "error"); }
  }

  async function removeTruck(t) {
    if (!window.confirm(`Remove truck ${t.truck_number} (${t.year || ""} ${t.make || ""} ${t.model || ""})? This cannot be undone.`)) return;
    try {
      const driver = employees.find(e => e.truck_id === t.id);
      if (driver) await sbPatch("employees", driver.id, { truck_id: null });
      await sbDelete("trucks", t.id);
      showToast("Truck removed");
      reloadTrucks();
    } catch (err) { showToast("Error removing truck: " + (err.message || err), "error"); }
  }

  const list = trucks.filter(t =>
    matchBranchFilter(t, branch) &&
    (!q || t.truck_number?.toLowerCase().includes(q.toLowerCase()) ||
      t.plate?.toLowerCase().includes(q.toLowerCase()) ||
      t.assigned_employee?.name?.toLowerCase().includes(q.toLowerCase()))
  );
  const sortAll = useSortableData(list, "truck_number");

  const maintenance = list.filter(t => t.next_oil_miles && t.mileage >= t.next_oil_miles - 500);
  const regExpired = list.filter(t => t.reg_expires && parseLocalDate(t.reg_expires) < new Date());
  const sortMaint = useSortableData(maintenance, "truck_number");
  const sortReg = useSortableData(list, "reg_expires", "asc");

  function oilStatus(t) {
    if (!t.next_oil_miles) return { color:"#8A95A8", label:"—" };
    const diff = t.next_oil_miles - (t.mileage || 0);
    if (diff <= 0) return { color:"#EF4444", label:"OVERDUE" };
    if (diff < 1000) return { color:"#F59E0B", label:"Due soon" };
    return { color:"#22C55E", label: t.next_oil_miles.toLocaleString() + " mi" };
  }

  return (
    <div>
      <BranchBar value={branch} onChange={setBranch} disabled={user.access_level === "employee"} />
      <div className="stat-row">
        {[
          {label:"Trucks",value:list.length,color:"#E8EDF5"},
          {label:"GPS active",value:list.filter(t=>t.has_gps).length,color:"#22C55E"},
          {label:"Oil service",value:maintenance.length,color:maintenance.length>0?"#EF4444":"#22C55E"},
          {label:"Reg expired",value:regExpired.length,color:regExpired.length>0?"#F59E0B":"#22C55E"},
          {label:"No GPS",value:list.filter(t=>!t.has_gps).length,color:"#8A95A8"},
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="tabs">
        {[["all","All trucks"],["maintenance","Needs service"],["registration","Registration"]].map(([t,l]) => (
          <button key={t} className={"tab-btn"+(tab===t?" active":"")} onClick={() => setTab(t)}>
            {l}{t==="maintenance"&&maintenance.length>0?<span style={{marginLeft:5,background:"#EF4444",color:"white",fontSize:9,padding:"1px 5px",borderRadius:8,fontWeight:700}}>{maintenance.length}</span>:null}
          </button>
        ))}
      </div>

      {tab === "all" && (
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,background:"#1E2535",border:"1px solid #2A3348",borderRadius:6,padding:"6px 11px",marginBottom:13}}>
            <span style={{color:"#4A5568"}}>⌕</span>
            <input style={{background:"none",border:"none",outline:"none",color:"#E8EDF5",fontSize:13,flex:1,fontFamily:"DM Sans,sans-serif"}} placeholder="Search truck, plate, driver..." value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div className="table-wrap">
            <div className="table-head">
              <span className="table-title">All trucks ({list.length})</span>
              {["super_admin","manager","lead"].includes(user.access_level) && <Btn variant="primary" onClick={() => setTruckModalOpen(true)}>+ Add truck</Btn>}
            </div>
            <table>
              <thead><tr>
                <SortableTh sortState={sortAll} sortKey="truck_number" accessor={t => parseInt(t.truck_number,10) || t.truck_number}>Truck</SortableTh>
                <SortableTh sortState={sortAll} sortKey="branch">Branch</SortableTh>
                <SortableTh sortState={sortAll} sortKey="department">Dept</SortableTh>
                <SortableTh sortState={sortAll} sortKey="driver_name" accessor={t => t.assigned_employee?.name || ""}>Driver</SortableTh>
                <SortableTh sortState={sortAll} sortKey="plate">Plate</SortableTh>
                <SortableTh sortState={sortAll} sortKey="mileage">Mileage</SortableTh>
                <SortableTh sortState={sortAll} sortKey="next_oil_miles">Next oil</SortableTh>
                <SortableTh sortState={sortAll} sortKey="reg_expires">Reg expires</SortableTh>
                <SortableTh sortState={sortAll} sortKey="has_gps">GPS</SortableTh>
                <th>Actions</th>
              </tr></thead>
              <tbody>
                {sortAll.rows.length === 0 ? (
                  <tr><td colSpan={10}><div className="empty-state">No trucks added yet — click "+ Add truck" to get started</div></td></tr>
                ) : sortAll.rows.map(t => {
                  const oil = oilStatus(t);
                  const regExp = t.reg_expires && parseLocalDate(t.reg_expires) < new Date();
                  const dot = maintenance.includes(t) || regExp ? "#EF4444" : t.has_gps ? "#22C55E" : "#8A95A8";
                  const canEdit = ["super_admin","manager","lead"].includes(user.access_level);
                  return (
                    <tr key={t.id}>
                      <td><div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:8,height:8,borderRadius:"50%",background:dot,flexShrink:0}} /><strong>{t.truck_number}</strong></div></td>
                      <td>{t.branch}</td>
                      <td>
                        {canEdit ? (
                          <select
                            value={t.department || ""}
                            onChange={async (e) => {
                              const newDept = e.target.value || null;
                              try {
                                await sbPatch("trucks", t.id, { department: newDept });
                                reloadTrucks();
                                showToast(newDept ? `Dept set to ${newDept}` : "Dept cleared");
                              } catch (err) { showToast("Error: " + (err.message || err), "error"); }
                            }}
                            style={{background:"#1E2535",border:"1px solid #2A3348",borderRadius:4,padding:"3px 6px",color:"#E8EDF5",fontSize:11,fontFamily:"DM Sans,sans-serif",cursor:"pointer"}}>
                            <option value="">—</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        ) : (
                          t.department ? <Badge color={deptColor(t.department)}>{t.department}</Badge> : <span style={{color:"#8A95A8"}}>—</span>
                        )}
                      </td>
                      <td>{t.assigned_employee?.name || <span style={{color:"#8A95A8"}}>Unassigned</span>}</td>
                      <td style={{fontFamily:"monospace",fontSize:11}}>{t.plate || "—"}</td>
                      <td style={{fontFamily:"monospace"}}>{t.mileage ? t.mileage.toLocaleString() : "—"}</td>
                      <td style={{color:oil.color,fontFamily:"monospace",fontSize:12}}>{oil.label}</td>
                      <td><Badge color={regExp?"red":!t.reg_expires?"gray":"green"}>{formatLocalDate(t.reg_expires, {month:"short",year:"numeric"})}</Badge></td>
                      <td><Badge color={t.has_gps?"green":"gray"}>{t.has_gps?"Active":"No GPS"}</Badge></td>
                      <td>
                        {canEdit ? (
                          <div style={{display:"flex",gap:6}}>
                            <Btn onClick={() => { setTruckEditing(t); setTruckModalOpen(true); }}>Edit</Btn>
                            <Btn variant="red" onClick={() => removeTruck(t)}>Remove</Btn>
                          </div>
                        ) : <span style={{color:"#8A95A8"}}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "maintenance" && (
        <div className="table-wrap">
          <div className="table-head"><span className="table-title">Needs service ({maintenance.length})</span></div>
          <table>
            <thead><tr>
              <SortableTh sortState={sortMaint} sortKey="truck_number" accessor={t => parseInt(t.truck_number,10) || t.truck_number}>Truck</SortableTh>
              <SortableTh sortState={sortMaint} sortKey="driver" accessor={t => t.assigned_employee?.name || ""}>Driver</SortableTh>
              <SortableTh sortState={sortMaint} sortKey="branch">Branch</SortableTh>
              <SortableTh sortState={sortMaint} sortKey="mileage">Current mileage</SortableTh>
              <SortableTh sortState={sortMaint} sortKey="next_oil_miles">Next oil due</SortableTh>
              <SortableTh sortState={sortMaint} sortKey="overdue" accessor={t => (t.mileage || 0) - (t.next_oil_miles || 0)}>Overdue by</SortableTh>
            </tr></thead>
            <tbody>
              {sortMaint.rows.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state">✓ All trucks are up to date on oil changes</div></td></tr>
              ) : sortMaint.rows.map(t => {
                const overdue = t.mileage - t.next_oil_miles;
                return (
                  <tr key={t.id}>
                    <td><strong>{t.truck_number}</strong></td>
                    <td>{t.assigned_employee?.name || "—"}</td>
                    <td>{t.branch}</td>
                    <td style={{fontFamily:"monospace"}}>{t.mileage?.toLocaleString()}</td>
                    <td style={{fontFamily:"monospace",color:"#EF4444"}}>{t.next_oil_miles?.toLocaleString()}</td>
                    <td><Badge color={overdue > 0 ? "red" : "amber"}>{overdue > 0 ? "+" + overdue.toLocaleString() + " mi" : "Due soon"}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "registration" && (
        <div className="table-wrap">
          <table>
            <thead><tr>
              <SortableTh sortState={sortReg} sortKey="truck_number" accessor={t => parseInt(t.truck_number,10) || t.truck_number}>Truck</SortableTh>
              <SortableTh sortState={sortReg} sortKey="driver" accessor={t => t.assigned_employee?.name || ""}>Driver</SortableTh>
              <SortableTh sortState={sortReg} sortKey="branch">Branch</SortableTh>
              <SortableTh sortState={sortReg} sortKey="plate">Plate</SortableTh>
              <SortableTh sortState={sortReg} sortKey="reg_expires">Reg expires</SortableTh>
              <SortableTh sortState={sortReg} sortKey="reg_status" accessor={t => {
                if (!t.reg_expires) return "zUnknown";
                const exp = parseLocalDate(t.reg_expires);
                if (exp < new Date()) return "aEXPIRED";
                if ((exp - new Date()) < 60 * 24 * 60 * 60 * 1000) return "bSoon";
                return "cCurrent";
              }}>Status</SortableTh>
            </tr></thead>
            <tbody>
              {sortReg.rows.map(t => {
                const exp = t.reg_expires ? parseLocalDate(t.reg_expires) : null;
                const expired = exp && exp < new Date();
                const soon = exp && !expired && (exp - new Date()) < 60 * 24 * 60 * 60 * 1000;
                return (
                  <tr key={t.id}>
                    <td><strong>{t.truck_number}</strong></td>
                    <td>{t.assigned_employee?.name || "—"}</td>
                    <td>{t.branch}</td>
                    <td style={{fontFamily:"monospace",fontSize:11}}>{t.plate || "—"}</td>
                    <td style={{color:expired?"#EF4444":soon?"#F59E0B":"#E8EDF5"}}>{exp ? exp.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—"}</td>
                    <td><Badge color={expired?"red":soon?"amber":!exp?"gray":"green"}>{expired?"EXPIRED":soon?"Expiring soon":!exp?"Unknown":"Current"}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {truckModalOpen && (
        <NewTruckModal
          employees={employees}
          trucks={trucks}
          editing={truckEditing}
          user={user}
          onClose={() => { setTruckModalOpen(false); setTruckEditing(null); }}
          onSaved={reloadTrucks}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ── Inspections (standalone module) ───────────────────────────────────────────
function InspectionsPage({ user, trucks, employees, showToast }) {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalTruck, setModalTruck] = useState(null);
  const [branch, setBranch] = useState(user.branch === "All" || ["super_admin","manager"].includes(user.access_level) ? "All" : user.branch);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | pass | fail | needs-inspection

  const canInspect = ["super_admin","manager","lead"].includes(user.access_level);

  async function load() {
    setLoading(true);
    try {
      const data = await sb("inspections", "?select=*,truck:trucks(truck_number,branch,year,make,model,plate,vin,assigned_employee:employees(name))&order=inspected_at.desc");
      setInspections(data);
    } catch (err) { showToast("Error loading inspections: " + (err.message || err), "error"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  // Build latest-per-truck map
  const latestByTruck = {};
  for (const i of inspections) {
    if (!i.truck_id) continue;
    if (!latestByTruck[i.truck_id] || new Date(i.inspected_at) > new Date(latestByTruck[i.truck_id].inspected_at)) {
      latestByTruck[i.truck_id] = i;
    }
  }

  const branchTrucks = trucks.filter(t => matchBranchFilter(t, branch));

  const filteredTrucks = branchTrucks.filter(t => {
    const latest = latestByTruck[t.id];
    if (statusFilter === "pass" && !(latest && latest.overall_status === "PASS")) return false;
    if (statusFilter === "fail" && !(latest && latest.fail_count > 0)) return false;
    if (statusFilter === "needs-inspection" && latest) return false;
    if (q) {
      const hay = `${t.truck_number} ${t.plate} ${t.year} ${t.make} ${t.model} ${t.assigned_employee?.name || ""}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });
  const sortInsp = useSortableData(filteredTrucks, "truck_number");

  const stats = {
    total: branchTrucks.length,
    needsInspection: branchTrucks.filter(t => !latestByTruck[t.id]).length,
    failing: branchTrucks.filter(t => { const l = latestByTruck[t.id]; return l && l.fail_count > 0; }).length,
    passing: branchTrucks.filter(t => { const l = latestByTruck[t.id]; return l && l.overall_status === "PASS"; }).length,
  };

  return (
    <div>
      {!canInspect && (
        <div className="alert blue" style={{marginBottom:14}}>
          ℹ Only managers, leads, and super admins can perform truck inspections. You can view inspection history below.
        </div>
      )}

      <BranchBar value={branch} onChange={setBranch} disabled={user.access_level === "employee"} />

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:14}}>
        <KpiTile label="Total trucks" value={stats.total} color="#3B82F6" />
        <KpiTile label="No inspection" value={stats.needsInspection} color="#F59E0B" />
        <KpiTile label="Failing" value={stats.failing} color="#EF4444" />
        <KpiTile label="Passing" value={stats.passing} color="#22C55E" />
      </div>

      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:180,display:"flex",alignItems:"center",gap:8,background:"#1E2535",border:"1px solid #2A3348",borderRadius:6,padding:"6px 11px"}}>
          <span style={{color:"#4A5568"}}>⌕</span>
          <input style={{background:"none",border:"none",outline:"none",color:"#E8EDF5",fontSize:13,flex:1,fontFamily:"DM Sans,sans-serif"}} placeholder="Search by truck #, plate, or driver..." value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <select className="branch-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="all">All status</option>
          <option value="needs-inspection">No inspection on file</option>
          <option value="fail">Latest = FAIL</option>
          <option value="pass">Latest = PASS</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading inspections...</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr>
              <SortableTh sortState={sortInsp} sortKey="truck_number" accessor={t => parseInt(t.truck_number,10) || t.truck_number}>Truck</SortableTh>
              <SortableTh sortState={sortInsp} sortKey="driver" accessor={t => t.assigned_employee?.name || ""}>Driver</SortableTh>
              <SortableTh sortState={sortInsp} sortKey="branch">Branch</SortableTh>
              <SortableTh sortState={sortInsp} sortKey="last_inspected" accessor={t => latestByTruck[t.id]?.inspected_at}>Last inspected</SortableTh>
              <SortableTh sortState={sortInsp} sortKey="inspector" accessor={t => latestByTruck[t.id]?.inspector_name || ""}>Inspector</SortableTh>
              <SortableTh sortState={sortInsp} sortKey="status" accessor={t => latestByTruck[t.id]?.overall_status || "zNo"}>Status</SortableTh>
              <th>Issues</th>
              <th>Actions</th>
            </tr></thead>
            <tbody>
              {sortInsp.rows.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state">No trucks match the filters</div></td></tr>
              ) : sortInsp.rows.map(t => {
                const latest = latestByTruck[t.id];
                const dot = !latest ? "#F59E0B" : latest.fail_count > 0 ? "#EF4444" : "#22C55E";
                return (
                  <tr key={t.id}>
                    <td><div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:8,height:8,borderRadius:"50%",background:dot,flexShrink:0}} /><strong>{t.truck_number}</strong> <span style={{color:"#8A95A8",fontSize:11}}>{t.year} {t.make} {t.model}</span></div></td>
                    <td>{t.assigned_employee?.name || <span style={{color:"#8A95A8"}}>Unassigned</span>}</td>
                    <td>{t.branch}</td>
                    <td style={{fontSize:12}}>{latest ? new Date(latest.inspected_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : <span style={{color:"#F59E0B"}}>Never</span>}</td>
                    <td style={{fontSize:12}}>{latest?.inspector_name || "—"}</td>
                    <td>{latest ? <Badge color={latest.fail_count > 0 ? "red" : "green"}>{latest.overall_status}</Badge> : <Badge color="amber">No inspection</Badge>}</td>
                    <td style={{fontSize:11,color:"#8A95A8",maxWidth:240}}>{latest?.notes || "—"}</td>
                    <td>
                      {canInspect && (
                        <Btn variant="primary" onClick={() => setModalTruck(t)}>
                          {latest ? "Re-inspect" : "Start inspection"}
                        </Btn>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalTruck && (
        <InspectionModal
          truck={modalTruck}
          user={user}
          employees={employees}
          onClose={() => setModalTruck(null)}
          onSaved={() => { load(); setModalTruck(null); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function KpiTile({ label, value, color }) {
  return (
    <div style={{background:"#1E2535",border:"1px solid #2A3348",borderRadius:8,padding:"12px 14px"}}>
      <div style={{fontSize:11,color:"#8A95A8",textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>{label}</div>
      <div style={{fontSize:22,fontWeight:600,color}}>{value}</div>
    </div>
  );
}

// ── Inspection Modal (the form leads/managers fill out) ───────────────────────
function InspectionModal({ truck, user, employees, onClose, onSaved, showToast }) {
  const [template, setTemplate] = useState([]);
  const [loadingTpl, setLoadingTpl] = useState(true);
  const [form, setForm] = useState({
    service_line: "",
    inspection_mileage: "",
    next_oil_change: "",
    registration_current: "yes",
    registration_expires: truck.reg_expires || "",
    notes: "",
    results: {} // {key: "pass" | "fail"}
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    sb("inspection_template", "?select=*&active=eq.true&order=display_order")
      .then(t => { setTemplate(t); setLoadingTpl(false); })
      .catch(err => { showToast("Error loading template: " + (err.message || err), "error"); setLoadingTpl(false); });
  }, []); // eslint-disable-line

  function update(k, v) { setForm(prev => ({ ...prev, [k]: v })); }
  function setResult(key, value) {
    setForm(prev => ({ ...prev, results: { ...prev.results, [key]: value } }));
  }

  async function save() {
    if (!form.inspection_mileage) { showToast("Current mileage is required", "error"); return; }
    if (!form.next_oil_change.trim()) { showToast("Next oil change info is required", "error"); return; }
    // Verify all required items have a result
    const missing = template.filter(t => t.required && !form.results[t.key]);
    if (missing.length > 0) {
      showToast(`Missing: ${missing.map(m => m.label).join(", ")}`, "error");
      return;
    }
    setSaving(true);
    try {
      const failCount = Object.values(form.results).filter(v => v === "fail").length;
      const payload = {
        truck_id: truck.id,
        inspector_id: user.id,
        inspector_name: user.name,
        service_line: form.service_line || null,
        inspection_mileage: parseInt(form.inspection_mileage, 10),
        next_oil_change: form.next_oil_change.trim(),
        registration_current: form.registration_current === "yes",
        registration_expires: form.registration_expires || null,
        results: form.results,
        notes: form.notes.trim() || null,
        overall_status: failCount > 0 ? `FAIL (${failCount})` : "PASS",
        fail_count: failCount
      };
      await sbPost("inspections", payload);
      // Also update the truck mileage if higher than current
      if (parseInt(form.inspection_mileage, 10) > (truck.mileage || 0)) {
        await sbPatch("trucks", truck.id, {
          mileage: parseInt(form.inspection_mileage, 10),
          mileage_reading_date: new Date().toISOString().slice(0,10)
        });
      }
      showToast(`Inspection saved · ${payload.overall_status}`, failCount > 0 ? "error" : "success");
      onSaved();
    } catch (err) {
      showToast("Error saving inspection: " + (err.message || err), "error");
    }
    setSaving(false);
  }

  // Group template items by category
  const categories = {};
  for (const item of template) {
    if (!categories[item.category]) categories[item.category] = [];
    categories[item.category].push(item);
  }
  const catLabels = {
    safety: "Safety",
    cleanliness: "Cleanliness",
    gear: "Gear & Equipment",
    documentation: "Documentation"
  };
  const catOrder = ["safety", "cleanliness", "gear", "documentation"];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:640, maxHeight:"90vh", overflowY:"auto"}}>
        <div className="modal-top">
          <div>
            <div className="modal-title">Truck Inspection — #{truck.truck_number}</div>
            <div style={{fontSize:12,color:"#8A95A8",marginTop:3}}>
              {truck.year} {truck.make} {truck.model} · Plate {truck.plate} · Driver: {truck.assigned_employee?.name || "Unassigned"}
            </div>
            <div style={{fontSize:11,color:"#8A95A8",marginTop:2}}>
              Inspector: <strong style={{color:"#E8EDF5"}}>{user.name}</strong>
            </div>
          </div>
          <div className="modal-close" onClick={onClose}>✕</div>
        </div>
        <div className="modal-body">
          {loadingTpl ? <div className="loading">Loading inspection form...</div> : (
            <>
              <div className="form-group">
                <label className="form-label">Service line</label>
                <select className="form-input" value={form.service_line}
                  onChange={e => update("service_line", e.target.value)}>
                  <option value="">— Select —</option>
                  <option value="Wildlife">Wildlife</option>
                  <option value="Pest">Pest</option>
                  <option value="Insulation">Insulation</option>
                  <option value="All 3">All 3</option>
                </select>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Current mileage *</label>
                  <input className="form-input" type="number" value={form.inspection_mileage}
                    onChange={e => update("inspection_mileage", e.target.value)}
                    placeholder="e.g. 87,452" />
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Next oil change *</label>
                  <input className="form-input" value={form.next_oil_change}
                    onChange={e => update("next_oil_change", e.target.value)}
                    placeholder="e.g. 92,000 or 7/15/2026 or ASAP" />
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Registration up to date</label>
                  <select className="form-input" value={form.registration_current}
                    onChange={e => update("registration_current", e.target.value)}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Registration expires</label>
                  <input className="form-input" type="date" value={form.registration_expires}
                    onChange={e => update("registration_expires", e.target.value)} />
                </div>
              </div>

              {catOrder.filter(c => categories[c]).map(cat => (
                <div key={cat} style={{marginBottom:16}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#8A95A8",textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>
                    {catLabels[cat] || cat}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {categories[cat].map(item => (
                      <div key={item.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#1E2535",border:"1px solid #2A3348",borderRadius:6,padding:"8px 12px"}}>
                        <div style={{fontSize:13}}>{item.label}{item.required && <span style={{color:"#EF4444"}}> *</span>}</div>
                        <div style={{display:"flex",gap:6}}>
                          <button
                            onClick={() => setResult(item.key, "pass")}
                            style={{
                              padding:"4px 12px",
                              borderRadius:4,
                              border:"1px solid " + (form.results[item.key] === "pass" ? "#22C55E" : "#2A3348"),
                              background: form.results[item.key] === "pass" ? "rgba(34,197,94,0.15)" : "transparent",
                              color: form.results[item.key] === "pass" ? "#22C55E" : "#8A95A8",
                              fontSize:12, fontWeight:600, cursor:"pointer"
                            }}>PASS</button>
                          <button
                            onClick={() => setResult(item.key, "fail")}
                            style={{
                              padding:"4px 12px",
                              borderRadius:4,
                              border:"1px solid " + (form.results[item.key] === "fail" ? "#EF4444" : "#2A3348"),
                              background: form.results[item.key] === "fail" ? "rgba(239,68,68,0.15)" : "transparent",
                              color: form.results[item.key] === "fail" ? "#EF4444" : "#8A95A8",
                              fontSize:12, fontWeight:600, cursor:"pointer"
                            }}>FAIL</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="form-group">
                <label className="form-label">Notes on the vehicle</label>
                <textarea className="form-input" rows={3} value={form.notes}
                  onChange={e => update("notes", e.target.value)}
                  placeholder="Any additional notes or observations..." />
              </div>

              <div style={{display:"flex",gap:8,marginTop:6}}>
                <Btn style={{flex:1}} onClick={onClose} disabled={saving}>Cancel</Btn>
                <Btn variant="primary" style={{flex:1}} onClick={save} disabled={saving}>
                  {saving ? "Saving..." : "Submit inspection"}
                </Btn>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Inspection Template Editor (Settings → Inspection Form) ───────────────────
function InspectionTemplateEditor({ showToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [newOpen, setNewOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await sb("inspection_template", "?select=*&order=display_order");
      setItems(data);
    } catch (err) { showToast("Error loading: " + (err.message || err), "error"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  async function remove(item) {
    if (!window.confirm(`Remove "${item.label}" from inspection form? Existing inspection records keep their data.`)) return;
    try {
      await sbDelete("inspection_template", item.id);
      showToast("Item removed");
      load();
    } catch (err) { showToast("Error: " + (err.message || err), "error"); }
  }

  async function toggleActive(item) {
    try {
      await sbPatch("inspection_template", item.id, { active: !item.active });
      load();
    } catch (err) { showToast("Error: " + (err.message || err), "error"); }
  }

  return (
    <div>
      <div className="alert blue" style={{marginBottom:14}}>
        ✏ Edit, add, or remove items that appear on the truck inspection form. Inactive items stay in the database but don't show on new inspections.
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
        <Btn variant="primary" onClick={() => setNewOpen(true)}>+ Add inspection item</Btn>
      </div>
      {loading ? <div className="loading">Loading...</div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Order</th><th>Label</th><th>Category</th><th>Required</th><th>Active</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td style={{fontFamily:"monospace"}}>{item.display_order}</td>
                  <td><strong>{item.label}</strong><div style={{fontSize:11,color:"#8A95A8"}}>{item.key}</div></td>
                  <td>{item.category}</td>
                  <td>{item.required ? <Badge color="blue">Required</Badge> : <Badge color="gray">Optional</Badge>}</td>
                  <td>{item.active ? <Badge color="green">Active</Badge> : <Badge color="gray">Inactive</Badge>}</td>
                  <td>
                    <div style={{display:"flex",gap:6}}>
                      <Btn onClick={() => setEditing(item)}>Edit</Btn>
                      <Btn onClick={() => toggleActive(item)}>{item.active ? "Disable" : "Enable"}</Btn>
                      <Btn variant="red" onClick={() => remove(item)}>Remove</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(editing || newOpen) && (
        <InspectionItemModal
          item={editing}
          onClose={() => { setEditing(null); setNewOpen(false); }}
          onSaved={() => { setEditing(null); setNewOpen(false); load(); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function InspectionItemModal({ item, onClose, onSaved, showToast }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    key: item?.key || "",
    label: item?.label || "",
    category: item?.category || "safety",
    required: item?.required ?? true,
    display_order: item?.display_order || 100,
    active: item?.active ?? true
  });
  const [saving, setSaving] = useState(false);

  function update(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function save() {
    if (!form.label.trim()) { showToast("Label is required", "error"); return; }
    if (!form.key.trim()) { showToast("Key is required", "error"); return; }
    if (!/^[a-z0-9_]+$/.test(form.key)) { showToast("Key must be lowercase letters, numbers, or underscores only", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        key: form.key.trim(),
        label: form.label.trim(),
        category: form.category,
        required: form.required,
        display_order: parseInt(form.display_order, 10) || 100,
        active: form.active
      };
      if (isEdit) await sbPatch("inspection_template", item.id, payload);
      else await sbPost("inspection_template", payload);
      showToast(isEdit ? "Item updated" : "Item added");
      onSaved();
    } catch (err) {
      showToast("Error: " + (err.message || err), "error");
    }
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:460}}>
        <div className="modal-top">
          <div><div className="modal-title">{isEdit ? "Edit inspection item" : "+ Add inspection item"}</div></div>
          <div className="modal-close" onClick={onClose}>✕</div>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Label *</label>
            <input className="form-input" value={form.label}
              onChange={e => {
                update("label", e.target.value);
                if (!isEdit) update("key", e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""));
              }}
              placeholder="e.g. Spare Tire Present" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Key (auto from label) *</label>
            <input className="form-input" value={form.key}
              onChange={e => update("key", e.target.value)}
              style={{fontFamily:"monospace"}}
              placeholder="e.g. spare_tire" />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category}
                onChange={e => update("category", e.target.value)}>
                <option value="safety">Safety</option>
                <option value="cleanliness">Cleanliness</option>
                <option value="gear">Gear & Equipment</option>
                <option value="documentation">Documentation</option>
              </select>
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Order (lower = first)</label>
              <input className="form-input" type="number" value={form.display_order}
                onChange={e => update("display_order", e.target.value)} />
            </div>
          </div>
          <div style={{display:"flex",gap:18,marginBottom:14}}>
            <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,cursor:"pointer"}}>
              <input type="checkbox" checked={form.required}
                onChange={e => update("required", e.target.checked)} />
              Required
            </label>
            <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,cursor:"pointer"}}>
              <input type="checkbox" checked={form.active}
                onChange={e => update("active", e.target.checked)} />
              Active (shows on form)
            </label>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn style={{flex:1}} onClick={onClose} disabled={saving}>Cancel</Btn>
            <Btn variant="primary" style={{flex:1}} onClick={save} disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save changes" : "Add item"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Employee Modal ────────────────────────────────────────────────────────
function AddEmployeeModal({ onClose, onSaved, showToast }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    branch: "DFW",
    department: "",
    access_level: "employee",
    start_date: new Date().toISOString().slice(0,10),
    status: "onboarding"
  });
  const [saving, setSaving] = useState(false);

  function update(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function save() {
    if (!form.name.trim()) { showToast("Name is required", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        branch: form.branch,
        department: form.department || null,
        access_level: form.access_level,
        start_date: form.start_date || null,
        status: form.status
      };
      await sbPost("employees", payload);
      showToast(`${form.name.trim()} added`);
      onSaved();
      onClose();
    } catch (err) {
      showToast("Error adding employee: " + (err.message || err), "error");
    }
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:480}}>
        <div className="modal-top">
          <div>
            <div className="modal-title">+ Add employee</div>
            <div style={{fontSize:12,color:"#8A95A8",marginTop:3}}>
              Add a new team member to the database
            </div>
          </div>
          <div className="modal-close" onClick={onClose}>✕</div>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Full name *</label>
            <input className="form-input" value={form.name}
              onChange={e => update("name", e.target.value)}
              placeholder="First Last" autoFocus />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email}
                onChange={e => update("email", e.target.value)}
                placeholder="name@critterstop.com" />
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Phone</label>
              <input className="form-input" type="tel" value={form.phone}
                onChange={e => update("phone", e.target.value)}
                placeholder="(555) 123-4567" />
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Branch *</label>
              <select className="form-input" value={form.branch}
                onChange={e => update("branch", e.target.value)}>
                {["DFW","OKC","ATX","CStat","Office"].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Department</label>
              <select className="form-input" value={form.department}
                onChange={e => update("department", e.target.value)}>
                <option value="">— None —</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Access level *</label>
              <select className="form-input" value={form.access_level}
                onChange={e => update("access_level", e.target.value)}>
                <option value="employee">Employee</option>
                <option value="lead">Lead</option>
                <option value="manager">Manager</option>
                <option value="super_admin">Super admin</option>
              </select>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Start date</label>
              <input className="form-input" type="date" value={form.start_date}
                onChange={e => update("start_date", e.target.value)} />
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status}
                onChange={e => update("status", e.target.value)}>
                <option value="onboarding">Onboarding</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginTop:6}}>
            <Btn style={{flex:1}} onClick={onClose} disabled={saving}>Cancel</Btn>
            <Btn variant="primary" style={{flex:1}} onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Add employee"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── New Truck Modal (shared by Fleet "+ Add truck" and Settings → Trucks) ─────
function DriverHistorySection({ truckId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    sb("truck_driver_history",
      `?truck_id=eq.${truckId}&select=*,employee:employees(name)&order=assigned_at.desc`
    ).then(data => {
      if (!cancelled) { setHistory(data); setLoading(false); }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [truckId]);

  return (
    <div className="form-group">
      <label className="form-label">Driver history</label>
      {loading ? (
        <div style={{fontSize:12,color:"#8A95A8",padding:"6px 0"}}>Loading history...</div>
      ) : history.length === 0 ? (
        <div style={{fontSize:12,color:"#8A95A8",padding:"6px 0",fontStyle:"italic"}}>No previous driver assignments recorded.</div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:200,overflowY:"auto"}}>
          {history.map((h, idx) => {
            const isCurrent = !h.unassigned_at;
            const driverName = h.employee?.name || h.driver_name || "—";
            return (
              <div key={h.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:"#1E2535",border:"1px solid #2A3348",borderRadius:6,fontSize:12}}>
                <span style={{
                  width:6, height:6, borderRadius:"50%",
                  background: isCurrent ? "#22C55E" : "#4A5568",
                  flexShrink:0
                }} />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:500,color:"#E8EDF5"}}>
                    {driverName}
                    {isCurrent && <Badge color="green" style={{marginLeft:8,fontSize:9}}>Current</Badge>}
                  </div>
                  <div style={{fontSize:10,color:"#8A95A8",marginTop:2}}>
                    {formatLocalDate(h.assigned_at?.slice(0,10), { month:"short", day:"numeric", year:"numeric" })}
                    {h.unassigned_at && " → " + formatLocalDate(h.unassigned_at.slice(0,10), { month:"short", day:"numeric", year:"numeric" })}
                    {h.notes && <span style={{marginLeft:8,fontStyle:"italic"}}>· {h.notes}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewTruckModal({ employees, trucks, onClose, onSaved, showToast, editing, user }) {
  const isEdit = !!editing;
  const [form, setForm] = useState(() => editing ? {
    truck_number: editing.truck_number || "",
    year: editing.year || "",
    make: editing.make || "",
    model: editing.model || "",
    vin: editing.vin || "",
    plate: editing.plate || "",
    branch: editing.branch || "DFW",
    department: editing.department || "",
    driver_id: editing.assigned_employee_id || ""
  } : {
    truck_number: "",
    year: "", make: "", model: "", vin: "", plate: "",
    branch: "DFW", department: "", driver_id: ""
  });
  const [saving, setSaving] = useState(false);

  function update(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function save() {
    if (!form.year || !form.make || !form.model || !form.vin || !form.plate) {
      showToast("Year, make, model, VIN, and plate are required", "error"); return;
    }
    if (form.vin.length !== 17) { showToast("VIN must be exactly 17 characters", "error"); return; }
    setSaving(true);
    try {
      // Auto-assign next truck number if not editing and not provided
      let truckNumber = form.truck_number;
      if (!truckNumber) {
        const nums = trucks.map(t => parseInt(t.truck_number, 10)).filter(n => !isNaN(n));
        truckNumber = String(nums.length ? Math.max(...nums) + 1 : 1);
      }
      const payload = {
        truck_number: truckNumber,
        year: parseInt(form.year, 10),
        make: form.make.trim(),
        model: form.model.trim(),
        vin: form.vin.trim().toUpperCase(),
        plate: form.plate.trim().toUpperCase(),
        branch: form.branch,
        department: form.department || null
      };
      let savedTruck;
      if (isEdit) {
        const result = await sbPatch("trucks", editing.id, payload);
        savedTruck = Array.isArray(result) ? result[0] : result;
      } else {
        const result = await sbPost("trucks", payload);
        savedTruck = Array.isArray(result) ? result[0] : result;
      }
      // Assign driver: set the chosen employee's truck_id to this truck
      // Also record the driver change in truck_driver_history.
      if (form.driver_id) {
        // First unassign any other employee currently pointing at this truck (if editing)
        if (isEdit) {
          const oldDrivers = employees.filter(e => e.truck_id === editing.id && e.id !== form.driver_id);
          for (const e of oldDrivers) await sbPatch("employees", e.id, { truck_id: null });
        }
        await sbPatch("employees", form.driver_id, { truck_id: savedTruck.id });
        const newDriver = employees.find(e => e.id === form.driver_id);
        // Only record a change if the driver is actually changing
        const previousDriver = isEdit ? employees.find(e => e.truck_id === editing.id) : null;
        if (!previousDriver || previousDriver.id !== form.driver_id) {
          await recordDriverChange(savedTruck.id, form.driver_id, newDriver?.name, user?.id, isEdit ? "Reassigned via Edit Truck" : "Initial assignment");
        }
      } else if (isEdit) {
        // Driver cleared → unassign current driver
        const cur = employees.find(e => e.truck_id === editing.id);
        if (cur) {
          await sbPatch("employees", cur.id, { truck_id: null });
          await recordDriverChange(savedTruck.id, null, null, user?.id, "Cleared via Edit Truck");
        }
      }
      showToast(isEdit ? "Truck updated" : `Truck ${truckNumber} added`);
      onSaved();
      onClose();
    } catch (err) {
      showToast("Error saving truck: " + (err.message || err), "error");
    }
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:520}}>
        <div className="modal-top">
          <div>
            <div className="modal-title">{isEdit ? "Edit truck" : "+ New truck"}</div>
            <div style={{fontSize:12,color:"#8A95A8",marginTop:3}}>
              {isEdit ? "Update vehicle details" : "Add a new vehicle to the fleet"}
            </div>
          </div>
          <div className="modal-close" onClick={onClose}>✕</div>
        </div>
        <div className="modal-body">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Year *</label>
              <input className="form-input" type="number" placeholder="2024" value={form.year}
                onChange={e => update("year", e.target.value.replace(/\D/g,"").slice(0,4))} />
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Make *</label>
              <input className="form-input" placeholder="Ford" value={form.make}
                onChange={e => update("make", e.target.value)} />
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Model *</label>
              <input className="form-input" placeholder="F-150" value={form.model}
                onChange={e => update("model", e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">VIN * (17 characters)</label>
            <input className="form-input" placeholder="1FTMF1CB1JKF55242" value={form.vin}
              maxLength={17}
              style={{fontFamily:"monospace",textTransform:"uppercase"}}
              onChange={e => update("vin", e.target.value.toUpperCase())} />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">License plate *</label>
              <input className="form-input" placeholder="ABC1234" value={form.plate}
                style={{fontFamily:"monospace",textTransform:"uppercase"}}
                onChange={e => update("plate", e.target.value.toUpperCase())} />
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Branch *</label>
              <select className="form-input" value={form.branch}
                onChange={e => update("branch", e.target.value)}>
                {["DFW","OKC","ATX","CStat","Office"].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <select className="form-input" value={form.department}
              onChange={e => update("department", e.target.value)}>
              <option value="">— None —</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Assigned driver</label>
            <select className="form-input" value={form.driver_id}
              onChange={e => update("driver_id", e.target.value)}>
              <option value="">— Unassigned —</option>
              {employees
                .filter(e => e.status !== "inactive")
                .sort((a,b) => a.name.localeCompare(b.name))
                .map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.branch})</option>
                ))}
            </select>
          </div>
          {isEdit && <DriverHistorySection truckId={editing.id} />}
          {!isEdit && (
            <div className="form-group">
              <label className="form-label" style={{color:"#8A95A8"}}>Truck number (optional — auto-assigned if blank)</label>
              <input className="form-input" placeholder="Auto" value={form.truck_number}
                onChange={e => update("truck_number", e.target.value)} />
            </div>
          )}
          <div style={{display:"flex",gap:8,marginTop:6}}>
            <Btn style={{flex:1}} onClick={onClose} disabled={saving}>Cancel</Btn>
            <Btn variant="primary" style={{flex:1}} onClick={save} disabled={saving}>
              {saving ? "Saving..." : (isEdit ? "Save changes" : "Add truck to database")}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Card Modal (add / edit a single credit card row) ──────────────────────────
function CardModal({ mode, card, employees, onClose, onSaved, showToast }) {
  // mode: "add-assigned" | "add-inventory" | "edit-assigned" | "edit-inventory" | "assign-from-inventory"
  const isInventory = mode === "add-inventory" || mode === "edit-inventory";
  const isEdit = mode === "edit-assigned" || mode === "edit-inventory";
  const isAssign = mode === "assign-from-inventory";

  const [form, setForm] = useState(() => ({
    assigned_to: card?.assigned_to || "",
    name_on_card: card?.name_on_card || "",
    last4: card?.last4 || "",
    program: card?.program || "Capital One",
    notes: card?.notes || ""
  }));
  const [saving, setSaving] = useState(false);

  function update(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function save() {
    if (!form.name_on_card.trim()) { showToast("Name on card is required", "error"); return; }
    if (form.last4 && !/^\d{4}$/.test(form.last4)) { showToast("Last 4 must be exactly 4 digits (or blank)", "error"); return; }
    if (!isInventory && !form.assigned_to) { showToast("Assigned-to is required for assigned cards", "error"); return; }

    setSaving(true);
    try {
      const body = {
        name_on_card: form.name_on_card.trim(),
        last4: form.last4 || null,
        program: form.program,
        notes: form.notes.trim() || null
      };
      if (!isInventory) body.assigned_to = form.assigned_to;

      if (isAssign) {
        // Move from card_inventory → credit_cards
        await sbPost("credit_cards", body);
        await sbDelete("card_inventory", card.id);
        showToast("Card assigned to " + form.assigned_to);
      } else if (isEdit) {
        await sbPatch(isInventory ? "card_inventory" : "credit_cards", card.id, body);
        showToast("Card updated");
      } else {
        await sbPost(isInventory ? "card_inventory" : "credit_cards", body);
        showToast(isInventory ? "Card added to inventory" : "Card added");
      }
      onSaved();
      onClose();
    } catch (err) {
      showToast("Error saving card: " + (err.message || err), "error");
    }
    setSaving(false);
  }

  const title =
    isAssign ? "Assign card to person" :
    isEdit ? `Edit card ${card?.last4 ? "•••• " + card.last4 : ""}` :
    isInventory ? "+ Add card to inventory" : "+ Add assigned card";

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:460}}>
        <div className="modal-top">
          <div><div className="modal-title">{title}</div></div>
          <div className="modal-close" onClick={onClose}>✕</div>
        </div>
        <div className="modal-body">
          {!isInventory && (
            <div className="form-group">
              <label className="form-label">Assigned to *</label>
              <select className="form-input" value={form.assigned_to}
                onChange={e => update("assigned_to", e.target.value)}>
                <option value="">— Select person —</option>
                {employees
                  .filter(e => e.status !== "inactive")
                  .sort((a,b) => a.name.localeCompare(b.name))
                  .map(e => (
                    <option key={e.id} value={e.name}>{e.name} ({e.branch})</option>
                  ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Name on card *</label>
            <input className="form-input" value={form.name_on_card}
              onChange={e => update("name_on_card", e.target.value)}
              placeholder="As printed on the physical card" />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1.4fr",gap:10,marginBottom:10}}>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Last 4</label>
              <input className="form-input" value={form.last4} maxLength={4}
                style={{fontFamily:"monospace",textAlign:"center",letterSpacing:4}}
                placeholder="1234"
                onChange={e => update("last4", e.target.value.replace(/\D/g,"").slice(0,4))} />
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Program *</label>
              <select className="form-input" value={form.program}
                onChange={e => update("program", e.target.value)}>
                <option>Capital One</option>
                <option>BILL Spend & Expense</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="form-input" value={form.notes}
              onChange={e => update("notes", e.target.value)}
              placeholder="Optional notes" />
          </div>
          <div style={{display:"flex",gap:8,marginTop:6}}>
            <Btn style={{flex:1}} onClick={onClose} disabled={saving}>Cancel</Btn>
            <Btn variant="primary" style={{flex:1}} onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save to database"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Trucks (standalone module) ────────────────────────────────────────────────
function TrucksPage({ user, employees, setEmployees, trucks, setTrucks, showToast }) {
  const [truckModalOpen, setTruckModalOpen] = useState(false);
  const [truckEditing, setTruckEditing] = useState(null);
  const [truckBranch, setTruckBranch] = useState(user.branch === "All" || ["super_admin","manager"].includes(user.access_level) ? "All" : user.branch);
  const [q, setQ] = useState("");

  async function reloadTrucks() {
    try {
      const t = await sb("trucks", "?select=*,assigned_employee:employees(name)&order=truck_number");
      setTrucks(t);
      const e = await sb("employees", "?select=*&order=name");
      setEmployees(e);
    } catch (err) { showToast("Error refreshing: " + (err.message || err), "error"); }
  }

  async function removeTruck(t) {
    if (!window.confirm(`Remove truck ${t.truck_number} (${t.year || ""} ${t.make || ""} ${t.model || ""})? This cannot be undone.`)) return;
    try {
      const driver = employees.find(e => e.truck_id === t.id);
      if (driver) await sbPatch("employees", driver.id, { truck_id: null });
      await sbDelete("trucks", t.id);
      showToast("Truck removed");
      reloadTrucks();
    } catch (err) { showToast("Error removing truck: " + (err.message || err), "error"); }
  }

  const filtered = trucks.filter(t =>
    (truckBranch === "All" || t.branch === truckBranch) &&
    (!q ||
      t.truck_number?.toString().toLowerCase().includes(q.toLowerCase()) ||
      t.plate?.toLowerCase().includes(q.toLowerCase()) ||
      t.vin?.toLowerCase().includes(q.toLowerCase()) ||
      t.assigned_employee?.name?.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <select className="branch-select" value={truckBranch} onChange={e=>setTruckBranch(e.target.value)}>
          <option value="All">All branches ({trucks.length})</option>
          {["DFW","OKC","ATX","CStat","Office"].map(b => (
            <option key={b} value={b}>{b} ({trucks.filter(t => t.branch === b).length})</option>
          ))}
        </select>
        <div style={{flex:1,minWidth:200,display:"flex",alignItems:"center",gap:8,background:"#1E2535",border:"1px solid #2A3348",borderRadius:6,padding:"6px 11px"}}>
          <span style={{color:"#4A5568"}}>⌕</span>
          <input style={{background:"none",border:"none",outline:"none",color:"#E8EDF5",fontSize:13,flex:1,fontFamily:"DM Sans,sans-serif"}} placeholder="Search by truck number, plate, VIN, or driver..." value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <Btn variant="primary" onClick={() => { setTruckEditing(null); setTruckModalOpen(true); }}>
          + New truck
        </Btn>
      </div>
      <div className="table-wrap">
        <div className="table-head"><span className="table-title">Fleet ({filtered.length} trucks)</span></div>
        <table>
          <thead><tr><th>Truck #</th><th>Year/Make/Model</th><th>VIN</th><th>Plate</th><th>Branch</th><th>Driver</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state">No trucks {truckBranch === "All" ? "added yet" : "for this branch"} — click "+ New truck" to add one</div></td></tr>
            ) : filtered.map(t => (
              <tr key={t.id}>
                <td><strong>{t.truck_number}</strong></td>
                <td>{[t.year, t.make, t.model].filter(Boolean).join(" ") || <span style={{color:"#8A95A8"}}>—</span>}</td>
                <td style={{fontFamily:"monospace",fontSize:11}}>{t.vin || <span style={{color:"#8A95A8"}}>—</span>}</td>
                <td style={{fontFamily:"monospace"}}>{t.plate || <span style={{color:"#8A95A8"}}>—</span>}</td>
                <td>{t.branch}</td>
                <td>{t.assigned_employee?.name || <span style={{color:"#8A95A8"}}>Unassigned</span>}</td>
                <td>
                  <div style={{display:"flex",gap:6}}>
                    <Btn onClick={() => { setTruckEditing(t); setTruckModalOpen(true); }}>Edit</Btn>
                    <Btn variant="red" onClick={() => removeTruck(t)}>Remove</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {truckModalOpen && (
        <NewTruckModal
          employees={employees}
          trucks={trucks}
          editing={truckEditing}
          user={user}
          onClose={() => { setTruckModalOpen(false); setTruckEditing(null); }}
          onSaved={reloadTrucks}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ── Cards Tables (sortable) ──────────────────────────────────────────────────
function CardsAssignedTable({ cards, onEdit, onMoveToInventory, onRemove }) {
  const sort = useSortableData(cards, "assigned_to");
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>
          <SortableTh sortState={sort} sortKey="assigned_to">Assigned to</SortableTh>
          <SortableTh sortState={sort} sortKey="name_on_card">Name on card</SortableTh>
          <SortableTh sortState={sort} sortKey="last4">Last 4</SortableTh>
          <SortableTh sortState={sort} sortKey="program">Program</SortableTh>
          <th>Notes</th>
          <th>Actions</th>
        </tr></thead>
        <tbody>
          {sort.rows.length === 0 ? (
            <tr><td colSpan={6}><div className="empty-state">No cards match the current filters</div></td></tr>
          ) : sort.rows.map(c => (
            <tr key={c.id}>
              <td><strong>{c.assigned_to}</strong></td>
              <td>{c.name_on_card}</td>
              <td style={{fontFamily:"monospace"}}>{c.last4 ? "•••• " + c.last4 : <span style={{color:"#EF4444"}}>missing</span>}</td>
              <td><Badge color={c.program === "Capital One" ? "blue" : "purple"}>{c.program}</Badge></td>
              <td style={{fontSize:11,color:"#8A95A8"}}>{c.notes || "—"}</td>
              <td>
                <div style={{display:"flex",gap:6}}>
                  <Btn onClick={() => onEdit(c)}>Edit</Btn>
                  <Btn onClick={() => onMoveToInventory(c)}>→ Inventory</Btn>
                  <Btn variant="red" onClick={() => onRemove(c)}>Remove</Btn>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardsInventoryTable({ cards, onAssign, onEdit, onRemove }) {
  const sort = useSortableData(cards, "name_on_card");
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>
          <SortableTh sortState={sort} sortKey="name_on_card">Name on card</SortableTh>
          <SortableTh sortState={sort} sortKey="last4">Last 4</SortableTh>
          <SortableTh sortState={sort} sortKey="program">Program</SortableTh>
          <th>Notes</th>
          <th>Actions</th>
        </tr></thead>
        <tbody>
          {sort.rows.length === 0 ? (
            <tr><td colSpan={5}><div className="empty-state">Inventory is empty</div></td></tr>
          ) : sort.rows.map(c => (
            <tr key={c.id}>
              <td><strong>{c.name_on_card}</strong></td>
              <td style={{fontFamily:"monospace"}}>{c.last4 ? "•••• " + c.last4 : <span style={{color:"#EF4444"}}>missing</span>}</td>
              <td><Badge color={c.program === "Capital One" ? "blue" : "purple"}>{c.program}</Badge></td>
              <td style={{fontSize:11,color:"#8A95A8"}}>{c.notes || "—"}</td>
              <td>
                <div style={{display:"flex",gap:6}}>
                  <Btn variant="primary" onClick={() => onAssign(c)}>Assign to person</Btn>
                  <Btn onClick={() => onEdit(c)}>Edit</Btn>
                  <Btn variant="red" onClick={() => onRemove(c)}>Remove</Btn>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Credit Cards (standalone module) ──────────────────────────────────────────
function CardsPage({ user, employees, showToast }) {
  const [cardsTab, setCardsTab] = useState("assigned");
  const [creditCards, setCreditCards] = useState([]);
  const [cardInventory, setCardInventory] = useState([]);
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const [cardModal, setCardModal] = useState(null);
  const [cardProgFilter, setCardProgFilter] = useState("All");
  const [cardSearch, setCardSearch] = useState("");

  async function loadCards() {
    try {
      const [cc, inv] = await Promise.all([
        sb("credit_cards", "?select=*&order=assigned_to"),
        sb("card_inventory", "?select=*&order=name_on_card")
      ]);
      setCreditCards(cc);
      setCardInventory(inv);
      setCardsLoaded(true);
    } catch (err) {
      showToast("Error loading cards: " + (err.message || err), "error");
      setCardsLoaded(true);
    }
  }

  useEffect(() => { loadCards(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function removeCard(c, table) {
    if (!window.confirm(`Remove this ${table === "credit_cards" ? "assigned card" : "inventory card"}? This cannot be undone.`)) return;
    try {
      await sbDelete(table, c.id);
      showToast("Card removed");
      loadCards();
    } catch (err) { showToast("Error removing card: " + (err.message || err), "error"); }
  }

  async function moveCardToInventory(c) {
    if (!window.confirm(`Move ${c.assigned_to}'s card (${c.name_on_card}${c.last4 ? " ••••" + c.last4 : ""}) to inventory?`)) return;
    try {
      await sbPost("card_inventory", { name_on_card: c.name_on_card, last4: c.last4, program: c.program, notes: c.notes });
      await sbDelete("credit_cards", c.id);
      showToast("Card moved to inventory");
      loadCards();
    } catch (err) { showToast("Error moving card: " + (err.message || err), "error"); }
  }

  return (
    <div>
      <div className="alert blue" style={{marginBottom:14}}>
        💳 Credit cards are visible to managers and leads only. {creditCards.length} assigned · {cardInventory.length} in inventory.
      </div>
      <div className="tabs" style={{marginBottom:14}}>
        {[["assigned",`Assigned (${creditCards.length})`],["inventory",`Inventory (${cardInventory.length})`]].map(([t,l]) => (
          <button key={t} className={"tab-btn"+(cardsTab===t?" active":"")} onClick={()=>setCardsTab(t)}>{l}</button>
        ))}
      </div>

      {!cardsLoaded ? (
        <div className="loading">Loading cards...</div>
      ) : cardsTab === "assigned" ? (
        <div>
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:180,display:"flex",alignItems:"center",gap:8,background:"#1E2535",border:"1px solid #2A3348",borderRadius:6,padding:"6px 11px"}}>
              <span style={{color:"#4A5568"}}>⌕</span>
              <input style={{background:"none",border:"none",outline:"none",color:"#E8EDF5",fontSize:13,flex:1,fontFamily:"DM Sans,sans-serif"}} placeholder="Search by name or last 4..." value={cardSearch} onChange={e=>setCardSearch(e.target.value)} />
            </div>
            <select className="branch-select" value={cardProgFilter} onChange={e=>setCardProgFilter(e.target.value)}>
              <option value="All">All programs</option>
              <option value="Capital One">Capital One</option>
              <option value="BILL Spend & Expense">BILL Spend & Expense</option>
            </select>
            <Btn variant="primary" onClick={() => setCardModal({ mode: "add-assigned", card: null })}>+ Add card</Btn>
          </div>
          <CardsAssignedTable
            cards={creditCards.filter(c =>
              (cardProgFilter === "All" || c.program === cardProgFilter) &&
              (!cardSearch ||
                c.assigned_to?.toLowerCase().includes(cardSearch.toLowerCase()) ||
                c.name_on_card?.toLowerCase().includes(cardSearch.toLowerCase()) ||
                c.last4?.includes(cardSearch))
            )}
            onEdit={c => setCardModal({ mode: "edit-assigned", card: c })}
            onMoveToInventory={moveCardToInventory}
            onRemove={c => removeCard(c, "credit_cards")}
          />
        </div>
      ) : (
        <div>
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:180,display:"flex",alignItems:"center",gap:8,background:"#1E2535",border:"1px solid #2A3348",borderRadius:6,padding:"6px 11px"}}>
              <span style={{color:"#4A5568"}}>⌕</span>
              <input style={{background:"none",border:"none",outline:"none",color:"#E8EDF5",fontSize:13,flex:1,fontFamily:"DM Sans,sans-serif"}} placeholder="Search inventory..." value={cardSearch} onChange={e=>setCardSearch(e.target.value)} />
            </div>
            <Btn variant="primary" onClick={() => setCardModal({ mode: "add-inventory", card: null })}>+ Add to inventory</Btn>
          </div>
          <CardsInventoryTable
            cards={cardInventory.filter(c =>
              !cardSearch ||
              c.name_on_card?.toLowerCase().includes(cardSearch.toLowerCase()) ||
              c.last4?.includes(cardSearch)
            )}
            onAssign={c => setCardModal({ mode: "assign-from-inventory", card: c })}
            onEdit={c => setCardModal({ mode: "edit-inventory", card: c })}
            onRemove={c => removeCard(c, "card_inventory")}
          />
        </div>
      )}

      {cardModal && (
        <CardModal
          mode={cardModal.mode}
          card={cardModal.card}
          employees={employees}
          onClose={() => setCardModal(null)}
          onSaved={loadCards}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ── Settings Tables (sortable) ───────────────────────────────────────────────
function SettingsUsersTable({ users, currentUserId, onResetPin, onToggleAccess }) {
  const sort = useSortableData(users, "name");
  return (
    <div className="table-wrap">
      <div className="table-head"><span className="table-title">All users ({users.length})</span></div>
      <table>
        <thead><tr>
          <SortableTh sortState={sort} sortKey="name">Name</SortableTh>
          <SortableTh sortState={sort} sortKey="branch">Branch</SortableTh>
          <SortableTh sortState={sort} sortKey="access_level">Access level</SortableTh>
          <SortableTh sortState={sort} sortKey="status">Status</SortableTh>
          <th>PIN</th>
          <th>Actions</th>
        </tr></thead>
        <tbody>
          {sort.rows.map(e => (
            <tr key={e.id}>
              <td><strong>{e.name}</strong></td>
              <td>{e.branch}</td>
              <td><Badge color={accessColor(e.access_level)}>{accessLabel(e.access_level)}</Badge></td>
              <td><Badge color={statusColor(e.status)}>{e.status}</Badge></td>
              <td><span style={{fontFamily:"monospace",fontSize:13,letterSpacing:4,color:"#8A95A8"}}>••••</span></td>
              <td>
                <div style={{display:"flex",gap:6}}>
                  <Btn onClick={() => onResetPin(e)}>Reset PIN</Btn>
                  {e.id !== currentUserId && <Btn onClick={() => onToggleAccess(e)}>{e.access_level==="employee"?"Make lead":"Make employee"}</Btn>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettingsProductsTable({ products }) {
  const sort = useSortableData(products, "name");
  return (
    <div className="table-wrap">
      <div className="table-head"><span className="table-title">Product catalog ({products.filter(p=>p.active).length} active)</span><Btn variant="primary" onClick={()=>{}}>+ Add product</Btn></div>
      <table>
        <thead><tr>
          <SortableTh sortState={sort} sortKey="name">Product</SortableTh>
          <SortableTh sortState={sort} sortKey="category">Category</SortableTh>
          <SortableTh sortState={sort} sortKey="unit_cost">Unit cost</SortableTh>
          <SortableTh sortState={sort} sortKey="unit_of_measure">Per</SortableTh>
          <SortableTh sortState={sort} sortKey="reorder_threshold">Reorder min</SortableTh>
          <SortableTh sortState={sort} sortKey="supplier">Supplier</SortableTh>
          <SortableTh sortState={sort} sortKey="active">Active</SortableTh>
        </tr></thead>
        <tbody>
          {sort.rows.map(p => (
            <tr key={p.id}>
              <td><strong>{p.name}</strong>{p.notes ? <span style={{fontSize:11,color:"#8A95A8",marginLeft:6}}>{p.notes}</span> : null}</td>
              <td><Badge color={p.category==="Pest"?"amber":p.category==="Wildlife"?"green":p.category==="Rodent"?"red":p.category==="Mosquito"?"teal":p.category==="Termite"?"purple":"blue"}>{p.category}</Badge></td>
              <td style={{fontFamily:"monospace"}}>${p.unit_cost > 0 ? p.unit_cost.toFixed(2) : "—"}</td>
              <td style={{color:"#8A95A8",fontSize:12}}>{p.unit_of_measure}</td>
              <td style={{fontFamily:"monospace"}}>{p.reorder_threshold > 0 ? p.reorder_threshold : "—"}</td>
              <td>{p.supplier}</td>
              <td><Badge color={p.active?"green":"gray"}>{p.active?"Active":"Inactive"}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettingsEmployeesTable({ employees }) {
  const sort = useSortableData(employees, "name");
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>
          <SortableTh sortState={sort} sortKey="name">Name</SortableTh>
          <SortableTh sortState={sort} sortKey="email">Email</SortableTh>
          <SortableTh sortState={sort} sortKey="branch">Branch</SortableTh>
          <SortableTh sortState={sort} sortKey="start_date">Start date</SortableTh>
          <SortableTh sortState={sort} sortKey="access_level">Access</SortableTh>
          <SortableTh sortState={sort} sortKey="status">Status</SortableTh>
          <th>Actions</th>
        </tr></thead>
        <tbody>
          {sort.rows.map(e => (
            <tr key={e.id}>
              <td><strong>{e.name}</strong></td>
              <td style={{fontSize:11,color:"#8A95A8"}}>{e.email || "—"}</td>
              <td>{e.branch}</td>
              <td style={{fontSize:12,color:"#8A95A8"}}>{formatLocalDate(e.start_date)}</td>
              <td><Badge color={accessColor(e.access_level)}>{accessLabel(e.access_level)}</Badge></td>
              <td><Badge color={statusColor(e.status)}>{e.status}</Badge></td>
              <td><div style={{display:"flex",gap:6}}><Btn>Edit</Btn><Btn variant="red">Deactivate</Btn></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Settings Shops Tab ───────────────────────────────────────────────────────
function SettingsShopsTab({ shops, reloadShops, showToast }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const sort = useSortableData(shops || [], "name");

  async function toggleActive(shop) {
    try {
      await sbPatch("shops", shop.id, { active: !shop.active });
      showToast(shop.active ? "Shop deactivated" : "Shop activated");
      reloadShops();
    } catch (err) { showToast("Error: " + (err.message || err), "error"); }
  }

  return (
    <div>
      <div className="alert blue" style={{marginBottom:14}}>
        🏪 Shops are the physical locations where you store inventory. Each shop has a branch (the city/region) and an optional department (Pest, Wildlife, etc.). Deactivating a shop hides it from inventory dropdowns but keeps historical data intact.
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
        <Btn variant="primary" onClick={() => { setEditing(null); setModalOpen(true); }}>+ Add shop</Btn>
      </div>
      <div className="table-wrap">
        <div className="table-head"><span className="table-title">All shops ({(shops || []).length})</span></div>
        <table>
          <thead><tr>
            <SortableTh sortState={sort} sortKey="name">Shop name</SortableTh>
            <SortableTh sortState={sort} sortKey="branch">Branch</SortableTh>
            <SortableTh sortState={sort} sortKey="department">Department</SortableTh>
            <SortableTh sortState={sort} sortKey="active">Status</SortableTh>
            <th>Notes</th>
            <th>Actions</th>
          </tr></thead>
          <tbody>
            {sort.rows.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state">No shops yet — click "+ Add shop" to create your first one</div></td></tr>
            ) : sort.rows.map(s => (
              <tr key={s.id}>
                <td><strong>{s.name}</strong></td>
                <td>{s.branch}</td>
                <td>{s.department ? <Badge color={deptColor(s.department)}>{s.department}</Badge> : <span style={{color:"#8A95A8"}}>—</span>}</td>
                <td>{s.active ? <Badge color="green">Active</Badge> : <Badge color="gray">Inactive</Badge>}</td>
                <td style={{fontSize:11,color:"#8A95A8",maxWidth:240}}>{s.notes || "—"}</td>
                <td>
                  <div style={{display:"flex",gap:6}}>
                    <Btn onClick={() => { setEditing(s); setModalOpen(true); }}>Edit</Btn>
                    <Btn variant={s.active ? "red" : "primary"} onClick={() => toggleActive(s)}>{s.active ? "Deactivate" : "Reactivate"}</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <ShopModal
          shop={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSaved={() => { setModalOpen(false); setEditing(null); reloadShops(); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function ShopModal({ shop, onClose, onSaved, showToast }) {
  const isEdit = !!shop;
  const [form, setForm] = useState({
    name: shop?.name || "",
    branch: shop?.branch || "DFW",
    department: shop?.department || "",
    notes: shop?.notes || "",
    active: shop?.active ?? true
  });
  const [saving, setSaving] = useState(false);

  function update(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function save() {
    if (!form.name.trim()) { showToast("Shop name is required", "error"); return; }
    if (!form.branch) { showToast("Branch is required", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        branch: form.branch,
        department: form.department || null,
        notes: form.notes.trim() || null,
        active: form.active
      };
      if (isEdit) await sbPatch("shops", shop.id, payload);
      else await sbPost("shops", payload);
      showToast(isEdit ? "Shop updated" : "Shop created");
      onSaved();
    } catch (err) {
      // Detect unique-name conflict
      const msg = (err.message || "").toLowerCase();
      if (msg.includes("unique") || msg.includes("duplicate")) {
        showToast("A shop with that name already exists", "error");
      } else {
        showToast("Error: " + (err.message || err), "error");
      }
    }
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:460}}>
        <div className="modal-top">
          <div>
            <div className="modal-title">{isEdit ? "Edit shop" : "+ Add shop"}</div>
            <div style={{fontSize:12,color:"#8A95A8",marginTop:3}}>
              {isEdit ? "Update shop details" : "Create a new physical inventory location"}
            </div>
          </div>
          <div className="modal-close" onClick={onClose}>✕</div>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Shop name *</label>
            <input className="form-input" value={form.name}
              onChange={e => update("name", e.target.value)} autoFocus
              placeholder="e.g. McKinney Warehouse, Frisco Pest Shop" />
            <div style={{fontSize:11,color:"#8A95A8",marginTop:4}}>Must be unique. This is the display name shown in inventory dropdowns.</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Branch *</label>
              <select className="form-input" value={form.branch}
                onChange={e => update("branch", e.target.value)}>
                {BASE_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Department</label>
              <select className="form-input" value={form.department}
                onChange={e => update("department", e.target.value)}>
                <option value="">— None —</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-input" rows={2} value={form.notes}
              onChange={e => update("notes", e.target.value)}
              placeholder="Address, contact info, anything else..." />
          </div>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,cursor:"pointer",marginBottom:14}}>
            <input type="checkbox" checked={form.active}
              onChange={e => update("active", e.target.checked)} />
            Active (shows in inventory dropdowns)
          </label>
          <div style={{display:"flex",gap:8}}>
            <Btn style={{flex:1}} onClick={onClose} disabled={saving}>Cancel</Btn>
            <Btn variant="primary" style={{flex:1}} onClick={save} disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save changes" : "Create shop"}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────
function Settings({ user, employees, setEmployees, products, setProducts, trucks, setTrucks, shops, reloadShops, showToast }) {
  const [tab, setTab] = useState("users");
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [pinTarget, setPinTarget] = useState(null);
  const [newPin, setNewPin] = useState("");
  const [empBranch, setEmpBranch] = useState("All");
  const [settingsAddEmpOpen, setSettingsAddEmpOpen] = useState(false);

  async function reloadEmployees() {
    try {
      const e = await sb("employees", "?select=*&order=name");
      setEmployees(e);
    } catch (err) { showToast("Error refreshing: " + (err.message || err), "error"); }
  }

  // Trucks tab state
  const [truckModalOpen, setTruckModalOpen] = useState(false);
  const [truckEditing, setTruckEditing] = useState(null);
  const [truckBranch, setTruckBranch] = useState("All");

  // Cards tab state
  const [cardsTab, setCardsTab] = useState("assigned"); // "assigned" | "inventory"
  const [creditCards, setCreditCards] = useState([]);
  const [cardInventory, setCardInventory] = useState([]);
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const [cardModal, setCardModal] = useState(null); // { mode, card }
  const [cardProgFilter, setCardProgFilter] = useState("All");
  const [cardSearch, setCardSearch] = useState("");

  // Load credit cards on first visit to that tab
  async function loadCards() {
    try {
      const [cc, inv] = await Promise.all([
        sb("credit_cards", "?select=*&order=assigned_to"),
        sb("card_inventory", "?select=*&order=name_on_card")
      ]);
      setCreditCards(cc);
      setCardInventory(inv);
      setCardsLoaded(true);
    } catch (err) {
      showToast("Error loading cards: " + (err.message || err), "error");
    }
  }

  useEffect(() => {
    if (tab === "cards" && !cardsLoaded) loadCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function reloadTrucks() {
    try {
      const t = await sb("trucks", "?select=*,assigned_employee:employees(name)&order=truck_number");
      setTrucks(t);
      // Also refresh employees so truck_id changes show up
      const e = await sb("employees", "?select=*&order=name");
      setEmployees(e);
    } catch (err) {
      showToast("Error refreshing trucks: " + (err.message || err), "error");
    }
  }

  async function removeTruck(t) {
    if (!window.confirm(`Remove truck ${t.truck_number} (${t.year || ""} ${t.make || ""} ${t.model || ""})? This cannot be undone.`)) return;
    try {
      // First unassign the driver
      const driver = employees.find(e => e.truck_id === t.id);
      if (driver) await sbPatch("employees", driver.id, { truck_id: null });
      await sbDelete("trucks", t.id);
      showToast("Truck removed");
      reloadTrucks();
    } catch (err) {
      showToast("Error removing truck: " + (err.message || err), "error");
    }
  }

  async function removeCard(c, table) {
    if (!window.confirm(`Remove this ${table === "credit_cards" ? "assigned card" : "inventory card"}? This cannot be undone.`)) return;
    try {
      await sbDelete(table, c.id);
      showToast("Card removed");
      loadCards();
    } catch (err) {
      showToast("Error removing card: " + (err.message || err), "error");
    }
  }

  async function moveCardToInventory(c) {
    if (!window.confirm(`Move ${c.assigned_to}'s card (${c.name_on_card}${c.last4 ? " ••••" + c.last4 : ""}) to inventory? This will unassign it from ${c.assigned_to}.`)) return;
    try {
      await sbPost("card_inventory", {
        name_on_card: c.name_on_card,
        last4: c.last4,
        program: c.program,
        notes: c.notes
      });
      await sbDelete("credit_cards", c.id);
      showToast("Card moved to inventory");
      loadCards();
    } catch (err) {
      showToast("Error moving card: " + (err.message || err), "error");
    }
  }

  const filteredUsers = employees.filter(e =>
    (roleFilter === "All" || (roleFilter === "managers" && e.access_level !== "employee") || (roleFilter === "employees" && e.access_level === "employee")) &&
    (!q || e.name.toLowerCase().includes(q.toLowerCase()) || e.branch.toLowerCase().includes(q.toLowerCase()))
  );

  async function savePin() {
    if (!/^[0-9]{4}$/.test(newPin)) { showToast("PIN must be exactly 4 digits", "error"); return; }
    try {
      await sbPatch("employees", pinTarget.id, { pin_hash: newPin });
      setEmployees(prev => prev.map(e => e.id === pinTarget.id ? { ...e, pin_hash: newPin } : e));
      setPinTarget(null); setNewPin("");
      showToast("PIN updated for " + pinTarget.name);
    } catch { showToast("Error saving PIN", "error"); }
  }

  async function toggleAccess(emp) {
    if (emp.id === user.id) { showToast("Cannot change your own access level", "error"); return; }
    const newLevel = emp.access_level === "employee" ? "lead" : "employee";
    try {
      await sbPatch("employees", emp.id, { access_level: newLevel });
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, access_level: newLevel } : e));
      showToast("Access updated for " + emp.name);
    } catch { showToast("Error updating access", "error"); }
  }

  async function resetAllPins() {
    if (!window.confirm("Reset ALL PINs to 0000? This cannot be undone.")) return;
    try {
      await Promise.all(employees.filter(e => e.id !== user.id).map(e => sbPatch("employees", e.id, { pin_hash: "0000" })));
      setEmployees(prev => prev.map(e => e.id === user.id ? e : { ...e, pin_hash: "0000" }));
      showToast("All PINs reset to 0000");
    } catch { showToast("Error resetting PINs", "error"); }
  }

  return (
    <div>
      <div className="tabs">
        {[["users","Users & PINs"],["products","Products"],["employees","Employees"],["shops","Shops"],["inspection","Inspection Form"]].map(([t,l]) => (
          <button key={t} className={"tab-btn"+(tab===t?" active":"")} onClick={()=>setTab(t)}>{l}</button>
        ))}
      </div>

      {tab === "users" && (
        <div>
          <div className="alert blue" style={{marginBottom:14}}>🔒 Only super admins can reset PINs. Changes are saved to the live database instantly.</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div className="table-wrap" style={{margin:0}}>
              <div className="table-head"><span className="table-title">Access levels</span></div>
              <div style={{padding:"0 14px"}}>
                <div className="kv"><span className="kv-key">Super admin</span><span style={{color:"#A855F7",fontSize:12}}>Jonathan & Chisam — full access</span></div>
                <div className="kv"><span className="kv-key">Manager</span><span style={{color:"#22C55E",fontSize:12}}>Branch managers — full branch access</span></div>
                <div className="kv"><span className="kv-key">Lead</span><span style={{color:"#3B82F6",fontSize:12}}>Crew leads — manage their team</span></div>
                <div className="kv"><span className="kv-key">Employee</span><span style={{fontSize:12,color:"#8A95A8"}}>Time off + Inventory only</span></div>
                <div className="kv"><span className="kv-key">Default PIN</span><span style={{fontFamily:"monospace",color:"#8A95A8"}}>0000</span></div>
              </div>
            </div>
            <div className="table-wrap" style={{margin:0}}>
              <div className="table-head"><span className="table-title">Quick actions</span></div>
              <div style={{padding:"12px 14px",display:"flex",flexDirection:"column",gap:8}}>
                <Btn onClick={resetAllPins}>↺ Reset ALL employee PINs to 0000</Btn>
                <Btn variant="primary" onClick={()=>{}}>+ Add new user</Btn>
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:180,display:"flex",alignItems:"center",gap:8,background:"#1E2535",border:"1px solid #2A3348",borderRadius:6,padding:"6px 11px"}}>
              <span style={{color:"#4A5568"}}>⌕</span>
              <input style={{background:"none",border:"none",outline:"none",color:"#E8EDF5",fontSize:13,flex:1,fontFamily:"DM Sans,sans-serif"}} placeholder="Search users..." value={q} onChange={e=>setQ(e.target.value)} />
            </div>
            <select className="branch-select" value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}>
              <option value="All">All roles</option>
              <option value="managers">Managers + leads</option>
              <option value="employees">Employees only</option>
            </select>
          </div>
          <SettingsUsersTable users={filteredUsers} currentUserId={user.id} onResetPin={(e) => { setPinTarget(e); setNewPin(""); }} onToggleAccess={toggleAccess} />
          {pinTarget && (
            <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setPinTarget(null)}>
              <div className="modal modal-sm">
                <div className="modal-top">
                  <div><div className="modal-title">Reset PIN — {pinTarget.name}</div><div style={{fontSize:12,color:"#8A95A8",marginTop:3}}>{pinTarget.branch} · {accessLabel(pinTarget.access_level)}</div></div>
                  <div className="modal-close" onClick={() => setPinTarget(null)}>✕</div>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">New PIN (4 digits)</label>
                    <input className="form-input" type="text" maxLength={4} value={newPin}
                      onChange={e => setNewPin(e.target.value.replace(/\D/g,""))}
                      placeholder="0000" style={{fontSize:28,letterSpacing:12,textAlign:"center",fontFamily:"monospace"}} />
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <Btn style={{flex:1}} onClick={() => setPinTarget(null)}>Cancel</Btn>
                    <Btn variant="primary" style={{flex:1}} onClick={savePin}>Save PIN to database</Btn>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "products" && (
        <SettingsProductsTable products={products} />
      )}

      {tab === "employees" && (
        <div>
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            <select className="branch-select" value={empBranch} onChange={e=>setEmpBranch(e.target.value)}>
              <option value="All">All branches</option>
              {["DFW","OKC","ATX","CStat","Office"].map(b=><option key={b} value={b}>{b}</option>)}
            </select>
            <Btn variant="primary" onClick={() => setSettingsAddEmpOpen(true)}>+ Add employee</Btn>
          </div>
          <SettingsEmployeesTable employees={employees.filter(e => empBranch === "All" || e.branch === empBranch)} />
        </div>
      )}

      {tab === "shops" && <SettingsShopsTab shops={shops} reloadShops={reloadShops} showToast={showToast} />}

      {tab === "inspection" && <InspectionTemplateEditor showToast={showToast} />}

      {tab === "trucks" && (
        <div>
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
            <select className="branch-select" value={truckBranch} onChange={e=>setTruckBranch(e.target.value)}>
              <option value="All">All branches ({trucks.length})</option>
              {["DFW","OKC","ATX","CStat","Office"].map(b => (
                <option key={b} value={b}>{b} ({trucks.filter(t => t.branch === b).length})</option>
              ))}
            </select>
            <div style={{flex:1}} />
            <Btn variant="primary" onClick={() => { setTruckEditing(null); setTruckModalOpen(true); }}>
              + New truck
            </Btn>
          </div>
          <div className="table-wrap">
            <div className="table-head"><span className="table-title">Fleet ({trucks.filter(t => truckBranch === "All" || t.branch === truckBranch).length} trucks)</span></div>
            <table>
              <thead><tr><th>Truck #</th><th>Year/Make/Model</th><th>VIN</th><th>Plate</th><th>Branch</th><th>Driver</th><th>Actions</th></tr></thead>
              <tbody>
                {trucks.filter(t => truckBranch === "All" || t.branch === truckBranch).length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state">No trucks {truckBranch === "All" ? "added yet" : "for this branch"} — click "+ New truck" to add one</div></td></tr>
                ) : trucks.filter(t => truckBranch === "All" || t.branch === truckBranch).map(t => (
                  <tr key={t.id}>
                    <td><strong>{t.truck_number}</strong></td>
                    <td>{[t.year, t.make, t.model].filter(Boolean).join(" ") || <span style={{color:"#8A95A8"}}>—</span>}</td>
                    <td style={{fontFamily:"monospace",fontSize:11}}>{t.vin || <span style={{color:"#8A95A8"}}>—</span>}</td>
                    <td style={{fontFamily:"monospace"}}>{t.plate || <span style={{color:"#8A95A8"}}>—</span>}</td>
                    <td>{t.branch}</td>
                    <td>{t.assigned_employee?.name || <span style={{color:"#8A95A8"}}>Unassigned</span>}</td>
                    <td>
                      <div style={{display:"flex",gap:6}}>
                        <Btn onClick={() => { setTruckEditing(t); setTruckModalOpen(true); }}>Edit</Btn>
                        <Btn variant="red" onClick={() => removeTruck(t)}>Remove</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {truckModalOpen && (
            <NewTruckModal
              employees={employees}
              trucks={trucks}
              editing={truckEditing}
              user={user}
              onClose={() => { setTruckModalOpen(false); setTruckEditing(null); }}
              onSaved={reloadTrucks}
              showToast={showToast}
            />
          )}
        </div>
      )}

      {tab === "cards" && (
        <div>
          <div className="alert blue" style={{marginBottom:14}}>
            💳 Credit cards are visible to managers and leads only. {creditCards.length} assigned · {cardInventory.length} in inventory.
          </div>
          <div className="tabs" style={{marginBottom:14}}>
            {[["assigned",`Assigned (${creditCards.length})`],["inventory",`Inventory (${cardInventory.length})`]].map(([t,l]) => (
              <button key={t} className={"tab-btn"+(cardsTab===t?" active":"")} onClick={()=>setCardsTab(t)}>{l}</button>
            ))}
          </div>

          {!cardsLoaded ? (
            <div className="loading">Loading cards...</div>
          ) : cardsTab === "assigned" ? (
            <div>
              <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:180,display:"flex",alignItems:"center",gap:8,background:"#1E2535",border:"1px solid #2A3348",borderRadius:6,padding:"6px 11px"}}>
                  <span style={{color:"#4A5568"}}>⌕</span>
                  <input style={{background:"none",border:"none",outline:"none",color:"#E8EDF5",fontSize:13,flex:1,fontFamily:"DM Sans,sans-serif"}} placeholder="Search by name or last 4..." value={cardSearch} onChange={e=>setCardSearch(e.target.value)} />
                </div>
                <select className="branch-select" value={cardProgFilter} onChange={e=>setCardProgFilter(e.target.value)}>
                  <option value="All">All programs</option>
                  <option value="Capital One">Capital One</option>
                  <option value="BILL Spend & Expense">BILL Spend & Expense</option>
                </select>
                <Btn variant="primary" onClick={() => setCardModal({ mode: "add-assigned", card: null })}>+ Add card</Btn>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Assigned to</th><th>Name on card</th><th>Last 4</th><th>Program</th><th>Notes</th><th>Actions</th></tr></thead>
                  <tbody>
                    {(() => {
                      const filtered = creditCards.filter(c =>
                        (cardProgFilter === "All" || c.program === cardProgFilter) &&
                        (!cardSearch ||
                          c.assigned_to?.toLowerCase().includes(cardSearch.toLowerCase()) ||
                          c.name_on_card?.toLowerCase().includes(cardSearch.toLowerCase()) ||
                          c.last4?.includes(cardSearch))
                      );
                      if (filtered.length === 0) return (
                        <tr><td colSpan={6}><div className="empty-state">No cards match the current filters</div></td></tr>
                      );
                      return filtered.map(c => (
                        <tr key={c.id}>
                          <td><strong>{c.assigned_to}</strong></td>
                          <td>{c.name_on_card}</td>
                          <td style={{fontFamily:"monospace"}}>{c.last4 ? "•••• " + c.last4 : <span style={{color:"#EF4444"}}>missing</span>}</td>
                          <td><Badge color={c.program === "Capital One" ? "blue" : "purple"}>{c.program}</Badge></td>
                          <td style={{fontSize:11,color:"#8A95A8"}}>{c.notes || "—"}</td>
                          <td>
                            <div style={{display:"flex",gap:6}}>
                              <Btn onClick={() => setCardModal({ mode: "edit-assigned", card: c })}>Edit</Btn>
                              <Btn onClick={() => moveCardToInventory(c)}>→ Inventory</Btn>
                              <Btn variant="red" onClick={() => removeCard(c, "credit_cards")}>Remove</Btn>
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:180,display:"flex",alignItems:"center",gap:8,background:"#1E2535",border:"1px solid #2A3348",borderRadius:6,padding:"6px 11px"}}>
                  <span style={{color:"#4A5568"}}>⌕</span>
                  <input style={{background:"none",border:"none",outline:"none",color:"#E8EDF5",fontSize:13,flex:1,fontFamily:"DM Sans,sans-serif"}} placeholder="Search inventory..." value={cardSearch} onChange={e=>setCardSearch(e.target.value)} />
                </div>
                <Btn variant="primary" onClick={() => setCardModal({ mode: "add-inventory", card: null })}>+ Add to inventory</Btn>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name on card</th><th>Last 4</th><th>Program</th><th>Notes</th><th>Actions</th></tr></thead>
                  <tbody>
                    {(() => {
                      const filtered = cardInventory.filter(c =>
                        !cardSearch ||
                        c.name_on_card?.toLowerCase().includes(cardSearch.toLowerCase()) ||
                        c.last4?.includes(cardSearch)
                      );
                      if (filtered.length === 0) return (
                        <tr><td colSpan={5}><div className="empty-state">Inventory is empty</div></td></tr>
                      );
                      return filtered.map(c => (
                        <tr key={c.id}>
                          <td><strong>{c.name_on_card}</strong></td>
                          <td style={{fontFamily:"monospace"}}>{c.last4 ? "•••• " + c.last4 : <span style={{color:"#EF4444"}}>missing</span>}</td>
                          <td><Badge color={c.program === "Capital One" ? "blue" : "purple"}>{c.program}</Badge></td>
                          <td style={{fontSize:11,color:"#8A95A8"}}>{c.notes || "—"}</td>
                          <td>
                            <div style={{display:"flex",gap:6}}>
                              <Btn variant="primary" onClick={() => setCardModal({ mode: "assign-from-inventory", card: c })}>Assign to person</Btn>
                              <Btn onClick={() => setCardModal({ mode: "edit-inventory", card: c })}>Edit</Btn>
                              <Btn variant="red" onClick={() => removeCard(c, "card_inventory")}>Remove</Btn>
                            </div>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {cardModal && (
            <CardModal
              mode={cardModal.mode}
              card={cardModal.card}
              employees={employees}
              onClose={() => setCardModal(null)}
              onSaved={loadCards}
              showToast={showToast}
            />
          )}
        </div>
      )}
      {settingsAddEmpOpen && <AddEmployeeModal onClose={() => setSettingsAddEmpOpen(false)} onSaved={reloadEmployees} showToast={showToast} />}
    </div>
  );
}

// ── Employee Documents (used inside ProfileModal) ────────────────────────────
function EmployeeDocuments({ employeeId, employeeName, canManage, currentUser, showToast }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await sb("employee_documents",
        `?employee_id=eq.${employeeId}&select=*&order=uploaded_at.desc`);
      setDocs(data);
    } catch (err) { showToast("Error loading documents: " + (err.message || err), "error"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [employeeId]); // eslint-disable-line

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { showToast("File too large (25MB max)", "error"); return; }
    setUploading(true);
    try {
      // Build storage path: employees/{employee_id}/{timestamp}-{filename}
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `employees/${employeeId}/${Date.now()}-${safe}`;
      await sbStorageUpload("employee-documents", path, file);
      await sbPost("employee_documents", {
        employee_id: employeeId,
        file_name: file.name,
        storage_path: path,
        mime_type: file.type || null,
        file_size: file.size,
        uploaded_by: currentUser.id,
        uploader_name: currentUser.name
      });
      showToast("Document uploaded");
      load();
    } catch (err) {
      showToast("Upload failed: " + (err.message || err), "error");
    }
    setUploading(false);
    e.target.value = ""; // reset input
  }

  async function handleDownload(doc) {
    try {
      const url = await sbStorageSignedUrl("employee-documents", doc.storage_path, 60);
      window.open(url, "_blank");
    } catch (err) { showToast("Download failed: " + (err.message || err), "error"); }
  }

  async function handleDelete(doc) {
    if (!window.confirm(`Delete "${doc.file_name}"? This cannot be undone.`)) return;
    try {
      await sbStorageDelete("employee-documents", doc.storage_path);
      await sbDelete("employee_documents", doc.id);
      showToast("Document deleted");
      load();
    } catch (err) { showToast("Delete failed: " + (err.message || err), "error"); }
  }

  return (
    <div>
      {canManage && (
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <label style={{flex:1, position:"relative", overflow:"hidden"}}>
            <input
              type="file"
              onChange={handleUpload}
              disabled={uploading}
              style={{position:"absolute",left:-9999,top:0,opacity:0,width:0,height:0}}
            />
            <div className="btn btn-primary" style={{width:"100%",cursor:uploading?"wait":"pointer",textAlign:"center",pointerEvents:uploading?"none":"auto"}}>
              {uploading ? "Uploading..." : "+ Upload document"}
            </div>
          </label>
        </div>
      )}

      {loading ? (
        <div style={{padding:"10px 0",fontSize:12,color:"#8A95A8"}}>Loading documents...</div>
      ) : docs.length === 0 ? (
        <div style={{padding:"10px 0",fontSize:13,color:"#8A95A8"}}>No documents on file{canManage ? " — upload above" : ""}.</div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {docs.map(doc => (
            <div key={doc.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",background:"#1E2535",border:"1px solid #2A3348",borderRadius:6,fontSize:12}}>
              <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0,flex:1}}>
                <div style={{fontSize:18,flexShrink:0}}>{fileIcon(doc.mime_type)}</div>
                <div style={{minWidth:0,flex:1}}>
                  <div style={{fontWeight:500,color:"#E8EDF5",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{doc.file_name}</div>
                  <div style={{fontSize:10,color:"#8A95A8",marginTop:2}}>
                    {formatFileSize(doc.file_size)} · uploaded by {doc.uploader_name || "—"} · {new Date(doc.uploaded_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                <Btn onClick={() => handleDownload(doc)}>Download</Btn>
                {canManage && <Btn variant="red" onClick={() => handleDelete(doc)}>Delete</Btn>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Company Documents (standalone module — all roles can view) ───────────────
function CompanyDocsPage({ user, showToast }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showMeta, setShowMeta] = useState(null); // pending file for metadata input
  const [meta, setMeta] = useState({ title: "", description: "" });
  const [q, setQ] = useState("");

  const canManage = ["super_admin","manager","lead"].includes(user.access_level);

  async function load() {
    setLoading(true);
    try {
      const data = await sb("company_documents", "?select=*&order=uploaded_at.desc");
      setDocs(data);
    } catch (err) { showToast("Error loading documents: " + (err.message || err), "error"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line

  function pickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { showToast("File too large (50MB max)", "error"); e.target.value = ""; return; }
    setShowMeta(file);
    setMeta({ title: file.name.replace(/\.[^/.]+$/, ""), description: "" });
    e.target.value = "";
  }

  async function confirmUpload() {
    if (!showMeta) return;
    const file = showMeta;
    setUploading(true);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `company/${Date.now()}-${safe}`;
      await sbStorageUpload("company-documents", path, file);
      await sbPost("company_documents", {
        file_name: file.name,
        storage_path: path,
        mime_type: file.type || null,
        file_size: file.size,
        title: meta.title.trim() || file.name,
        description: meta.description.trim() || null,
        uploaded_by: user.id,
        uploader_name: user.name
      });
      showToast("Document uploaded");
      setShowMeta(null);
      load();
    } catch (err) {
      showToast("Upload failed: " + (err.message || err), "error");
    }
    setUploading(false);
  }

  async function handleDownload(doc) {
    try {
      const url = await sbStorageSignedUrl("company-documents", doc.storage_path, 60);
      window.open(url, "_blank");
    } catch (err) { showToast("Download failed: " + (err.message || err), "error"); }
  }

  async function handleDelete(doc) {
    if (!window.confirm(`Delete "${doc.title || doc.file_name}"? This cannot be undone.`)) return;
    try {
      await sbStorageDelete("company-documents", doc.storage_path);
      await sbDelete("company_documents", doc.id);
      showToast("Document deleted");
      load();
    } catch (err) { showToast("Delete failed: " + (err.message || err), "error"); }
  }

  const filtered = docs.filter(d =>
    !q ||
    (d.title || "").toLowerCase().includes(q.toLowerCase()) ||
    (d.description || "").toLowerCase().includes(q.toLowerCase()) ||
    (d.file_name || "").toLowerCase().includes(q.toLowerCase())
  );
  const sortDocs = useSortableData(filtered, "uploaded_at", "desc");

  return (
    <div>
      <div className="alert blue" style={{marginBottom:14}}>
        📚 Company-wide documents — handbooks, policies, training materials. Visible to all employees. {canManage ? "Managers and leads can upload and delete." : "Contact your manager to add documents."}
      </div>

      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:200,display:"flex",alignItems:"center",gap:8,background:"#1E2535",border:"1px solid #2A3348",borderRadius:6,padding:"6px 11px"}}>
          <span style={{color:"#4A5568"}}>⌕</span>
          <input style={{background:"none",border:"none",outline:"none",color:"#E8EDF5",fontSize:13,flex:1,fontFamily:"DM Sans,sans-serif"}} placeholder="Search documents..." value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        {canManage && (
          <label style={{position:"relative"}}>
            <input
              type="file"
              onChange={pickFile}
              disabled={uploading}
              style={{position:"absolute",left:-9999,top:0,opacity:0,width:0,height:0}}
            />
            <div className="btn btn-primary" style={{cursor:uploading?"wait":"pointer",pointerEvents:uploading?"none":"auto"}}>
              + Upload document
            </div>
          </label>
        )}
      </div>

      {loading ? (
        <div className="loading">Loading documents...</div>
      ) : (
        <div className="table-wrap">
          <div className="table-head"><span className="table-title">Documents ({filtered.length})</span></div>
          <table>
            <thead><tr>
              <th></th>
              <SortableTh sortState={sortDocs} sortKey="title" accessor={d => (d.title || d.file_name || "")}>Title</SortableTh>
              <SortableTh sortState={sortDocs} sortKey="description">Description</SortableTh>
              <SortableTh sortState={sortDocs} sortKey="file_size">Size</SortableTh>
              <SortableTh sortState={sortDocs} sortKey="uploader_name">Uploaded by</SortableTh>
              <SortableTh sortState={sortDocs} sortKey="uploaded_at">Date</SortableTh>
              <th>Actions</th>
            </tr></thead>
            <tbody>
              {sortDocs.rows.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state">{docs.length === 0 ? "No company documents uploaded yet" : "No documents match your search"}</div></td></tr>
              ) : sortDocs.rows.map(doc => (
                <tr key={doc.id}>
                  <td style={{fontSize:22,width:36}}>{fileIcon(doc.mime_type)}</td>
                  <td>
                    <strong>{doc.title || doc.file_name}</strong>
                    {doc.title && doc.title !== doc.file_name && <div style={{fontSize:10,color:"#8A95A8",marginTop:2}}>{doc.file_name}</div>}
                  </td>
                  <td style={{fontSize:11,color:"#8A95A8",maxWidth:300}}>{doc.description || "—"}</td>
                  <td style={{fontSize:12,fontFamily:"monospace"}}>{formatFileSize(doc.file_size)}</td>
                  <td style={{fontSize:12}}>{doc.uploader_name || "—"}</td>
                  <td style={{fontSize:12,color:"#8A95A8"}}>{new Date(doc.uploaded_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</td>
                  <td>
                    <div style={{display:"flex",gap:6}}>
                      <Btn variant="primary" onClick={() => handleDownload(doc)}>Download</Btn>
                      {canManage && <Btn variant="red" onClick={() => handleDelete(doc)}>Delete</Btn>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showMeta && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !uploading && setShowMeta(null)}>
          <div className="modal" style={{maxWidth:460}}>
            <div className="modal-top">
              <div>
                <div className="modal-title">Upload document</div>
                <div style={{fontSize:12,color:"#8A95A8",marginTop:3}}>
                  {showMeta.name} · {formatFileSize(showMeta.size)}
                </div>
              </div>
              <div className="modal-close" onClick={() => !uploading && setShowMeta(null)}>✕</div>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={meta.title}
                  onChange={e => setMeta(m => ({...m, title: e.target.value}))}
                  placeholder="e.g. Employee Handbook 2026" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={meta.description}
                  onChange={e => setMeta(m => ({...m, description: e.target.value}))}
                  placeholder="Brief description of what this document is..." />
              </div>
              <div style={{display:"flex",gap:8}}>
                <Btn style={{flex:1}} onClick={() => setShowMeta(null)} disabled={uploading}>Cancel</Btn>
                <Btn variant="primary" style={{flex:1}} onClick={confirmUpload} disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload"}
                </Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Profile Modal ─────────────────────────────────────────────────────────────
function ProfileModal({ person, trucks, creditCards, currentUser, onClose, onSaved, showToast, canEdit }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: person?.name || "",
    email: person?.email || "",
    phone: person?.phone || "",
    branch: person?.branch || "",
    department: person?.department || "",
    start_date: person?.start_date || "",
    access_level: person?.access_level || "employee",
    status: person?.status || "active"
  });
  const [saving, setSaving] = useState(false);

  if (!person) return null;

  const initials = person.name.split(" ").map(w=>w[0]).join("").substring(0,2);
  const colors = ["#A855F7","#3B82F6","#14B8A6","#22C55E","#F59E0B","#EF4444"];
  const color = colors[person.name.charCodeAt(0) % colors.length];

  // Truck assigned to this person
  const truck = trucks?.find(t => t.id === person.truck_id);
  // Credit cards assigned to this person (by name match)
  const personCards = (creditCards || []).filter(c => c.assigned_to === person.name);

  function update(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function save() {
    if (!form.name.trim()) { showToast("Name is required", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        branch: form.branch,
        department: form.department || null,
        start_date: form.start_date || null,
        access_level: form.access_level,
        status: form.status
      };
      await sbPatch("employees", person.id, payload);
      showToast("Profile updated");
      if (onSaved) onSaved();
      setEditing(false);
    } catch (err) {
      showToast("Error saving: " + (err.message || err), "error");
    }
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:680, maxHeight:"90vh", overflowY:"auto"}}>
        <div className="modal-top">
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:44,height:44,borderRadius:11,background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:600,color:"white"}}>{initials}</div>
            <div>
              <div className="modal-title">{person.name}</div>
              <div style={{fontSize:12,color:"#8A95A8",marginTop:2}}>{person.branch} · {accessLabel(person.access_level)}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <Badge color={statusColor(person.status)}>{person.status}</Badge>
            <Badge color={accessColor(person.access_level)}>{accessLabel(person.access_level)}</Badge>
            {canEdit && !editing && <Btn onClick={() => setEditing(true)}>Edit</Btn>}
            <div className="modal-close" onClick={onClose}>✕</div>
          </div>
        </div>
        <div className="modal-body">
          {editing ? (
            <div>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:10,marginBottom:10}}>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Full name *</label>
                  <input className="form-input" value={form.name} onChange={e => update("name", e.target.value)} />
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Branch</label>
                  <select className="form-input" value={form.branch} onChange={e => update("branch", e.target.value)}>
                    {["DFW","OKC","ATX","CStat","Office"].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Department</label>
                  <select className="form-input" value={form.department} onChange={e => update("department", e.target.value)}>
                    <option value="">— None —</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => update("email", e.target.value)} />
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Phone</label>
                  <input className="form-input" type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="(555) 123-4567" />
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Start date</label>
                  <input className="form-input" type="date" value={form.start_date} onChange={e => update("start_date", e.target.value)} />
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Access level</label>
                  <select className="form-input" value={form.access_level} onChange={e => update("access_level", e.target.value)}>
                    <option value="employee">Employee</option>
                    <option value="lead">Lead</option>
                    <option value="manager">Manager</option>
                    <option value="super_admin">Super admin</option>
                  </select>
                </div>
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={e => update("status", e.target.value)}>
                    <option value="active">Active</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <Btn style={{flex:1}} onClick={() => setEditing(false)} disabled={saving}>Cancel</Btn>
                <Btn variant="primary" style={{flex:1}} onClick={save} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Btn>
              </div>
            </div>
          ) : (
            <>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                <div className="mod-card">
                  <div className="mod-card-title"><span style={{width:7,height:7,borderRadius:2,background:"#22C55E",display:"inline-block"}} />HR Info</div>
                  <div className="kv"><span className="kv-key">Branch</span><span className="kv-val">{branchLabel(person)}</span></div>
                  <div className="kv"><span className="kv-key">Department</span><span className="kv-val">{person.department ? <Badge color={deptColor(person.department)}>{person.department}</Badge> : <span style={{color:"#8A95A8"}}>—</span>}</span></div>
                  <div className="kv"><span className="kv-key">Start date</span><span className="kv-val">{formatLocalDate(person.start_date)}</span></div>
                  <div className="kv"><span className="kv-key">Access level</span><span className="kv-val">{accessLabel(person.access_level)}</span></div>
                  <div className="kv"><span className="kv-key">Email</span><span className="kv-val" style={{fontSize:10}}>{person.email || "—"}</span></div>
                  <div className="kv"><span className="kv-key">Phone</span><span className="kv-val">{person.phone || <span style={{color:"#8A95A8"}}>—</span>}</span></div>
                </div>
                <div className="mod-card">
                  <div className="mod-card-title"><span style={{width:7,height:7,borderRadius:2,background:"#3B82F6",display:"inline-block"}} />Fleet</div>
                  {truck ? (
                    <>
                      <div className="kv"><span className="kv-key">Truck</span><span className="kv-val"><strong>#{truck.truck_number}</strong></span></div>
                      <div className="kv"><span className="kv-key">Vehicle</span><span className="kv-val">{[truck.year, truck.make, truck.model].filter(Boolean).join(" ")}</span></div>
                      <div className="kv"><span className="kv-key">Plate</span><span className="kv-val" style={{fontFamily:"monospace"}}>{truck.plate || "—"}</span></div>
                      <div className="kv"><span className="kv-key">Mileage</span><span className="kv-val">{truck.mileage ? truck.mileage.toLocaleString() : "—"}</span></div>
                      <div className="kv"><span className="kv-key">GPS</span><span className="kv-val">{truck.has_gps ? "Active" : "No GPS"}</span></div>
                    </>
                  ) : (
                    <div style={{padding:"8px 0",fontSize:13,color:"#8A95A8"}}>No truck assigned</div>
                  )}
                </div>
              </div>

              <div className="mod-card" style={{marginBottom:12}}>
                <div className="mod-card-title"><span style={{width:7,height:7,borderRadius:2,background:"#A855F7",display:"inline-block"}} />Credit cards ({personCards.length})</div>
                {personCards.length === 0 ? (
                  <div style={{padding:"8px 0",fontSize:13,color:"#8A95A8"}}>No credit cards assigned</div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:6}}>
                    {personCards.map(c => (
                      <div key={c.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",background:"#1E2535",border:"1px solid #2A3348",borderRadius:6,fontSize:12}}>
                        <div>
                          <strong>{c.name_on_card}</strong>
                          <div style={{color:"#8A95A8",fontSize:11,marginTop:2}}>{c.program}</div>
                        </div>
                        <div style={{fontFamily:"monospace",fontSize:13}}>{c.last4 ? "•••• " + c.last4 : <span style={{color:"#EF4444"}}>missing</span>}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mod-card">
                <div className="mod-card-title"><span style={{width:7,height:7,borderRadius:2,background:"#F59E0B",display:"inline-block"}} />Documents</div>
                <div style={{marginTop:8}}>
                  <EmployeeDocuments
                    employeeId={person.id}
                    employeeName={person.name}
                    canManage={canEdit}
                    currentUser={currentUser}
                    showToast={showToast}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("home");
  const [profile, setProfile] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [products, setProducts] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [shops, setShops] = useState([]);
  const [toast, setToast] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type, key: Date.now() });
  }, []);

  async function reloadShops() {
    try {
      const s = await sb("shops", "?select=*&order=name");
      setShops(s);
    } catch (err) { /* silent */ }
  }

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([
      sb("employees", "?select=*&order=name").catch(() => []),
      sb("trucks", "?select=*,assigned_employee:employees(name)&order=truck_number").catch(() => []),
      sb("products", "?select=*&order=category,name").catch(() => []),
      sb("credit_cards", "?select=*&order=assigned_to").catch(() => []),
      sb("inventory", "?select=*").catch(() => []),
      sb("shops", "?select=*&order=name").catch(() => []),
    ]).then(([e, t, p, cc, inv, s]) => {
      setEmployees(e);
      setTrucks(t);
      setProducts(p);
      setCreditCards(cc);
      setInventory(inv);
      setShops(s);
      setDataLoaded(true);
    });
  }, [currentUser]);

  function login(user) {
    setCurrentUser(user);
    setPage(["super_admin","manager","lead"].includes(user.access_level) ? "home" : "timeoff");
  }

  function logout() {
    setCurrentUser(null);
    setPage("home");
    setDataLoaded(false);
    setEmployees([]);
    setTrucks([]);
    setProducts([]);
    setCreditCards([]);
    setInventory([]);
    setShops([]);
  }

  const isManager = currentUser && ["super_admin","manager","lead"].includes(currentUser.access_level);
  const isSuperAdmin = currentUser && ["super_admin"].includes(currentUser.access_level);
  const MANAGER_PAGES = ["home","people","hr","fleet","inspections","cards","slack","settings"];

  function navItem(id, label, icon, badge) {
    if (!currentUser) return null;
    if (!isManager && MANAGER_PAGES.includes(id)) return null;
    return (
      <div key={id} className={"nav-item"+(page===id?" active":"")} onClick={() => setPage(id)}>
        <span style={{width:18,textAlign:"center",fontSize:13}}>{icon}</span>
        {label}
        {badge && <span className={"nav-badge"+(badge.c?" "+badge.c:"")}>{badge.n}</span>}
      </div>
    );
  }

  const titles = {home:"Dashboard",people:"People",hr:"HR & Onboarding",timeoff:"Time Off & Callouts",inventory:"Inventory",equipment:"Equipment",fleet:"Fleet",inspections:"Inspections",cards:"Credit Cards",documents:"Company Documents",slack:"Slack Alerts",settings:"Settings"};

  return (
    <>
      <style>{css}</style>
      {toast && <Toast key={toast.key} msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      {!currentUser ? (
        <Login onLogin={login} />
      ) : (
        <div className="app">
          <nav className="sidebar">
            <div className="sb-logo">
              <div className="sb-logo-icon">🦎</div>
              <div><div className="sb-logo-text">Critter Stop</div><div className="sb-logo-sub">OPS PLATFORM</div></div>
            </div>
            {isManager && <div className="sb-section"><div className="sb-section-label">Overview</div>{navItem("home","Dashboard","⊡")}{navItem("people","People","◎")}</div>}
            <div className="sb-section">
              <div className="sb-section-label">Modules</div>
              {navItem("hr","HR & Onboarding","✦")}
              {navItem("timeoff","Time Off & Callouts","◈")}
              {navItem("inventory","Inventory","◧")}
              {navItem("equipment","Equipment","🔧")}
              {navItem("fleet","Fleet","◉")}
              {navItem("inspections","Inspections","✓")}
              {navItem("cards","Credit Cards","◆")}
              {navItem("documents","Documents","📁")}
            </div>
            {isManager && <div className="sb-section"><div className="sb-section-label">Comms & Admin</div>{navItem("slack","Slack Alerts","◫")}{navItem("settings","Settings","⚙")}</div>}
            <div className="sb-footer">
              <button className="signout-btn" onClick={logout}>← Sign out</button>
              <div className="user-pill">
                <div className="avatar">{currentUser.name.split(" ").map(w=>w[0]).join("").substring(0,2)}</div>
                <div>
                  <div style={{fontSize:12,fontWeight:500,color:"#E8EDF5",lineHeight:1.3}}>{currentUser.name}</div>
                  <div style={{fontSize:10,color:"#8A95A8"}}>{accessLabel(currentUser.access_level)} · {currentUser.branch}</div>
                </div>
              </div>
            </div>
          </nav>
          <div className="main">
            {page !== "inventory" && (
              <div className="page-header">
                <div><div className="page-title">{titles[page]}</div><div className="page-sub">Critter Stop · {currentUser.branch === "All" ? "All branches" : currentUser.branch}</div></div>
              </div>
            )}
            {!dataLoaded && page !== "inventory" && <div className="loading">Loading data from database...</div>}
            {dataLoaded && page === "home" && <Dashboard user={currentUser} employees={employees} trucks={trucks} inventory={inventory} shops={shops} />}
            {dataLoaded && page === "people" && <People user={currentUser} employees={employees} setEmployees={setEmployees} onProfile={setProfile} showToast={showToast} />}
            {dataLoaded && page === "hr" && <HR user={currentUser} employees={employees} setEmployees={setEmployees} onProfile={setProfile} showToast={showToast} />}
            {page === "timeoff" && <TimeOff user={currentUser} employees={employees} showToast={showToast} />}
            {page === "inventory" && <Inventory user={currentUser} products={products} trucks={trucks} employees={employees} shops={shops} showToast={showToast} />}
            {page === "equipment" && <EquipmentPage user={currentUser} employees={employees} showToast={showToast} />}
            {dataLoaded && page === "fleet" && <Fleet user={currentUser} trucks={trucks} setTrucks={setTrucks} employees={employees} setEmployees={setEmployees} showToast={showToast} />}
            {dataLoaded && page === "inspections" && <InspectionsPage user={currentUser} trucks={trucks} employees={employees} showToast={showToast} />}
            {dataLoaded && page === "cards" && <CardsPage user={currentUser} employees={employees} showToast={showToast} />}
            {page === "documents" && <CompanyDocsPage user={currentUser} showToast={showToast} />}
            {page === "slack" && (
              <div className="table-wrap">
                <div className="table-head"><span className="table-title">Slack integration</span><Btn variant="primary">Send alerts now</Btn></div>
                <div style={{padding:"20px",color:"#8A95A8",fontSize:13,lineHeight:1.7}}>
                  Add your Slack Webhook URL in Supabase Edge Functions to enable automated bi-weekly inspection DMs, reorder alerts, and callout notifications to your managers.
                  <br/><br/>
                  <strong style={{color:"#E8EDF5"}}>Setup:</strong> Go to your Slack workspace → Apps → Incoming Webhooks → Create webhook → paste the URL here.
                </div>
              </div>
            )}
            {isManager && page === "settings" && dataLoaded && <Settings user={currentUser} employees={employees} setEmployees={setEmployees} products={products} setProducts={setProducts} trucks={trucks} setTrucks={setTrucks} shops={shops} reloadShops={reloadShops} showToast={showToast} />}
          </div>
          {profile && (
            <ProfileModal
              person={employees.find(e => e.id === profile.id) || profile}
              trucks={trucks}
              creditCards={creditCards}
              currentUser={currentUser}
              canEdit={isManager}
              onSaved={async () => {
                const e = await sb("employees", "?select=*&order=name").catch(() => null);
                if (e) setEmployees(e);
              }}
              onClose={() => setProfile(null)}
              showToast={showToast}
            />
          )}
        </div>
      )}
    </>
  );
}
