let client;

// 1. Initialize Charts
const createChart = (id) => {
    const ctx = document.getElementById(id);
    if (!ctx) return null;
    return new Chart(ctx, {
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
            plugins: { legend: { display: false }, tooltip: { enabled: true } },
            responsive: true,
            maintainAspectRatio: true
        }
    });
};

window.addEventListener('DOMContentLoaded', () => {
    // Setup Charts
    const tempChart = createChart('tempChart');
    const humChart = createChart('humChart');
    const soilChart = createChart('soilChart');
    const ldrChart = createChart('ldrChart');
    const mq135Chart = createChart('mq135Chart');

    // 2. MQTT Configuration
    // GitHub Pages require HTTPS, so we use Port 8084 (Secure WebSockets)
    const broker = "broker.emqx.io";
    const port = 8084; 
    const clientID = "web_client_" + Math.random().toString(16).substr(2, 8);

    client = new Paho.MQTT.Client(broker, port, clientID);

    const connectOptions = {
        useSSL: true, // MANDATORY for GitHub Pages
        timeout: 5,
        keepAliveInterval: 60,
        onSuccess: () => {
            console.log("Connected to EMQX Broker");
            document.getElementById("connStatus").innerText = "Online";
            document.getElementById("connStatus").className = "text-green-400 font-bold";
            client.subscribe("greenhouse/data");
        },
        onFailure: (err) => {
            console.error("Connection Failed:", err);
            document.getElementById("connStatus").innerText = "Offline (Retry)";
            document.getElementById("connStatus").className = "text-red-400 font-bold";
        }
    };

    client.onMessageArrived = (msg) => {
        try {
            const data = JSON.parse(msg.payloadString);
            console.log("Data Received:", data);
            
            // Node 1 Processing
            if (data.temp !== undefined) {
                updateChart(tempChart, data.temp, 50);
                updateChart(humChart, data.hum, 100);
                updateChart(soilChart, data.soil, 4095);
            }
            
            // Node 2 Processing
            if (data.ldr !== undefined) {
                updateChart(ldrChart, data.ldr, 4095);
                updateChart(mq135Chart, data.mq135, 4095);
            }
        } catch (e) {
            console.error("Error parsing MQTT message:", e);
        }
    };

    client.connect(connectOptions);

    function updateChart(chart, value, max) {
        if (!chart) return;
        const val = Math.min(Math.max(value, 0), max);
        chart.data.datasets[0].data = [val, max - val];
        chart.update();
    }
});

// 3. Actuator Control Function
function publish(topic, msg) {
    if (client && client.isConnected()) {
        const message = new Paho.MQTT.Message(msg);
        message.destinationName = topic;
        client.send(message);
        console.log(`Published to ${topic}: ${msg}`);
    } else {
        alert("Dashboard is not connected to the MQTT broker.");
    }
}
