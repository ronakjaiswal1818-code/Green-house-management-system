let client;

window.addEventListener('DOMContentLoaded', () => {
    // 1. CHART INITIALIZATION
    // Optimized for the 12-bit ADC of ESP32 (0-4095) and standard sensors
    const createChart = (id) => new Chart(document.getElementById(id), {
        type: 'doughnut',
        data: { 
            datasets: [{ 
                data: [0, 100], 
                backgroundColor: ['#ffffff', 'rgba(255,255,255,0.1)'],
                borderWidth: 0 
            }] 
        },
        options: { 
            cutout: '75%', 
            plugins: { 
                tooltip: { enabled: true }, 
                legend: { display: false } 
            },
            responsive: true,
            maintainAspectRatio: true
        }
    });

    // Initializing all charts
    const tempChart = createChart('tempChart');
    const humChart = createChart('humChart');
    const soilChart = createChart('soilChart');
    const ldrChart = createChart('ldrChart');
    const mq135Chart = createChart('mq135Chart');

    // 2. MQTT SETUP (EMQX Broker)
    // Random client ID to prevent connection drops
    client = new Paho.MQTT.Client("broker.emqx.io", 8083, "web_dash_" + Math.random().toString(16).substr(2, 5));

    const connectOptions = {
        useSSL: false,
        onSuccess: () => {
            console.log("Dashboard Connected to EMQX");
            client.subscribe("greenhouse/data");
        },
        onFailure: (err) => {
            console.log("Connection Failed: ", err);
        }
    };

    client.connect(connectOptions);

    // 3. MESSAGE ARRIVAL LOGIC
    client.onMessageArrived = (msg) => {
        try {
            const data = JSON.parse(msg.payloadString);
            
            // Handle Data from Node 1 (DHT22 & Soil)
            if (data.temp !== undefined) {
                updateChart(tempChart, data.temp, 50); // Max 50°C
                updateChart(humChart, data.hum, 100);  // Max 100%
                updateChart(soilChart, data.soil, 4095); // Max ADC Value
                
                // Optional: Update text values if IDs exist in HTML
                if(document.getElementById('tempText')) document.getElementById('tempText').innerText = data.temp + "°C";
                if(document.getElementById('soilText')) document.getElementById('soilText').innerText = data.soil;
            }
            
            // Handle Data from Node 2 (LDR & MQ135)
            if (data.ldr !== undefined) {
                updateChart(ldrChart, data.ldr, 4095); 
                updateChart(mq135Chart, data.mq135, 4095);
            }

        } catch (e) {
            console.error("Data Error:", e);
        }
    };

    function updateChart(chart, value, max) {
        // Ensure value doesn't exceed chart bounds
        const safeVal = Math.min(Math.max(value, 0), max);
        chart.data.datasets[0].data = [safeVal, max - safeVal];
        chart.update();
    }
});

// 4. ACTUATOR COMMANDS (Fan & Pump)
// This matches your request for "Fan" and "Pump" labels
function publish(topic, msg) {
    if (client && client.isConnected()) {
        const message = new Paho.MQTT.Message(msg);
        message.destinationName = topic;
        client.send(message);
        console.log("Command Sent to " + topic + ": " + msg);
    } else {
        console.log("MQTT Not Connected");
    }
}
