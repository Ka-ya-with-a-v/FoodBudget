import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

export default function Error() {
  return (
    <div className="page">
      {/* Top bar */}
      <Navbar />

      {/* 404 content */}
      <main className="main404">
        <h1 className="code404">404</h1>
        <p className="msg">
          This page <span className="red">blew</span> the{" "}
          <span className="green">budget</span>. Let’s{" "}
          <span className="orange">try</span> something else.
        </p>

        <Link to="/" className="btnBack">
          ← Back to Home
        </Link>
      </main>

      <style>{css}</style>
    </div>
  );
}

/* ---------- Inline CSS ---------- */
const css = `
:root{
  --bg:#f3efe9; --ink:#111827; --muted:#6b7280; --ring:#e5e7eb;
  --green:#22c55e; --red:#ef4444; --orange:#f97316;
  --shadow:0 10px 25px rgba(0,0,0,.1);
}

body{margin:0;background:var(--bg);font-family:Inter,system-ui,Segoe UI,Roboto,sans-serif;color:var(--ink)}
.page{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:flex-start}

/* top bar */
.topbar{
  width:100%;height:60px;background:#fff;border-bottom:1px solid var(--ring);
  display:flex;align-items:center;justify-content:space-between;padding:0 16px;box-shadow:var(--shadow)
}
.brand{display:flex;align-items:center;gap:10px;font-weight:900}
.logo{font-size:22px}
.brandText{font-size:18px}
.right{display:flex;gap:8px}
.iconBtn{
  border:1px solid var(--ring);border-radius:10px;padding:6px 10px;background:#fff;cursor:pointer;
  text-decoration:none;color:var(--ink)
}

/* center content */
.main404{
  text-align:center;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
  margin-top:60px;padding:16px;
}
.code404{
  font-size:10rem;font-weight:900;margin:0;color:var(--ink);line-height:1;
}
.msg{
  font-size:1.4rem;margin-top:12px;color:#9ca3af;font-weight:600;
}
.red{color:var(--red)} .green{color:var(--green)} .orange{color:var(--orange)}

.btnBack{
  margin-top:28px;background:linear-gradient(90deg,#22c55e,#f59e0b);color:#fff;
  padding:12px 20px;border-radius:10px;font-weight:700;text-decoration:none;
  box-shadow:var(--shadow);transition:all .2s ease;
}
.btnBack:hover{transform:translateY(-2px)}
`;
