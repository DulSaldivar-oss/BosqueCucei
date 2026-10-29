#!/usr/bin/env sh
# Respaldo diario de la base de datos y las fotos. Programar con cron, por ejemplo:
#   15 3 * * * cd /home/ubuntu/BosqueCucei && ./scripts/respaldo.sh >> respaldos/registro.log 2>&1
set -eu
destino="${1:-respaldos}"
fecha="$(date +%Y-%m-%d_%H%M)"
mkdir -p "$destino"
docker compose exec -T db pg_dump -U bosque -d bosque --format=custom > "$destino/bosque_$fecha.dump"
docker run --rm -v bosque-cucei_fotos:/fotos -v "$(pwd)/$destino":/respaldo alpine tar czf "/respaldo/fotos_$fecha.tar.gz" -C /fotos .
# Conserva los últimos 14 respaldos de cada tipo.
ls -1t "$destino"/bosque_*.dump 2>/dev/null | tail -n +15 | xargs -r rm --
ls -1t "$destino"/fotos_*.tar.gz 2>/dev/null | tail -n +15 | xargs -r rm --
echo "Respaldo listo: $destino/bosque_$fecha.dump"
