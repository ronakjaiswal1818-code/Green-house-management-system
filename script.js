let client;

window.addEventListener('DOMContentLoaded', () => {
    // 1. Create Charts with a modern glass look
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
                tooltip: { enabled: false }, 
                legend: { display: false } 
            },
            responsive: true,
            maintainAspectRatio: true
        }
    });

    const tempChart = createChart('tempChart');
    const humChart = createChart('humChart');
    const ldrChart = createChart('ldrChart');
    const mq135Chart = createChart('mq135Chart');

    // 2. Setup MQTT Client for EMQX Broker
    // Port 8083 is the standard WebSocket port for EMQX
    client = new Paho.MQTT.Client("broker.emqx.io", 8083, "web_client_" + Math.random());

    const connectOptions = {
        useSSL: false, // Set to true if your GitHub page is forced to HTTPS and the broker supports it
        onSuccess: onConnect,
        onFailure: (err) => console.log("Connection Failed: ", err)
    };

    client.connect(connectOptions);

    function onConnect() {
        console.log("Connected to EMQX Broker");
        // Subscribe to sensor data from ESP32
        client.subscribe("greenhouse/data");
    }

    client.onMessageArrived = (msg) => {
        try {
            const data = JSON.parse(msg.payloadString);
            console.log("Data Received:", data);
            
            // Update charts with incoming sensor values
            updateChart(tempChart, data.temp, 50); // Assuming 50C max
            updateChart(humChart, data.hum, 100);  // 100% max
            updateChart(ldrChart, data.ldr, 1024); // 10-bit sensor max
            updateChart(mq135Chart, data.mq135, 1000); // Typical Air Quality max
            
            // Update numeric text on dashboard if you have spans with these IDs
            if(document.getElementById('tempVal')) document.getElementById('tempVal').innerText = data.temp.toFixed(1);
            if(document.getElementById('humVal')) document.getElementById('humVal').innerText = data.hum.toFixed(1);
        } catch (e) {
            console.error("Error parsing JSON:", e);
        }
    };

    function updateChart(chart, value, max) {
        // Calculate percentage for doughnut display
        const val = Math.min(value, max);
        chart.data.datasets[0].data = [val, max - val];
        chart.update();
    }
});

// 3. Function to send commands to ESP32 (Fan/Pump)
function publish(topic, msg) {
    if (client && client.isConnected()) {
        const message = new Paho.MQTT.Message(msg);
        message.destinationName = topic;
        client.send(message);
        console.log(`Published: ${msg} to ${topic}`);
    } else {
        console.error("MQTT Client not connected");
    }
}
