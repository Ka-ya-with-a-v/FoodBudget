import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import NavBar from "../components/Navbar.jsx";
import "./basketResult.css";

export default function BasketResult() {
    const { state } = useLocation() || {};
    const navigate = useNavigate();

    const initialBudget = state?.budget ?? 90;
    const prefsFromSetup = state?.preferences ?? ["Vegetarian", "Vegan"];

    const itemsFromSetup =
        state?.items?.map((name, idx) => ({
            id: idx + 1,
            name: name,
            category: "Uncategorised",
            unit: "",
            price: 5, // default dummy price for testing
            locked: false,
            enabled: true,
        })) ?? [];


    const [prefs, setPrefs] = useState(prefsFromSetup);
    const [lines, setLines] = useState(itemsFromSetup);

    // Totals
    const originalTotal = useMemo(() => lines.reduce((s, x) => s + x.price, 0), [lines]);
    const optimisedTotal = useMemo(
        () => lines.reduce((s, x) => s + x.price, 0),
        [lines]
    );
    const savings = Math.max(0, originalTotal - optimisedTotal);
    const pct = originalTotal ? (savings / originalTotal) * 100 : 0;

    const toggleEnable = (id) =>
        setLines((xs) => xs.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)));

    const toggleLock = (id) =>
        setLines((xs) => xs.map((x) => (x.id === id ? { ...x, locked: !x.locked } : x)));

    const reOptimise = () => {
        navigate("/basket-setup", {
            state: { items: lines.map((l) => l.name), budget: initialBudget, preferences: prefs },
        });
    };

    const groups = useMemo(() => {
        const map = new Map();
        for (const it of lines) {
            const arr = map.get(it.category) ?? [];
            arr.push(it);
            map.set(it.category, arr);
        }
        return Array.from(map.entries());
    }, [lines]);

    return (
        <div className="page">
            <NavBar />

            <main className="main">
                <h1 className="title">
                    Grocery <span>Meal Optimiser</span>
                </h1>
                <p className="subtitle">
                    Save <b className="money">money</b> with smart shopping <b className="subs">substitutions</b>
                </p>

                <section className="savingsCard">
                    <div className="row">
                        <div className="left">
                            <div className="label">Total Savings</div>
                            <div className="big">${savings.toFixed(2)}</div>
                            <div className="tiny">{pct.toFixed(1)}% savings on your basket</div>
                        </div>
                        <div className="rightNote">
                            <div className="tiny">Original: ${originalTotal.toFixed(2)} • Optimised: ${optimisedTotal.toFixed(2)}</div>
                        </div>
                    </div>
                </section>

                {/* Results header row */}
                <div className="resultsHeader">
                    <h2>Optimisation Results</h2>

                    <div className="controls">
                        <button className="pill" onClick={reOptimise}>Re-optimise Basket</button>

                        <div className="prefs">
                            <span className="prefsLabel">Dietary preferences</span>
                            {prefs.map((p) => (
                                <span key={p} className="chip">{p}</span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="summaryLine">
                    {lines.length} items categorised – Budget: ${initialBudget.toFixed(2)}
                </div>

                {/* Items */}
                <section className="list">
                    {groups.map(([category, arr]) => (
                        <div key={category} className="group">
                            <div className="groupHeader">
                                <span className="cat">{category}</span>
                                <span className="count">{arr.length} {arr.length === 1 ? "item" : "items"}</span>
                            </div>

                            {arr.map((it) => (
                                <article key={it.id} className="itemCard">
                                    <div className="itemMain">
                                        <div className="name">{it.name}</div>
                                        <div className="meta">
                                            <span className="price">${it.price.toFixed(2)}</span>
                                            <button
                                                type="button"
                                                className={`lock ${it.locked ? "on" : ""}`}
                                                onClick={() => toggleLock(it.id)}
                                                title={it.locked ? "Unlock item" : "Lock item"}
                                                aria-pressed={it.locked}
                                            >
                                                {it.locked ? "🔒" : "🔓"}
                                            </button>

                                            <label className="switch" title={it.enabled ? "Enabled" : "Disabled"}>
                                                <input
                                                    type="checkbox"
                                                    checked={it.enabled}
                                                    onChange={() => toggleEnable(it.id)}
                                                />
                                                <span className="slider"></span>
                                            </label>
                                        </div>
                                    </div>

                                    {it.locked && (
                                        <div className="notice">
                                            🔒 This item is locked and won’t be substituted
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    ))}
                </section>
            </main>
        </div>
    );
}
