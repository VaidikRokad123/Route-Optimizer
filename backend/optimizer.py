"""
Core route optimization logic.
K-Means clustering + Balanced Assignment + Nearest Neighbor TSP + 2-Opt improvement.
"""

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from math import radians, sin, cos, sqrt, atan2, ceil


def haversine(lat1, lon1, lat2, lon2):
    """Calculate distance (km) between two lat/lon points."""
    R = 6371
    dlat, dlon = radians(lat2 - lat1), radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * R * atan2(sqrt(a), sqrt(1 - a))


def dist_matrix(coords):
    """Build pairwise distance matrix for a set of coordinates."""
    n = len(coords)
    D = np.zeros((n, n))
    for i in range(n):
        for j in range(i + 1, n):
            D[i, j] = D[j, i] = haversine(*coords[i], *coords[j])
    return D


def balanced_cluster_assignment(coords, centroids, max_size):
    """
    Assign points to nearest centroid while respecting max cluster size.

    Algorithm:
    1. Compute distance from every point to every centroid.
    2. Create a list of (distance, point_idx, centroid_idx) tuples.
    3. Sort by distance (closest first).
    4. Greedily assign each point to its nearest centroid that still has capacity.

    Returns:
        numpy array of cluster labels (same shape as coords rows).
    """
    n_points = len(coords)
    k = len(centroids)
    labels = np.full(n_points, -1, dtype=int)
    cluster_counts = np.zeros(k, dtype=int)

    # Compute all distances: points × centroids
    distances = np.zeros((n_points, k))
    for i in range(n_points):
        for j in range(k):
            distances[i, j] = haversine(
                coords[i][0], coords[i][1],
                centroids[j][0], centroids[j][1]
            )

    # Build sorted assignment candidates: (distance, point_idx, centroid_idx)
    candidates = []
    for i in range(n_points):
        for j in range(k):
            candidates.append((distances[i, j], i, j))
    candidates.sort(key=lambda x: x[0])

    # Greedy assignment: closest first, skip if cluster is full
    assigned = set()
    for dist, pt, cid in candidates:
        if pt in assigned:
            continue
        if cluster_counts[cid] < max_size:
            labels[pt] = cid
            cluster_counts[cid] += 1
            assigned.add(pt)
        if len(assigned) == n_points:
            break

    # Safety: assign any remaining unassigned points to the least-full cluster
    for i in range(n_points):
        if labels[i] == -1:
            least_full = np.argmin(cluster_counts)
            labels[i] = least_full
            cluster_counts[least_full] += 1

    return labels


def nearest_neighbor(D):
    """Nearest Neighbor heuristic for TSP."""
    n = len(D)
    unvisited = set(range(1, n))
    route = [0]
    while unvisited:
        last = route[-1]
        next_city = min(unvisited, key=lambda j: D[last, j])
        route.append(next_city)
        unvisited.remove(next_city)
    route.append(0)
    return route


def two_opt(route, D):
    """2-Opt improvement on a TSP route."""
    best = list(route)
    improved = True
    while improved:
        improved = False
        for i in range(1, len(best) - 2):
            for j in range(i + 1, len(best) - 1):
                if (D[best[i - 1], best[i]] + D[best[j], best[j + 1]] >
                        D[best[i - 1], best[j]] + D[best[i], best[j + 1]]):
                    best[i:j + 1] = reversed(best[i:j + 1])
                    improved = True
    return best


def optimize_routes(file_path, num_clusters=20, max_cluster_size=None):
    """
    Main optimization function.
    Reads an Excel file, clusters delivery points, and optimizes routes.

    Args:
        file_path: Path to the Excel file with shipment data.
        num_clusters: Number of trucks/clusters (used when max_cluster_size is None).
        max_cluster_size: Max houses per truck. If provided, num_clusters is
                          computed automatically as ceil(total_houses / max_cluster_size).

    Returns:
        dict with keys: depot, routes, summary, num_clusters, etc.
    """
    xls = pd.ExcelFile(file_path)
    shipments = pd.read_excel(xls, 'Shipments_Data')
    store = pd.read_excel(xls, 'Store Location')
    xls.close()  # Release file handle so Windows can delete the temp file

    # Depot coordinate
    depot = (float(store['Latitute'][0]), float(store['Longitude'][0]))

    # House coordinates
    coords = shipments[['Latitude', 'Longitude']].dropna().values

    # Determine number of clusters
    if max_cluster_size and max_cluster_size > 0:
        k = int(ceil(len(coords) / max_cluster_size))
        k = max(1, min(k, len(coords)))  # Clamp to valid range
    else:
        k = min(num_clusters, len(coords))
        max_cluster_size = None  # Ensure it's None for plain K-Means path

    # K-Means to find good spatial centroids
    kmeans = KMeans(n_clusters=k, random_state=42, n_init='auto')
    kmeans.fit(coords)

    # Assign labels — balanced if max_cluster_size is set, plain K-Means otherwise
    if max_cluster_size:
        labels = balanced_cluster_assignment(coords, kmeans.cluster_centers_, max_cluster_size)
    else:
        labels = kmeans.labels_

    shipments_clean = shipments[['Latitude', 'Longitude']].dropna().copy()
    shipments_clean['cluster'] = labels

    routes = []
    summaries = []

    for cluster_id in range(k):
        cluster_points = shipments_clean[shipments_clean['cluster'] == cluster_id][['Latitude', 'Longitude']].values
        if len(cluster_points) == 0:
            continue

        # Add depot at start
        cluster_coords = np.vstack([depot, cluster_points])
        D = dist_matrix(cluster_coords)

        route = nearest_neighbor(D)
        route = two_opt(route, D)

        total_dist = sum(D[route[i], route[i + 1]] for i in range(len(route) - 1))

        route_points = []
        for seq, idx in enumerate(route):
            route_points.append({
                "seq": seq,
                "type": "depot" if idx == 0 else "house",
                "lat": float(cluster_coords[idx][0]),
                "lon": float(cluster_coords[idx][1]),
            })

        routes.append({
            "cluster_id": cluster_id,
            "points": route_points,
            "num_houses": len(cluster_points),
            "distance_km": round(total_dist, 2),
        })

        summaries.append({
            "cluster_id": cluster_id,
            "num_houses": len(cluster_points),
            "distance_km": round(total_dist, 2),
        })

    total_distance = round(sum(s['distance_km'] for s in summaries), 2)

    result = {
        "depot": {"lat": depot[0], "lon": depot[1]},
        "routes": routes,
        "summary": summaries,
        "num_clusters": k,
        "total_distance_km": total_distance,
        "total_houses": len(coords),
    }

    if max_cluster_size:
        result["max_cluster_size"] = max_cluster_size

    return result
