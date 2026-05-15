import React, { useEffect, useMemo, useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import "./dashboard.css";

// Constants
const YEARS = Array.from({ length: 26 }, (_, i) => 2000 + i);
const CATEGORIES = [
    "Rice & Cereal Products",
    "Meat",
    "Fish & Other Seafood",
    "Milk & Dairy",
    "Oils & Fats",
    "Fruits & Nuts",
    "Vegetables",
    "Sugar & Confectionery",
    "Condiments & Sauces",
    "Non-Alcoholic Beverages"
];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COLORS = ["#6366f1", "#ec4899", "#f97316", "#06b6d4", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

const Dashboard = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedYear, setSelectedYear] = useState(2025);
    const [viewMode, setViewMode] = useState("month");
    const [showDropdown, setShowDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);
    const [allData, setAllData] = useState([]);
    const [basePrices, setBasePrices] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hoveredPoint, setHoveredPoint] = useState(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest(".searchContainer")) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    // Fetch CPI data and base prices
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [cpiResponse, basePricesResponse] = await Promise.all([
                    fetch("/api/dashboard/all-items", {
                        method: "GET",
                        headers: { "Content-Type": "application/json" }
                    }),
                    fetch("/api/dashboard/base-prices", {
                        method: "GET",
                        headers: { "Content-Type": "application/json" }
                    })
                ]);

                if (!cpiResponse.ok) {
                    throw new Error(`CPI API Error: ${cpiResponse.status} ${cpiResponse.statusText}`);
                }
                if (!basePricesResponse.ok) {
                    throw new Error(`Base Prices API Error: ${basePricesResponse.status} ${basePricesResponse.statusText}`);
                }

                const cpiData = await cpiResponse.json();
                const basePricesData = await basePricesResponse.json();

                // Convert base prices array to object for easy lookup
                const basePricesMap = {};
                basePricesData.forEach(item => {
                    basePricesMap[item.category] = item.averagePrice;
                });

                setAllData(cpiData);
                setBasePrices(basePricesMap);
            } catch (err) {
                console.error("Fetch error:", err);
                setError(`Error: ${err.message}.`);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Calculate actual price from CPI and base price
    const calculateActualPrice = useCallback((cpiValue, category) => {
        const basePrice = basePrices[category];
        if (!basePrice || cpiValue == null) return 0;
        return (cpiValue / 100) * basePrice;
    }, [basePrices]);

    // Filter categories based on search
    const filteredCategories = useMemo(() => {
        return CATEGORIES.filter(cat =>
            cat.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    // Toggle category selection
    const toggleCategory = useCallback((cat) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    }, []);

    // Get items for selected categories with calculated actual prices
    const categoryItems = useMemo(() => {
        if (selectedCategories.length === 0) return [];
        return allData
            .filter(item => {
                const itemCategory = item.category;
                return selectedCategories.includes(itemCategory);
            })
            .map(item => ({
                ...item,
                priceSGD: calculateActualPrice(item.cpiValue || item.priceSGD, item.category)
            }));
    }, [selectedCategories, allData, calculateActualPrice]);

    // Filter by year if in month view
    const filteredItems = useMemo(() => {
        if (viewMode === "month") {
            return categoryItems.filter(item => parseInt(item.year) === selectedYear);
        }
        return categoryItems;
    }, [categoryItems, selectedYear, viewMode]);

    // Calculate yearly averages for yearly view
    const processedItems = useMemo(() => {
        if (viewMode === "month") return filteredItems;

        const yearlyData = {};
        filteredItems.forEach(item => {
            const key = `${item.category}-${item.year}`;
            if (!yearlyData[key]) {
                yearlyData[key] = { prices: [], year: item.year, category: item.category };
            }
            yearlyData[key].prices.push(item.priceSGD);
        });

        return Object.values(yearlyData).map(item => ({
            category: item.category,
            year: item.year,
            month: item.year,
            priceSGD: item.prices.reduce((a, b) => a + b, 0) / item.prices.length
        }));
    }, [filteredItems, viewMode]);

    // Group data by category
    const groupedByCategory = useMemo(() => {
        const grouped = {};
        processedItems.forEach(item => {
            if (!grouped[item.category]) {
                grouped[item.category] = [];
            }
            grouped[item.category].push(item);
        });
        return grouped;
    }, [processedItems]);

    // Chart data with multiple lines
    const chartData = useMemo(() => {
        const width = 720, height = 450, pad = 48;

        if (Object.keys(groupedByCategory).length === 0) {
            return { width, height, pad, paths: [], xTicks: [], yTicks: [] };
        }

        const allPrices = Object.values(groupedByCategory)
            .flat()
            .map(item => item.priceSGD);

        const min = Math.min(...allPrices) * 0.95;
        const max = Math.max(...allPrices) * 1.05;

        const firstCategoryData = Object.values(groupedByCategory)[0];
        const sortedFirstCategory = [...firstCategoryData].sort((a, b) => {
            if (viewMode === "month") {
                return MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month);
            } else {
                return parseInt(a.year) - parseInt(b.year);
            }
        });
        const dataLength = sortedFirstCategory.length;

        const x = (i) => pad + (i / Math.max(1, dataLength - 1)) * (width - pad * 2);
        const y = (v) => height - pad - ((v - min) / (max - min)) * (height - pad * 2);

        const paths = Object.entries(groupedByCategory).map(([category, data], idx) => {
            const sortedData = [...data].sort((a, b) => {
                if (viewMode === "month") {
                    return MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month);
                } else {
                    return parseInt(a.year) - parseInt(b.year);
                }
            });

            const d = sortedData
                .map((item, i) => `${i ? "L" : "M"} ${x(i)} ${y(item.priceSGD)}`)
                .join(" ");

            return {
                name: category,
                d,
                color: COLORS[idx % COLORS.length],
                points: sortedData.map((item, i) => ({
                    x: x(i),
                    y: y(item.priceSGD),
                    label: viewMode === "month" ? item.month : item.year,
                    price: item.priceSGD,
                    category: category
                }))
            };
        });

        const xTicks = sortedFirstCategory.map((item, i) => ({
            label: viewMode === "month" ? item.month : item.year,
            x: x(i)
        })).filter((_, i, arr) => arr.length <= 8 || i % Math.ceil(arr.length / 7) === 0);

        const yTicks = [min, (min + max) / 2, max].map(v => ({ v, y: y(v) }));

        return { width, height, pad, paths, xTicks, yTicks };
    }, [groupedByCategory, viewMode]);

    // Tile data - show stats for each category
    const tilesData = useMemo(() => {
        const tiles = [];
        Object.entries(groupedByCategory).forEach(([category, data]) => {
            const prices = data.map(i => i.priceSGD);
            const first = prices[0] ?? 0;
            const last = prices[prices.length - 1] ?? 0;
            const pct = first ? ((last - first) / first) * 100 : 0;
            tiles.push({
                category,
                price: last,
                pct,
                min: Math.min(...prices),
                max: Math.max(...prices),
                avg: prices.reduce((a, b) => a + b, 0) / prices.length
            });
        });
        return tiles;
    }, [groupedByCategory]);

    return (
        <div className="dashboardContainer">
            <Navbar />

            <main className="mainContent">
                <header className="pageHeader">
                    <h1 className="pageTitle">
                        Food Price <span className="titleGradient">Inflation</span> Tracker
                    </h1>
                    <p className="pageSubtitle">
                        Compare price trends across <span className="subtitleEmphasis">multiple food categories</span>
                    </p>
                    {error && <p className="errorMessage">{error}</p>}
                </header>

                <section className="controlSection">
                    <div className="controlGrid">
                        {/* Left Panel */}
                        <div className="leftPanel">
                            {/* View Mode */}
                            <div className="controlGroup">
                                <label className="controlLabel">View Mode</label>
                                <div className="viewModeButtons">
                                    {["month", "year"].map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => {
                                                setViewMode(mode);
                                                setShowYearDropdown(false);
                                            }}
                                            className={`viewButton ${viewMode === mode ? "viewButtonActive" : "viewButtonInactive"}`}
                                        >
                                            {mode === "month" ? "Monthly" : "Yearly"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Category Search & Multi-Select */}
                            <div className="controlGroup">
                                <label className="controlLabel">Search & Select Categories</label>
                                <div className="searchContainer">
                                    <input
                                        type="text"
                                        placeholder="Type to search..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setShowDropdown(true);
                                        }}
                                        onFocus={() => setShowDropdown(true)}
                                        className="searchInput"
                                    />
                                    <span className="searchIcon">🔍</span>

                                    {showDropdown && (
                                        <div className="dropdown">
                                            {filteredCategories.length > 0 ? (
                                                filteredCategories.map(cat => (
                                                    <label key={cat} className="dropdownItem">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedCategories.includes(cat)}
                                                            onChange={() => toggleCategory(cat)}
                                                            className="dropdownCheckbox"
                                                        />
                                                        <span className={selectedCategories.includes(cat) ? "dropdownItemTextSelected" : "dropdownItemText"}>
                                                            {cat}
                                                        </span>
                                                    </label>
                                                ))
                                            ) : (
                                                <div className="dropdownEmpty">No categories found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Selected Categories Badges */}
                            {selectedCategories.length > 0 && (
                                <div className="controlGroup">
                                    <label className="controlLabel">Selected ({selectedCategories.length})</label>
                                    <div className="badgeContainer">
                                        {selectedCategories.map((cat, idx) => (
                                            <div key={cat} className="badge" style={{ borderLeftColor: COLORS[idx % COLORS.length] }}>
                                                <span>{cat}</span>
                                                <button
                                                    onClick={() => toggleCategory(cat)}
                                                    className="badgeRemove"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Year Selector - Only show in month view */}
                            {viewMode === "month" && (
                                <div className="controlGroup">
                                    <label className="controlLabel">Select Year</label>
                                    <div style={{ position: "relative" }}>
                                        <button
                                            onClick={() => setShowYearDropdown(!showYearDropdown)}
                                            className="yearButton"
                                        >
                                            {selectedYear}
                                            <span>{showYearDropdown ? "▴" : "▾"}</span>
                                        </button>
                                        {showYearDropdown && (
                                            <div className="yearDropdown">
                                                {YEARS.map(year => (
                                                    <button
                                                        key={year}
                                                        onClick={() => {
                                                            setSelectedYear(year);
                                                            setShowYearDropdown(false);
                                                        }}
                                                        className={`yearItem ${selectedYear === year ? "yearItemActive" : "yearItemInactive"}`}
                                                    >
                                                        {year}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Stats Tiles */}
                            {selectedCategories.length > 0 && (
                                <div className="controlGroup">
                                    <label className="controlLabel">Category Stats</label>
                                    <div className="statsContainer">
                                        {tilesData.slice(0, 4).map((tile, idx) => (
                                            <div key={tile.category} className="statsTile" style={{ borderLeftColor: COLORS[idx % COLORS.length] }}>
                                                <div className="statsTileCategory">{tile.category}</div>
                                                <div className="statsTilePrice">S${tile.price?.toFixed(2)}</div>
                                                <div className={`statsTileChange ${tile.pct >= 0 ? "statsTileChangeUp" : "statsTileChangeDown"}`}>
                                                    {tile.pct >= 0 ? "▲" : "▼"} {Math.abs(tile.pct).toFixed(1)}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Panel - Chart */}
                        <div className="rightPanel">
                            <div className="chartContainer">
                                <div className="chartTitle">
                                    {selectedCategories.length > 0 ? (
                                        <>
                                            <span>{selectedCategories.length} Categories - Price Trends</span>
                                            {viewMode === "month" && <span className="yearBadge">Year: {selectedYear}</span>}
                                        </>
                                    ) : (
                                        "Select categories to compare"
                                    )}
                                </div>
                                {loading ? (
                                    <p className="loadingText">Loading...</p>
                                ) : selectedCategories.length > 0 && chartData.paths.length > 0 ? (
                                    <div>
                                        <svg
                                            width={chartData.width}
                                            height={chartData.height}
                                            className="chart"
                                            onMouseMove={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const mouseX = e.clientX - rect.left;
                                                const mouseY = e.clientY - rect.top;

                                                let closest = null;
                                                let minDist = 15;

                                                chartData.paths.forEach(path => {
                                                    path.points.forEach(point => {
                                                        const dist = Math.hypot(point.x - mouseX, point.y - mouseY);
                                                        if (dist < minDist) {
                                                            minDist = dist;
                                                            closest = { ...point };
                                                        }
                                                    });
                                                });

                                                setHoveredPoint(closest);
                                            }}
                                            onMouseLeave={() => setHoveredPoint(null)}
                                        >
                                            <line x1={chartData.pad} y1={chartData.height - chartData.pad} x2={chartData.width - chartData.pad} y2={chartData.height - chartData.pad} stroke="#e5e7eb" strokeWidth="2" />
                                            <line x1={chartData.pad} y1={chartData.pad} x2={chartData.pad} y2={chartData.height - chartData.pad} stroke="#e5e7eb" strokeWidth="2" />

                                            {chartData.yTicks.map((t, i) => (
                                                <g key={i}>
                                                    <line x1={chartData.pad} x2={chartData.width - chartData.pad} y1={t.y} y2={t.y} stroke="#f3f4f6" strokeWidth="1" />
                                                    <text x="8" y={t.y + 4} fontSize="13" fill="#9ca3af">S${t.v.toFixed(2)}</text>
                                                </g>
                                            ))}

                                            {chartData.paths.map((p, i) => (
                                                <path key={i} d={p.d} fill="none" stroke={p.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                            ))}

                                            {hoveredPoint && chartData.paths.map((path, pathIdx) => {
                                                const point = path.points.find(pt =>
                                                    Math.abs(pt.x - hoveredPoint.x) < 0.1 &&
                                                    Math.abs(pt.y - hoveredPoint.y) < 0.1
                                                );
                                                return point ? (
                                                    <circle key={`circle-${pathIdx}`} cx={point.x} cy={point.y} r="6" fill={path.color} opacity="0.8" />
                                                ) : null;
                                            })}

                                            {hoveredPoint && (
                                                <g>
                                                    <rect x={hoveredPoint.x + 10} y={hoveredPoint.y - 65} width="200" height="100" fill="#fff" stroke="#e5e7eb" strokeWidth="2" rx="8" />
                                                    <text x={hoveredPoint.x + 18} y={hoveredPoint.y - 40} fontSize="13" fontWeight="600" fill="#6b7280">{viewMode === "month" ? "Month" : "Year"}</text>
                                                    <text x={hoveredPoint.x + 18} y={hoveredPoint.y - 20} fontSize="16" fontWeight="700" fill="#1f2937">{hoveredPoint.label}</text>
                                                    <text x={hoveredPoint.x + 18} y={hoveredPoint.y + 10} fontSize="13" fontWeight="600" fill="#6b7280">Price</text>
                                                    <text x={hoveredPoint.x + 18} y={hoveredPoint.y + 35} fontSize="16" fontWeight="700" fill="#1f2937">S${hoveredPoint.price.toFixed(2)}</text>
                                                </g>
                                            )}

                                            {chartData.xTicks.map((t, i) => (
                                                <text key={i} x={t.x} y={chartData.height - 10} fontSize="13" textAnchor="middle" fill="#9ca3af">
                                                    {t.label}
                                                </text>
                                            ))}
                                        </svg>

                                        <div className="chartLegend">
                                            {chartData.paths.map((p, i) => (
                                                <div key={p.name} className="legendItem">
                                                    <div className="legendColor" style={{ backgroundColor: p.color }} />
                                                    <span className="legendText">{p.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="emptyChartText">Select categories to compare their price trends</p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;