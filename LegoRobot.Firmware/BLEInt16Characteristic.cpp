#include "BLEInt16Characteristic.h"

BLEInt16Characteristic::BLEInt16Characteristic(const std::string& uuid, const std::string& name)
    : BLECharacteristic(uuid, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE), name(name)
{
    nameDescriptor.setValue(name);
    nameDescriptor.setAccessPermissions(ESP_GATT_PERM_READ);
    addDescriptor(&nameDescriptor);
    setIntValue(0);
    setCallbacks(this);
}

int16_t BLEInt16Characteristic::getIntValue()
{
    if (getLength() != 2)
        return 0;

    return *(int16_t*)getData();
}

void BLEInt16Characteristic::setIntValue(int16_t value)
{
    uint8_t temp[2];
    temp[0] = value;
    temp[1] = value >> 8;
    setValue(temp, 2);
}

void BLEInt16Characteristic::onWrite(BLECharacteristic* pCharacteristic)
{
    Serial.print("Write value to ");
    Serial.print(name.c_str());
    Serial.print(": ");
    Serial.println(getIntValue());
}
