# Hosting the Vocab backend

The Android app is local-first and needs no server, but two things do:

- the `/privacy` URL that Google Play requires in the listing, and
- optional use of the self-hosted web app and CLI.

Host the existing container as-is. No new services.

## Cheapest workable option

A single small VPS runs the published Docker image.

| Item | Choice | Cost |
|---|---|---|
| VPS | Hetzner CX22 (2 vCPU, 4 GB) or comparable | ~€3.50/mo |
| Domain | optional; IP works for `/privacy` | €0–1/mo |
| TLS | Caddy (auto) or Let's Encrypt | €0 |
| **Total** | | **≤ €5/mo** |

Inside the €10/mo ceiling set for this project.

Alternatives at similar cost: Fly.io, Railway, Render (all have a free or
sub-$5 always-on tier; verify current pricing before committing, since these
providers have changed free-tier terms repeatedly).

## Deploy

```bash
git clone https://github.com/Krocosr/vocab.git /opt/vocab
cd /opt/vocab
docker compose up -d --build
```

`docker-compose.yml` binds `${PORT:-8737}:8080` and mounts `./data` for the
SQLite file, so the cache and saved words survive restarts.

## Put TLS in front

```bash
# Caddy
echo "vocab.example.com {
  reverse_proxy 127.0.0.1:8737
}" | sudo tee /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Then the Play Console privacy policy URL is
`https://vocab.example.com/privacy`.

## Verify after deploy

```bash
curl -fsS https://vocab.example.com/privacy | grep -q "Privacy Policy" && echo OK
curl -fsS https://vocab.example.com/api/word/serendipity | head -c 120
```

## Operational notes

- **Uptime matters more than cost.** A dead backend means a dead privacy-policy
  URL, and Play review can reject the listing over it. Use the provider's
  automatic restart and set an uptime alert.
- **Back up `data/vocab.db`.** It is the lookup cache; losing it costs nothing
  but a slow first week. A nightly `cp` is enough.
- **The app does not depend on this host**, so an outage degrades the web app
  and CLI only. Android users are unaffected.
