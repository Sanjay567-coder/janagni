import { ShieldAlert, BarChart3, Clock, AlertOctagon } from "lucide-react";

export default function OfficerDashboard() {
  const kpis = [
    { label: "Total Active", value: "24", icon: BarChart3, color: "text-calm-300" },
    { label: "SLA Breaches", value: "8", icon: AlertOctagon, color: "text-ember-600" },
    { label: "Active RTIs", value: "3", icon: ShieldAlert, color: "text-ember-500" },
    { label: "Avg Resolution", value: "14.2d", icon: Clock, color: "text-sage-500" },
  ];

  const complaintsList = [
    {
      id: "GCC-2026-89412",
      cat: "Sanitation",
      days: "Day 0",
      sla: "Within SLA",
      stage: "Filed",
      action: "Review Intake",
      statusColor: "text-calm-300",
    },
    {
      id: "GCC-2026-87411",
      cat: "Road Potholes",
      days: "Day 32",
      sla: "Lapsed +2d",
      stage: "Nudge Active",
      action: "Zonal Reply",
      statusColor: "text-ember-500",
    },
    {
      id: "GCC-2026-85103",
      cat: "Streetlights",
      days: "Day 38",
      sla: "Lapsed +8d",
      stage: "RTI Triggered",
      action: "PIO Response",
      statusColor: "text-ember-600",
    },
    {
      id: "GCC-2026-81990",
      cat: "Drainage Overflow",
      days: "Day 46",
      sla: "Lapsed +16d",
      stage: "Writ Escalated",
      action: "Submit Affidavit",
      statusColor: "text-red-500",
    },
    {
      id: "GCC-2026-79920",
      cat: "Public Safety",
      days: "Day 12",
      sla: "Resolved",
      stage: "Resolved",
      action: "Archived",
      statusColor: "text-sage-500",
    },
  ];

  return (
    <div className="flex flex-col flex-1 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-fraunces text-2xl font-semibold mb-1">Ward Authority</h1>
        <p className="text-text-500 text-xs uppercase tracking-wider">
          Zone 13 · Adyar &amp; Velachery Portal
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-ink-800 border border-border rounded-custom p-4 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] text-text-500 font-sans tracking-wide uppercase">{kpi.label}</span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <span className="text-2xl font-mono font-medium text-text-100">{kpi.value}</span>
            </div>
          );
        })}
      </div>

      {/* Demo Warning */}
      <div className="bg-ink-800 border border-ember-600/30 text-text-300 rounded-custom p-4 mb-6 text-[12.5px] leading-relaxed flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-ember-500 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-text-100">Authority Demo Environment.</strong> You are viewing complaints routed to Ward 172. Action responses are simulated for escalation testing.
        </div>
      </div>

      {/* Compliance Table Title */}
      <h2 className="text-xs uppercase tracking-widest text-text-500 font-mono mb-3">
        Grievance Compliance Register
      </h2>

      {/* Horizontally Scrollable Table Container */}
      <div className="w-full bg-ink-800 border border-border rounded-custom overflow-hidden shadow-lg mb-4">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-ink-600">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-border bg-ink-700/50">
                <th className="p-3 text-[10.5px] font-mono uppercase tracking-wider text-text-500">ID</th>
                <th className="p-3 text-[10.5px] font-mono uppercase tracking-wider text-text-500">Category</th>
                <th className="p-3 text-[10.5px] font-mono uppercase tracking-wider text-text-500">SLA Status</th>
                <th className="p-3 text-[10.5px] font-mono uppercase tracking-wider text-text-500">Escalation</th>
                <th className="p-3 text-[10.5px] font-mono uppercase tracking-wider text-text-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {complaintsList.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-ink-700/20 transition-colors">
                  <td className="p-3 font-mono text-xs text-text-300">{c.id}</td>
                  <td className="p-3 text-xs text-text-100 font-semibold">{c.cat}</td>
                  <td className="p-3 text-xs">
                    <div className="flex flex-col">
                      <span className="text-text-300 font-mono text-[11px]">{c.days}</span>
                      <span className={`text-[10px] ${c.statusColor}`}>{c.sla}</span>
                    </div>
                  </td>
                  <td className="p-3 text-xs text-text-300 font-sans">{c.stage}</td>
                  <td className="p-3 text-right">
                    <button className="text-[10.5px] font-semibold px-2.5 py-1 bg-ink-700 hover:bg-ink-600 text-text-100 rounded border border-border hover:border-text-500 transition-all">
                      {c.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
