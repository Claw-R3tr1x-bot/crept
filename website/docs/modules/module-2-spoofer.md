# Module 2: Device Integrity

Description: Verifies hardware identity consistency and reset events.

How to enable/disable:
- Enable in settings under `device_integrity.enabled`.

Settings & configuration options:

| setting name | type | default | description |
|---|---|---|---|
| enabled | boolean | true | Enables module runtime |
| strict_mode | boolean | false | Uses strict policy checks |
| telemetry_level | string | basic | Controls diagnostics verbosity |
| retry_limit | number | 3 | Retry count for transient failures |


Example config snippet:
```json
{
  "device_integrity": {
    "enabled": true,
    "retry_limit": 5
  }
}
```

Known limitations:
- Requires accurate host identifier collection.
