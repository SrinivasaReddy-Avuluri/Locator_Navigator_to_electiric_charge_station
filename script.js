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

// Fetch nearby charging stations using OpenStreetMap Nominatim API
function fetchNearbyStations(location) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=charging+station&limit=5&lat=${location.lat}&lon=${location.lng}`;

    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            if (data.length > 0) {
                const stations = data.map((station) => ({
                    name: station.display_name.split(",")[0],
                    lat: parseFloat(station.lat),
                    lng: parseFloat(station.lon),
                    address: station.display_name,
                }));
                displayStations(stations);
            } else {
                alert("No nearby charging stations found.");
            }
        })
        .catch((error) => {
            console.error("Error fetching stations:", error);
            alert("Unable to fetch nearby stations.");
        });
}

// Display stations on the map and in the sidebar
function displayStations(stations) {
    const stationsList = document.getElementById("stations-list");
    stationsList.innerHTML = ""; // Clear previous list

    // Remove existing markers from the map
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

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
    const fromLocation = document.getElementById("location-search").value;

    if (fromLocation) {
        // Prioritize the user-provided "From Location"
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fromLocation)}`;

        fetch(url)
            .then((response) => response.json())
            .then((data) => {
                if (data.length > 0) {
                    const { lat: fromLat, lon: fromLng } = data[0];
                    calculateRoute(fromLat, fromLng, lat, lng);
                } else {
                    alert("From location not found. Please try again.");
                }
            })
            .catch((error) => {
                console.error("Error fetching from location:", error);
                alert("An error occurred while searching for the from location.");
            });
    } else if (navigator.geolocation) {
        // Use the user's current location if no "From Location" is provided
        navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            };
            calculateRoute(userLocation.lat, userLocation.lng, lat, lng);
        });
    } else {
        alert("Please enter a location or enable geolocation.");
    }
}

// Calculate and display the route using OpenRouteService API
function calculateRoute(fromLat, fromLng, toLat, toLng) {
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=YOUR_OPENROUTESERVICE_API_KEY&start=${fromLng},${fromLat}&end=${toLng},${toLat}`;

    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            if (routeLayer) {
                map.removeLayer(routeLayer);
            }

            const coordinates = data.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            routeLayer = L.polyline(coordinates, { color: 'blue' }).addTo(map);
            map.fitBounds(routeLayer.getBounds());

            const distance = data.features[0].properties.segments[0].distance / 1000; // in km
            const duration = data.features[0].properties.segments[0].duration / 60; // in minutes

            const routeDetails = document.getElementById("route-details");
            routeDetails.innerHTML = `
                <div><strong>Distance:</strong> ${distance.toFixed(2)} km</div>
                <div><strong>Duration:</strong> ${duration.toFixed(2)} minutes</div>
            `;
        })
        .catch((error) => {
            console.error("Error fetching route:", error);
            alert("Unable to calculate route.");
        });
}

// Handle location search
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