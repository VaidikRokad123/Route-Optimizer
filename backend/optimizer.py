"""
Core route optimization logic.
K-Means clustering + Nearest Neighbor TSP + 2-Opt improvement.
"""

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from math import radians, sin, cos, sqrt, atan2


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


def optimize_routes(file_path, num_clusters=20):
    """
    Main optimization function.
    Reads an Excel file, clusters delivery points, and optimizes routes.
    
    Returns:
        dict with keys: depot, routes, summary, num_clusters
    """
    xls = pd.ExcelFile(file_path)
    shipments = pd.read_excel(xls, 'Shipments_Data')
    store = pd.read_excel(xls, 'Store Location')
    xls.close()  # Release file handle so Windows can delete the temp file

    # Depot coordinate
    depot = (float(store['Latitute'][0]), float(store['Longitude'][0]))

    # House coordinates
    coords = shipments[['Latitude', 'Longitude']].dropna().values

    # K-Means clustering
    k = min(num_clusters, len(coords))
    kmeans = KMeans(n_clusters=k, random_state=42, n_init='auto')
    labels = kmeans.fit_predict(coords)
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

    return {
        "depot": {"lat": depot[0], "lon": depot[1]},
        "routes": routes,
        "summary": summaries,
        "num_clusters": k,
        "total_distance_km": total_distance,
        "total_houses": len(coords),
    }
