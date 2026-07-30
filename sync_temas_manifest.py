"""
Sincroniza los nombres de tema en manifest.json con el campo "tema"
que ya trae cada archivo JSON individual (public/temas/.../algo.json).

Por qué: el nombre del tema vive en dos lugares (manifest.json y
dentro de cada JSON) y hoy hay que actualizarlos a mano en los dos.
Este script usa el JSON como fuente de verdad y actualiza el
manifest para que coincida.

Uso:
    python sync_temas_manifest.py

Por defecto es un "dry run": solo MUESTRA qué cambiaría, no toca
nada. Para aplicar los cambios de verdad:

    python sync_temas_manifest.py --aplicar
"""

import json
import sys
from pathlib import Path

# Ajusta estas dos rutas si tu estructura de carpetas es distinta.
MANIFEST_PATH = Path("src/data/manifest.json")
PUBLIC_DIR = Path("public")


def main():
    aplicar = "--aplicar" in sys.argv

    if not MANIFEST_PATH.is_file():
        print(f"No encuentro {MANIFEST_PATH} (¿corriste el script desde la raíz del proyecto?)")
        sys.exit(1)

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8-sig"))

    cambios = []
    archivos_faltantes = []
    json_invalidos = []

    for curso in manifest.get("cursos", []):
        for t in curso.get("temas", []):
            archivo = t.get("archivo")
            if not archivo:
                continue

            ruta = PUBLIC_DIR / archivo
            if not ruta.is_file():
                archivos_faltantes.append((curso.get("nombre"), t.get("tema"), archivo))
                continue

            try:
                contenido = json.loads(ruta.read_text(encoding="utf-8-sig"))
            except json.JSONDecodeError as e:
                json_invalidos.append((archivo, str(e)))
                continue

            tema_real = contenido.get("tema")
            if not tema_real:
                continue  # el JSON no trae su propio campo "tema", no hay con qué comparar

            if tema_real != t.get("tema"):
                cambios.append((curso.get("nombre"), archivo, t.get("tema"), tema_real))
                if aplicar:
                    t["tema"] = tema_real

    # --- Reporte ---
    print(f"Temas revisados en el manifest: {sum(len(c.get('temas', [])) for c in manifest['cursos'])}")

    if archivos_faltantes:
        print(f"\n⚠️  {len(archivos_faltantes)} archivo(s) referenciados en el manifest que no existen:")
        for curso, tema, archivo in archivos_faltantes:
            print(f"   {curso} / {tema} -> {archivo}")

    if json_invalidos:
        print(f"\n⚠️  {len(json_invalidos)} archivo(s) con JSON inválido:")
        for archivo, err in json_invalidos:
            print(f"   {archivo}: {err}")

    if not cambios:
        print("\n✓ El manifest ya coincide con el 'tema' de cada JSON. Nada que cambiar.")
        return

    print(f"\n{'Aplicando' if aplicar else 'Encontrados (dry run, nada se guardó todavía)'}: {len(cambios)} cambio(s)")
    for curso, archivo, antes, ahora in cambios:
        print(f"   [{curso}] {archivo}")
        print(f"      antes:  {antes!r}")
        print(f"      ahora:  {ahora!r}")

    if aplicar:
        MANIFEST_PATH.write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"\n✓ manifest.json actualizado ({len(cambios)} tema(s)).")
    else:
        print("\nEsto fue solo una vista previa. Corre con --aplicar para guardar los cambios.")


if __name__ == "__main__":
    main()
