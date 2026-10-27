import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Reading = { timestamp: string; voltage_v: number; current_a: number; power_factor: number; active_power_kw: number; energy_kwh_interval: number; is_anomaly: boolean; anomaly_reason: string | null; is_ml_anomaly?: boolean; anomaly_score?: number | null };
type Summary = { reading_count: number; average_voltage_v: number; average_current_a: number; average_power_kw: number; total_energy_kwh: number; anomaly_count: number };
type View = "Overview" | "Live monitor" | "Anomalies" | "Energy reports" | "Settings";
type Range = "1h" | "6h" | "24h" | "7d";
const API = "http://127.0.0.1:8000";
const RANGE_COUNTS: Record<Range, number> = { "1h": 12, "6h": 72, "24h": 288, "7d": 2016 };
const fmt = (value: number | undefined, digits = 1) => typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: digits }) : "—";

function App() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("24h");
  const [view, setView] = useState<View>("Overview");
  const [query, setQuery] = useState("");

  async function loadData(selectedRange: Range = range) {
    setLoading(true);
    setError("");
    const count = RANGE_COUNTS[selectedRange];
    try {
      const [s, r] = await Promise.all([
        fetch(API + "/api/summary?count=" + count),
        fetch(API + "/api/readings?count=" + count),
      ]);
      if (!s.ok || !r.ok) throw new Error("Backend returned an error. Check that FastAPI is running.");
      setSummary(await s.json() as Summary);
      setReadings((await r.json() as { items: Reading[] }).items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not connect to the API.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { void loadData("24h"); }, []);

  const chartData = useMemo(() => readings.map((r) => ({
    time: range === "7d" ? new Date(r.timestamp).toLocaleDateString([], { month: "short", day: "numeric" }) : new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    power: r.active_power_kw,
  })), [readings, range]);
  const ruleAlerts = readings.filter((r) => r.is_anomaly).slice().reverse();
  const mlAlerts = readings.filter((r) => r.is_ml_anomaly).slice().reverse();
  const matchingRows = readings.slice().reverse().filter((r) =>
    (r.timestamp + " " + r.voltage_v + " " + r.current_a + " " + r.active_power_kw).toLowerCase().includes(query.toLowerCase())
  );
  const latestRows = matchingRows.slice(0, 6);
  const setPage = (next: View) => { setView(next); window.scrollTo({ top: 0, behavior: "smooth" }); };

  function downloadReport() {
    const headings = ["timestamp", "voltage_v", "current_a", "power_factor", "active_power_kw", "rule_anomaly", "ml_anomaly", "anomaly_score"];
    const lines = [headings.join(","), ...readings.map((r) => [
      r.timestamp, r.voltage_v, r.current_a, r.power_factor, r.active_power_kw,
      r.is_anomaly, r.is_ml_anomaly, r.anomaly_score ?? "",
    ].join(","))];
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    link.download = "gridsense-" + range + "-readings.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const nav: { name: View; icon: string; badge?: string }[] = [
    { name: "Overview", icon: "▦" },
    { name: "Live monitor", icon: "⌁", badge: "LIVE" },
    { name: "Anomalies", icon: "△" },
    { name: "Energy reports", icon: "ϟ" },
  ];

  function Metric({ title, value, unit, tone }: { title: string; value: string; unit: string; tone: string }) {
    return <article className="metric"><span className={"metric-icon " + tone}>{tone === "mint" ? "ϟ" : tone === "blue" ? "⌁" : tone === "violet" ? "▦" : "△"}</span><label>{title}</label><strong>{value}<small>{unit}</small></strong><p><i/> Based on {range} of readings</p></article>;
  }
  function Chart() {
    return <article className="panel chart-panel"><div className="panel-heading"><div><label>ENERGY TRENDS</label><h2>Power consumption</h2><p>Active power over the selected time period.</p></div><div className="ranges">{(["1h", "6h", "24h", "7d"] as Range[]).map((x) => <button key={x} aria-pressed={range === x} className={range === x ? "selected" : ""} onClick={() => { setRange(x); void loadData(x); }}>{x}</button>)}</div></div><div className="chart-meta"><span><i/> Active power <small>kW</small></span><span className="chart-meta-right">{readings.length} readings · {range}</span></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 12, right: 5, left: -15, bottom: 0 }}><defs><linearGradient id="powerFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#59d8ae" stopOpacity={0.22}/><stop offset="100%" stopColor="#59d8ae" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#26332c" strokeDasharray="3 6"/><XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#86938a", fontSize: 10 }} minTickGap={45} dy={9}/><YAxis axisLine={false} tickLine={false} tick={{ fill: "#86938a", fontSize: 10 }} width={42}/><Tooltip contentStyle={{ background: "#121b17", border: "1px solid #34443a", borderRadius: 9, color: "#eff8f1", fontSize: 12 }} formatter={(v) => [Number(v).toFixed(2) + " kW", "Active power"]}/><Area type="monotone" dataKey="power" stroke="#59d8ae" strokeWidth={2.5} fill="url(#powerFill)" activeDot={{ r: 4 }} dot={false}/></AreaChart></ResponsiveContainer></div><div className="chart-footer"><span><i/> Five-minute readings</span><span>{range === "1h" ? "Last hour" : range === "6h" ? "Last 6 hours" : range === "7d" ? "Last 7 days" : "Last 24 hours"}</span></div></article>;
  }
  function ReadingsTable({ items }: { items: Reading[] }) {
    return <div className="table-wrap"><table><thead><tr><th>TIME</th><th>VOLTAGE</th><th>CURRENT</th><th>POWER FACTOR</th><th>ACTIVE POWER</th><th>RULE STATUS</th><th>ML STATUS</th><th>ML SCORE</th></tr></thead><tbody>{items.length ? items.map((r) => <tr key={r.timestamp}><td>{new Date(r.timestamp).toLocaleString()}</td><td>{fmt(r.voltage_v)} <small>V</small></td><td>{fmt(r.current_a, 2)} <small>A</small></td><td>{fmt(r.power_factor, 2)}</td><td className="power">{fmt(r.active_power_kw, 2)} <small>kW</small></td><td><span className={"status " + (r.is_anomaly ? "review" : "")}><i/>{r.is_anomaly ? "Flagged" : "Normal"}</span></td><td><span className={"status " + (r.is_ml_anomaly ? "ml-review" : "")}><i/>{r.is_ml_anomaly ? "Anomaly" : "Normal"}</span></td><td>{typeof r.anomaly_score === "number" ? r.anomaly_score.toFixed(4) : "—"}</td></tr>) : <tr><td className="empty" colSpan={8}>{loading ? "Loading readings…" : "No readings match this filter."}</td></tr>}</tbody></table></div>;
  }
  const pageTitles: Record<View, string> = {
    "Overview": "Good morning, Vishal R",
    "Live monitor": "Live grid monitor",
    "Anomalies": "Anomaly center",
    "Energy reports": "Energy reports",
    "Settings": "Workspace settings",
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#" onClick={(e) => { e.preventDefault(); setPage("Overview"); }}><span className="brand-mark"><i/><i/><i/></span><span>grid<span className="brand-accent">sense</span><small>ENERGY INTELLIGENCE</small></span></a>
      <div className="workspace-caption">WORKSPACE</div><div className="workspace"><span className="workspace-avatar">N</span><span><b>Northstar Energy</b><small>Operations team</small></span><span className="caret">⌄</span></div>
      <div className="nav-caption">MONITORING</div>
      <nav>{nav.map((item) => <button key={item.name} className={"nav-item " + (view === item.name ? "active" : "")} onClick={() => setPage(item.name)}><span>{item.icon}</span>{item.name}{item.badge && <em>{item.badge}</em>}{item.name === "Anomalies" && <b className="nav-count">{mlAlerts.length + ruleAlerts.length}</b>}</button>)}</nav>
      <div className="nav-caption preference-caption">PREFERENCES</div><button className={"nav-item " + (view === "Settings" ? "active" : "")} onClick={() => setPage("Settings")}><span>⚙</span>Settings</button>
      <div className="sidebar-fill"/>
      <div className="help-card"><span className="help-icon">✳</span><b>Need a hand?</b><p>Explore readings, alerts, and energy reports from your workspace.</p><button onClick={() => setPage("Live monitor")}>Open live monitor&nbsp; →</button></div>
      <div className="profile"><span className="profile-avatar">VR</span><span><b>Vishal R</b><small>Energy analyst</small></span><span className="profile-menu">···</span></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="crumb">Workspace <span>›</span> <b>{view}</b></div><div className="top-actions"><span className="today">☼&nbsp; {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</span><label className="search">⌕ <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search readings..." /></label><span className="mini-avatar">VR</span></div></header>
      <div className="content">
        <section className="page-heading"><div><div className="eyebrow"><i/> GRIDSENSE AI / {view.toUpperCase()}</div><h1>{pageTitles[view]}{view === "Overview" && <span> ✳</span>}</h1><p>{view === "Overview" ? "Here’s what’s happening across your energy network today." : view === "Live monitor" ? "Inspect every electrical reading and its detection status." : view === "Anomalies" ? "Review rule-based flags and machine learning detections." : view === "Energy reports" ? "Explore and export energy readings for the selected period." : "Current workspace and data source information."}</p></div><button className="refresh" disabled={loading} onClick={() => void loadData()}><span>⟳</span>{loading ? "Refreshing…" : "Refresh data"}</button></section>
        {error && <div className="error"><b>Connection issue</b><span>{error} Start the backend using the README instructions.</span></div>}

        {view === "Overview" && <>
          <section className="metrics">
            <Metric title="ENERGY CONSUMED" value={fmt(summary?.total_energy_kwh)} unit="kWh" tone="mint"/>
            <Metric title="AVG. ACTIVE POWER" value={fmt(summary?.average_power_kw, 2)} unit="kW" tone="blue"/>
            <Metric title="GRID VOLTAGE" value={fmt(summary?.average_voltage_v)} unit="V" tone="violet"/>
            <Metric title="ML ANOMALIES" value={String(mlAlerts.length)} unit="readings" tone="amber"/>
          </section>
          <section className="primary"><Chart/><article className="panel health-panel"><div className="panel-heading"><div><label>NETWORK STATUS</label><h2>System health</h2></div><span className="healthy"><i/>{error ? "Offline" : "Connected"}</span></div><div className="score"><strong>{error ? "—" : "98"}</strong><span>/ 100<br/>health score</span><div className="gauge">ϟ</div></div><div className="health-line"/><div className="health-row"><span><i className="dot mint-dot"/>Voltage stability</span><b>Optimal</b></div><div className="health-row"><span><i className="dot blue-dot"/>Frequency</span><b>50.02 Hz</b></div><div className="health-row"><span><i className="dot violet-dot"/>Power factor</span><b>{fmt(readings.length ? readings.reduce((a,r) => a + r.power_factor, 0) / readings.length : undefined, 2)}</b></div><div className="health-row"><span><i className="dot mint-dot"/>Data connection</span><b>{error ? "Offline" : "Connected"}</b></div><button className="detail-link" onClick={() => setPage("Live monitor")}>View system details <span>›</span></button></article></section>
          <section className="secondary"><article className="panel readings-panel"><div className="panel-heading"><div><label>REAL-TIME FEED</label><h2>Recent readings</h2><p>Rule status and ML status are shown separately.</p></div><button className="view-all" onClick={() => setPage("Live monitor")}>View all&nbsp; ›</button></div><ReadingsTable items={latestRows}/></article>
          <article className="panel alerts-panel"><div className="panel-heading"><div><label>MACHINE LEARNING</label><h2>ML anomaly readings <span className="alert-count">{mlAlerts.length}</span></h2></div><button className="view-all" onClick={() => setPage("Anomalies")}>View all&nbsp; ›</button></div>{mlAlerts.length ? <div className="alert-list">{mlAlerts.slice(0,4).map((r) => <div className="alert-row" key={r.timestamp}><span className="alert-icon">ML</span><span><b>Unusual electrical reading</b><small>{new Date(r.timestamp).toLocaleString()} · score {typeof r.anomaly_score === "number" ? r.anomaly_score.toFixed(4) : "—"}</small></span></div>)}</div> : <div className="all-clear"><span>⌁</span><b>{loading ? "Loading model results…" : "No ML anomalies"}</b><p>There are no model-flagged readings in this period.</p></div>}</article></section>
        </>}

        {view === "Live monitor" && <><section className="metrics"><Metric title="READINGS LOADED" value={String(readings.length)} unit="samples" tone="mint"/><Metric title="AVG. VOLTAGE" value={fmt(summary?.average_voltage_v)} unit="V" tone="blue"/><Metric title="AVG. CURRENT" value={fmt(summary?.average_current_a, 2)} unit="A" tone="violet"/><Metric title="ML ANOMALIES" value={String(mlAlerts.length)} unit="readings" tone="amber"/></section><section className="view-section"><Chart/></section><section className="panel full-table"><div className="panel-heading"><div><label>TELEMETRY</label><h2>All readings · rule and ML results</h2><p>Showing {matchingRows.length} readings for {range}.</p></div></div><ReadingsTable items={matchingRows}/></section></>}

        {view === "Anomalies" && <><section className="metrics"><Metric title="RULE-BASED FLAGS" value={String(ruleAlerts.length)} unit="readings" tone="amber"/><Metric title="ML MODEL FLAGS" value={String(mlAlerts.length)} unit="readings" tone="violet"/><Metric title="TOTAL READINGS" value={String(readings.length)} unit="samples" tone="blue"/><Metric title="MODEL" value="Isolation" unit="Forest" tone="mint"/></section><section className="panel full-table"><div className="panel-heading"><div><label>MODEL OUTPUT</label><h2>Machine learning flagged readings</h2><p>Isolation Forest predictions and anomaly scores. Rule flags appear in their own column.</p></div></div><ReadingsTable items={matchingRows.filter((r) => r.is_ml_anomaly)}/></section><section className="panel full-table"><div className="panel-heading"><div><label>ENGINEERING RULES</label><h2>Rule-flagged readings</h2><p>{ruleAlerts.length} threshold alerts in this {range} sample.</p></div></div><ReadingsTable items={matchingRows.filter((r) => r.is_anomaly)}/></section></>}

        {view === "Energy reports" && <><section className="metrics"><Metric title="TOTAL ENERGY" value={fmt(summary?.total_energy_kwh)} unit="kWh" tone="mint"/><Metric title="AVERAGE POWER" value={fmt(summary?.average_power_kw, 2)} unit="kW" tone="blue"/><Metric title="AVERAGE VOLTAGE" value={fmt(summary?.average_voltage_v)} unit="V" tone="violet"/><Metric title="PERIOD" value={range} unit="selected" tone="amber"/></section><section className="view-section"><Chart/></section><section className="panel report-panel"><div><label>EXPORT YOUR DATA</label><h2>Download a readings report</h2><p>Export timestamped voltage, current, power, rule flags, ML flags, and anomaly scores for the selected period.</p></div><button className="refresh" onClick={downloadReport}>↓&nbsp; Download CSV</button></section></>}

        {view === "Settings" && <section className="panel settings-panel"><label>WORKSPACE SETTINGS</label><h2>Data source</h2><p className="settings-intro">GridSense is currently running with simulated electrical readings from the local FastAPI backend.</p><div className="settings-row"><span><b>Environment</b><small>Generated five-minute sample data</small></span><strong>Simulation</strong></div><div className="settings-row"><span><b>ML detector</b><small>Isolation Forest trained on baseline readings</small></span><strong>Active</strong></div><div className="settings-row"><span><b>Selected history</b><small>Choose a period to change the dashboard data window</small></span><select value={range} onChange={(e) => { const x = e.target.value as Range; setRange(x); void loadData(x); }}>{(["1h","6h","24h","7d"] as Range[]).map((x) => <option key={x}>{x}</option>)}</select></div><button className="refresh" onClick={() => void loadData()}>⟳&nbsp; Reload readings</button><p className="safety-note">Simulation only. This data is not connected to electrical equipment and must not be used for safety decisions.</p></section>}

        <footer><span><b>GRIDSENSE AI</b> · ENERGY INTELLIGENCE, MADE CLEAR</span><span><i/> SIMULATION ENVIRONMENT · NOT FOR SAFETY-CRITICAL USE</span></footer>
      </div>
    </main>
  </div>;
}
export default App;

