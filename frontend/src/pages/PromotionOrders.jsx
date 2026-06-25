import React, { useEffect, useState } from "react";
import { api, formatEUR } from "@/lib/api";
import { Tag, ChevronRight, Percent } from "lucide-react";

export default function PromotionOrders() {
  const [groups, setGroups] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/stats/promotion-orders")
      .then((r) => setGroups(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Promo bestellingen</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Alle bestellingen waar een gevolgde promotie op is toegepast
        </p>
      </div>

      {loading && (
        <div className="text-slate-500 text-sm">Laden…</div>
      )}

      {!loading && groups.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-500">
          Geen promoties met "Bestellingen bijhouden" aan.<br />
          Zet de schakelaar aan in Promoties om een promo hier te tonen.
        </div>
      )}

      <div className="space-y-4">
        {groups.map((g) => {
          const p = g.promotion;
          const isOpen = openId === p.id;
          const valLabel =
            p.type === "order_percent"
              ? `${p.value}% op bestelling`
              : p.type === "item_percent"
              ? `${p.value}% op items`
              : `${formatEUR(p.value)} per item`;
          return (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden"
              data-testid={`promo-group-${p.name}`}
            >
              <button
                onClick={() => setOpenId(isOpen ? null : p.id)}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-900/70 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {p.type === "item_fixed" ? (
                    <Tag className="h-5 w-5 text-amber-400 shrink-0" />
                  ) : (
                    <Percent className="h-5 w-5 text-amber-400 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold tracking-tight truncate">{p.name}</div>
                    <div className="text-xs text-slate-400">{valLabel}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                  <Stat label="Orders" value={g.order_count} />
                  <Stat label="Omzet" value={formatEUR(g.revenue)} accent />
                  <Stat label="Korting" value={`−${formatEUR(g.discount_total)}`} emerald />
                  <ChevronRight
                    className={`h-4 w-4 text-slate-500 transition-transform ${
                      isOpen ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-800">
                  {g.orders.length === 0 && (
                    <div className="p-5 text-sm text-slate-500 text-center">
                      Nog geen bestellingen met deze promo.
                    </div>
                  )}
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead className="bg-slate-900/60 text-slate-400 text-xs">
                        <tr>
                          <th className="text-left p-3 font-medium">Wanneer</th>
                          <th className="text-left p-3 font-medium">Tafel</th>
                          <th className="text-right p-3 font-medium">Items</th>
                          <th className="text-right p-3 font-medium">Korting</th>
                          <th className="text-right p-3 font-medium">Totaal</th>
                          <th className="text-left p-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.orders.map((o) => (
                          <tr
                            key={o.id}
                            className="border-t border-slate-800/60"
                            data-testid={`promo-order-${o.id}`}
                          >
                            <td className="p-3 text-slate-300 font-mono text-xs">
                              {new Date(o.created_at).toLocaleString("nl-NL")}
                            </td>
                            <td className="p-3">{o.table_name || "Bar"}</td>
                            <td className="p-3 text-right font-mono tabular text-slate-400">
                              {o.items.reduce((s, i) => s + i.qty, 0)}
                            </td>
                            <td className="p-3 text-right font-mono tabular text-emerald-400">
                              −{formatEUR(o.discount)}
                            </td>
                            <td className="p-3 text-right font-mono tabular font-semibold text-amber-400">
                              {formatEUR(o.total)}
                            </td>
                            <td className="p-3">
                              <span
                                className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                  o.status === "open"
                                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                }`}
                              >
                                {o.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const Stat = ({ label, value, accent, emerald }) => (
  <div className="text-right hidden sm:block">
    <div className="text-[10px] uppercase tracking-widest text-slate-500">{label}</div>
    <div
      className={`font-mono tabular font-semibold ${
        accent ? "text-amber-400" : emerald ? "text-emerald-400" : "text-slate-100"
      }`}
    >
      {value}
    </div>
  </div>
);
