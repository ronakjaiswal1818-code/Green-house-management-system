let client;

window.addEventListener('DOMContentLoaded', () => {
    // 1. MQTT SETTINGS (SECURE WSS FOR GITHUB)
    const broker = "broker.emqx.io";
    const port = 8084; 
    const clientID = "agrobot_web_" + Math.random().toString(16).substr(2, 8);

    client = new Paho.MQTT.Client(broker, port, clientID);

    const connectOptions = {
        useSSL: true, // MUST BE TRUE
        onSuccess: () => {
            console.log("Connected Successfully");
            const statusBox = document.getElementById("connStatus");
            statusBox.innerText = "ONLINE";
            statusBox.style.color = "#4ade80"; // Neon Green
            client.subscribe("greenhouse/data");
        },
        onFailure: (err) => {
            console.error("MQTT Failed", err);
            const statusBox = document.getElementById("connStatus");
            statusBox.innerText = "OFFLINE";
            statusBox.style.color = "#f87171"; // Red
        }
    };

    // 2. DATA HANDLER
    client.onMessageArrived = (msg) => {
        try {
            const data = JSON.parse(msg.payloadString);
            
            // Map JSON keys to HTML IDs
            // Note: .toFixed(1) keeps 1 decimal place for floats
            if (data.temp !== undefined) {
                document.getElementById("val-temp").innerText = parseFloat(data.temp).toFixed(1);
                document.getElementById("val-hum").innerText = parseFloat(data.hum).toFixed(1);
                document.getElementById("val-soil").innerText = data.soil;
            }

            if (data.ldr !== undefined) {
                document.getElementById("val-ldr").innerText = data.ldr;
                document.getElementById("val-mq135").innerText = data.mq135;
            }
        } catch (e) {
            console.error("Message Error:", e);
        }
    };

    client.connect(connectOptions);
});

// 3. ACTUATOR COMMAND PUBLISHER
function publish(topic, msg) {
    if (client && client.isConnected()) {
        const message = new Paho.MQTT.Message(msg);
        message.destinationName = topic;
        client.send(message);
        console.log(`Action: ${topic} -> ${msg}`);
    } else {
        console.warn("Cannot publish, client disconnected");
    }
}
