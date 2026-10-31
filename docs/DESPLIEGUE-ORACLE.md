# Despliegue en Oracle Cloud

Guía para poner Bosque CUCEI en una máquina virtual de Oracle Cloud Infrastructure (OCI). Todo corre con Docker Compose:

```
Internet ──443──▶ Caddy (HTTPS automático) ──▶ app Next.js :3000 ──▶ PostgreSQL 17
                                                   └─ volumen «fotos»
```

**Resumen**, una vez creada la máquina y abiertos los puertos en la VCN (pasos 1 y 2):

```bash
git clone https://github.com/DulSaldivar-oss/BosqueCucei.git && cd BosqueCucei
sudo ./scripts/preparar-servidor.sh      # Docker, firewall y swap; luego sal y vuelve a entrar por SSH
cp .env.produccion.example .env && nano .env
./scripts/desplegar.sh
```

## 1. Crear la máquina

1. En la consola de OCI: **Compute → Instances → Create instance**.
2. Imagen: **Ubuntu 24.04**.
3. Forma: **VM.Standard.A1.Flex** (Ampere, ARM). En la capa *Always Free* alcanza con **2 OCPU y 12 GB de RAM** para el piloto. Las imágenes de Docker del proyecto funcionan en ARM y en x86 (el CI compila ambas).
4. Agrega tu llave SSH pública y crea la instancia. Anota la **IP pública**.

> También funciona en la forma gratuita **VM.Standard.E2.1.Micro** (1 GB de RAM): el script del paso 4 agrega swap para que la compilación no se quede sin memoria, aunque tarda más.

## 2. Abrir los puertos 80 y 443 en la red

Oracle bloquea el tráfico en **dos lugares**: la red (aquí) y el firewall de la instancia (lo resuelve el script del paso 4).

*Networking → Virtual Cloud Networks → tu VCN → Security Lists → Default Security List → Add Ingress Rules*:

| Origen | Protocolo | Puerto destino |
| --- | --- | --- |
| `0.0.0.0/0` | TCP | 80 |
| `0.0.0.0/0` | TCP | 443 |
| `0.0.0.0/0` | UDP | 443 (HTTP/3, opcional) |

## 3. Dominio (obligatorio para la cámara)

Los navegadores solo permiten usar la cámara (escáner QR) en sitios con **HTTPS**, y el certificado necesita un dominio.

- **Ideal:** pedir a la coordinación de TI un subdominio institucional (p. ej. `bosque.cucei.udg.mx`) con un registro **A** hacia la IP pública.
- **Para el piloto, sin trámites:** usar [sslip.io](https://sslip.io), que resuelve cualquier nombre con la IP incluida: si la IP es `203.0.113.10`, el dominio `bosque.203-0-113-10.sslip.io` ya apunta a tu máquina y Caddy puede obtener su certificado.

## 4. Preparar la máquina

```bash
ssh ubuntu@IP_PUBLICA
git clone https://github.com/DulSaldivar-oss/BosqueCucei.git
cd BosqueCucei
sudo ./scripts/preparar-servidor.sh
exit        # vuelve a entrar por SSH para usar docker sin sudo
```

`preparar-servidor.sh` se corre una vez y puede repetirse sin problema:

- instala Docker y agrega a tu usuario al grupo `docker`;
- abre 80/TCP, 443/TCP y 443/UDP en iptables, antes de la regla `REJECT` que traen las imágenes de Oracle, y guarda las reglas;
- si la máquina tiene menos de 4 GB de RAM, crea 2 GB de swap.

## 5. Configurar

```bash
cd BosqueCucei
cp .env.produccion.example .env
nano .env
```

| Variable | Valor |
| --- | --- |
| `DOMINIO` | El dominio del paso 3. |
| `POSTGRES_PASSWORD` | Solo letras y números, porque va dentro de una URL de conexión. Genérala con `openssl rand -hex 24`. |
| `COMPOSE_PROFILES` | `app` (ya viene). Hace que se levanten la app, las migraciones y Caddy. |

## 6. Desplegar

```bash
./scripts/desplegar.sh
```

El script:

1. Revisa que `.env` esté completo (no deja pasar los valores de ejemplo ni contraseñas con caracteres que rompen la URL).
2. Trae los cambios con `git pull --ff-only` (usa `--sin-actualizar` para omitirlo).
3. Compila y levanta todo con `docker compose up -d --build`. El servicio `migrar` aplica el esquema y las semillas (ajustes, especies, los 1086 árboles del inventario oficial y misiones) antes de que arranque la app, y vuelve a correr en cada despliegue aplicando solo lo pendiente o lo que cambió.
4. Espera a que `/api/salud` responda (app arriba y conectada a la base) y limpia imágenes viejas.

La primera compilación en ARM tarda unos minutos. Después abre `https://TU_DOMINIO`.

Para revisar el estado en cualquier momento:

```bash
docker compose ps
curl -s https://TU_DOMINIO/api/salud      # {"ok":true,"base_de_datos":"ok"}
docker compose logs -f app                # Ctrl+C para salir
```

## 7. Datos iniciales

**El inventario ya viene cargado:** la semilla `db/semillas/03_arboles.sql` trae los 1086 árboles del Excel oficial (`data/inventario/arboles-cucei.xlsx`) y las 132 especies. Para actualizarlo más adelante, sigue [docs/INVENTARIO.md](INVENTARIO.md): se reemplaza el Excel en el repositorio y el siguiente despliegue sincroniza la base, o se sube desde `/admin/arboles/importar`.

**Personas y observaciones de ejemplo** (solo para presentar el prototipo, no en producción real):

```bash
docker compose run --rm migrar npm run db:demo
```

> Si en esta máquina ya habías cargado el inventario de demostración (`db:migrar -- --demo`), sus códigos CUCEI-0001…0071 ahora son los árboles reales. Los cinco que no existen en el inventario (CUCEI-0024, 0025, 0052, 0054 y 0066) quedan como árboles del panel: desactívalos en `/admin/arboles`.

**Primer administrador:** regístrate en `/registro` y después:

```bash
docker compose run --rm migrar npm run admin:crear -- tu-correo@dominio
```

## 8. Imprimir las placas

En `/admin/arboles/qr` se generan etiquetas de 6 × 9 cm con el QR de cada árbol, filtrables por zona. El QR apunta a `https://TU_DOMINIO/a/<qr_id>`. Si las placas ya colocadas tienen otro QR, no hace falta reimprimir: guarda su contenido en la columna `qr_id` del árbol.

## 9. Respaldos

```bash
./scripts/respaldo.sh            # base de datos (pg_dump) y fotos en ./respaldos
crontab -e                       # respaldo diario a las 3:15
15 3 * * * cd /home/ubuntu/BosqueCucei && ./scripts/respaldo.sh >> respaldos/registro.log 2>&1
```

Conserva los últimos 14 de cada tipo. Copia la carpeta `respaldos` fuera de la máquina de vez en cuando (por ejemplo a Object Storage de Oracle).

Restaurar la base:

```bash
docker compose exec -T db pg_restore -U bosque -d bosque --clean < respaldos/bosque_FECHA.dump
```

Los registros de los contenedores rotan solos (3 archivos de 10 MB por servicio), así que no llenan el disco.

## 10. Actualizar

En la máquina:

```bash
./scripts/desplegar.sh
```

O desde GitHub, sin entrar por SSH: pestaña **Actions → Desplegar en Oracle → Run workflow** (ver la sección siguiente).

## Integración continua y despliegue desde GitHub

**`.github/workflows/ci.yml`** corre en cada pull request y en cada cambio a `main`:

| Trabajo | Qué comprueba |
| --- | --- |
| Lint, tipos, pruebas y build | ESLint, TypeScript, las pruebas con Vitest (incluidas las de integración contra PostgreSQL 17) y `next build`. |
| Imagen Docker | Compila las imágenes `app` y `herramientas` para `linux/amd64` y `linux/arm64` (la arquitectura de las máquinas Ampere). |
| Despliegue completo | Levanta el `docker-compose.yml` real con `./scripts/desplegar.sh`, como en producción. Prueba el sitio por HTTPS a través de Caddy, la redirección de HTTP, las cabeceras de seguridad, que la semilla cargó todo el inventario y que el escáner resuelve un número de placa. |

**`.github/workflows/desplegar.yml`** despliega a la máquina por SSH cuando lo lanzas a mano. Configúralo una vez en *Settings → Secrets and variables → Actions*:

| Nombre | Tipo | Valor |
| --- | --- | --- |
| `ORACLE_HOST` | Secreto | IP pública o dominio de la máquina. |
| `ORACLE_USUARIO` | Secreto | Usuario SSH, normalmente `ubuntu`. |
| `ORACLE_SSH_KEY` | Secreto | Llave privada SSH con acceso a la máquina. Conviene crear una exclusiva para esto y agregar la pública a `~/.ssh/authorized_keys`. |
| `ORACLE_RUTA` | Variable (opcional) | Carpeta del repositorio en la máquina, relativa al home o absoluta, si no es `~/BosqueCucei`. |

El workflow entra a la máquina, se cambia a `main` y corre `./scripts/desplegar.sh`.

## Problemas comunes

| Síntoma | Causa probable |
| --- | --- |
| El sitio no abre desde fuera | Falta abrir 80/443 en la Security List (paso 2) o no corriste `preparar-servidor.sh` (paso 4). |
| Caddy no obtiene el certificado | El dominio no apunta a la IP pública o el puerto 80 está cerrado. Revisa `docker compose logs caddy`. |
| «Cámara no disponible» | El sitio no está en HTTPS o la persona negó el permiso en el navegador. |
| `/api/salud` responde `503` | La app no alcanza la base. Revisa `docker compose logs db app`. Si cambiaste `POSTGRES_PASSWORD` después del primer arranque, el volumen de la base conserva la contraseña anterior. |
| La compilación se detiene sin error claro | Falta memoria. Corre `sudo ./scripts/preparar-servidor.sh` para agregar swap. |
| Fotos que desaparecen | Las fotos viven en el volumen `bosque-cucei_fotos`; no lo borres con `docker compose down -v`. |
