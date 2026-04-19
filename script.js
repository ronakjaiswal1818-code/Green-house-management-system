let client;

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
            plugins: { legend: { display: false } },
            responsive: true
        }
    });
};

window.addEventListener('DOMContentLoaded', () => {
    const charts = {
        temp: createChart('tempChart'),
        hum: createChart('humChart'),
        soil: createChart('soilChart'),
        ldr: createChart('ldrChart'),
        mq135: createChart('mq135Chart')
    };

    // SECURE SETTINGS FOR GITHUB PAGES
    client = new Paho.MQTT.Client("broker.emqx.io", 8084, "client_" + Math.random().toString(16).substr(2, 8));

    const options = {
        useSSL: true, // This fixes the Mixed Content Error
        onSuccess: () => {
            const status = document.getElementById("connStatus");
            status.innerText = "ONLINE";
            status.style.color = "#4ade80";
            client.subscribe("greenhouse/data");
        },
        onFailure: (err) => {
            document.getElementById("connStatus").innerText = "OFFLINE";
            console.log(err);
        }
    };

    client.onMessageArrived = (msg) => {
        const data = JSON.parse(msg.payloadString);
        if (data.temp !== undefined) {
            updateChart(charts.temp, data.temp, 50);
            updateChart(charts.hum, data.hum, 100);
            updateChart(charts.soil, data.soil, 4095);
        }
        if (data.ldr !== undefined) {
            updateChart(charts.ldr, data.ldr, 4095);
            updateChart(charts.mq135, data.mq135, 4095);
        }
    };

    client.connect(options);
});

function updateChart(chart, value, max) {
    if (!chart) return;
    const val = Math.min(Math.max(value, 0), max);
    chart.data.datasets[0].data = [val, max - val];
    chart.update();
}

function publish(topic, msg) {
    if (client && client.isConnected()) {
        const message = new Paho.MQTT.Message(msg);
        message.destinationName = topic;
        client.send(message);
    }
}
