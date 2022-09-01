import { BLEClient } from "./BLEClient.js";
import * as noUiSlider from "./lib/noUiSlider/nouislider.mjs";

let client: BLEClient | null;

$(function () {
    $("#connectBtn").on("click", connect);

    initSlider("#m1s", value => client?.setMotor1Speed(value) || Promise.resolve());
    initSlider("#m2s", value => client?.setMotor2Speed(value) || Promise.resolve());

    setInterval(updateConnectionStatus, 500);
});

function initSlider(elementId: string, updateHandler: (value: number) => Promise<void>) {
    const element = $(elementId).get(0);
    if (!element)
        throw new Error(`Element ${elementId} not found`);

    const slider = noUiSlider.create(element, {
        start: 0,
        step: 1,
        range: {
            min: -255,
            max: 255
        },
        orientation: "vertical",
        direction: "rtl",
        tooltips: true
    });

    async function update(values: (string | number)[]) {
        const value = <number>values[0];
        try {
            await updateHandler(value);
        }
        catch (ex) {
            $("#error").html((<Error>ex).message);
        }
    }

    slider.on("update", update);
    slider.on("end", () => slider.set(0));
}

function updateConnectionStatus() {
    let status = "disconnected";

    if (client?.isConnected) {
        status = "connected";

        if (client.ping)
            status = `ping: ${client.ping.toFixed(1)} ms`;
    }

    $("#connectionStatus").html(status);
}

async function connect() {
    client?.disconnect();
    $("#deviceName").html("");
    $("#error").html("");

    try {
        client = await BLEClient.connect();
        $("#deviceName").html(client.deviceName);
    }
    catch (ex) {
        client = null;
        $("#error").html((<Error>ex).message);
    }
}
