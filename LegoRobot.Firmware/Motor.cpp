#include "Motor.h"

Motor::Motor(byte in1Pin, byte in2Pin, byte pwmPin, bool invert)
    : in1Pin(in1Pin), in2Pin(in2Pin), pwmPin(pwmPin), invert(invert)
{
    pinMode(in1Pin, OUTPUT);
    pinMode(in2Pin, OUTPUT);
    pinMode(pwmPin, OUTPUT);
}

void Motor::setSpeed(int speed)
{
    speed = max(-255, min(255, speed));
    if (speed == this->speed)
        return;

    this->speed = speed;

    if (invert)
        speed = -speed;

    if (speed > 0)
    {
        digitalWrite(in1Pin, LOW);
        digitalWrite(in2Pin, HIGH);
        analogWrite(pwmPin, speed);
    }
    else if (speed < 0)
    {
        digitalWrite(in2Pin, LOW);
        digitalWrite(in1Pin, HIGH);
        analogWrite(pwmPin, -speed);
    }
    else
    {
        digitalWrite(in1Pin, LOW);
        digitalWrite(in2Pin, LOW);
        digitalWrite(pwmPin, LOW);
    }
}
