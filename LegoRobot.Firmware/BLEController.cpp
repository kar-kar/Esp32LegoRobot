#include "BLEController.h"

void BLEController::init()
{
    BLEDevice::init(deviceName);
    auto bleServer = BLEDevice::createServer();
    bleServer->setCallbacks(this);

    auto bleService = bleServer->createService(BLE_SERVICE_UUID);
    bleService->addCharacteristic(&motor2SpeedCharacteristic);
    bleService->addCharacteristic(&motor1SpeedCharacteristic);
    bleService->start();

    bleServer->getAdvertising()->start();

    Serial.println("BLE server started");
}

int32_t BLEController::getMotor1Speed()
{
    return motor1SpeedCharacteristic.getIntValue();
}

int32_t BLEController::getMotor2Speed()
{
    return motor2SpeedCharacteristic.getIntValue();
}

void BLEController::onConnect(BLEServer* pServer, esp_ble_gatts_cb_param_t* param)
{
    Serial.println("BLE device connected");
    isConnected = true;
    pServer->updateConnParams(param->connect.remote_bda, 0x06, 0x06, 0, 100);
}

void BLEController::onDisconnect(BLEServer* pServer)
{
    Serial.println("BLE device disconnected");
    isConnected = false;
}
