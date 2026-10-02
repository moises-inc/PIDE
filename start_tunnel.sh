#!/usr/bin/env bash
# ==============================================================================
# 🌐 PIDE — Despliegue de Aula / Modo Móvil Estudiantes (\$0 USD)
# ==============================================================================
# Inicia el backend FastAPI (8000), frontend Vite (5173) y levanta un Quick Tunnel
# seguro de Cloudflare sin costo, generando un enlace HTTPS y código QR para
# smartphones de alumnos y computadores en la sala de clases.
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DIR="$DIR/bin"
BACKEND_PORT=8000
FRONTEND_PORT=5173
LOG_FILE="/tmp/cloudflared_pide.log"
PYTHON_BIN="$DIR/.venv/bin/python"

if [ ! -x "$PYTHON_BIN" ]; then
    PYTHON_BIN="$(command -v python3 || echo "python3")"
fi

echo -e "\033[1;36m====================================================================\033[0m"
echo -e "\033[1;36m       🧪 PIDE · Conexión Web de Aula y Móviles Estudiantes         \033[0m"
echo -e "\033[1;36m====================================================================\033[0m"

# 1. Asegurar binario de cloudflared
mkdir -p "$BIN_DIR"
CLOUDFLARED_BIN=""

check_cloudflared() {
    if [ -x "$BIN_DIR/cloudflared" ] && "$BIN_DIR/cloudflared" --version >/dev/null 2>&1; then
        CLOUDFLARED_BIN="$BIN_DIR/cloudflared"
        return 0
    fi
    if command -v cloudflared >/dev/null 2>&1 && cloudflared --version >/dev/null 2>&1; then
        CLOUDFLARED_BIN="$(command -v cloudflared)"
        return 0
    fi
    return 1
}

if check_cloudflared; then
    VER_INFO=$("$CLOUDFLARED_BIN" --version 2>/dev/null | awk '{print $1,$2,$3}' || echo "cloudflared")
    echo -e "\033[1;32m[Cloudflare OK]\033[0m Binario preparado: \033[1m$VER_INFO\033[0m"
else
    echo -e "\033[1;33m[Instalación]\033[0m Descargando binario estático de Cloudflare Tunnel (~40MB)..."
    curl -# -L --fail "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64" -o "$BIN_DIR/cloudflared.tmp"
    mv "$BIN_DIR/cloudflared.tmp" "$BIN_DIR/cloudflared"
    chmod +x "$BIN_DIR/cloudflared"
    CLOUDFLARED_BIN="$BIN_DIR/cloudflared"
    echo -e "\033[1;32m[OK]\033[0m Binario preparado e instalado en: $CLOUDFLARED_BIN"
fi

# 2. Verificar o iniciar Backend FastAPI
BACKEND_PID=""
if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "\033[1;32m[Backend]\033[0m FastAPI en ejecución en puerto $BACKEND_PORT."
else
    echo -e "\033[1;33m[Backend]\033[0m Iniciando FastAPI en segundo plano..."
    export PYTHONPATH="$DIR/backend${PYTHONPATH:+:$PYTHONPATH}"
    "$PYTHON_BIN" -m uvicorn app.main:app --app-dir "$DIR/backend" --host 127.0.0.1 --port $BACKEND_PORT > /tmp/pide_backend.log 2>&1 &
    BACKEND_PID=$!
    
    echo -ne "Esperando que el backend esté listo"
    for i in {1..30}; do
        if curl -s "http://127.0.0.1:$BACKEND_PORT/api/elements" >/dev/null 2>&1; then
            echo -e " \033[1;32m[OK]\033[0m"
            break
        fi
        echo -ne "."
        sleep 0.5
    done
fi

# 3. Detectar IP Local (Wi-Fi USS)
LOCAL_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}' || hostname -I | awk '{print $1}')
LOCAL_URL="http://${LOCAL_IP:-127.0.0.1}:$FRONTEND_PORT"

# 4. Asegurar Frontend
FRONTEND_PID=""
if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "\033[1;32m[Frontend]\033[0m Frontend en ejecución en puerto $FRONTEND_PORT."
else
    echo -e "\033[1;33m[Frontend]\033[0m Iniciando servidor Vite..."
    npm --prefix "$DIR/frontend" run dev -- --host 0.0.0.0 --port $FRONTEND_PORT > /tmp/pide_frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    echo -ne "Esperando que el frontend esté listo"
    for i in {1..30}; do
        if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e " \033[1;32m[OK]\033[0m"
            break
        fi
        echo -ne "."
        sleep 0.5
    done
fi

# 5. Iniciar Cloudflare Quick Tunnel con HTTP/2
echo -e "\033[1;35m[Cloudflare]\033[0m Conectando túnel seguro HTTPS con Cloudflare Edge (HTTP/2)..."
rm -f "$LOG_FILE"
"$CLOUDFLARED_BIN" tunnel --protocol http2 --url "http://localhost:$FRONTEND_PORT" > "$LOG_FILE" 2>&1 &
TUNNEL_PID=$!

# Limpieza al salir
cleanup() {
    echo -e "\n\033[1;33m[Cierre]\033[0m Deteniendo Cloudflare Tunnel (PID: $TUNNEL_PID)..."
    kill "$TUNNEL_PID" 2>/dev/null || true
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    rm -f "$DIR/frontend/public/tunnel_info.json" "$DIR/frontend/dist/tunnel_info.json"
    echo -e "\033[1;32m[OK]\033[0m Sesión cerrada correctamente."
    exit 0
}
trap cleanup SIGINT SIGTERM

# 6. Extraer URL pública de Cloudflare
echo -ne "\033[1;33m[Conectando]\033[0m Generando enlace público seguro"
TUNNEL_URL=""
for i in {1..60}; do
    if [ -f "$LOG_FILE" ]; then
        FOUND_URL=$(grep -oE "https://[a-zA-Z0-9-]+\.trycloudflare\.com" "$LOG_FILE" | head -n 1 || true)
        if [ -n "$FOUND_URL" ]; then
            TUNNEL_URL="$FOUND_URL"
            echo -e " \033[1;32m[OK]\033[0m"
            break
        fi
    fi
    echo -ne "."
    sleep 0.5
done

if [ -z "$TUNNEL_URL" ]; then
    echo ""
    echo -e "\033[1;31m[Error]\033[0m No se pudo obtener la URL de Cloudflare en 30 segundos."
    echo -e "Últimas líneas del registro ($LOG_FILE):"
    tail -n 15 "$LOG_FILE" 2>/dev/null || true
    exit 1
fi

# 7. Escribir metadatos de túnel
INFO_JSON=$(cat <<INFEOF
{
  "url": "$TUNNEL_URL",
  "local_url": "$LOCAL_URL",
  "generated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "status": "online",
  "protocol": "http2"
}
INFEOF
)
mkdir -p "$DIR/frontend/public" "$DIR/frontend/dist"
echo "$INFO_JSON" > "$DIR/frontend/public/tunnel_info.json"
echo "$INFO_JSON" > "$DIR/frontend/dist/tunnel_info.json"

# 8. Renderizar panel terminal y Código QR
echo ""
echo -e "\033[1;32m====================================================================\033[0m"
echo -e "\033[1;32m ✅ PIDE ACTIVO EN LA RED CON TÚNEL CLOUDFLARE (\$0 USD)             \033[0m"
echo -e "\033[1;32m====================================================================\033[0m"
echo -e " ⚡ \033[1;33mOPCIÓN A (Red Wi-Fi USS / Aula - Red Local):\033[0m"
echo -e "    \033[1;37;42m $LOCAL_URL \033[0m"
echo -e "    \033[0;32m↳ Si las laptops y smartphones están en la misma red Wi-Fi USS\033[0m"
echo ""
echo -e " 🌐 \033[1;36mOPCIÓN B (Túnel Cloudflare HTTPS - Alumnos 4G/5G o Remoto):\033[0m"
echo -e "    \033[1;37;44m $TUNNEL_URL \033[0m"
echo -e "    \033[0;36m↳ Acceso universal con cifrado SSL gratuito (HTTP/2 optimizado)\033[0m"
echo -e "\033[1;36m--------------------------------------------------------------------\033[0m"
echo -e " 📱 \033[1mCÓDIGO QR PARA ESCANEAR DESDE SMARTPHONES (Cloudflare HTTPS):\033[0m"
echo ""

if [ -x "$PYTHON_BIN" ]; then
    "$PYTHON_BIN" -c "import qrcode; qr = qrcode.QRCode(); qr.add_data('$TUNNEL_URL'); qr.print_ascii(invert=True)"
else
    echo -e "   (Abre el enlace directamente en el navegador del dispositivo)"
fi

echo ""
echo -e "\033[1;33m[Instrucciones para el Docente]\033[0m"
echo -e " 1. Proyecta esta terminal para que los alumnos escaneen el código QR."
echo -e " 2. Los alumnos accederán inmediatamente a la Tabla Periódica PIDE."
echo -e " 3. Presiona \033[1mCtrl+C\033[0m en esta terminal para finalizar el túnel."
echo ""

wait "$TUNNEL_PID"
