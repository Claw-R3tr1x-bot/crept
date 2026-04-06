# Module 1: Policy Guard

Description: Runtime policy enforcement and anomaly alerts.

How to enable/disable:
- Enable: set `enabled=true`
- Disable: set `enabled=false`

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
  "policy_guard": {
    "enabled": true,
    "strict_mode": true,
    "telemetry_level": "full"
  }
}
```

Known limitations:
- Strict mode may increase false positives for custom environments.
