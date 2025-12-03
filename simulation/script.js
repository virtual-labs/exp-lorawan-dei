// Virtual Lab State
const state = {
    device: 'esp32',
    devEUI: '',
    appEUI: '',
    appKey: '',
    spreadingFactor: 7,
    bandwidth: 125,
    codingRate: '4/5',
    sensors: {
        temperature: true,
        humidity: true,
        pressure: false,
        light: false
    },
    isActivated: false,
    isTransmitting: false,
    packetsSent: 0,
    packetsReceived: 0,
    frameCounter: 0,
    sensorData: {
        temperature: [],
        humidity: [],
        pressure: [],
        light: []
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    updateConnectionLines();
    window.addEventListener('resize', updateConnectionLines);
});

// Event Listeners
function initializeEventListeners() {
    // Device selection
    document.querySelectorAll('.device-card').forEach(card => {
        card.addEventListener('click', () => selectDevice(card.dataset.device));
    });

    // Generate buttons
    document.getElementById('genDevEUI').addEventListener('click', () => generateHex('devEUI', 16));
    document.getElementById('genAppEUI').addEventListener('click', () => generateHex('appEUI', 16));
    document.getElementById('genAppKey').addEventListener('click', () => generateHex('appKey', 32));

    // Spreading factor slider
    const sfSlider = document.getElementById('spreadingFactor');
    sfSlider.addEventListener('input', (e) => {
        state.spreadingFactor = parseInt(e.target.value);
        document.getElementById('sfValue').textContent = e.target.value;
    });

    // Bandwidth and coding rate
    document.getElementById('bandwidth').addEventListener('change', (e) => {
        state.bandwidth = parseInt(e.target.value);
    });
    document.getElementById('codingRate').addEventListener('change', (e) => {
        state.codingRate = e.target.value;
    });

    // Sensor toggles
    document.getElementById('tempSensor').addEventListener('change', (e) => {
        state.sensors.temperature = e.target.checked;
        updateSensorVisibility();
    });
    document.getElementById('humiditySensor').addEventListener('change', (e) => {
        state.sensors.humidity = e.target.checked;
        updateSensorVisibility();
    });
    document.getElementById('pressureSensor').addEventListener('change', (e) => {
        state.sensors.pressure = e.target.checked;
        updateSensorVisibility();
    });
    document.getElementById('lightSensor').addEventListener('change', (e) => {
        state.sensors.light = e.target.checked;
        updateSensorVisibility();
    });

    // Activate button
    document.getElementById('activateBtn').addEventListener('click', activateDevice);

    // Simulation controls
    document.getElementById('startSimBtn').addEventListener('click', startTransmission);
    document.getElementById('pauseSimBtn').addEventListener('click', pauseTransmission);

    // Other buttons
    document.getElementById('resetBtn').addEventListener('click', resetLab);
    document.getElementById('helpBtn').addEventListener('click', () => showModal(true));
    document.getElementById('closeHelpBtn').addEventListener('click', () => showModal(false));
    document.getElementById('clearLogBtn').addEventListener('click', clearLog);

    // Modal click outside
    document.getElementById('helpModal').addEventListener('click', (e) => {
        if (e.target.id === 'helpModal') showModal(false);
    });
}

// Device Selection
function selectDevice(device) {
    state.device = device;
    document.querySelectorAll('.device-card').forEach(card => {
        card.classList.toggle('active', card.dataset.device === device);
    });
    document.getElementById('deviceType').textContent = device.toUpperCase();
    addLog('info', `Selected device: ${device.toUpperCase()}`);
}

// Generate Hex
function generateHex(field, length) {
    const hex = Array.from({ length }, () =>
        Math.floor(Math.random() * 16).toString(16)
    ).join('').toUpperCase();

    document.getElementById(field).value = hex;
    state[field] = hex;
    addLog('info', `Generated ${field.toUpperCase()}: ${hex}`);
}

// Activate Device
function activateDevice() {
    const devEUI = document.getElementById('devEUI').value;
    const appEUI = document.getElementById('appEUI').value;
    const appKey = document.getElementById('appKey').value;

    if (!devEUI || devEUI.length !== 16) {
        addLog('error', 'Invalid DevEUI. Must be 16 hex characters.');
        return;
    }
    if (!appEUI || appEUI.length !== 16) {
        addLog('error', 'Invalid AppEUI. Must be 16 hex characters.');
        return;
    }
    if (!appKey || appKey.length !== 32) {
        addLog('error', 'Invalid AppKey. Must be 32 hex characters.');
        return;
    }

    state.devEUI = devEUI;
    state.appEUI = appEUI;
    state.appKey = appKey;
    state.isActivated = true;

    document.getElementById('deviceStatus').textContent = 'Activated';
    document.getElementById('deviceStatus').classList.add('active');

    addLog('success', 'Device activation initiated...');

    setTimeout(() => {
        addLog('success', 'Join Request sent to Network Server');
    }, 500);

    setTimeout(() => {
        addLog('success', 'Join Accept received');
    }, 1500);

    setTimeout(() => {
        addLog('success', `${state.device.toUpperCase()} successfully joined LoRaWAN network!`);
        addLog('info', 'Ready to transmit data. Click Play to start.');
    }, 2500);
}

// Start Transmission
function startTransmission() {
    if (!state.isActivated) {
        addLog('error', 'Please activate device first');
        return;
    }

    state.isTransmitting = true;
    document.getElementById('startSimBtn').style.display = 'none';
    document.getElementById('pauseSimBtn').style.display = 'flex';

    addLog('info', 'Starting data transmission...');
    transmitData();
}

// Pause Transmission
function pauseTransmission() {
    state.isTransmitting = false;
    document.getElementById('startSimBtn').style.display = 'flex';
    document.getElementById('pauseSimBtn').style.display = 'none';
    addLog('warning', 'Transmission paused');
}

// Transmit Data
function transmitData() {
    if (!state.isTransmitting) return;

    state.frameCounter++;
    state.packetsSent++;

    // Generate sensor data
    const data = {};
    if (state.sensors.temperature) {
        data.temperature = (20 + Math.random() * 10).toFixed(1);
        state.sensorData.temperature.push(parseFloat(data.temperature));
        if (state.sensorData.temperature.length > 20) state.sensorData.temperature.shift();
    }
    if (state.sensors.humidity) {
        data.humidity = (40 + Math.random() * 40).toFixed(1);
        state.sensorData.humidity.push(parseFloat(data.humidity));
        if (state.sensorData.humidity.length > 20) state.sensorData.humidity.shift();
    }
    if (state.sensors.pressure) {
        data.pressure = (980 + Math.random() * 60).toFixed(1);
        state.sensorData.pressure.push(parseFloat(data.pressure));
        if (state.sensorData.pressure.length > 20) state.sensorData.pressure.shift();
    }
    if (state.sensors.light) {
        data.light = Math.floor(Math.random() * 1000);
        state.sensorData.light.push(data.light);
        if (state.sensorData.light.length > 20) state.sensorData.light.shift();
    }

    // Simulate packet transmission
    animatePacket(data);

    addLog('info', `Frame #${state.frameCounter}: Transmitting sensor data`);

    // Calculate next transmission (based on SF)
    const airtime = calculateAirtime();
    const interval = 5000 + (state.spreadingFactor - 7) * 500; // Slower with higher SF

    setTimeout(() => transmitData(), interval);
}

// Animate Packet
function animatePacket(data) {
    const packet = document.createElement('div');
    packet.className = 'packet';
    packet.style.cssText = `
        position: absolute;
        width: 12px;
        height: 12px;
        background: linear-gradient(135deg, #8b5cf6, #06b6d4);
        border-radius: 50%;
        box-shadow: 0 0 15px rgba(139, 92, 246, 0.8);
        z-index: 10;
        pointer-events: none;
    `;

    const canvas = document.getElementById('networkCanvas');
    const device = document.getElementById('endDevice');
    const gateway = document.getElementById('gateway');
    const networkServer = document.getElementById('networkServer');
    const appServer = document.getElementById('appServer');

    canvas.appendChild(packet);

    const deviceRect = device.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    packet.style.left = (deviceRect.left - canvasRect.left + deviceRect.width / 2) + 'px';
    packet.style.top = (deviceRect.top - canvasRect.top + deviceRect.height / 2) + 'px';

    // Animate to gateway
    setTimeout(() => {
        const gatewayRect = gateway.getBoundingClientRect();
        packet.style.transition = 'all 0.8s ease';
        packet.style.left = (gatewayRect.left - canvasRect.left + gatewayRect.width / 2) + 'px';
        packet.style.top = (gatewayRect.top - canvasRect.top + gatewayRect.height / 2) + 'px';
    }, 50);

    // Animate to network server
    setTimeout(() => {
        const nsRect = networkServer.getBoundingClientRect();
        packet.style.left = (nsRect.left - canvasRect.left + nsRect.width / 2) + 'px';
        packet.style.top = (nsRect.top - canvasRect.top + nsRect.height / 2) + 'px';
    }, 900);

    // Animate to app server
    setTimeout(() => {
        const appRect = appServer.getBoundingClientRect();
        packet.style.left = (appRect.left - canvasRect.left + appRect.width / 2) + 'px';
        packet.style.top = (appRect.top - canvasRect.top + appRect.height / 2) + 'px';
    }, 1700);

    // Remove packet and update data
    setTimeout(() => {
        packet.remove();
        state.packetsReceived++;
        updateDashboard(data);
        addLog('success', `Frame #${state.frameCounter}: Data received at Application Server`);
    }, 2500);
}

// Update Dashboard
function updateDashboard(data) {
    // Update readings
    if (data.temperature !== undefined) {
        document.getElementById('tempValue').textContent = data.temperature;
    }
    if (data.humidity !== undefined) {
        document.getElementById('humidityValue').textContent = data.humidity;
    }
    if (data.pressure !== undefined) {
        document.getElementById('pressureValue').textContent = data.pressure;
    }
    if (data.light !== undefined) {
        document.getElementById('lightValue').textContent = data.light;
    }

    // Update statistics
    document.getElementById('packetsSent').textContent = state.packetsSent;
    document.getElementById('packetsReceived').textContent = state.packetsReceived;

    const successRate = state.packetsSent > 0
        ? ((state.packetsReceived / state.packetsSent) * 100).toFixed(1)
        : 0;
    document.getElementById('successRate').textContent = successRate + '%';

    const rssi = -120 + (12 - state.spreadingFactor) * 5 + Math.random() * 10;
    document.getElementById('avgRSSI').textContent = rssi.toFixed(0) + ' dBm';

    const dataRate = calculateDataRate();
    document.getElementById('dataRate').textContent = dataRate + ' bps';

    const airtime = calculateAirtime();
    document.getElementById('airtime').textContent = airtime.toFixed(0) + ' ms';

    // Update packet details
    document.getElementById('frameCounter').textContent = state.frameCounter;
    document.getElementById('port').textContent = '2';
    document.getElementById('rssi').textContent = rssi.toFixed(0) + ' dBm';
    document.getElementById('snr').textContent = (5 + Math.random() * 5).toFixed(1) + ' dB';
    document.getElementById('frequency').textContent = '868.1 MHz';

    // Update packet count
    document.querySelector('.data-count').textContent = `${state.packetsReceived} packets received`;
}

// Calculate Data Rate
function calculateDataRate() {
    const sf = state.spreadingFactor;
    const bw = state.bandwidth;
    const dataRate = (sf * bw * 1000) / Math.pow(2, sf);
    return Math.floor(dataRate);
}

// Calculate Airtime
function calculateAirtime() {
    const sf = state.spreadingFactor;
    const bw = state.bandwidth;
    const payloadSize = 20; // bytes

    const symbolDuration = Math.pow(2, sf) / (bw * 1000);
    const preambleTime = (8 + 4.25) * symbolDuration;
    const payloadSymbols = 8 + Math.max(Math.ceil((8 * payloadSize - 4 * sf + 28) / (4 * sf)) * 5, 0);
    const payloadTime = payloadSymbols * symbolDuration;

    return (preambleTime + payloadTime) * 1000; // Convert to ms
}

// Update Sensor Visibility
function updateSensorVisibility() {
    document.getElementById('pressureCard').style.display = state.sensors.pressure ? 'flex' : 'none';
    document.getElementById('lightCard').style.display = state.sensors.light ? 'flex' : 'none';
}

// Update Connection Lines
function updateConnectionLines() {
    const device = document.getElementById('endDevice');
    const gateway = document.getElementById('gateway');
    const networkServer = document.getElementById('networkServer');
    const appServer = document.getElementById('appServer');
    const canvas = document.getElementById('networkCanvas');

    if (!device || !gateway || !networkServer || !appServer) return;

    const canvasRect = canvas.getBoundingClientRect();
    const deviceRect = device.getBoundingClientRect();
    const gatewayRect = gateway.getBoundingClientRect();
    const nsRect = networkServer.getBoundingClientRect();
    const appRect = appServer.getBoundingClientRect();

    const getCenter = (rect) => ({
        x: rect.left - canvasRect.left + rect.width / 2,
        y: rect.top - canvasRect.top + rect.height / 2
    });

    const d = getCenter(deviceRect);
    const g = getCenter(gatewayRect);
    const n = getCenter(nsRect);
    const a = getCenter(appRect);

    document.getElementById('line1').setAttribute('d', `M ${d.x} ${d.y} L ${g.x} ${g.y}`);
    document.getElementById('line2').setAttribute('d', `M ${g.x} ${g.y} L ${n.x} ${n.y}`);
    document.getElementById('line3').setAttribute('d', `M ${n.x} ${n.y} L ${a.x} ${a.y}`);
}

// Add Log Entry
function addLog(type, message) {
    const logContent = document.getElementById('logContent');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;

    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `
        <span class="log-time">${time}</span>
        <span class="log-message">${message}</span>
    `;

    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
}

// Clear Log
function clearLog() {
    const logContent = document.getElementById('logContent');
    logContent.innerHTML = `
        <div class="log-entry log-info">
            <span class="log-time">--:--:--</span>
            <span class="log-message">Log cleared.</span>
        </div>
    `;
}

// Reset Lab
function resetLab() {
    if (confirm('Reset the entire lab? This will clear all data and configuration.')) {
        location.reload();
    }
}

// Show/Hide Modal
function showModal(show) {
    const modal = document.getElementById('helpModal');
    if (show) {
        modal.classList.add('active');
    } else {
        modal.classList.remove('active');
    }
}
