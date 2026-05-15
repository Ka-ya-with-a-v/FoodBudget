import React, { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./hawkerSwapResult.css";

export default function HawkerSwapResult() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const [loading, setLoading] = useState(true);
    const [alternatives, setAlternatives] = useState([]);
    const [meal, setMeal] = useState("");
    const [address, setAddress] = useState("");

    const userId = 1; // Temporary user ID

    useEffect(() => {
        // If state is passed via navigate, use it
        if (location.state?.meal && location.state?.alternatives) {
            setMeal(location.state.meal);
            setAlternatives(location.state.alternatives);
            setLoading(false);
        } else {
            // If page refreshed, try fetching meal and address from query params
            const mealQuery = searchParams.get("meal");
            const addrQuery = searchParams.get("address");

            if (!mealQuery || !addrQuery) {
                alert("Missing meal or address info!");
                setLoading(false);
                return;
            }

            setMeal(mealQuery);
            setAddress(addrQuery);

            // Fetch alternatives from backend
            fetch(`/api/hawker-stalls/nearby?radiusKm=3`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    address: addrQuery,
                    baseDishName: mealQuery,
                }),
            })
                .then((res) => {
                    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
                    return res.json();
                })
                .then((data) => {
                    setAlternatives(data);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("Error fetching alternatives:", err);
                    alert(`Failed to fetch alternatives: ${err.message}`);
                    setLoading(false);
                });
        }
    }, [location.state, searchParams]);

    if (loading) {
        return (
            <div className="page">
                <Navbar />
                <main className="main">
                    <h1 className="title">Smart <span>Hawker Swap</span></h1>
                    <p>Loading alternatives...</p>
                </main>
            </div>
        );
    }

    return (
        <div className="page">
            <Navbar />
            <main className="main">
                <h1 className="title">Smart <span>Hawker Swap</span></h1>

                <section className="ccontainer results-wrapper">
                    {alternatives.length === 0 ? (
                        <p>No alternatives found near your area.</p>
                    ) : (
                        alternatives.map((r) => (
                            <article className="resultCard" key={r.stallName + r.dishName}>
                                <div className="inner">
                                    <div className="rowTop">
                                        <div>
                                            <div className="mealTitle">{r.dishName}</div>
                                            <div className="stall">{r.stallName}</div>
                                        </div>
                                        <span className="saveBadge">save ${r.savings.toFixed(2)}</span>
                                    </div>

                                    <div className="desc">{r.category}</div>

                                    <div className="rowMeta">
                                        <span className="meta">📍 {r.distanceKm.toFixed(1)} km away</span>
                                        <div className="price">
                                            <span className="old">${r.oldPrice.toFixed(2)}</span>
                                            <span className="new">${r.newPrice.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="rowAddress">
                                        <span className="pill cuisine">{r.cuisine}</span>
                                        <span className="addr">{r.address}</span>
                                        <a
                                            className="btnDirections"
                                            href={`https://maps.google.com/?q=${encodeURIComponent(r.address)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Directions
                                        </a>
                                    </div>

                                    <div className="rowSavings">
                                        <span className="hint">Est. monthly savings:</span>
                                        <span className="amt">${r.estMonthlySavings.toFixed(2)}</span>
                                    </div>
                                </div>
                            </article>
                        ))
                    )}
                </section>
            </main>
        </div>
    );
}







// import React from "react";
// import { useLocation, Link } from "react-router-dom";
// import "./hawkerSwapResult.css";
// import Navbar from "../components/Navbar.jsx";

// export default function HawkerSwapResult() {
//     const { state } = useLocation() || {};
//     const selectedCuisine = state?.cuisine ?? "Chinese";
//     const selectedMeal = state?.meal ?? "Economical Rice";

//     const results = [
//         {
//             id: 1,
//             title: "Chicken Rice",
//             stall: "Tian Tian Chicken Rice",
//             distanceKm: 1.1,
//             cuisine: "CHINESE",
//             address: "1 Kadayanallur St, Singapore 069184",
//             monthlySavings: 24.0,
//             save: 0.5,
//             oldPrice: 5.0,
//             newPrice: 3.5
//         },
//         {
//             id: 2,
//             title: "Chicken Rice",
//             stall: "Heng Ji Chicken Rice",
//             distanceKm: 0.4, 
//             cuisine: "Chinese",
//             address: "15 Smith St, Singapore 058905",
//             monthlySavings: 16.0,
//             save: 0.3,
//             oldPrice: 5.0,
//             newPrice: 4.0
//         }
//     ];

//     return (
//         <div className="page">
//             {/* ✅ use Nav properly */}
//             <Navbar />

//             <main className="main">
//                 <h1 className="title">
//                     Smart <span>Hawker Swap</span>
//                 </h1>

//                 <section className="container">
//                     {results.map((r) => (
//                         <article className="resultCard" key={r.id}>
//                             <div className="inner">
//                                 <div className="rowTop">
//                                     <div>
//                                         <div className="mealTitle">{r.title}</div>
//                                         <div className="stall">{r.stall}</div>
//                                     </div>
//                                     <span className="saveBadge">save ${r.save.toFixed(2)}</span>
//                                 </div>

//                                 <div className="desc">{r.desc}</div>

//                                 <div className="rowMeta">
//                                     <span className="meta"><span aria-hidden>📍</span> {r.distanceKm}km away</span>
//                                     {/* <span className="meta"><span aria-hidden>⭐</span> {r.rating}</span> */}

//                                     <div className="price">
//                                         <span className="old">${r.oldPrice.toFixed(2)}</span>
//                                         <span className="new">${r.newPrice.toFixed(2)}</span>
//                                     </div>
//                                 </div>

//                                 <div className="rowAddress">
//                                     <span className="pill cuisine">{r.cuisine}</span>
//                                     <span className="addr">{r.address}</span>

//                                     <a
//                                         className="btnDirections"
//                                         href={`https://maps.google.com/?q=${encodeURIComponent(r.address)}`}
//                                         target="_blank"
//                                         rel="noreferrer"
//                                     >
//                                         Directions
//                                     </a>
//                                 </div>

//                                 <div className="rowSavings">
//                                     <span className="hint">Estimated monthly savings (4 meals/week):</span>
//                                     <span className="amt">${r.monthlySavings.toFixed(2)}</span>
//                                 </div>
//                             </div>
//                         </article>
//                     ))}
//                 </section>
//             </main>
//         </div>
//     );
// }
