let map;
let markers = [];
let routeLayer;

// Initialize the map
function initMap() {
    map = L.map('map').setView([20.5937, 78.9629], 5); // Default center (India)

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    enableLocation();
}

// Enable location and fetch nearby charging stations
function enableLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                map.setView([userLocation.lat, userLocation.lng], 13);
                fetchNearbyStations(userLocation);
            },
            () => {
                alert("Unable to fetch your location. Please try again.");
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
    }
}

// Fetch nearby charging stations (mock data for now)
function fetchNearbyStations(location) {
    const stations = [
        { name: "Station 1", lat: location.lat + 0.01, lng: location.lng + 0.01, address: "Address 1" },
        { name: "Station 2", lat: location.lat + 0.02, lng: location.lng - 0.01, address: "Address 2" },
        { name: "Station 3", lat: location.lat - 0.01, lng: location.lng + 0.02, address: "Address 3" },
        { name: "Station 4", lat: location.lat - 0.02, lng: location.lng - 0.02, address: "Address 4" },
        { name: "Station 5", lat: location.lat + 0.03, lng: location.lng + 0.03, address: "Address 5" }
    ];

    displayStations(stations);
}

// Display stations on the map and in the sidebar
function displayStations(stations) {
    const stationsList = document.getElementById("stations-list");
    stationsList.innerHTML = ""; // Clear previous list

    stations.forEach((station, index) => {
        const marker = L.marker([station.lat, station.lng]).addTo(map)
            .bindPopup(`<b>${station.name}</b><br>${station.address}`);

        markers.push(marker);

        const stationElement = document.createElement("div");
        stationElement.className = "station-item";
        stationElement.innerHTML = `
            <div class="station-name">${station.name}</div>
            <div class="station-address">${station.address}</div>
        `;
        stationElement.addEventListener("click", () => {
            map.setView([station.lat, station.lng], 15);
            marker.openPopup();
            showStationDetails(station);
        });
        stationsList.appendChild(stationElement);

        // Automatically show details for the first station
        if (index === 0) {
            showStationDetails(station);
        }
    });
}

// Show station details and add navigation button
function showStationDetails(station) {
    const detailsContent = document.getElementById("details-content");
    detailsContent.innerHTML = `
        <div class="detail-item"><strong>Name:</strong> ${station.name}</div>
        <div class="detail-item"><strong>Address:</strong> ${station.address}</div>
        <button onclick="navigateToStation(${station.lat}, ${station.lng})">Navigate</button>
    `;
}

// Navigate to a station using OpenRouteService API
function navigateToStation(lat, lng) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };

            const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=YOUR_OPENROUTESERVICE_API_KEY&start=${userLocation.lng},${userLocation.lat}&end=${lng},${lat}`;

            fetch(url)
                .then((response) => response.json())
                .then((data) => {
                    if (routeLayer) {
                        map.removeLayer(routeLayer);
                    }

                    const coordinates = data.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
                    routeLayer = L.polyline(coordinates, { color: 'blue' }).addTo(map);
                    map.fitBounds(routeLayer.getBounds());
                })
                .catch((error) => {
                    console.error("Error fetching route:", error);
                    alert("Unable to calculate route.");
                });
        });
    } else {
        alert("Geolocation is not supported by your browser.");
    }
}

// Search for a location using Nominatim API
document.getElementById("search-btn").addEventListener("click", () => {
    const location = document.getElementById("location-search").value;
    if (location) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`;

        fetch(url)
            .then((response) => response.json())
            .then((data) => {
                if (data.length > 0) {
                    const { lat, lon } = data[0];
                    map.setView([lat, lon], 13);
                    fetchNearbyStations({ lat: parseFloat(lat), lng: parseFloat(lon) });
                } else {
                    alert("Location not found. Please try again.");
                }
            })
            .catch((error) => {
                console.error("Error fetching location:", error);
                alert("An error occurred while searching for the location.");
            });
    } else {
        alert("Please enter a location.");
    }
});

// Initialize the map when the page loads
window.onload = initMap;