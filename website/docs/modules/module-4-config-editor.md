# Module 4: Config Editor

Description: UI editor for validated config changes with rollback support.

How to enable/disable:
- Enable via `config_editor.enabled`.

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
  "config_editor": {
    "enabled": true
  }
}
```

Known limitations:
- Advanced nested schema edits are not available in quick mode.
