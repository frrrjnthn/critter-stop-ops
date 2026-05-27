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
        {["DFW","OKC","ATX","CStat","Office"].map(b => <option key={b} value={b}>{b}</option>)}
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
function Dashboard({ user, employees, trucks, inventory }) {
  const totalEmp = employees.length;
  const onboarding = employees.filter(e => e.status === "onboarding").length;
  const oilIssues = trucks.filter(t => t.next_oil_miles && t.mileage >= t.next_oil_miles - 500).length;
  const regIssues = trucks.filter(t => {
    if (!t.reg_expires) return false;
    return new Date(t.reg_expires) < new Date();
  }).length;

  return (
    <div>
      <div className="stat-row">
        {[
          { label:"Total employees", value: totalEmp, color:"#E8EDF5" },
          { label:"Onboarding", value: onboarding, color:"#3B82F6" },
          { label:"Total trucks", value: trucks.length, color:"#E8EDF5" },
          { label:"Oil service due", value: oilIssues, color: oilIssues > 0 ? "#EF4444" : "#22C55E" },
          { label:"Reg expired", value: regIssues, color: regIssues > 0 ? "#F59E0B" : "#22C55E" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{color: s.color}}>{s.value}</div>
          </div>
        ))}
      </div>
      <div className="table-wrap">
        <div className="table-head"><span className="table-title">Branch overview</span></div>
        <table>
          <thead><tr><th>Branch</th><th>Employees</th><th>Trucks</th><th>Onboarding</th></tr></thead>
          <tbody>
            {["DFW","OKC","ATX","CStat"].map(b => {
              const bEmp = employees.filter(e => e.branch === b);
              const bTruck = trucks.filter(t => t.branch === b);
              const bOnboard = bEmp.filter(e => e.status === "onboarding");
              return (
                <tr key={b}>
                  <td><strong>{b}</strong></td>
                  <td>{bEmp.length}</td>
                  <td>{bTruck.length}</td>
                  <td>{bOnboard.length > 0 ? <Badge color="blue">{bOnboard.length} active</Badge> : <Badge color="green">Clear</Badge>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── People ────────────────────────────────────────────────────────────────────
function People({ user, employees, onProfile }) {
  const [branch, setBranch] = useState(user.access_level === "super_admin" || user.access_level === "manager" ? "All" : user.branch);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  const list = employees.filter(e =>
    (branch === "All" || e.branch === branch) &&
    (statusFilter === "All" || e.status === statusFilter) &&
    (!q || e.name.toLowerCase().includes(q.toLowerCase()))
  );

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
          <Btn variant="primary" onClick={() => {}}>+ Add employee</Btn>
        )}
      </div>
      <div className="table-wrap">
        <div className="table-head">
          <span className="table-title">Employees ({list.length})</span>
        </div>
        <table>
          <thead><tr><th>Name</th><th>Branch</th><th>Start date</th><th>Access</th><th>Status</th></tr></thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={5}><div className="empty-state">No employees found</div></td></tr>
            ) : list.map(e => (
              <tr key={e.id} onClick={() => onProfile(e)}>
                <td><strong>{e.name}</strong></td>
                <td>{e.branch}</td>
                <td style={{color:"#8A95A8",fontSize:12}}>{e.start_date ? new Date(e.start_date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—"}</td>
                <td><Badge color={accessColor(e.access_level)}>{accessLabel(e.access_level)}</Badge></td>
                <td><Badge color={statusColor(e.status)}>{e.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── HR ────────────────────────────────────────────────────────────────────────
function HR({ user, employees, onProfile }) {
  const [branch, setBranch] = useState(user.branch === "All" ? "All" : user.branch);
  const [tab, setTab] = useState("onboarding");
  const list = employees.filter(e => branch === "All" || e.branch === branch);
  const onboarding = list.filter(e => e.status === "onboarding");

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
        <div className="table-wrap">
          <div className="table-head"><span className="table-title">Active onboarding ({onboarding.length})</span><Btn variant="primary">+ Add employee</Btn></div>
          <table>
            <thead><tr><th>Employee</th><th>Branch</th><th>Start date</th><th>Access level</th><th>Status</th></tr></thead>
            <tbody>
              {onboarding.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state">✓ No active onboarding for this branch</div></td></tr>
              ) : onboarding.map(e => (
                <tr key={e.id} onClick={() => onProfile(e)}>
                  <td><strong>{e.name}</strong></td><td>{e.branch}</td>
                  <td>{e.start_date ? new Date(e.start_date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—"}</td>
                  <td><Badge color={accessColor(e.access_level)}>{accessLabel(e.access_level)}</Badge></td>
                  <td><Badge color="blue">Onboarding</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "all" && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Employee</th><th>Branch</th><th>Start date</th><th>Access</th><th>Status</th></tr></thead>
            <tbody>
              {list.map(e => (
                <tr key={e.id} onClick={() => onProfile(e)}>
                  <td><strong>{e.name}</strong></td><td>{e.branch}</td>
                  <td style={{color:"#8A95A8",fontSize:12}}>{e.start_date ? new Date(e.start_date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—"}</td>
                  <td><Badge color={accessColor(e.access_level)}>{accessLabel(e.access_level)}</Badge></td>
                  <td><Badge color={statusColor(e.status)}>{e.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "documents" && (
        <div className="alert blue">📄 Document storage is configured in Supabase Storage. Click any employee profile to upload documents for that person.</div>
      )}
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
  const [form, setForm] = useState({ employee_id:"", type:"pto_request", start_date:"", end_date:"", reason:"", notes:"" });

  const isManager = ["super_admin","manager","lead"].includes(user.access_level);

  useEffect(() => {
    sb("time_off", "?select=*,employee:employees(name,branch)&order=created_at.desc")
      .then(data => { setRequests(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function submitRequest() {
    if (!form.employee_id || !form.start_date) { showToast("Please fill required fields", "error"); return; }
    try {
      const newReq = await sbPost("time_off", { ...form, status: "pending" });
      const emp = employees.find(e => e.id === form.employee_id);
      setRequests(prev => [{ ...newReq[0], employee: emp }, ...prev]);
      setShowForm(false);
      setForm({ employee_id:"", type:"pto_request", start_date:"", end_date:"", reason:"", notes:"" });
      showToast("Request submitted");
    } catch { showToast("Error submitting request", "error"); }
  }

  async function updateStatus(id, status) {
    try {
      await sbPatch("time_off", id, { status, approved_by: user.id });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      showToast(status === "approved" ? "Request approved" : "Request denied");
    } catch { showToast("Error updating request", "error"); }
  }

  const filtered = requests.filter(r => {
    if (branch !== "All" && r.employee?.branch !== branch) return false;
    if (!isManager && r.employee_id !== user.id) return false;
    return true;
  });

  const pending = filtered.filter(r => r.status === "pending");
  const callouts = filtered.filter(r => r.type === "callout");

  return (
    <div>
      {isManager && <BranchBar value={branch} onChange={setBranch} />}
      <div className="tabs">
        {[["requests","Requests"],["callouts","Callout log"],["calendar","Calendar"]].map(([t,l]) => (
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
                    <thead><tr><th>Employee</th><th>Branch</th><th>Dates</th><th>Reason</th><th>Type</th>{isManager && <th>Action</th>}</tr></thead>
                    <tbody>
                      {pending.map(r => (
                        <tr key={r.id}>
                          <td><strong>{r.employee?.name || "Unknown"}</strong></td>
                          <td>{r.employee?.branch}</td>
                          <td>{r.start_date}{r.end_date && r.end_date !== r.start_date ? " → " + r.end_date : ""}</td>
                          <td>{r.reason || "—"}</td>
                          <td><Badge color={r.type==="callout"?"red":"blue"}>{r.type==="callout"?"Callout":"PTO"}</Badge></td>
                          {isManager && (
                            <td>
                              <div style={{display:"flex",gap:6}}>
                                <Btn variant="primary" style={{padding:"3px 9px",fontSize:11}} onClick={() => updateStatus(r.id,"approved")}>✓ Approve</Btn>
                                <Btn variant="red" style={{padding:"3px 9px",fontSize:11}} onClick={() => updateStatus(r.id,"denied")}>✕ Deny</Btn>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="table-wrap">
                <div className="table-head"><span className="table-title">All requests</span></div>
                <table>
                  <thead><tr><th>Employee</th><th>Branch</th><th>Dates</th><th>Reason</th><th>Status</th><th>Type</th></tr></thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6}><div className="empty-state">No requests yet</div></td></tr>
                    ) : filtered.map(r => (
                      <tr key={r.id}>
                        <td><strong>{r.employee?.name || "Unknown"}</strong></td>
                        <td>{r.employee?.branch}</td>
                        <td style={{fontSize:12,color:"#8A95A8"}}>{r.start_date}{r.end_date && r.end_date !== r.start_date ? " → " + r.end_date : ""}</td>
                        <td>{r.reason || "—"}</td>
                        <td><Badge color={r.status==="approved"?"green":r.status==="denied"?"red":"amber"}>{r.status}</Badge></td>
                        <td><Badge color={r.type==="callout"?"red":"blue"}>{r.type==="callout"?"Callout":"PTO"}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {showForm && (
            <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
              <div className="modal modal-sm">
                <div className="modal-top">
                  <div className="modal-title">Request time off / log callout</div>
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
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-input" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                      <option value="pto_request">PTO Request</option>
                      <option value="callout">Callout</option>
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
        </div>
      )}

      {tab === "callouts" && (
        <div className="table-wrap">
          <div className="table-head">
            <span className="table-title">Callout log ({callouts.length})</span>
            <Btn variant="primary" onClick={() => { setForm(f => ({...f, type:"callout"})); setShowForm(true); }}>+ Log callout</Btn>
          </div>
          <table>
            <thead><tr><th>Employee</th><th>Branch</th><th>Date</th><th>Reason</th><th>Notice</th><th>Status</th></tr></thead>
            <tbody>
              {callouts.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state">No callouts logged yet</div></td></tr>
              ) : callouts.map(r => (
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

      {tab === "calendar" && (
        <div>
          <div className="alert blue">📅 Calendar view — approved PTO and callouts for {branch === "All" ? "all branches" : branch}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
              <div key={d} style={{textAlign:"center",fontSize:10,color:"#4A5568",padding:"4px 0",fontWeight:500}}>{d}</div>
            ))}
            {[null,null,null,null,null,null,null,...Array.from({length:30},(_,i)=>i+1)].map((d,i) => {
              const dayReqs = d ? filtered.filter(r => r.start_date && new Date(r.start_date).getDate() === d && r.status === "approved") : [];
              return (
                <div key={i} style={{minHeight:60,background:"#1E2535",border:"1px solid #2A3348",borderRadius:6,padding:5,opacity:d?1:.35}}>
                  <div style={{fontSize:11,fontWeight:500,color:"#8A95A8",marginBottom:3}}>{d}</div>
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
      )}
    </div>
  );
}

// ── Inventory ─────────────────────────────────────────────────────────────────
function Inventory({ user, products, showToast }) {
  const [branch, setBranch] = useState(user.branch === "All" ? "All" : user.branch);
  const [tab, setTab] = useState("log");
  const [catFilter, setCatFilter] = useState("All");
  const [inventory, setInventory] = useState([]);
  const [loadingInv, setLoadingInv] = useState(true);
  const [form, setForm] = useState({ product_id:"", quantity:1, action:"load_truck", notes:"" });
  const isManager = ["super_admin","manager","lead"].includes(user.access_level);

  useEffect(() => {
    sb("inventory", "?select=*,product:products(name,category,unit_cost)")
      .then(data => { setInventory(data); setLoadingInv(false); })
      .catch(() => setLoadingInv(false));
  }, []);

  async function logMove() {
    if (!form.product_id) { showToast("Select a product", "error"); return; }
    try {
      await sbPost("inventory_transactions", {
        product_id: form.product_id,
        employee_id: user.id,
        action: form.action,
        quantity: parseInt(form.quantity),
        from_location: branch === "All" ? "DFW" : branch,
        to_location: branch === "All" ? "DFW" : branch,
        notes: form.notes
      });
      setForm({ product_id:"", quantity:1, action:"load_truck", notes:"" });
      showToast("Move logged successfully");
    } catch { showToast("Error logging move", "error"); }
  }

  const filteredProducts = products.filter(p =>
    p.active &&
    (catFilter === "All" || p.category === catFilter)
  );

  const cats = ["All","Pest","Wildlife","Rodent","Mosquito","Termite","Insulation"];
  const catColors = {Pest:"#F59E0B",Wildlife:"#22C55E",Rodent:"#EF4444",Mosquito:"#14B8A6",Termite:"#A855F7",Insulation:"#3B82F6"};

  return (
    <div style={{padding:0,maxWidth:"100%"}}>
      <div style={{background:"#1a6b3c",color:"white",padding:"13px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{background:"rgba(255,255,255,.15)",borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>📦</div>
          <div>
            <div style={{fontSize:14,fontWeight:600}}>Critter Stop Inventory</div>
            <div style={{fontSize:11,opacity:.75}}>{branch === "All" ? "All branches" : branch} · {products.filter(p=>p.active).length} products</div>
          </div>
        </div>
        <select style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:7,padding:"5px 9px",color:"white",fontSize:12,outline:"none",cursor:"pointer"}}
          value={branch} onChange={e => setBranch(e.target.value)} disabled={!isManager}>
          <option value="All" style={{background:"#1a6b3c"}}>All branches</option>
          {["DFW","OKC","ATX","CStat"].map(b => <option key={b} value={b} style={{background:"#1a6b3c"}}>{b}</option>)}
        </select>
      </div>

      <div style={{display:"flex",background:"#f7f8f6",borderBottom:"1px solid #e5e7e3"}}>
        {[["Total products",products.filter(p=>p.active).length,"#1a6b3c"],
          ["Categories",6,"#1a6b3c"],
          ["Pest items",products.filter(p=>p.category==="Pest"&&p.active).length,"#d68910"],
          ["Wildlife items",products.filter(p=>p.category==="Wildlife"&&p.active).length,"#1a6b3c"]].map(([l,v,c]) => (
          <div key={l} style={{flex:1,padding:"9px 12px",textAlign:"center",borderRight:"1px solid #e5e7e3"}}>
            <div style={{fontSize:18,fontWeight:700,color:c,fontFamily:"monospace"}}>{v}</div>
            <div style={{fontSize:10,color:"#8a8d85",textTransform:"uppercase",letterSpacing:".05em",marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",background:"white",borderBottom:"2px solid #e5e7e3",overflowX:"auto"}}>
        {(isManager ? ["log","products","reorder"] : ["log","products"]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{flex:1,minWidth:80,padding:"11px 8px",border:"none",background:"none",fontSize:12,fontWeight:tab===t?600:500,color:tab===t?"#1a6b3c":"#555750",borderBottom:tab===t?"2px solid #1a6b3c":"2px solid transparent",marginBottom:-2,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>
            {t==="log"?"Log Move":t==="products"?"Products":"Reorder"}
          </button>
        ))}
      </div>

      <div style={{padding:16,background:"#f7f8f6",minHeight:300}}>
        {tab === "log" && (
          <div style={{background:"white",border:"1px solid #e5e7e3",borderRadius:11,padding:16}}>
            <div style={{fontSize:13,fontWeight:600,color:"#1a1a18",marginBottom:12}}>Log inventory move</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
              {(isManager
                ? [["load_truck","🚛 Load truck"],["return","↩ Return to shop"],["add_stock","+ Add shop stock"],["usage","📊 Monthly usage"],["adjust","⚠ Adjust / write-off"]]
                : [["load_truck","🚛 Load truck"],["return","↩ Return to shop"]]
              ).map(([val, label]) => (
                <button key={val} onClick={() => setForm(f => ({...f, action:val}))}
                  style={{padding:"7px 14px",borderRadius:20,border:"1.5px solid " + (form.action===val?"#1a6b3c":"#e5e7e3"),background:form.action===val?"#e8f5ee":"white",color:form.action===val?"#1a6b3c":"#555750",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:11}}>
              <div>
                <div style={{fontSize:11,fontWeight:500,color:"#8a8d85",textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>Category</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                  {cats.map(c => (
                    <button key={c} onClick={() => setCatFilter(c)}
                      style={{padding:"4px 10px",borderRadius:12,border:"1px solid " + (catFilter===c?"#1a6b3c":"#e5e7e3"),background:catFilter===c?"#e8f5ee":"white",color:catFilter===c?"#1a6b3c":"#555750",fontSize:12,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:500,color:"#8a8d85",textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>Product</div>
                <select style={{width:"100%",background:"#f7f8f6",border:"1px solid #e5e7e3",borderRadius:8,padding:"8px 11px",fontSize:13,color:"#1a1a18",fontFamily:"DM Sans,sans-serif",outline:"none"}}
                  value={form.product_id} onChange={e => setForm(f => ({...f, product_id: e.target.value}))}>
                  <option value="">Select product...</option>
                  {filteredProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — ${p.unit_cost}/{p.unit_of_measure}</option>
                  ))}
                </select>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
                <div>
                  <div style={{fontSize:11,fontWeight:500,color:"#8a8d85",textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>Quantity</div>
                  <input type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({...f, quantity: e.target.value}))}
                    style={{width:"100%",background:"#f7f8f6",border:"1px solid #e5e7e3",borderRadius:8,padding:"8px 11px",fontSize:13,color:"#1a1a18",fontFamily:"DM Sans,sans-serif",outline:"none"}} />
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:500,color:"#8a8d85",textTransform:"uppercase",letterSpacing:".06em",marginBottom:5}}>Notes (optional)</div>
                  <input type="text" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                    style={{width:"100%",background:"#f7f8f6",border:"1px solid #e5e7e3",borderRadius:8,padding:"8px 11px",fontSize:13,color:"#1a1a18",fontFamily:"DM Sans,sans-serif",outline:"none"}}
                    placeholder="Optional notes..." />
                </div>
              </div>
              <button onClick={logMove} style={{background:"#1a6b3c",color:"white",border:"none",borderRadius:10,padding:12,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>
                Submit move
              </button>
            </div>
          </div>
        )}

        {tab === "products" && (
          <div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
              {cats.map(c => (
                <button key={c} onClick={() => setCatFilter(c)}
                  style={{padding:"5px 12px",borderRadius:12,border:"1px solid " + (catFilter===c?"#1a6b3c":"#e5e7e3"),background:catFilter===c?"#e8f5ee":"white",color:catFilter===c?"#1a6b3c":"#555750",fontSize:12,cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontWeight:catFilter===c?600:400}}>
                  {c === "All" ? "All categories" : c}{c !== "All" ? ` (${products.filter(p=>p.category===c&&p.active).length})` : ""}
                </button>
              ))}
            </div>
            {filteredProducts.length === 0 ? (
              <div className="empty-state">No products in this category</div>
            ) : (
              <div style={{background:"white",borderRadius:11,overflow:"hidden",border:"1px solid #e5e7e3"}}>
                {filteredProducts.map((p, idx) => (
                  <div key={p.id} style={{padding:"11px 15px",display:"flex",alignItems:"center",gap:12,borderBottom:idx<filteredProducts.length-1?"1px solid #e5e7e3":"none"}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:catColors[p.category]||"#888",flexShrink:0}} />
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:500,color:"#1a1a18",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                      <div style={{fontSize:11,color:"#8a8d85",marginTop:2}}>{p.category} · {p.unit_of_measure}{p.notes ? " · " + p.notes : ""}</div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#1a6b3c",fontFamily:"monospace"}}>${p.unit_cost > 0 ? p.unit_cost.toFixed(2) : "—"}</div>
                      <div style={{fontSize:10,color:"#8a8d85",marginTop:2}}>per {p.unit_of_measure}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "reorder" && isManager && (
          <div>
            <div style={{background:"#FEF3C7",border:"1px solid rgba(245,158,11,.3)",borderRadius:10,padding:"11px 14px",marginBottom:14,fontSize:13,color:"#92400E"}}>
              ⚠ Set reorder thresholds in Settings → Products. Items below threshold will appear here automatically.
            </div>
            <div className="table-wrap" style={{marginTop:0}}>
              <div className="table-head"><span className="table-title">All products with thresholds</span><Btn variant="primary" onClick={()=>{}}>Send Veseris order</Btn></div>
              <table>
                <thead><tr><th>Product</th><th>Category</th><th>Unit cost</th><th>Reorder min</th><th>Supplier</th></tr></thead>
                <tbody>
                  {products.filter(p=>p.active&&p.reorder_threshold>0).map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td><Badge color={p.category==="Pest"?"amber":p.category==="Wildlife"?"green":p.category==="Rodent"?"red":"blue"}>{p.category}</Badge></td>
                      <td style={{fontFamily:"monospace"}}>${p.unit_cost.toFixed(2)}</td>
                      <td style={{fontFamily:"monospace"}}>{p.reorder_threshold}</td>
                      <td>{p.supplier}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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

  async function reloadTrucks() {
    try {
      const t = await sb("trucks", "?select=*,assigned_employee:employees(name)&order=truck_number");
      setTrucks(t);
      const e = await sb("employees", "?select=*&order=name");
      setEmployees(e);
    } catch (err) { showToast("Error refreshing: " + (err.message || err), "error"); }
  }

  const list = trucks.filter(t =>
    (branch === "All" || t.branch === branch) &&
    (!q || t.truck_number?.toLowerCase().includes(q.toLowerCase()) ||
      t.plate?.toLowerCase().includes(q.toLowerCase()) ||
      t.assigned_employee?.name?.toLowerCase().includes(q.toLowerCase()))
  );

  const maintenance = list.filter(t => t.next_oil_miles && t.mileage >= t.next_oil_miles - 500);
  const regExpired = list.filter(t => t.reg_expires && new Date(t.reg_expires) < new Date());

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
              <thead><tr><th>Truck</th><th>Branch</th><th>Driver</th><th>Plate</th><th>Mileage</th><th>Next oil</th><th>Reg expires</th><th>GPS</th></tr></thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state">No trucks added yet — add your first truck in Settings</div></td></tr>
                ) : list.map(t => {
                  const oil = oilStatus(t);
                  const regExp = t.reg_expires && new Date(t.reg_expires) < new Date();
                  const dot = maintenance.includes(t) || regExp ? "#EF4444" : t.has_gps ? "#22C55E" : "#8A95A8";
                  return (
                    <tr key={t.id}>
                      <td><div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:8,height:8,borderRadius:"50%",background:dot,flexShrink:0}} /><strong>{t.truck_number}</strong></div></td>
                      <td>{t.branch}</td>
                      <td>{t.assigned_employee?.name || <span style={{color:"#8A95A8"}}>Unassigned</span>}</td>
                      <td style={{fontFamily:"monospace",fontSize:11}}>{t.plate || "—"}</td>
                      <td style={{fontFamily:"monospace"}}>{t.mileage ? t.mileage.toLocaleString() : "—"}</td>
                      <td style={{color:oil.color,fontFamily:"monospace",fontSize:12}}>{oil.label}</td>
                      <td><Badge color={regExp?"red":!t.reg_expires?"gray":"green"}>{t.reg_expires ? new Date(t.reg_expires).toLocaleDateString("en-US",{month:"short",year:"numeric"}) : "—"}</Badge></td>
                      <td><Badge color={t.has_gps?"green":"gray"}>{t.has_gps?"Active":"No GPS"}</Badge></td>
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
            <thead><tr><th>Truck</th><th>Driver</th><th>Branch</th><th>Current mileage</th><th>Next oil due</th><th>Overdue by</th></tr></thead>
            <tbody>
              {maintenance.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state">✓ All trucks are up to date on oil changes</div></td></tr>
              ) : maintenance.map(t => {
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
            <thead><tr><th>Truck</th><th>Driver</th><th>Branch</th><th>Plate</th><th>Reg expires</th><th>Status</th></tr></thead>
            <tbody>
              {list.map(t => {
                const exp = t.reg_expires ? new Date(t.reg_expires) : null;
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
          editing={null}
          onClose={() => setTruckModalOpen(false)}
          onSaved={reloadTrucks}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ── New Truck Modal (shared by Fleet "+ Add truck" and Settings → Trucks) ─────
function NewTruckModal({ employees, trucks, onClose, onSaved, showToast, editing }) {
  const isEdit = !!editing;
  const [form, setForm] = useState(() => editing ? {
    truck_number: editing.truck_number || "",
    year: editing.year || "",
    make: editing.make || "",
    model: editing.model || "",
    vin: editing.vin || "",
    plate: editing.plate || "",
    branch: editing.branch || "DFW",
    driver_id: editing.assigned_employee_id || ""
  } : {
    truck_number: "",
    year: "", make: "", model: "", vin: "", plate: "",
    branch: "DFW", driver_id: ""
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
        branch: form.branch
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
      if (form.driver_id) {
        // First unassign any other employee currently pointing at this truck (if editing)
        if (isEdit) {
          const oldDrivers = employees.filter(e => e.truck_id === editing.id && e.id !== form.driver_id);
          for (const e of oldDrivers) await sbPatch("employees", e.id, { truck_id: null });
        }
        await sbPatch("employees", form.driver_id, { truck_id: savedTruck.id });
      } else if (isEdit) {
        // Driver cleared → unassign current driver
        const cur = employees.find(e => e.truck_id === editing.id);
        if (cur) await sbPatch("employees", cur.id, { truck_id: null });
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

// ── Settings ──────────────────────────────────────────────────────────────────
function Settings({ user, employees, setEmployees, products, setProducts, trucks, setTrucks, showToast }) {
  const [tab, setTab] = useState("users");
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [pinTarget, setPinTarget] = useState(null);
  const [newPin, setNewPin] = useState("");
  const [empBranch, setEmpBranch] = useState("All");

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
        {[["users","Users & PINs"],["products","Products"],["employees","Employees"],["trucks","Trucks"],["cards","Cards"]].map(([t,l]) => (
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
          <div className="table-wrap">
            <div className="table-head"><span className="table-title">All users ({filteredUsers.length})</span></div>
            <table>
              <thead><tr><th>Name</th><th>Branch</th><th>Access level</th><th>Status</th><th>PIN</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredUsers.map(e => (
                  <tr key={e.id}>
                    <td><strong>{e.name}</strong></td>
                    <td>{e.branch}</td>
                    <td><Badge color={accessColor(e.access_level)}>{accessLabel(e.access_level)}</Badge></td>
                    <td><Badge color={statusColor(e.status)}>{e.status}</Badge></td>
                    <td><span style={{fontFamily:"monospace",fontSize:13,letterSpacing:4,color:"#8A95A8"}}>••••</span></td>
                    <td>
                      <div style={{display:"flex",gap:6}}>
                        <Btn onClick={() => { setPinTarget(e); setNewPin(""); }}>Reset PIN</Btn>
                        {e.id !== user.id && <Btn onClick={() => toggleAccess(e)}>{e.access_level==="employee"?"Make lead":"Make employee"}</Btn>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        <div className="table-wrap">
          <div className="table-head"><span className="table-title">Product catalog ({products.filter(p=>p.active).length} active)</span><Btn variant="primary" onClick={()=>{}}>+ Add product</Btn></div>
          <table>
            <thead><tr><th>Product</th><th>Category</th><th>Unit cost</th><th>Per</th><th>Reorder min</th><th>Supplier</th><th>Active</th></tr></thead>
            <tbody>
              {products.map(p => (
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
      )}

      {tab === "employees" && (
        <div>
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            <select className="branch-select" value={empBranch} onChange={e=>setEmpBranch(e.target.value)}>
              <option value="All">All branches</option>
              {["DFW","OKC","ATX","CStat","Office"].map(b=><option key={b} value={b}>{b}</option>)}
            </select>
            <Btn variant="primary" onClick={()=>{}}>+ Add employee</Btn>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Branch</th><th>Start date</th><th>Access</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {employees.filter(e => empBranch === "All" || e.branch === empBranch).map(e => (
                  <tr key={e.id}>
                    <td><strong>{e.name}</strong></td>
                    <td style={{fontSize:11,color:"#8A95A8"}}>{e.email || "—"}</td>
                    <td>{e.branch}</td>
                    <td style={{fontSize:12,color:"#8A95A8"}}>{e.start_date ? new Date(e.start_date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—"}</td>
                    <td><Badge color={accessColor(e.access_level)}>{accessLabel(e.access_level)}</Badge></td>
                    <td><Badge color={statusColor(e.status)}>{e.status}</Badge></td>
                    <td><div style={{display:"flex",gap:6}}><Btn>Edit</Btn><Btn variant="red">Deactivate</Btn></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
    </div>
  );
}

// ── Profile Modal ─────────────────────────────────────────────────────────────
function ProfileModal({ person, onClose }) {
  if (!person) return null;
  const initials = person.name.split(" ").map(w=>w[0]).join("").substring(0,2);
  const colors = ["#A855F7","#3B82F6","#14B8A6","#22C55E","#F59E0B","#EF4444"];
  const color = colors[person.name.charCodeAt(0) % colors.length];
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
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
            <div className="modal-close" onClick={onClose}>✕</div>
          </div>
        </div>
        <div className="modal-body">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div className="mod-card">
              <div className="mod-card-title"><span style={{width:7,height:7,borderRadius:2,background:"#22C55E",display:"inline-block"}} />HR Info</div>
              <div className="kv"><span className="kv-key">Branch</span><span className="kv-val">{person.branch}</span></div>
              <div className="kv"><span className="kv-key">Start date</span><span className="kv-val">{person.start_date ? new Date(person.start_date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—"}</span></div>
              <div className="kv"><span className="kv-key">Access level</span><span className="kv-val">{accessLabel(person.access_level)}</span></div>
              <div className="kv"><span className="kv-key">Email</span><span className="kv-val" style={{fontSize:10}}>{person.email || "—"}</span></div>
            </div>
            <div className="mod-card">
              <div className="mod-card-title"><span style={{width:7,height:7,borderRadius:2,background:"#3B82F6",display:"inline-block"}} />Fleet</div>
              <div className="kv"><span className="kv-key">Truck assigned</span><span className="kv-val">{person.truck_id ? "See fleet tab" : "Unassigned"}</span></div>
              <div className="kv"><span className="kv-key">Status</span><span className="kv-val">{person.status}</span></div>
            </div>
          </div>
          <div style={{marginTop:12}}>
            <div className="mod-card">
              <div className="mod-card-title"><span style={{width:7,height:7,borderRadius:2,background:"#F59E0B",display:"inline-block"}} />Documents</div>
              <div style={{padding:"8px 0",fontSize:13,color:"#8A95A8"}}>
                Document upload and management will be available after connecting Supabase Storage.
              </div>
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <Btn style={{flex:1}}>Upload document</Btn>
                <Btn variant="primary" style={{flex:1}}>Issue write-up</Btn>
              </div>
            </div>
          </div>
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
  const [toast, setToast] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type, key: Date.now() });
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([
      sb("employees", "?select=*&order=name").catch(() => []),
      sb("trucks", "?select=*,assigned_employee:employees(name)&order=truck_number").catch(() => []),
      sb("products", "?select=*&order=category,name").catch(() => []),
    ]).then(([e, t, p]) => {
      setEmployees(e);
      setTrucks(t);
      setProducts(p);
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
  }

  const isManager = currentUser && ["super_admin","manager","lead"].includes(currentUser.access_level);
  const isSuperAdmin = currentUser && ["super_admin"].includes(currentUser.access_level);
  const MANAGER_PAGES = ["home","people","hr","fleet","slack","settings"];

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

  const titles = {home:"Dashboard",people:"People",hr:"HR & Onboarding",timeoff:"Time Off & Callouts",inventory:"Inventory",fleet:"Fleet",slack:"Slack Alerts",settings:"Settings"};

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
              {navItem("fleet","Fleet","◉")}
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
            {dataLoaded && page === "home" && <Dashboard user={currentUser} employees={employees} trucks={trucks} inventory={[]} />}
            {dataLoaded && page === "people" && <People user={currentUser} employees={employees} onProfile={setProfile} />}
            {dataLoaded && page === "hr" && <HR user={currentUser} employees={employees} onProfile={setProfile} />}
            {page === "timeoff" && <TimeOff user={currentUser} employees={employees} showToast={showToast} />}
            {page === "inventory" && <Inventory user={currentUser} products={products} showToast={showToast} />}
            {dataLoaded && page === "fleet" && <Fleet user={currentUser} trucks={trucks} setTrucks={setTrucks} employees={employees} setEmployees={setEmployees} showToast={showToast} />}
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
            {isManager && page === "settings" && dataLoaded && <Settings user={currentUser} employees={employees} setEmployees={setEmployees} products={products} setProducts={setProducts} trucks={trucks} setTrucks={setTrucks} showToast={showToast} />}
          </div>
          {profile && <ProfileModal person={profile} onClose={() => setProfile(null)} />}
        </div>
      )}
    </>
  );
}
