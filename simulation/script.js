// Configuration
const config = {
    deviceEUI: '00:11:22:33:44:55:66:77',
    updateInterval: 1000, // Default update interval in milliseconds
    maxDataPoints: 20,   // Maximum number of data points to show in charts
    sensorRanges: {
        temperature: { min: 15, max: 35 },
        humidity: { min: 30, max: 90 },
        airQuality: { min: 0, max: 500 },
        light: { min: 0, max: 1023 }
    },
    connectionStates: {
        disconnected: 'disconnected',
        connecting: 'connecting',
        connected: 'connected'
    },
    connectionSteps: {
        initializing: 'Initializing...',
        scanning: 'Scanning for Gateway...',
        connecting: 'Establishing Connection...',
        authenticating: 'Authenticating...',
        connected: 'Connected'
    }
};

// State variables
let simulationInterval;
let isSimulationRunning = false;
let dataHistory = {
    temperature: [],
    humidity: [],
    airQuality: [],
    light: []
};

// Network state
let networkState = {
    lora: config.connectionStates.disconnected,
    server: config.connectionStates.disconnected,
    signalStrength: -120,
    connectionStep: config.connectionSteps.initializing
};

// Chart instances
const charts = {
    temperature: null,
    humidity: null,
    airQuality: null,
    light: null
};

// Initialize charts
function initializeCharts() {
    const chartConfig = {
        type: 'line',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: {
                    display: false
                },
                y: {
                    beginAtZero: false
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    };

    // Initialize each chart
    Object.keys(charts).forEach(sensor => {
        const ctx = document.getElementById(`${sensor}Chart`).getContext('2d');
        charts[sensor] = new Chart(ctx, {
            ...chartConfig,
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    borderColor: getSensorColor(sensor),
                    borderWidth: 2,
                    fill: false
                }]
            }
        });
    });
}

// Get sensor-specific color
function getSensorColor(sensor) {
    const colors = {
        temperature: '#e74c3c',
        humidity: '#3498db',
        airQuality: '#2ecc71',
        light: '#f39c12'
    };
    return colors[sensor];
}

// Update network visualization
function updateNetworkVisualization() {
    // Update ESP32 node
    const esp32Node = document.getElementById('esp32Node');
    esp32Node.className = `device-node ${networkState.lora}`;

    // Update Gateway node
    const gatewayNode = document.getElementById('gatewayNode');
    gatewayNode.className = `gateway-node ${networkState.lora}`;

    // Update Server node
    const serverNode = document.getElementById('serverNode');
    serverNode.className = `server-node ${networkState.server}`;

    // Update connection lines
    const loraConnection = document.getElementById('loraConnection');
    loraConnection.className = `connection-line ${networkState.lora}`;
    
    // Add wire flow effect during connection
    if (networkState.lora === config.connectionStates.connecting) {
        loraConnection.style.background = 'transparent';
    } else if (networkState.lora === config.connectionStates.connected) {
        loraConnection.style.background = 'var(--success-color)';
    } else {
        loraConnection.style.background = 'var(--border-color)';
    }

    // Update status displays
    document.getElementById('loraStatus').textContent = networkState.connectionStep;
    document.getElementById('serverStatus').textContent = networkState.server.charAt(0).toUpperCase() + networkState.server.slice(1);
    document.getElementById('signalStrength').textContent = `${networkState.signalStrength} dBm`;

    // Update signal strength bars
    updateSignalStrengthBars();
}

// Update signal strength bars
function updateSignalStrengthBars() {
    const bars = document.querySelectorAll('.signal-bar');
    const strength = Math.min(5, Math.max(0, Math.floor((networkState.signalStrength + 120) / 14)));
    
    bars.forEach((bar, index) => {
        bar.classList.toggle('active', index < strength);
    });
}

// Simulate network connection process
function simulateNetworkConnection() {
    // Reset network state
    networkState.lora = config.connectionStates.connecting;
    networkState.server = config.connectionStates.disconnected;
    networkState.signalStrength = -120;
    networkState.connectionStep = config.connectionSteps.initializing;
    updateNetworkVisualization();

    // Simulate connection process with steps
    const steps = [
        { delay: 1000, step: config.connectionSteps.scanning },
        { delay: 2000, step: config.connectionSteps.connecting },
        { delay: 2000, step: config.connectionSteps.authenticating },
        { delay: 1000, step: config.connectionSteps.connected }
    ];

    let currentStep = 0;
    const executeStep = () => {
        if (currentStep < steps.length) {
            networkState.connectionStep = steps[currentStep].step;
            updateNetworkVisualization();

            if (currentStep === steps.length - 1) {
                // Add a small delay before showing the final connection
                setTimeout(() => {
                    networkState.lora = config.connectionStates.connected;
                    networkState.signalStrength = -85;
                    updateNetworkVisualization();

                    // Add a small delay before connecting to server
                    setTimeout(() => {
                        networkState.server = config.connectionStates.connecting;
                        updateNetworkVisualization();

                        setTimeout(() => {
                            networkState.server = config.connectionStates.connected;
                            updateNetworkVisualization();
                        }, 1000);
                    }, 500);
                }, 500);
            }

            currentStep++;
            setTimeout(executeStep, steps[currentStep - 1].delay);
        }
    };

    executeStep();
}

// Simulate network disconnection
function simulateNetworkDisconnection() {
    networkState.server = config.connectionStates.disconnected;
    networkState.connectionStep = config.connectionSteps.initializing;
    updateNetworkVisualization();

    setTimeout(() => {
        networkState.lora = config.connectionStates.disconnected;
        networkState.signalStrength = -120;
        updateNetworkVisualization();
    }, 1000);
}

// Generate random sensor data
function generateSensorData() {
    return {
        temperature: generateRandomValue(config.sensorRanges.temperature),
        humidity: generateRandomValue(config.sensorRanges.humidity),
        airQuality: generateRandomValue(config.sensorRanges.airQuality),
        light: generateRandomValue(config.sensorRanges.light)
    };
}

// Generate random value within range
function generateRandomValue(range) {
    return Number((Math.random() * (range.max - range.min) + range.min).toFixed(1));
}

// Update sensor displays
function updateSensorDisplays(data) {
    document.getElementById('temperatureValue').textContent = `${data.temperature}°C`;
    document.getElementById('humidityValue').textContent = `${data.humidity}%`;
    document.getElementById('airQualityValue').textContent = data.airQuality;
    document.getElementById('lightValue').textContent = data.light;
}

// Update charts
function updateCharts(data) {
    const timestamp = new Date().toLocaleTimeString();
    
    Object.keys(data).forEach(sensor => {
        // Add new data point
        dataHistory[sensor].push(data[sensor]);
        
        // Remove oldest point if exceeding max
        if (dataHistory[sensor].length > config.maxDataPoints) {
            dataHistory[sensor].shift();
        }
        
        // Update chart
        charts[sensor].data.labels = Array(dataHistory[sensor].length).fill('');
        charts[sensor].data.datasets[0].data = dataHistory[sensor];
        charts[sensor].update();
    });
}

// Update data log
function updateDataLog(data) {
    const tbody = document.getElementById('logTableBody');
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>${new Date().toLocaleString()}</td>
        <td>${data.temperature}°C</td>
        <td>${data.humidity}%</td>
        <td>${data.airQuality}</td>
        <td>${data.light}</td>
        <td>${networkState.signalStrength} dBm</td>
    `;
    
    tbody.insertBefore(row, tbody.firstChild);
    
    // Keep only last 10 entries
    while (tbody.children.length > 10) {
        tbody.removeChild(tbody.lastChild);
    }
}

// Update device information
function updateDeviceInfo() {
    document.getElementById('deviceEUI').textContent = config.deviceEUI;
    document.getElementById('networkStatus').textContent = isSimulationRunning ? 'Connected' : 'Disconnected';
    document.getElementById('lastTx').textContent = new Date().toLocaleString();
    
    // Simulate battery drain
    const batteryLevel = Math.max(0, 100 - (dataHistory.temperature.length * 0.5));
    document.getElementById('batteryLevel').textContent = `${batteryLevel.toFixed(0)}%`;
}

// Start simulation
function startSimulation() {
    if (isSimulationRunning) return;
    
    isSimulationRunning = true;
    document.getElementById('startSimulation').disabled = true;
    document.getElementById('stopSimulation').disabled = false;
    
    // Simulate network connection
    simulateNetworkConnection();
    
    // Start data generation
    simulationInterval = setInterval(() => {
        const data = generateSensorData();
        updateSensorDisplays(data);
        updateCharts(data);
        updateDataLog(data);
        updateDeviceInfo();
        
        // Simulate signal strength variation
        if (networkState.lora === config.connectionStates.connected) {
            networkState.signalStrength = Math.max(-120, Math.min(-50, 
                networkState.signalStrength + (Math.random() * 4 - 2)
            ));
            updateNetworkVisualization();
        }
    }, config.updateInterval);
}

// Stop simulation
function stopSimulation() {
    if (!isSimulationRunning) return;
    
    isSimulationRunning = false;
    clearInterval(simulationInterval);
    document.getElementById('startSimulation').disabled = false;
    document.getElementById('stopSimulation').disabled = true;
    
    // Simulate network disconnection
    simulateNetworkDisconnection();
    
    // Update device status
    updateDeviceInfo();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize charts
    initializeCharts();
    
    // Setup control buttons
    document.getElementById('startSimulation').addEventListener('click', startSimulation);
    document.getElementById('stopSimulation').addEventListener('click', stopSimulation);
    
    // Setup speed control
    document.getElementById('speedControl').addEventListener('change', (e) => {
        config.updateInterval = parseInt(e.target.value);
        if (isSimulationRunning) {
            stopSimulation();
            startSimulation();
        }
    });
}); 