# Despliegue en Oracle Cloud

Guía para poner Bosque CUCEI en una máquina virtual de Oracle Cloud Infrastructure (OCI). Todo corre con Docker Compose:

```
Internet ──443──▶ Caddy (HTTPS automático) ──▶ app Next.js :3000 ──▶ PostgreSQL 17
                                                   └─ volumen «fotos»
```

## 1. Crear la máquina

1. En la consola de OCI: **Compute → Instances → Create instance**.
2. Imagen: **Ubuntu 24.04**.
3. Forma: **VM.Standard.A1.Flex** (Ampere, ARM). En la capa *Always Free* alcanza con **2 OCPU y 12 GB de RAM** para el piloto. Las imágenes de Docker del proyecto funcionan en ARM y en x86.
4. Agrega tu llave SSH pública y crea la instancia. Anota la **IP pública**.

## 2. Abrir los puertos 80 y 443

Oracle bloquea el tráfico en **dos lugares**; hay que abrir ambos.

**a) En la red (VCN):** *Networking → Virtual Cloud Networks → tu VCN → Security Lists → Default Security List → Add Ingress Rules*:

| Origen | Protocolo | Puerto destino |
| --- | --- | --- |
| `0.0.0.0/0` | TCP | 80 |
| `0.0.0.0/0` | TCP | 443 |
| `0.0.0.0/0` | UDP | 443 (HTTP/3, opcional) |

**b) En el firewall de la instancia** (las imágenes de Ubuntu de Oracle traen reglas de iptables propias):

```bash
ssh ubuntu@IP_PUBLICA
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p udp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## 3. Dominio (obligatorio para la cámara)

Los navegadores solo permiten usar la cámara (escáner QR) en sitios con **HTTPS**, y el certificado necesita un dominio.

- **Ideal:** pedir a la coordinación de TI un subdominio institucional (p. ej. `bosque.cucei.udg.mx`) con un registro **A** hacia la IP pública.
- **Para el piloto, sin trámites:** usar [sslip.io](https://sslip.io), que resuelve cualquier nombre con la IP incluida: si la IP es `203.0.113.10`, el dominio `bosque.203-0-113-10.sslip.io` ya apunta a tu máquina y Caddy puede obtener su certificado.

## 4. Instalar Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
exit   # vuelve a entrar por SSH para que tome el grupo
```

## 5. Descargar y configurar

```bash
git clone https://github.com/DulSaldivar-oss/BosqueCucei.git
cd BosqueCucei
cp .env.produccion.example .env
nano .env
```

En `.env`:

- `DOMINIO`: el dominio del paso 3.
- `CORREO_ACME`: correo para avisos de Let's Encrypt.
- `POSTGRES_PASSWORD`: genera una con `openssl rand -base64 24`.
- `COMPOSE_PROFILES=app` (ya viene): hace que se levanten la app, las migraciones y Caddy.

## 6. Levantar

```bash
docker compose up -d --build
docker compose logs -f app      # Ctrl+C para salir
```

La primera compilación en ARM tarda unos minutos. El servicio `migrar` aplica el esquema y las semillas (ajustes, especies y misiones) antes de que arranque la app; se vuelve a ejecutar en cada `up` y solo aplica lo pendiente.

Abre `https://TU_DOMINIO`.

## 7. Datos iniciales

**Inventario real (recomendado):** entra al panel e importa el CSV en `/admin/arboles/importar`.

**O datos de demostración** para presentar el prototipo:

```bash
docker compose run --rm migrar npm run db:migrar -- --demo
docker compose run --rm migrar npm run db:demo
```

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

## 10. Actualizar

```bash
git pull
docker compose up -d --build
```

## Problemas comunes

| Síntoma | Causa probable |
| --- | --- |
| El sitio no abre desde fuera | Falta abrir 80/443 en la Security List **o** en iptables (paso 2). |
| Caddy no obtiene el certificado | El dominio no apunta a la IP pública o el puerto 80 está cerrado. Revisa `docker compose logs caddy`. |
| «Cámara no disponible» | El sitio no está en HTTPS o la persona negó el permiso en el navegador. |
| La app no conecta a la base | Revisa `POSTGRES_PASSWORD` en `.env`; si la cambiaste después del primer arranque, el volumen conserva la contraseña anterior. |
| Fotos que desaparecen | Las fotos viven en el volumen `bosque-cucei_fotos`; no lo borres con `docker compose down -v`. |
