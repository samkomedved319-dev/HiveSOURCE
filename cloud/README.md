# Hive Cloud Computer

Remote box the desktop app calls with `HIVE_CLOUD_URL`.

## Cloudflare (always-on)

```bash
cd cloud/cloudflare
npx wrangler login
npx wrangler deploy
npx wrangler secret put HIVE_CLOUD_TOKEN
```

Then in Hive `.env`:

```
HIVE_CLOUD_URL=https://hive-cloud-computer.<you>.workers.dev
HIVE_CLOUD_TOKEN=same-secret
```

The Durable Object `HiveBox` keeps a virtual disk + concurrent Scout/Hive/Pulse jobs. Shell is limited to `ls`, `cat`, `echo`, `pwd`, `uname`.

## Google Colab (real shell)

1. Upload `cloud/colab/hive_cloud.py` to `/content/hive_cloud.py`
2. Open `cloud/colab/HiveCloudComputer.ipynb` in Colab
3. Run the cell, copy the ngrok URL into `HIVE_CLOUD_URL`

Colab can run real commands inside `/content/hive-box` (20s timeout, destructive commands blocked).

## From Hive

Ask: “status of the cloud computer” or “run ls on the cloud computer”.
Scout uses `hive_cloud_swarm` so three remote agents start together.
