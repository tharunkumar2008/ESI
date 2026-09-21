# ESI ESP32 Hardware Prototype

This integration is intended for a **low-voltage DC demonstration only**. Use an ESP32, INA219 voltage/current sensor, a 5V or 12V DC supply, DC loads, LEDs, relay, buzzer, and OLED display. Never connect the development board or sensor directly to 230V AC mains.

## Reading payload

Send the following JSON to the ESI hardware-reading procedure or the backend adapter that maps to it:

```json
{
  "device_id": "ESP32-LAB-01",
  "voltage": 5.0,
  "current": 1.2,
  "power": 6.0,
  "energy": 0.04,
  "timestamp": "2026-09-21T14:32:00Z"
}
```

The UI exposes the status as `ESP32 CONNECTED` or `ESP32 OFFLINE`. The prototype default is offline until a real gateway is attached.

## Suggested loop

1. Sample INA219 voltage and current at a safe low-voltage DC interval.
2. Calculate power as voltage × current and integrate energy over time.
3. Send the payload over Wi-Fi to the authorized backend adapter.
4. Use the OLED and buzzer for local status only; the ESI control centre remains the source of anomaly context.
5. Validate every change with a multimeter and current limit before increasing load.
