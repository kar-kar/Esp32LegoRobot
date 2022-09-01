#include "Motor.h"
#include "BLEController.h"
#include "Blinker.h"

#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error Bluetooth is not enabled!
#endif

#define LED 2
#define A_PWM 23
#define A_IN1 27
#define A_IN2 13
#define B_PWM 26
#define B_IN1 17
#define B_IN2 25
#define STNDBY 16

Blinker blinker(LED);
Motor motor1(B_IN1, B_IN2, B_PWM);
Motor motor2(A_IN1, A_IN2, A_PWM, true);
BLEController ble("Lego Robot 1");

void setup()
{
    Serial.begin(115200);

    pinMode(STNDBY, OUTPUT);
    digitalWrite(STNDBY, HIGH);

    ble.init();
}

void loop()
{
    if (ble.getIsConnected())
    {
        blinker.setPeriod(-1);
        motor1.setSpeed(ble.getMotor1Speed());
        motor2.setSpeed(ble.getMotor2Speed());
    }
    else
    {
        blinker.setPeriod(1000);
        motor1.setSpeed(0);
        motor2.setSpeed(0);
    }

    blinker.loop();
}