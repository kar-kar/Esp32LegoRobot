#pragma once

#include <Arduino.h>
#include <BLEDevice.h>
#include "BLEInt16Characteristic.h"

#define BLE_SERVICE_UUID "0d57bff8-1684-405b-a325-142df5d952ee"
#define BLE_MOTOR1_SPEED_CHARACTERISTIC_UUID "52214fe2-2cec-4750-8eac-cb5c9635baf6"
#define BLE_MOTOR2_SPEED_CHARACTERISTIC_UUID "822ec32a-0ba9-48ed-9984-23f5cbeb93b2"


class BLEController : public BLEServerCallbacks
{
public:
    BLEController(const std::string& deviceName) : deviceName(deviceName) { }
    void init();
    bool getIsConnected() const { return isConnected; }
    int32_t getMotor1Speed();
    int32_t getMotor2Speed();
    void onConnect(BLEServer* pServer, esp_ble_gatts_cb_param_t* param) override;
    void onDisconnect(BLEServer* pServer) override;
private:
    const std::string deviceName;
    BLEInt16Characteristic motor1SpeedCharacteristic = BLEInt16Characteristic(BLE_MOTOR1_SPEED_CHARACTERISTIC_UUID, "Motor 1 Speed");
    BLEInt16Characteristic motor2SpeedCharacteristic = BLEInt16Characteristic(BLE_MOTOR2_SPEED_CHARACTERISTIC_UUID, "Motor 2 Speed");
    bool isConnected = false;
};

