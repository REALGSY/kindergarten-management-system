# Agent instructions

## Deployment configuration

### Deployment target

- Domain: `kindergarten.bjtu.cc`
- Public server: `39.102.114.72`
- Exposed server port: `5010`
- B computer SSH access: connect through the public server, SSH port `2222`, username `LDX`
- B computer project root: `D:\wan\code\project\kindergarten`

### Network path

- User traffic reaches `kindergarten.bjtu.cc`.
- Nginx on the public server reverse-proxies the domain.
- The service is exposed through server port `5010`.
- The B computer updates and runs the actual project through network tunneling / FRP.
- The website must ultimately be reachable through `kindergarten.bjtu.cc`.

### Deployment rules

- Do not use Docker. The target B computer does not support virtualization.
- Before updating the website, stop the old running project first.
- Sync project files only after the old process is stopped.
- Start the new version after syncing.
- Verify domain reachability after startup.
- Do not install extra applications until checking whether an equivalent application already exists on the target device.
- Install any required additional applications under `D:\wan` or one of its subdirectories.
- Do not expose SSH passwords, private keys, tokens, application secrets, or other credentials in repo files, scripts, logs, comments, or documentation.
- Preserve environment files and secret-bearing files already present on the B computer unless explicitly instructed otherwise.

### FRP / Nginx verification checklist

- Check Nginx config for `kindergarten.bjtu.cc`.
- Check whether port `5010` is listening on the public server.
- Check public server FRP process/config.
- Check B computer FRP process/config.
- Confirm the correct local service port used by the project on B computer.
- Confirm traffic from domain to Nginx to FRP to the B computer application.

Known deployment findings from the current environment:

- Public server Nginx has configs for `kindergarten.bjtu.cc` on ports `80` and `5010`.
- Public server Nginx proxies frontend traffic to `127.0.0.1:15010` and backend/API traffic to `127.0.0.1:15011`.
- Public server port `5010` is expected to be handled by Nginx.
- Public server FRP currently runs `frps` with config `/etc/frp/frps-gzh.toml`; the owner-provided `/usr/local/bin/frps` path is the binary path, not the active config path.
- B computer project FRP currently uses `frpc.exe` with config `D:\wan\frp\frp_0.63.0_windows_amd64\frp_0.63.0_windows_amd64\frpc-kindergarten.toml`.
- The owner-provided B computer path `D:\wan\frp\frp_0.63.0_windows_amd64\frp_0.63.0_windows_amd64\frps.toml` exists, but it is not the active kindergarten tunnel config observed for this deployment.
- TODO: confirm FRP client/server naming with the owner. The provided B computer path uses `frps.toml`, but the active kindergarten tunnel is a client process/config (`frpc.exe` / `frpc-kindergarten.toml`).
- Current expected app ports on B computer are frontend `127.0.0.1:4000` and backend `127.0.0.1:3000`.

### Deployment checklist

- Check current `git status`.
- Identify stack and build/start commands from repository files.
- SSH to public server.
- SSH from public server to B computer on port `2222` as `LDX`.
- Create `D:\wan\code\project\kindergarten` if missing.
- Stop the old project process safely.
- Sync files to the project root.
- Install/update dependencies.
- Build if required.
- Start the app.
- Verify local port on B computer.
- Verify FRP tunnel.
- Verify server port `5010`.
- Verify `kindergarten.bjtu.cc`.
