# -*- coding: utf-8 -*-
"""
Versión automática de actualizar_manifest.py: queda corriendo en
segundo plano y actualiza manifest.json apenas guardás o creás un
archivo .json dentro de public/temas/ — sin que tengas que ejecutar
nada a mano cada vez.

Requiere instalar una librería una sola vez:
    pip install watchdog

Uso (parado en la raíz del proyecto, junto a package.json):
    python watch_manifest.py

Se queda corriendo hasta que cierres la terminal o hagas Ctrl+C.
Al arrancar, además, hace un primer barrido de todo public/temas/
por si ya había temas sin reflejar en el manifest.
"""

import sys
import time
from pathlib import Path

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    print("Falta instalar 'watchdog'. Corré esto una sola vez:\n")
    print("    pip install watchdog\n")
    sys.exit(1)

from actualizar_manifest import (
    actualizar_manifest,
    encontrar_archivos_json,
    MANIFEST_PATH,
    TEMAS_PATH,
)

DEBOUNCE_SEGUNDOS = 1.0  # evita procesar el mismo guardado 2-3 veces seguidas


class ManejadorTemas(FileSystemEventHandler):
    def __init__(self):
        super().__init__()
        self._ultimo_evento = {}  # ruta -> timestamp del último procesado

    def _procesar(self, ruta_str):
        if not ruta_str.endswith(".json"):
            return
        ahora = time.time()
        if ahora - self._ultimo_evento.get(ruta_str, 0) < DEBOUNCE_SEGUNDOS:
            return
        self._ultimo_evento[ruta_str] = ahora

        ruta = Path(ruta_str)
        if not ruta.exists():
            return  # se borró o es un archivo temporal del editor

        print(f"\n[detectado] {ruta}")
        try:
            actualizar_manifest([ruta], MANIFEST_PATH)
        except Exception as e:
            print(f"  [!] Error al actualizar el manifest: {e}")

    def on_created(self, event):
        if not event.is_directory:
            self._procesar(event.src_path)

    def on_modified(self, event):
        if not event.is_directory:
            self._procesar(event.src_path)


if __name__ == "__main__":
    if not TEMAS_PATH.exists():
        print(f"No existe la carpeta {TEMAS_PATH} — revisá que este script esté en la raíz del proyecto.")
        sys.exit(1)

    # Primer barrido completo al arrancar, por si hay temas sueltos.
    print("Barrido inicial de public/temas/...")
    archivos = encontrar_archivos_json([str(TEMAS_PATH)])
    if archivos:
        actualizar_manifest(archivos, MANIFEST_PATH)

    print(f"\nEscuchando cambios en {TEMAS_PATH} (Ctrl+C para detener)...")
    observer = Observer()
    observer.schedule(ManejadorTemas(), str(TEMAS_PATH), recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        print("\nDetenido.")
    observer.join()
