#pragma once

#include <Arduino.h>
#include <BLEService.h>

class BLEInt16Characteristic : public BLECharacteristic, BLECharacteristicCallbacks
{
public:
	BLEInt16Characteristic(const std::string& uuid, const std::string& name);
	int16_t getIntValue();
	void setIntValue(int16_t value);
	void onWrite(BLECharacteristic* pCharacteristic) override;
private:
	const std::string name;
	BLEDescriptor nameDescriptor = BLEDescriptor(BLEUUID((uint16_t)0x2901));
};

