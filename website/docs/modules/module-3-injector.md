# Module 3: Loader Manager

Description: Controls startup sequence and plugin loading policies.

How to enable/disable:
- Toggle `loader_manager.enabled`.

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
  "loader_manager": {
    "enabled": true,
    "strict_mode": false
  }
}
```

Known limitations:
- Plugin compatibility must match target runtime version.
