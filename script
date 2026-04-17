// Wait for the HTML to fully load before running the script
window.addEventListener('DOMContentLoaded', (event) => {
    
    // Chart Configuration
    const createChart = (id, color) => new Chart(document.getElementById(id), {
        type: 'doughnut',
        data: { datasets: [{ data: [0, 100], backgroundColor: [color, '#f3f4f6'] }] },
        options: { cutout: '80%', plugins: { tooltip: { enabled: false } } }
    });

    const tempChart = createChart('tempChart', '#ef4444');
    const humChart = createChart('humChart', '#3b82f6');
    const ldrChart = createChart('ldrChart', '#eab308');
    const mq135Chart = createChart('mq135Chart', '#84cc16');

    // MQTT Setup
    // Use a unique client ID to prevent connection conflicts
    const client = new Paho.MQTT.Client("broker.hivemq.com", 8000, "web_client_" + parseInt(Math.random() * 10000));

    client.connect({
        onSuccess: () => {
            console.log("Connected to Broker");
            client.subscribe("greenhouse/data");
        },
        onFailure: (err) => {
            console.error("Connection failed: ", err.errorMessage);
        }
    });

    client.onMessageArrived = (msg) => {
        try {
            const data = JSON.parse(msg.payloadString);
            
            // Update charts dynamically
            updateChart(tempChart, data.temp);
            updateChart(humChart, data.hum);
            updateChart(ldrChart, data.ldr);
            updateChart(mq135Chart, data.mq135);
        } catch (e) {
            console.error("Error parsing JSON:", e);
        }
    };

    function updateChart(chart, value) {
        chart.data.datasets[0].data = [value, 100 - value];
        chart.update();
    }
});

// Global function for buttons
function publish(topic, msg) {
    // Note: 'client' must be globally scoped if defined inside the event listener above
    // If you get a 'client is not defined' error, move the 'client' variable 
    // outside of the DOMContentLoaded listener.
    window.client.send(topic, msg);
}
