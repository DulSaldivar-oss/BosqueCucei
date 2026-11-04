#!/usr/bin/env bash
# Corre un comando del proyecto en la máquina del servidor, dentro del contenedor «migrar».
# La máquina no necesita Bun, Node ni npm: vienen dentro de la imagen de Docker y ese
# contenedor ya tiene la conexión a la base de datos.
#
#   ./scripts/bosque.sh admin:crear tu-correo@dominio    da acceso al panel a una cuenta
#   ./scripts/bosque.sh db:migrar                         aplica migraciones y semillas pendientes
#   ./scripts/bosque.sh db:demo                           personas y observaciones de ejemplo (no en producción real)
set -euo pipefail
cd "$(dirname "$0")/.."

if [ $# -eq 0 ]; then
  echo "Uso: ./scripts/bosque.sh <comando> [argumentos]" >&2
  echo "Comandos: admin:crear <correo> · db:migrar · db:demo [--reiniciar]" >&2
  exit 1
fi

case "$1" in
  inventario:importar | db:sql | sprites | especies:importar)
    # Estos cambian archivos del repositorio; dentro del contenedor los cambios se perderían.
    echo "✗ «$1» modifica archivos del repositorio: córrelo en tu computadora (con Bun) y sube los cambios," >&2
    echo "  o, para el inventario, sube el Excel en /admin/arboles/importar. Ver docs/INVENTARIO.md." >&2
    exit 1
    ;;
esac

[ -f .env ] || { echo "✗ Falta el archivo .env. Corre primero ./scripts/desplegar.sh (ver docs/DESPLIEGUE-ORACLE.md)." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "✗ No está Docker. Corre primero: sudo ./scripts/preparar-servidor.sh" >&2; exit 1; }

exec docker compose run --rm migrar bun run "$@"
