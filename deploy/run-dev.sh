#!/usr/bin/env bash
# Start the Next.js dev server (hot reload) under systemd.
# Uses deployer's nvm Node so the unit does not depend on a global node install.
set -euo pipefail

cd /opt/mmcPhotoday

export NVM_DIR="/home/deployer/.nvm"
if [[ -s "${NVM_DIR}/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  source "${NVM_DIR}/nvm.sh"
fi

exec npm run dev
