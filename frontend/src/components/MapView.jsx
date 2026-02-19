import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, Tooltip } from 'react-leaflet'
import L from 'leaflet'

// 20 distinct colors for truck routes
const ROUTE_COLORS = [
    '#ff6384', '#36a2eb', '#4bc0c0', '#9966ff', '#ff9f40',
    '#ff6384', '#c9cbcf', '#4dc9f6', '#f67019', '#537bc4',
    '#acc236', '#166a8f', '#00a950', '#58595b', '#8549ba',
    '#eb4888', '#f5c842', '#2ec4b6', '#e63946', '#457b9d',
]

// Custom depot icon
const depotIcon = new L.DivIcon({
    html: `<div style="
    width: 32px; height: 32px;
    background: linear-gradient(135deg, #00e676, #00c853);
    border: 3px solid #fff;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    box-shadow: 0 0 15px rgba(0, 230, 118, 0.5);
  ">🏭</div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
})

function MapView({ data, selectedTruck }) {
    if (!data) return null

    const { depot, routes } = data
    const center = [depot.lat, depot.lon]

    // Filter routes based on selection
    const visibleRoutes = selectedTruck !== null
        ? routes.filter(r => r.cluster_id === selectedTruck)
        : routes

    return (
        <div className="map-container">
            <MapContainer center={center} zoom={12} scrollWheelZoom={true}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Depot Marker */}
                <Marker position={center} icon={depotIcon}>
                    <Popup>
                        <div style={{ color: '#333', fontWeight: 600 }}>
                            📍 Garbage Depot<br />
                            Lat: {depot.lat.toFixed(4)}<br />
                            Lon: {depot.lon.toFixed(4)}
                        </div>
                    </Popup>
                </Marker>

                {/* Visible truck routes */}
                {visibleRoutes.map((route) => {
                    const color = ROUTE_COLORS[route.cluster_id % ROUTE_COLORS.length]
                    const positions = route.points.map(p => [p.lat, p.lon])
                    const isSelected = selectedTruck === route.cluster_id

                    return (
                        <div key={route.cluster_id}>
                            {/* Route polyline */}
                            <Polyline
                                positions={positions}
                                pathOptions={{
                                    color,
                                    weight: isSelected ? 5 : 3.5,
                                    opacity: isSelected ? 1 : 0.85,
                                }}
                            >
                                <Tooltip sticky>
                                    🚛 Truck {route.cluster_id + 1} — {route.num_houses} houses — {route.distance_km} km
                                </Tooltip>
                            </Polyline>

                            {/* House markers */}
                            {route.points
                                .filter(p => p.type === 'house')
                                .map((p, idx) => (
                                    <CircleMarker
                                        key={`h-${route.cluster_id}-${idx}`}
                                        center={[p.lat, p.lon]}
                                        radius={isSelected ? 6 : 4}
                                        pathOptions={{
                                            color: color,
                                            fillColor: color,
                                            fillOpacity: 0.8,
                                            weight: isSelected ? 2 : 1,
                                        }}
                                    >
                                        <Tooltip>
                                            Stop #{idx + 1} of {route.num_houses} — Truck {route.cluster_id + 1}
                                        </Tooltip>
                                    </CircleMarker>
                                ))}
                        </div>
                    )
                })}
            </MapContainer>
        </div>
    )
}

export default MapView
