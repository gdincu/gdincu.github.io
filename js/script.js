const map = L.map('map').setView([44.319603, 23.801761], 14);

map.createPane('routePane');
map.getPane('routePane').style.zIndex = 400;
map.createPane('stopPane');
map.getPane('stopPane').style.zIndex = 500;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

const busMarkers = {};
let shapesData, schedules, colorData, stopsData;

const stopIcon = L.icon({
    iconUrl: 'assets/icons/bus-stop.png',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10]
});

Promise.all([
    fetch('data/route_colors.json').then(res => res.json()),
    fetch('data/gtfs_shapes.geojson').then(res => res.json()),
    fetch('data/bus_schedules.json').then(res => res.json()),
    fetch('data/gtfs_stops.geojson').then(res => res.json())
]).then(([colors, shapes, scheds, stops]) => {
    colorData = colors;
    shapesData = shapes;
    schedules = scheds;
    stopsData = stops;

    L.geoJSON(shapesData, {
        pane: 'routePane',
        style: (f) => ({ color: colorData[f.properties.shape_id]?.color || "#3388ff", weight: 5, opacity: 0.6 }),
        onEachFeature: (f, l) => {
            const name = colorData[f.properties.shape_id]?.route_name || "Unknown";
            l.bindPopup(`<strong>Route: ${name}</strong><br>ID: ${f.properties.shape_id}`);
        }
    }).addTo(map);

    L.geoJSON(stopsData, {
        pane: 'stopPane',
        pointToLayer: (f, latlng) => L.marker(latlng, { icon: stopIcon }),
        onEachFeature: (f, l) => l.bindPopup(`<strong>Stop:</strong> ${f.properties.stop_name}<br>ID: ${f.properties.stop_id}`)
    }).addTo(map);

    updateBuses(); 
    autoPlay.start(); 
}).catch(err => console.error("Error loading resources:", err));

const slider = document.getElementById('time-slider');
const timeDisplay = document.getElementById('time-display');

function secondsToTime(s) { return new Date(s * 1000).toISOString().substr(11, 8); }
function timeToSeconds(t) { const [h, m, s] = t.split(':').map(Number); return h * 3600 + m * 60 + s; }

function updateBuses() {
    if (!schedules || !shapesData) return;
    const currentSeconds = parseInt(slider.value);
    timeDisplay.innerText = secondsToTime(currentSeconds);

    schedules.forEach(trip => {
        const start = timeToSeconds(trip.start_time);
        const end = timeToSeconds(trip.end_time);

        if (currentSeconds >= start && currentSeconds <= end) {
            const progress = (currentSeconds - start) / (end - start);
            const shape = shapesData.features.find(f => f.properties.shape_id === trip.shape_id);
            
            if (shape) {
                const coords = shape.geometry.coordinates;
                const index = Math.floor(progress * (coords.length - 1));
                const pos = coords[index];
                const newLatLng = [pos[1], pos[0]];

                if (!busMarkers[trip.trip_id]) {
                    const icon = L.icon({
                        iconUrl: `assets/icons/route_icon_${trip.route_short_name.toLowerCase()}.png`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15],
                        className: 'route-icon-marker'
                    });

                    busMarkers[trip.trip_id] = L.marker(newLatLng, {icon: icon})
                        .addTo(map)
                        .bindPopup(`
                            <div style="line-height:1.4">
                                <strong style="color:#d00">Active Bus</strong><br>
                                <b>Route:</b> ${trip.route_short_name}<br>
                                <b>Trip ID:</b> ${trip.trip_id}<br>
                                <b>Ends at:</b> ${trip.end_time}
                            </div>
                        `, { autoPan: false });
                } else {
                    busMarkers[trip.trip_id].setLatLng(newLatLng);
                    if (busMarkers[trip.trip_id].getPopup().isOpen()) {
                        busMarkers[trip.trip_id].getPopup().setLatLng(newLatLng);
                    }
                }
            }
        } else if (busMarkers[trip.trip_id]) {
            map.removeLayer(busMarkers[trip.trip_id]);
            delete busMarkers[trip.trip_id];
        }
    });
}

slider.addEventListener('input', updateBuses);

const autoPlay = {
    active: false, 
    speedMultiplier: 30, 
    lastTimestamp: 0,
    toggle() { this.active ? this.stop() : this.start(); },
    start() {
        if (this.active) return;
        this.active = true;
        this.lastTimestamp = performance.now();
        document.getElementById('play-pause-btn').innerHTML = '<i class="fas fa-pause"></i>';
        requestAnimationFrame(this.step.bind(this));
    },
    stop() {
        this.active = false;
        document.getElementById('play-pause-btn').innerHTML = '<i class="fas fa-play"></i>';
    },
    step(timestamp) {
        if (!this.active) return;
        const delta = (timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;
        let val = parseFloat(slider.value) + (delta * this.speedMultiplier);
        slider.value = (val > 86399) ? 0 : val;
        updateBuses();
        requestAnimationFrame(this.step.bind(this));
    }
};

const recorder = {
    mediaRecorder: null, 
    chunks: [],
    async start() {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: false });
            this.chunks = [];
            this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
            this.mediaRecorder.ondataavailable = e => this.chunks.push(e.data);
            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.chunks, { type: 'video/webm' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'bus-visualization.webm';
                a.click();
                document.getElementById('recording-status').style.display = 'none';
                stream.getTracks().forEach(t => t.stop());
            };
            this.mediaRecorder.start();
            document.getElementById('recording-status').style.display = 'block';
        } catch (e) { console.error("Recording error:", e); }
    },
    stop() { if(this.mediaRecorder) this.mediaRecorder.stop(); }
};