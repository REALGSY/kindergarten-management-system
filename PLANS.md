# Planning guide

## Deployment execution plan requirements

Future deployment plans must include the following deployment-specific details before any remote changes are made:

- Current deployment state: local git status, detected stack, current remote processes, current ports, existing runtime locations, and current FRP/Nginx status.
- Old process identification and stop strategy: exact process, scheduled task, service, command line, project path, or port used to identify what will be stopped.
- File sync strategy: source, destination, excluded paths, preservation rules for environment files, database files, logs, uploaded files, and secret-bearing files.
- Runtime/dependency strategy: detected package managers, dependency install commands, build commands, test commands, and confirmation that equivalent runtimes or supporting applications already exist before installing anything new.
- FRP verification: public server FRP binary/config/process, B computer FRP binary/config/process, expected local ports, expected remote ports, and any naming uncertainty.
- Nginx verification: config file paths, server names, listen ports, upstream targets, and reload/backout plan if config changes are required.
- Port verification: B computer app ports, FRP-exposed public-server-local ports, public server exposed port `5010`, and commands used to verify them.
- Domain verification: `http://kindergarten.bjtu.cc`, `https://kindergarten.bjtu.cc` if TLS is configured, status codes, and observed certificate or proxy issues.
- Rollback plan: backup location, restore commands, previous process/task restart commands, and validation steps after rollback.
- Logs and troubleshooting locations: frontend, backend, FRP, Nginx, scheduled task/service, and build/install logs.
- Commands actually run: record commands used for status checks, stop, sync, dependency install, build, start, and validation.
- Validation results: local B computer checks, public server checks, FRP checks, domain checks, and any unresolved TODOs.

Deployment plans must also preserve these rules:

- Do not use Docker for this target.
- Stop the old project before syncing updates.
- Do not install extra applications until checking for equivalent existing applications.
- Install any required additional applications under `D:\wan` or its subdirectories.
- Do not write SSH passwords, private keys, tokens, or secrets into repo files, scripts, logs, comments, or plan text.
