#!/usr/bin/env bash
# Prepara una máquina Ubuntu nueva de Oracle Cloud para Bosque CUCEI. Se corre una sola vez:
#   sudo ./scripts/preparar-servidor.sh
# Instala Docker, abre los puertos 80 y 443 en el firewall de la instancia y, si la máquina
# tiene poca memoria, agrega swap para poder compilar la app.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Ejecútalo con sudo: sudo $0" >&2
  exit 1
fi
usuario="${SUDO_USER:-ubuntu}"

echo "1/3 Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker
usermod -aG docker "$usuario"

echo "2/3 Puertos 80 y 443 en iptables"
# Las imágenes de Ubuntu de Oracle traen una regla REJECT al final de INPUT: las nuevas reglas
# se insertan antes de ella. (Además hay que abrir los puertos en la Security List de la VCN.)
for regla in "tcp 80" "tcp 443" "udp 443"; do
  set -- $regla
  if ! iptables -C INPUT -p "$1" --dport "$2" -m state --state NEW -j ACCEPT 2>/dev/null; then
    posicion=$(iptables -L INPUT --line-numbers -n | awk '/REJECT/ {print $1; exit}')
    if [ -n "$posicion" ]; then
      iptables -I INPUT "$posicion" -p "$1" --dport "$2" -m state --state NEW -j ACCEPT
    else
      iptables -A INPUT -p "$1" --dport "$2" -m state --state NEW -j ACCEPT
    fi
  fi
done
if command -v netfilter-persistent >/dev/null 2>&1; then
  netfilter-persistent save
else
  echo "  Aviso: no está netfilter-persistent; las reglas se pierden al reiniciar." >&2
fi

echo "3/3 Memoria"
memoria_mb=$(awk '/MemTotal/ {print int($2 / 1024)}' /proc/meminfo)
if [ "$memoria_mb" -lt 4000 ] && ! swapon --show | grep -q '/swapfile'; then
  # Compilar Next.js pide unos 2 GB; las máquinas pequeñas necesitan swap.
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "  Swap de 2 GB activado (memoria: ${memoria_mb} MB)."
else
  echo "  Memoria suficiente (${memoria_mb} MB)."
fi

echo
echo "Listo. Cierra la sesión SSH y vuelve a entrar para usar docker sin sudo."
echo "Siguiente paso: cp .env.produccion.example .env, edítalo y corre ./scripts/desplegar.sh"
