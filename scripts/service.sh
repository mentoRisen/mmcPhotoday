#!/usr/bin/env bash
# Manage the mmc-photoday-dev systemd service.
# Requires sudoers rules from deploy/sudoers-mmc-photoday (one-time root setup).
set -euo pipefail

SERVICE="mmc-photoday-dev.service"

usage() {
  cat <<EOF
Usage: $(basename "$0") <command>

Commands:
  start     Start the dev server (hot reload, same as npm run dev)
  stop      Stop the dev server
  restart   Restart the dev server
  status    Show service status
  logs      Follow service logs (Ctrl+C to exit)
  enable    Start automatically on boot
  disable   Do not start on boot
EOF
}

require_sudoers() {
  local rc=0
  sudo -n /bin/systemctl status "${SERVICE}" >/dev/null 2>&1 || rc=$?
  case "${rc}" in
    0|3|4) return 0 ;; # running, stopped, or unit not installed yet
    *)
      echo "Cannot manage ${SERVICE} without passwordless sudo." >&2
      echo "Ask an admin to install deploy/sudoers-mmc-photoday (see README)." >&2
      exit 1
      ;;
  esac
}

case "${1:-}" in
  start|stop|restart|status|enable|disable)
    require_sudoers
    sudo systemctl "$1" "${SERVICE}"
    ;;
  logs)
    require_sudoers
    sudo journalctl -u "${SERVICE}" -f
    ;;
  ""|-h|--help|help)
    usage
    exit 0
    ;;
  *)
    echo "Unknown command: $1" >&2
    usage
    exit 1
    ;;
esac
