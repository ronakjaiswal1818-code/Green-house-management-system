let client;

window.addEventListener('DOMContentLoaded', () => {
    // White color for modern glass look
    const createChart = (id) => new Chart(document.getElementById(id), {
        type: 'doughnut',
        data: { datasets: [{ data: [0, 100], backgroundColor: ['#ffffff', 'rgba(255,255,255,0.1)'] }] },
        options: { 
            cutout: '75%', 
            plugins: { tooltip: { enabled: false }, legend: { display: false } } 
        }
    });

    const tempChart = createChart('tempChart');
    const humChart = createChart('humChart');
    const ldrChart = createChart('ldrChart');
    const mq135Chart = createChart('mq135Chart');

    client = new Paho.MQTT.Client("broker.hivemq.com", 8000, "web_client_" + Math.random());

    client.connect({
        onSuccess: () => client.subscribe("greenhouse/data")
    });

    client.onMessageArrived = (msg) => {
        const data = JSON.parse(msg.payloadString);
        updateChart(tempChart, data.temp);
        updateChart(humChart, data.hum);
        updateChart(ldrChart, data.ldr);
        updateChart(mq135Chart, data.mq135);
    };

    function updateChart(chart, value) {
        chart.data.datasets[0].data = [value, 100 - value];
        chart.update();
    }
});

function publish(topic, msg) {
    if (client) client.send(topic, msg);
}
