#!/usr/bin/env bash
# WearShare: deploy the latest backend code from GitHub. Run on the server as root:
#     bash /opt/wearshare/deploy/update.sh
set -euo pipefail
cd /opt/wearshare
git pull --ff-only
cd backend
.venv/bin/pip install -r requirements.txt
systemctl restart wearshare
sleep 3
systemctl --no-pager --lines=0 status wearshare | head -n 5
curl -s http://127.0.0.1:8000/api/health && echo
