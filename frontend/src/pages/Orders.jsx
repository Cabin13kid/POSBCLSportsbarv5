import React, { useEffect, useState } from "react";
import { api, formatEUR } from "@/lib/api";
import { toast } from "sonner";
import { Check, Trash2 } from "lucide-react";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("open");

  const load = async () => {
    const r = await api.get(`/orders?status=${tab}`);
    setOrders(r.data);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const markPaid = async (o) => {
    await api.post(`/orders/${o.id}/pay`);
    toast.success("Bestelling afgerekend");
    load();
  };

  const del = async (o) => {
    if (!window.confirm("Bestelling verwijderen?")) return;
    await api.delete(`/orders/${o.id}`);
    toast.success("Verwijderd");
    load();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bestellingen</h1>
          <p className="text-sm text-slate-400 mt-0.5">Lopende en afgeronde bestellingen</p>
        </div>
        <div className="inline-flex rounded-full bg-slate-900 border border-slate-800 p-1">
          {[
            { v: "open", l: "Open" },
            { v: "paid", l: "Betaald" },
          ].map((o) => (
            <button
              key={o.v}
              onClick={() => setTab(o.v)}
              data-testid={`orders-tab-${o.v}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === o.v
                  ? "bg-amber-500 text-slate-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {orders.length === 0 && (
          <div className="col-span-full text-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            Geen {tab === "open" ? "openstaande" : "afgeronde"} bestellingen.
          </div>
        )}
        {orders.map((o) => (
          <div
            key={o.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5"
            data-testid={`order-card-${o.id}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-500">
                  {o.table_name || "Bar"}
                </div>
                <div className="text-sm text-slate-300 mt-0.5">
                  {new Date(o.created_at).toLocaleString("nl-NL")}
                </div>
              </div>
              <span
                className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ${
                  o.status === "open"
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {o.status}
              </span>
            </div>

            <ul className="mt-4 space-y-1">
              {o.items.map((it, idx) => (
                <li
                  key={idx}
                  className="flex justify-between text-sm border-b border-slate-800/60 py-1.5"
                >
                  <span>
                    <span className="font-mono tabular text-slate-500 mr-2">
                      {it.qty}×
                    </span>
                    {it.name}
                  </span>
                  <span className="font-mono tabular text-slate-300">
                    {formatEUR(it.price * it.qty)}
                  </span>
                </li>
              ))}
            </ul>

            {o.note && (
              <div className="mt-3 text-xs text-slate-400 bg-slate-950 rounded-md p-2 border border-slate-800">
                {o.note}
              </div>
            )}

            <div className="flex items-end justify-between mt-4">
              <span className="text-xs uppercase tracking-widest text-slate-500">
                Totaal
              </span>
              <span className="text-2xl font-mono tabular font-bold text-amber-400">
                {formatEUR(o.total)}
              </span>
            </div>

            <div className="flex gap-2 mt-4">
              {o.status === "open" && (
                <button
                  onClick={() => markPaid(o)}
                  data-testid={`pay-order-${o.id}`}
                  className="flex-1 h-10 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold text-sm flex items-center justify-center gap-1.5"
                >
                  <Check className="h-4 w-4" /> Afrekenen
                </button>
              )}
              <button
                onClick={() => del(o)}
                className="h-10 w-10 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
