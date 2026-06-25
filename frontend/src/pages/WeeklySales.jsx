import React, { useEffect, useMemo, useState } from "react";
import { api, formatEUR, CATEGORIES } from "@/lib/api";
import { TrendingUp, Calendar } from "lucide-react";

export default function WeeklySales() {
  const [data, setData] = useState({ days: 7, rows: [], total_qty: 0, total_revenue: 0 });
  const [days, setDays] = useState(7);
  const [filter, setFilter] = useState("Alle");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/stats/weekly-sales?days=${days}`)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [days]);

  const rows = useMemo(
    () => (filter === "Alle" ? data.rows : data.rows.filter((r) => r.category === filter)),
    [filter, data.rows],
  );

  const maxQty = Math.max(1, ...rows.map((r) => r.qty));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Weekverkoop</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Aantallen verkocht per product over de afgelopen {days} dagen
          </p>
        </div>
        <div className="inline-flex rounded-full bg-slate-900 border border-slate-800 p-1">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              data-testid={`weekly-range-${d}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                days === d
                  ? "bg-amber-500 text-slate-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card
          icon={Calendar}
          label="Periode"
          value={`${days} dagen`}
        />
        <Card
          icon={TrendingUp}
          label="Totaal verkocht"
          value={data.total_qty}
          mono
        />
        <Card
          label="Omzet (incl. korting verwerkt)"
          value={formatEUR(data.total_revenue)}
          accent
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {["Alle", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            data-testid={`weekly-filter-${c}`}
            className={`h-9 px-3 rounded-full text-sm font-medium ${
              filter === c
                ? "bg-amber-500 text-slate-950"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-slate-900 text-slate-400 text-xs">
              <tr>
                <th className="text-left p-3 font-medium">Product</th>
                <th className="text-left p-3 font-medium">Categorie</th>
                <th className="text-right p-3 font-medium">Verkocht</th>
                <th className="text-left p-3 font-medium w-1/3">Verdeling</th>
                <th className="text-right p-3 font-medium">Omzet</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    Laden…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    Geen verkopen in deze periode.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr
                  key={r.menu_item_id}
                  className="border-t border-slate-800 hover:bg-slate-900/60"
                  data-testid={`weekly-row-${r.name}`}
                >
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3 text-slate-400">{r.category}</td>
                  <td className="p-3 text-right font-mono tabular font-semibold text-amber-400">
                    {r.qty}
                  </td>
                  <td className="p-3">
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500"
                        style={{ width: `${(r.qty / maxQty) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono tabular text-slate-300">
                    {formatEUR(r.revenue)}
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

const Card = ({ icon: Icon, label, value, mono, accent }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 sm:p-5">
    <div className="flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-widest text-slate-500">
      {Icon && <Icon className="h-3.5 w-3.5" />}
      <span className="truncate">{label}</span>
    </div>
    <div
      className={`mt-1.5 sm:mt-2 ${mono ? "font-mono tabular" : ""} text-xl sm:text-3xl font-bold ${
        accent ? "text-amber-400" : "text-slate-100"
      }`}
    >
      {value}
    </div>
  </div>
);
