const BLE_SERVICE_UUID = "0d57bff8-1684-405b-a325-142df5d952ee";
const BLE_MOTOR1_SPEED_CHARACTERISTIC_UUID = "52214fe2-2cec-4750-8eac-cb5c9635baf6";
const BLE_MOTOR2_SPEED_CHARACTERISTIC_UUID = "822ec32a-0ba9-48ed-9984-23f5cbeb93b2";

export class BLEClient {
    private _ping? : number;

    private constructor(
        private readonly device: BluetoothDevice,
        private readonly sender: SyncSender<number>
    ) { }

    get deviceName(): string {
        return this.device.name ?? "unknown device";
    }

    get isConnected(): boolean {
        return this.device.gatt?.connected ?? false;
    }

    get ping(): number | undefined {
        return this._ping;
    };

    public static async connect(): Promise<BLEClient> {
        const device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [BLE_SERVICE_UUID]
        });

        if (!device.gatt)
            throw new Error("GATT not supported");

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(BLE_SERVICE_UUID);
        const sender = new SyncSender<number>();

        const m1chr = await service.getCharacteristic(BLE_MOTOR1_SPEED_CHARACTERISTIC_UUID);
        sender.addSender(BLE_MOTOR1_SPEED_CHARACTERISTIC_UUID, this.createSendFunc(m1chr), 0);

        const m2chr = await service.getCharacteristic(BLE_MOTOR2_SPEED_CHARACTERISTIC_UUID);
        sender.addSender(BLE_MOTOR2_SPEED_CHARACTERISTIC_UUID, this.createSendFunc(m2chr), 0);

        return new BLEClient(device, sender);
    }

    private static createSendFunc(c: BluetoothRemoteGATTCharacteristic): (value: number) => Promise<void> {
        const sendFunc = async (speed: number) => {
            let buffer = new Int16Array([speed]).buffer;
            await c.writeValue(buffer);
        };

        return sendFunc;
    }

    public disconnect() {
        if (this.isConnected)
            this.device.gatt?.disconnect();
    }

    public async setMotor1Speed(speed: number) {
        if (!this.isConnected)
            return;
        await this.sender.send(BLE_MOTOR1_SPEED_CHARACTERISTIC_UUID, speed);
        this._ping = this.sender.lastSendDuration;
    }

    public async setMotor2Speed(speed: number) {
        if (!this.isConnected)
            return;
        await this.sender.send(BLE_MOTOR2_SPEED_CHARACTERISTIC_UUID, speed);
        this._ping = this.sender.lastSendDuration;
    }
}

class SyncSender<T> {
    private readonly senders = new Map<string, Sender<T>>;
    private sendAllTask = Promise.resolve();
    private _lastSendDuration?: number;

    public get lastSendDuration() {
        return this._lastSendDuration;
    }

    public addSender(id: string, sendFunc: (value: T) => Promise<void>, initialValue: T) {
        const sender = new Sender<T>(sendFunc, initialValue);
        this.senders.set(id, sender);
    }

    public async send(id: string, value: T) {
        const sender = this.senders.get(id);
        if (!sender)
            throw new Error(`Sender '${id}' not registered`);

        sender.setNextValue(value);

        try {
            //wait previous send completes
            await this.sendAllTask;
        }
        catch {
        }

        //begin new send
        this.sendAllTask = this.sendAll();

        //wait new send completes
        await this.sendAllTask;
    }

    private async sendAll() {
        let areAllSendersSynchronized = false;

        while (!areAllSendersSynchronized) {
            areAllSendersSynchronized = true;

            for (let sender of this.senders.values()) {
                if (!sender.isSynchronized) {
                    areAllSendersSynchronized = false;
                    const startTime = performance.now();
                    await sender.send();
                    this._lastSendDuration = performance.now() - startTime;
                }
            }
        }
    }
}

class Sender<T> {
    private readonly sendFunc: (value: T) => Promise<void>;
    private currentValue: T;
    private nextValue: T;

    public get isSynchronized(): boolean {
        return this.currentValue == this.nextValue;
    }

    public constructor(sendFunc: (value: T) => Promise<void>, initialValue: T) {
        this.sendFunc = sendFunc;
        this.currentValue = initialValue;
        this.nextValue = initialValue;
    }

    public setNextValue(value: T) {
        this.nextValue = value;
    }

    public async send() {
        const value = this.nextValue;
        await this.sendFunc(value);
        this.currentValue = value;
    }
}