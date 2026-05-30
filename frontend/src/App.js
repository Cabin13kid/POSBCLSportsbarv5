import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "sonner";
import Login from "@/pages/Login";
import Layout from "@/pages/Layout";
import POS from "@/pages/POS";
import Orders from "@/pages/Orders";
import Floorplan from "@/pages/Floorplan";
import MenuManagement from "@/pages/MenuManagement";
import Inventory from "@/pages/Inventory";

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-slate-500">
        Laden…
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Toaster
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: "rgb(15 23 42)",
                color: "rgb(248 250 252)",
                border: "1px solid rgb(30 41 59)",
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <Protected>
                  <Layout />
                </Protected>
              }
            >
              <Route path="/" element={<POS />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/floorplan" element={<Floorplan />} />
              <Route path="/menu" element={<MenuManagement />} />
              <Route path="/inventory" element={<Inventory />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
