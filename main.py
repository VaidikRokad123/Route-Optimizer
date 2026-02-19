import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from math import radians, sin, cos, sqrt, atan2
import folium
from tqdm import tqdm
from IPython.display import display

# --- Haversine distance (km) ---
def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat, dlon = radians(lat2 - lat1), radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1))*cos(radians(lat2))*sin(dlon/2)**2
    return 2 * R * atan2(sqrt(a), sqrt(1 - a))

# --- Distance matrix for a set of coordinates ---
def dist_matrix(coords):
    n = len(coords)
    D = np.zeros((n, n))
    for i in range(n):
        for j in range(i+1, n):
            D[i, j] = D[j, i] = haversine(*coords[i], *coords[j])
    return D

# --- Nearest Neighbor heuristic for TSP ---
def nearest_neighbor(D):
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

# --- 2-Opt improvement ---
def two_opt(route, D):
    best = route
    improved = True
    while improved:
        improved = False
        for i in range(1, len(route)-2):
            for j in range(i+1, len(route)-1):
                if D[best[i-1], best[i]] + D[best[j], best[j+1]] > D[best[i-1], best[j]] + D[best[i], best[j+1]]:
                    best[i:j+1] = reversed(best[i:j+1])
                    improved = True
        route = best
    return best


# 👉 Mount your Google Drive if the Excel file is there, or upload it manually.
# from google.colab import drive
# drive.mount('/content/drive')

# Example path (adjust if in Drive)
file_path = "/content/smart_route_optimization.xlsx"

xls = pd.ExcelFile(file_path)
shipments = pd.read_excel(xls, 'Shipments_Data')
store = pd.read_excel(xls, 'Store Location')

print("Sheets found:", xls.sheet_names)
print("Shipments shape:", shipments.shape)
shipments.head()


# Extract depot coordinate (store)
depot = (store['Latitute'][0], store['Longitude'][0])

# Extract house coordinates
coords = shipments[['Latitude', 'Longitude']].dropna().values

k = 20  # number of trucks/clusters
kmeans = KMeans(n_clusters=k, random_state=42, n_init='auto')
labels = kmeans.fit_predict(coords)

shipments['cluster'] = labels
print(shipments['cluster'].value_counts())


routes, summaries = [], []
for cluster_id in tqdm(range(k), desc="Optimizing routes"):
    cluster_points = shipments[shipments['cluster'] == cluster_id][['Latitude', 'Longitude']].values
    if len(cluster_points) == 0: 
        continue

    # Add depot at start
    cluster_coords = np.vstack([depot, cluster_points])
    D = dist_matrix(cluster_coords)

    route = nearest_neighbor(D)
    route = two_opt(route, D)

    total_dist = sum(D[route[i], route[i+1]] for i in range(len(route)-1))

    for seq, idx in enumerate(route):
        routes.append({
            "cluster": cluster_id,
            "seq": seq,
            "type": "depot" if idx == 0 else "house",
            "lat": cluster_coords[idx][0],
            "lon": cluster_coords[idx][1],
            "cluster_size": len(cluster_points)
        })
    summaries.append({"cluster": cluster_id,
                      "num_houses": len(cluster_points),
                      "distance_km": total_dist})

routes_df = pd.DataFrame(routes)
summary_df = pd.DataFrame(summaries)

routes_df.to_csv("optimized_routes.csv", index=False)
summary_df.to_csv("routes_summary.csv", index=False)

routes_df.head()


# m = folium.Map(location=depot, zoom_start=12)
# colors = [
#     'red','blue','green','purple','orange','darkred','lightred','beige',
#     'darkblue','darkgreen','cadetblue','darkpurple','white','pink','lightblue',
#     'lightgreen','gray','black','lightgray','brown'
# ]

# for c in range(k):
#     cluster_data = routes_df[routes_df['cluster'] == c]
#     if cluster_data.empty: 
#         continue
#     color = colors[c % len(colors)]
#     pts = list(zip(cluster_data['lat'], cluster_data['lon']))
#     folium.PolyLine(pts, color=color, weight=3, opacity=0.7).add_to(m)
#     folium.Marker(pts[0], icon=folium.Icon(color="green"), tooltip=f"Depot {c}").add_to(m)

# m.save("garbage_routes.html")
# m


# summary_df.sort_values("distance_km", ascending=False).head(10)


# --- Single combined map ---
m_all = folium.Map(location=depot, zoom_start=12)

# 20 distinct colors
colors = [
    'red','blue','green','purple','orange','darkred','lightred','beige',
    'darkblue','darkgreen','cadetblue','darkpurple','white','pink','lightblue',
    'lightgreen','gray','black','lightgray','brown'
]

# Add depot marker
folium.Marker(depot, icon=folium.Icon(color="green", icon="home"), tooltip="Garbage Depot").add_to(m_all)

# Add each truck route
for c in range(k):
    cluster_data = routes_df[routes_df['cluster'] == c]
    if cluster_data.empty:
        continue

    pts = list(zip(cluster_data['lat'], cluster_data['lon']))
    color = colors[c % len(colors)]
    
    # Draw route polyline
    folium.PolyLine(
        pts, 
        color=color, 
        weight=4, 
        opacity=0.8, 
        tooltip=f"Truck {c} (Houses: {len(pts)-1})"
    ).add_to(m_all)
    
    # Add start and end markers
    folium.CircleMarker(
        location=pts[0], radius=5, color="green", fill=True, tooltip=f"Start/Depot - Truck {c}"
    ).add_to(m_all)
    folium.CircleMarker(
        location=pts[-1], radius=5, color="red", fill=True, tooltip=f"End - Truck {c}"
    ).add_to(m_all)

print("🗺️ Displaying combined map with all 20 truck routes:")
display(m_all)