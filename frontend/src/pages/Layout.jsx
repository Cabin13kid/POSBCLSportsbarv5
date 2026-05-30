import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Beer,
  LayoutGrid,
  ClipboardList,
  Package,
  BookOpen,
  Map,
  LogOut,
} from "lucide-react";

const nav = [
  { to: "/", icon: LayoutGrid, label: "POS", end: true },
  { to: "/orders", icon: ClipboardList, label: "Bestellingen" },
  { to: "/floorplan", icon: Map, label: "Plattegrond" },
  { to: "/menu", icon: BookOpen, label: "Menu" },
  { to: "/inventory", icon: Package, label: "Voorraad" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-50">
      <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-900/40 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-800 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-amber-500 flex items-center justify-center">
            <Beer className="h-4.5 w-4.5 text-slate-950" />
          </div>
          <div>
            <div className="font-semibold tracking-tight">BARTRACK</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">
              ops dashboard
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-3">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              data-testid={`nav-${n.label.toLowerCase()}`}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    : "text-slate-400 hover:text-slate-50 hover:bg-slate-800/60 border border-transparent"
                }`
              }
            >
              <n.icon className="h-4 w-4" />
              <span className="font-medium">{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className="px-3 py-2 text-xs">
            <div className="text-slate-500">Ingelogd als</div>
            <div className="text-slate-200 truncate" data-testid="current-user">{user?.email}</div>
          </div>
          <button
            onClick={async () => {
              await logout();
              navigate("/login", { replace: true });
            }}
            className="mt-1 w-full flex items-center gap-2 text-sm text-slate-400 hover:text-rose-400 px-3 py-2 rounded-lg hover:bg-rose-500/10 transition-colors"
            data-testid="logout-btn"
          >
            <LogOut className="h-4 w-4" />
            Uitloggen
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
