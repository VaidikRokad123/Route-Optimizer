import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import axios from 'axios'
import MapView from '../components/MapView'
import RouteSummary from '../components/RouteSummary'

function Dashboard({ data, onOptimized }) {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [selectedTruck, setSelectedTruck] = useState(null)

    // If no data, try fetching demo
    const handleLoadDemo = async () => {
        setLoading(true)
        try {
            const res = await axios.get('/api/optimize/demo')
            onOptimized(res.data)
        } catch {
            // ignore
        } finally {
            setLoading(false)
        }
    }

    const handleSelectTruck = (clusterId) => {
        // Toggle: click same truck again to deselect
        setSelectedTruck(prev => prev === clusterId ? null : clusterId)
    }

    // Get selected truck details
    const selectedRoute = selectedTruck !== null
        ? data?.routes?.find(r => r.cluster_id === selectedTruck)
        : null

    if (!data) {
        return (
            <div className="page">
                <div className="empty-state">
                    <div className="empty-icon">🗺️</div>
                    <h2>No route data yet</h2>
                    <p>Upload an Excel file or try the demo to see optimized routes</p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <button className="btn btn-primary" onClick={() => navigate('/')}>
                            📤 Upload File
                        </button>
                        <button className="btn btn-secondary" onClick={handleLoadDemo} disabled={loading}>
                            {loading ? '⏳ Loading...' : '⚡ Load Demo'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            {loading && (
                <div className="loading-overlay">
                    <div className="loading-spinner" />
                    <p className="loading-text">Processing routes...</p>
                </div>
            )}

            <div className="page">
                <div className="page-header">
                    <h1>
                        <span className="gradient-text">Route</span> Dashboard
                    </h1>
                    <p>
                        <span className="pulse-ring" style={{ marginRight: 8 }} />
                        {selectedTruck !== null
                            ? `Viewing Truck ${selectedTruck + 1} — click again to show all`
                            : `AI optimization complete — ${data.num_clusters} trucks, ${data.total_houses} houses`
                        }
                    </p>
                </div>

                {/* Stats Cards — show selected truck stats or overall */}
                {selectedRoute ? (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">🚛</div>
                            <div className="stat-value">#{selectedTruck + 1}</div>
                            <div className="stat-label">Truck ID</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🏠</div>
                            <div className="stat-value">{selectedRoute.num_houses}</div>
                            <div className="stat-label">Houses Visited</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📏</div>
                            <div className="stat-value">{selectedRoute.distance_km}</div>
                            <div className="stat-label">Route Distance (km)</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📍</div>
                            <div className="stat-value">{selectedRoute.points.length}</div>
                            <div className="stat-label">Total Stops</div>
                        </div>
                    </div>
                ) : (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">🚛</div>
                            <div className="stat-value">{data.num_clusters}</div>
                            <div className="stat-label">Total Trucks</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🏠</div>
                            <div className="stat-value">{data.total_houses}</div>
                            <div className="stat-label">Houses Covered</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📏</div>
                            <div className="stat-value">{data.total_distance_km}</div>
                            <div className="stat-label">Total Distance (km)</div>
                        </div>
                        {data.max_cluster_size ? (
                            <div className="stat-card">
                                <div className="stat-icon">📦</div>
                                <div className="stat-value">≤ {data.max_cluster_size}</div>
                                <div className="stat-label">Max Houses/Truck</div>
                            </div>
                        ) : (
                            <div className="stat-card">
                                <div className="stat-icon">⚡</div>
                                <div className="stat-value">
                                    {data.total_houses > 0
                                        ? (data.total_distance_km / data.total_houses).toFixed(2)
                                        : '—'}
                                </div>
                                <div className="stat-label">Avg km/house</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Clear selection button */}
                {selectedTruck !== null && (
                    <div style={{ marginBottom: 16, textAlign: 'right' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setSelectedTruck(null)}
                            style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                        >
                            ✕ Show All Trucks
                        </button>
                    </div>
                )}

                {/* Map */}
                <MapView data={data} selectedTruck={selectedTruck} />

                {/* Route Summary Table */}
                <RouteSummary
                    data={data}
                    selectedTruck={selectedTruck}
                    onSelectTruck={handleSelectTruck}
                />
            </div>
        </>
    )
}

export default Dashboard
