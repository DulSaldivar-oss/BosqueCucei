#!/usr/bin/env bash
# Despliega o actualiza Bosque CUCEI en la máquina:
#   ./scripts/desplegar.sh                  trae los cambios de git, compila y reinicia
#   ./scripts/desplegar.sh --sin-actualizar usa el código tal como está
set -euo pipefail
cd "$(dirname "$0")/.."

fallar() {
  echo "✗ $*" >&2
  exit 1
}

[ -f .env ] || fallar "Falta el archivo .env. Crea uno con: cp .env.produccion.example .env (y edítalo)."
set -a
# shellcheck disable=SC1091
. ./.env
set +a

[ -n "${DOMINIO:-}" ] && [ "$DOMINIO" != "bosque.ejemplo.mx" ] || fallar "Define DOMINIO en .env (el dominio que apunta a esta máquina)."
[ -n "${POSTGRES_PASSWORD:-}" ] && [ "$POSTGRES_PASSWORD" != "cambia-esta-contrasena" ] ||
  fallar "Define POSTGRES_PASSWORD en .env (genera una con: openssl rand -hex 24)."
[[ "$POSTGRES_PASSWORD" =~ ^[A-Za-z0-9_-]+$ ]] ||
  fallar "POSTGRES_PASSWORD solo puede tener letras, números, guion y guion bajo (va dentro de una URL)."
[ "${COMPOSE_PROFILES:-}" = "app" ] || fallar "Agrega COMPOSE_PROFILES=app a .env para levantar la app y Caddy."
command -v docker >/dev/null 2>&1 || fallar "No está Docker. Corre primero: sudo ./scripts/preparar-servidor.sh"
if ! docker info >/dev/null 2>&1; then
  if docker info 2>&1 | grep -qi "permission denied"; then
    fallar "Tu usuario no puede usar Docker. Corre: sudo usermod -aG docker \$USER, cierra la sesión SSH y vuelve a entrar."
  fi
  fallar "Docker no está corriendo. Arráncalo con: sudo systemctl enable --now docker"
fi

# El dominio debe apuntar a esta máquina; si no, el navegador abre el sitio de otra persona.
if [ "$DOMINIO" != "localhost" ] && command -v getent >/dev/null 2>&1; then
  ip_dominio="$(getent ahostsv4 "$DOMINIO" 2>/dev/null | awk 'NR==1 {print $1}')"
  ip_maquina="$(curl -fsS -4 --max-time 5 https://ifconfig.me 2>/dev/null || true)"
  if [ -z "$ip_dominio" ]; then
    echo "⚠ $DOMINIO no existe en el DNS. Revisa que esté bien escrito (DuckDNS termina en .duckdns.org)." >&2
  elif [ -n "$ip_maquina" ] && [ "$ip_dominio" != "$ip_maquina" ]; then
    echo "⚠ $DOMINIO apunta a $ip_dominio, pero esta máquina es $ip_maquina. Corrige el registro DNS (o la IP en DuckDNS)." >&2
  fi
fi

if [ "${1:-}" != "--sin-actualizar" ] && [ -d .git ]; then
  echo "→ Actualizando el código"
  git pull --ff-only
fi

echo "→ Compilando y levantando servicios (la primera vez tarda varios minutos)"
docker compose up -d --build --remove-orphans

echo "→ Esperando a que la app responda"
for _ in $(seq 1 60); do
  if docker compose exec -T app wget -qO- http://127.0.0.1:3000/api/salud >/dev/null 2>&1; then
    docker compose ps
    docker image prune -f >/dev/null
    echo "✓ Bosque CUCEI está en línea: https://$DOMINIO"
    exit 0
  fi
  sleep 5
done

docker compose ps
docker compose logs --tail 60 migrar app caddy
fallar "La app no respondió en 5 minutos. Revisa los registros de arriba."
