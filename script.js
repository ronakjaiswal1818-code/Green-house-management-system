let client;

window.addEventListener('DOMContentLoaded', () => {
    client = new Paho.MQTT.Client("broker.emqx.io", 8084, "agrobot_" + Math.random().toString(16).substr(2, 8));

    const options = {
        useSSL: true,
        onSuccess: () => {
            document.getElementById("connStatus").innerText = "ONLINE";
            document.getElementById("connStatus").style.color = "#4ade80";
            client.subscribe("greenhouse/data");
            client.subscribe("greenhouse/status");
        },
        onFailure: (err) => { document.getElementById("connStatus").innerText = "OFFLINE"; }
    };

    client.onMessageArrived = (msg) => {
        const topic = msg.destinationName;
        const payload = msg.payloadString;

        if (topic === "greenhouse/data") {
            const data = JSON.parse(payload);
            if(data.temp) document.getElementById("val-temp").innerText = parseFloat(data.temp).toFixed(1);
            if(data.hum) document.getElementById("val-hum").innerText = parseFloat(data.hum).toFixed(1);
            if(data.soil) document.getElementById("val-soil").innerText = data.soil;
            if(data.ldr) document.getElementById("val-ldr").innerText = data.ldr;
            if(data.mq135) document.getElementById("val-mq135").innerText = data.mq135;
        }

        if (topic === "greenhouse/status") {
            const status = JSON.parse(payload);
            updateUI("btn-pump", "stat-pump", status.pump, "bg-blue-600");
            updateUI("btn-fan", "stat-fan", status.fan, "bg-orange-600");
        }
    };
    client.connect(options);
});

function updateUI(btnId, spanId, state, activeClass) {
    const btn = document.getElementById(btnId);
    const span = document.getElementById(spanId);
    if (state === "ON") {
        btn.classList.replace("glass", activeClass);
        span.innerText = "ON";
    } else {
        btn.className = btn.className.replace(/bg-\w+-\d+/, "glass");
        span.innerText = "OFF";
    }
}

function publish(topic, msg) {
    if (client.isConnected()) {
        const message = new Paho.MQTT.Message(msg);
        message.destinationName = topic;
        client.send(message);
    }
}
