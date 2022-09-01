#pragma once

#include <Arduino.h>

class Motor
{
public:
    Motor(byte in1Pin, byte in2Pin, byte in3Pin, bool invert = false);
    void setSpeed(int speed);
private:
    const byte in1Pin;
    const byte in2Pin;
    const byte pwmPin;
    const bool invert;
    int speed = 0;
};

