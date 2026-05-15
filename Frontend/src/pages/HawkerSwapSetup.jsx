import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./hawkerSwapSetup.css";

export default function HawkerSwapSetup() {
    const navigate = useNavigate();
    const [meal, setMeal] = useState("");
    const [newAddress, setNewAddress] = useState("");
    const [userId] = useState(1); // Temporary user ID (can be dynamic later)

    // Save address to backend using fetch
    const saveAddress = async () => {
        if (!newAddress.trim()) return alert("Please enter an address!");

        try {
            const res = await fetch("/api/addresses/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, approximateAddress: newAddress }),
            });

            if (res.ok) {
                const data = await res.json();
                alert("Address saved successfully!");
                console.log("Saved address response:", data);
            } else {
                const errorText = await res.text();
                alert(`Failed to save address: ${errorText}`);
                console.warn("Server response:", errorText);
            }
        } catch (err) {
            console.error("Error saving address:", err);
            alert(`Error saving address: ${err.message}`);
        }
    };

    // Find cheaper alternatives using fetch
    const findAlternatives = async () => {
        if (!meal.trim()) return alert("Please enter a meal name!");
        if (!newAddress.trim()) return alert("Please enter an address first!");

        try {
            const res = await fetch("/api/hawker-stalls/nearby?radiusKm=3", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, address: newAddress, baseDishName: meal }),
            });

            if (res.ok) {
                const data = await res.json();
                console.log("Backend results:", data);

                navigate("/hawker-swap/result", {
                    state: { cuisine: "Chinese", meal: meal, alternatives: data },
                });
            } else {
                const errorText = await res.text();
                alert(`Failed to fetch alternatives: ${errorText}`);
                console.warn("Server response:", errorText);
            }
        } catch (err) {
            console.error("Error fetching alternatives:", err);
            alert(`Error fetching alternatives: ${err.message}`);
        }
    };

    return (
        <div className="page">
            <Navbar />
            <main className="main">
                <h1 className="title">
                    Smart <span>Hawker Swap</span>
                </h1>
                <p className="subtitle">
                    Find <b className="orange">cheaper</b> alternatives to your favorite hawker meals within <b className="green">3km radius</b>
                </p>

                <section className="card">
                    <div className="address-form">
                        <label className="label">Enter your address:</label>
                        <input
                            className="input"
                            type="text"
                            placeholder="e.g., 123 Example Street"
                            value={newAddress}
                            onChange={(e) => setNewAddress(e.target.value)}
                        />
                        <button onClick={saveAddress}>Save Address</button>
                    </div>

                    <div className="form">
                        <label className="label">Search for a meal:</label>
                        <input
                            className="input"
                            type="text"
                            placeholder="Enter meal name..."
                            value={meal}
                            onChange={(e) => setMeal(e.target.value)}
                        />
                        <button onClick={findAlternatives}>Find Alternatives</button>
                    </div>
                </section>
            </main>
        </div>
    );
}





// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import Navbar from "../components/Navbar";
// import "./hawkerSwapSetup.css";

// export default function HawkerSwapSetup() {
//     const navigate = useNavigate();
//     const [meal, setMeal] = useState("");
//     const [newAddress, setNewAddress] = useState("");

//     const findAlternatives = () => {
//         // Just navigate straight to /result
//         navigate("/hawker-swap/result", {
//             state: {
//                 cuisine: "Chinese",
//                 meal: meal || "Economical Rice",
//                 alternatives: [],
//             },
//         });
//     };

//     const saveAddress = () => {
//         // Temporarily disabled
//     };

//     return (
//         <div className="page">
//             <Navbar />

//             <main className="main">
//                 <h1 className="title">
//                     Smart <span>Hawker Swap</span>
//                 </h1>
//                 <p className="subtitle">
//                     Find <b className="orange">cheaper</b> alternatives to your favorite hawker meals within <b className="green">3km radius</b>
//                 </p>

//                 <section className="card">
//                     <div className="address-form">
//                         <label className="label">Enter your address:</label>
//                         <input
//                             className="input"
//                             type="text"
//                             placeholder="e.g., 123 Example Street"
//                             value={newAddress}
//                             onChange={(e) => setNewAddress(e.target.value)}
//                         />
//                         <button onClick={saveAddress}>Save Address</button>
//                     </div>

//                     <div className="form">
//                         <label className="label">Search for a meal:</label>
//                         <input
//                             className="input"
//                             type="text"
//                             placeholder="Enter meal name..."
//                             value={meal}
//                             onChange={(e) => setMeal(e.target.value)}
//                         />
//                         <button onClick={findAlternatives}>
//                             Find Alternatives
//                         </button>
//                     </div>
//                 </section>
//             </main>
//         </div>
//     );
// }











// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import Navbar from "../components/Navbar";
// import "./hawkerSwapSetup.css";
//
// export default function HawkerSwapSetup() {
//     const navigate = useNavigate();
//     const CUISINES = [
//         "Chinese", "Malay", "Indian", "Western", "Japanese", "Korean", "Thai",
//         "Vietnamese", "Indonesian", "Halal", "Vegetarian", "Seafood", "Peranakan",
//         "Tibetan", "Fusion",
//     ];
//
//     const [cuisine, setCuisine] = useState("Chinese");
//     const [meal, setMeal] = useState("Economical Rice");
//     const [inflation, setInflation] = useState([
//         { category: "Noodles", rate: "+26.1%" },
//         { category: "Rice Dishes", rate: "+24.5%" },
//     ]);
//     const [alternatives, setAlternatives] = useState([]);
//     const [newAddress, setNewAddress] = useState("");
//     const userId = "demo-user";
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState(null);
//
//     useEffect(() => {
//         axios
//             .get("http://localhost:8080/hawker-stalls/high-inflation")
//             .then((res) => {
//                 const rows = Object.entries(res.data).map(([category, rate]) => ({
//                     category,
//                     rate: `+${Number(rate).toFixed(1)}%`,
//                 }));
//                 setInflation(rows);
//             })
//             .catch((err) => {
//                 console.error("Error fetching inflation data:", err);
//                 setError("Failed to fetch inflation data");
//             });
//     }, []);
//
//     const findAlternatives = async () => {
//         setLoading(true);
//         setError(null);
//
//         try {
//             const res = await axios.post(
//                 `http://localhost:8080/hawker-stalls/nearby?baseDishName=${encodeURIComponent(meal)}&radiusKm=3`,
//                 {
//                     lat: 1.3521,
//                     lng: 103.8198,
//                     address: newAddress || "Singapore",
//                 }
//             );
//
//             const list = Array.isArray(res.data) ? res.data : [];
//
//             // Navigate to results page with state
//             navigate("/result", {
//                 state: { cuisine, meal, alternatives: list },
//             });
//         } catch (err) {
//             console.error("Error finding alternatives:", err);
//             setError("Failed to find alternatives");
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     const saveAddress = async () => {
//         if (!newAddress.trim()) return;
//         try {
//             await axios.post("http://localhost:8080/api/addresses", {
//                 userId,
//                 address: newAddress,
//                 label: "Home",
//             });
//             alert("Address saved!");
//             setNewAddress("");
//         } catch (err) {
//             console.error("Error saving address:", err);
//             alert("Failed to save address");
//         }
//     };
//
//     return (
//         <div className="page">
//             <Navbar />
//
//             <main className="main">
//                 <h1 className="title">
//                     Smart <span>Hawker Swap</span>
//                 </h1>
//                 <p className="subtitle">
//                     Find <b className="orange">cheaper</b> alternatives to your favorite hawker meals within <b className="green">3km radius</b>
//                 </p>
//
//                 <section className="card">
//
//                     {/*
//           {error && (
//             <div className="alert">
//               <b>⚠️ {error}</b>
//             </div>
//           )}
//
//           <div className="alert">
//             <b>⚠️ High Inflation Detected!</b>
//             <p>{inflation.length} food categories are experiencing high inflation:</p>
//             <ul>
//               {inflation.map((item, i) => (
//                 <li key={i}>
//                   {item.category} <span className="rate">{item.rate} increase</span>
//                 </li>
//               ))}
//             </ul>
//           </div>
//           */}
//
//                     <div className="address-form">
//                         <label className="label">Enter your address:</label>
//                         <input
//                             className="input"
//                             type="text"
//                             placeholder="e.g., 123 Example Street"
//                             value={newAddress}
//                             onChange={(e) => setNewAddress(e.target.value)}
//                         />
//                         <button onClick={saveAddress}>Save Address</button>
//                     </div>
//
//                     <div className="form">
//                         <label className="label">Search for a meal:</label>
//                         <input
//                             className="input"
//                             type="text"
//                             placeholder="Enter meal name..."
//                             value={meal}
//                             onChange={(e) => setMeal(e.target.value)}
//                         />
//                         <button onClick={findAlternatives} disabled={loading}>
//                             {loading ? "Finding..." : "Find Alternatives"}
//                         </button>
//
//                         <div className="alternatives">
//                             <p className="altTitle">⤷ Cheaper alternatives within <b>3km</b>:</p>
//                             {alternatives.length === 0 ? (
//                                 <p style={{ color: "#64748B" }}>No alternatives yet. Try searching.</p>
//                             ) : (
//                                 alternatives.map((a, i) => (
//                                     <div key={i} className="altCard">
//                                         <div className="altName">
//                                             {a.name || a.dishName || "Unknown dish"}
//                                             {a.distanceKm && <span>· {a.distanceKm.toFixed(1)}km</span>}
//                                             {a.address && <span>· {a.address}</span>}
//                                         </div>
//                                         <div className="saveTag">
//                                             {a.save ? `save $${a.save.toFixed(2)}` : a.price ? `$${a.price.toFixed(2)}` : "view"}
//                                         </div>
//                                     </div>
//                                 ))
//                             )}
//                         </div>
//                     </div>
//                 </section>
//             </main>
//         </div>
//     );
// }


