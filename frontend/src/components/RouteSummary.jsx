const ROUTE_COLORS = [
    '#ff6384', '#36a2eb', '#4bc0c0', '#9966ff', '#ff9f40',
    '#ff6384', '#c9cbcf', '#4dc9f6', '#f67019', '#537bc4',
    '#acc236', '#166a8f', '#00a950', '#58595b', '#8549ba',
    '#eb4888', '#f5c842', '#2ec4b6', '#e63946', '#457b9d',
]

function RouteSummary({ data, selectedTruck, onSelectTruck }) {
    if (!data || !data.summary) return null

    const { summary } = data
    const sorted = [...summary].sort((a, b) => b.distance_km - a.distance_km)

    return (
        <div className="summary-table-wrap glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    🚛 Click a truck to view its route details
                </span>
                {selectedTruck !== null && (
                    <button
                        onClick={() => onSelectTruck(null)}
                        style={{
                            background: 'rgba(0, 229, 255, 0.08)',
                            border: '1px solid rgba(0, 229, 255, 0.2)',
                            color: 'var(--accent-cyan)',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontFamily: 'var(--font-body)',
                        }}
                    >
                        Clear Selection
                    </button>
                )}
            </div>
            <table className="summary-table">
                <thead>
                    <tr>
                        <th>Truck</th>
                        <th>Houses</th>
                        <th>Distance</th>
                        <th>Efficiency</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((row) => {
                        const color = ROUTE_COLORS[row.cluster_id % ROUTE_COLORS.length]
                        const efficiency = row.num_houses > 0
                            ? (row.distance_km / row.num_houses).toFixed(2)
                            : '—'
                        const isSelected = selectedTruck === row.cluster_id

                        return (
                            <tr
                                key={row.cluster_id}
                                onClick={() => onSelectTruck(row.cluster_id)}
                                style={{
                                    cursor: 'pointer',
                                    background: isSelected ? `${color}15` : undefined,
                                    borderLeft: isSelected ? `3px solid ${color}` : '3px solid transparent',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <td>
                                    <span
                                        className="truck-badge"
                                        style={{ background: `${color}18`, color: color }}
                                    >
                                        <span style={{
                                            width: 8, height: 8,
                                            borderRadius: '50%',
                                            background: color,
                                            display: 'inline-block',
                                        }} />
                                        Truck {row.cluster_id + 1}
                                    </span>
                                </td>
                                <td>{row.num_houses}</td>
                                <td>
                                    <span className="distance-val">{row.distance_km} km</span>
                                </td>
                                <td style={{ color: 'var(--text-muted)' }}>
                                    {efficiency} km/house
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

export default RouteSummary
