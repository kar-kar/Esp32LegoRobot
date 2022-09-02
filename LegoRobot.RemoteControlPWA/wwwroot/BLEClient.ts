//Check web-bluetooth implementation status
//https://github.com/WebBluetoothCG/web-bluetooth/blob/main/implementation-status.md

const BLE_SERVICE_UUID = "0d57bff8-1684-405b-a325-142df5d952ee";
const BLE_MOTOR1_SPEED_CHARACTERISTIC_UUID = "52214fe2-2cec-4750-8eac-cb5c9635baf6";
const BLE_MOTOR2_SPEED_CHARACTERISTIC_UUID = "822ec32a-0ba9-48ed-9984-23f5cbeb93b2";

export class BLEClient {
    private _ping?: number;

    private constructor(
        private readonly device: BluetoothDevice,
        private readonly syncWriter: SyncWriter
    ) { }

    get deviceName() {
        return this.device.name ?? "unknown device";
    }

    get isConnected() {
        return this.device.gatt?.connected ?? false;
    }

    get ping() {
        return this._ping;
    };

    public static async connect() {
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [BLE_SERVICE_UUID]
        });

        if (!device.gatt)
            throw new Error("GATT not supported");

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(BLE_SERVICE_UUID);
        const syncWriter = new SyncWriter();

        const m1chr = await service.getCharacteristic(BLE_MOTOR1_SPEED_CHARACTERISTIC_UUID);
        syncWriter.addWriter(BLE_MOTOR1_SPEED_CHARACTERISTIC_UUID, this.createWriter(m1chr));

        const m2chr = await service.getCharacteristic(BLE_MOTOR2_SPEED_CHARACTERISTIC_UUID);
        syncWriter.addWriter(BLE_MOTOR2_SPEED_CHARACTERISTIC_UUID, this.createWriter(m2chr));

        return new BLEClient(device, syncWriter);
    }

    private static createWriter(c: BluetoothRemoteGATTCharacteristic) {
        return (speed: number) => c.writeValue(new Int16Array([speed]).buffer);
    }

    public disconnect() {
        if (this.isConnected)
            this.device.gatt?.disconnect();
    }

    public async setMotor1Speed(speed: number) {
        if (!this.isConnected)
            return;
        await this.syncWriter.write(BLE_MOTOR1_SPEED_CHARACTERISTIC_UUID, speed);
        this._ping = this.syncWriter.lastWriteDuration;
    }

    public async setMotor2Speed(speed: number) {
        if (!this.isConnected)
            return;
        await this.syncWriter.write(BLE_MOTOR2_SPEED_CHARACTERISTIC_UUID, speed);
        this._ping = this.syncWriter.lastWriteDuration;
    }
}

/**
GATT operations are asynchonous. Attempt to start GATT operation while previous is not completed throws error.
This class synchronizes operations to avoid errors.
*/
class SyncWriter {
    private readonly writers = new Map<string, (value: any) => Promise<void>>();
    private readonly queue: { id: string, value: any }[] = [];
    private currentWriteTask?: Promise<void>;
    private _lastWriteDuration?: number;

    public get lastWriteDuration() {
        return this._lastWriteDuration;
    }

    public addWriter(id: string, writer: (value: any) => Promise<void>) {
        this.writers.set(id, writer);
    }

    public async write(id: string, value: any) {
        this.enqueue(id, value);

        //if write operation is in progress - just wait for its completion
        //the queued request will be processed by the ongoing operation
        if (this.currentWriteTask) {
            await this.currentWriteTask;
            return;
        }

        //if write operation is not in progress - start new
        this.currentWriteTask = this.writeQueue();
        await this.currentWriteTask;
        this.currentWriteTask = undefined;
    }

    private enqueue(id: string, value: any) {
        //for the current Lego Robot implementation it's not necessary to send all queued values to the same characterics
        //only the latest is important
        for (let request of this.queue) {
            if (request.id == id) {
                //update existing write request
                request.value = value;
                return;
            }
        }

        //add new request if no requests to the same GATT characteristic are queued
        this.queue.push({ id, value });
    }

    private async writeQueue() {
        let request = this.queue.shift();
        while (request) {
            const startTime = performance.now();
            await this.writeInternal(request.id, request.value);
            this._lastWriteDuration = performance.now() - startTime;
            request = this.queue.shift();
        }
    }

    private writeInternal(id: string, value: any) {
        const writer = this.writers.get(id);
        if (!writer)
            throw new Error(`Writer '${id}' is not registered.`);
        return writer(value);
    }
}