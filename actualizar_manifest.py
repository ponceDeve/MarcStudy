# -*- coding: utf-8 -*-

"""
Reconstruye src/data/manifest.json a partir de los archivos JSON
ubicados en public/temas/.

Uso:

    python actualizar_manifest.py
        (escanea toda la carpeta public/temas/)

    python actualizar_manifest.py public/temas/fil/fil-05.json
        (procesa un archivo puntual)

    python actualizar_manifest.py public/temas/fil/
        (procesa una carpeta puntual)

El manifest se reconstruye desde cero:
- Los temas eliminados de public/temas/ también se eliminan del manifest.
- Los temas nuevos se agregan.
- Los nombres modificados se actualizan.
- No se conservan temas que ya no existan en los archivos JSON.
"""

import json
import sys
from pathlib import Path


RAIZ_PROYECTO = Path(__file__).resolve().parent
MANIFEST_PATH = RAIZ_PROYECTO / "src" / "data" / "manifest.json"
TEMAS_PATH = RAIZ_PROYECTO / "public" / "temas"


def encontrar_archivos_json(rutas):
    archivos = []

    for ruta in rutas:
        p = Path(ruta)

        if p.is_dir():
            archivos.extend(sorted(p.rglob("*.json")))

        elif p.is_file():
            archivos.append(p)

        else:
            print(f"  [!] No existe: {p}")

    return archivos


def deducir_codigo_y_archivo_relativo(path_json: Path):
    partes = path_json.resolve().parts

    if "temas" not in partes:
        raise ValueError(
            f"'{path_json}' no está dentro de una carpeta 'temas/' "
            "— no puedo deducir el código."
        )

    idx = partes.index("temas")

    if idx + 1 >= len(partes):
        raise ValueError(
            f"'{path_json}' no contiene una carpeta de curso después de 'temas/'."
        )

    carpeta_codigo = partes[idx + 1]
    codigo = carpeta_codigo.upper()

    archivo_relativo = "/".join(partes[idx:])

    return codigo, archivo_relativo


def reconstruir_manifest(archivos_json, manifest_path: Path):
    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)

    except FileNotFoundError:
        manifest = {}

    except json.JSONDecodeError as e:
        print(f"[!] manifest.json inválido: {e}")
        sys.exit(1)

    manifest["cursos"] = []

    cursos_por_codigo = {}

    cursos_creados = 0
    temas_agregados = 0
    errores = 0

    for path_json in archivos_json:

        try:
            with open(path_json, "r", encoding="utf-8") as f:
                tema_data = json.load(f)

        except json.JSONDecodeError as e:
            print(f"  [!] JSON inválido en {path_json}: {e}")
            errores += 1
            continue

        if "curso" not in tema_data or "tema" not in tema_data:
            print(
                f"  [!] {path_json} no tiene 'curso' o 'tema' "
                "— se salta."
            )
            errores += 1
            continue

        try:
            codigo, archivo_relativo = (
                deducir_codigo_y_archivo_relativo(path_json)
            )

        except ValueError as e:
            print(f"  [!] {e}")
            errores += 1
            continue

        nombre_curso = tema_data["curso"]
        nombre_tema = tema_data["tema"]

        curso = cursos_por_codigo.get(codigo)

        if curso is None:
            curso = {
                "nombre": nombre_curso,
                "codigo": codigo,
                "temas": []
            }

            manifest["cursos"].append(curso)
            cursos_por_codigo[codigo] = curso

            cursos_creados += 1

            print(f"  + Curso: {nombre_curso} ({codigo})")

        curso["temas"].append({
            "tema": nombre_tema,
            "archivo": archivo_relativo
        })

        temas_agregados += 1

        print(f"    + {nombre_tema}")

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(
            manifest,
            f,
            ensure_ascii=False,
            indent=2
        )
        f.write("\n")

    print()
    print("========================================")
    print("Manifest reconstruido correctamente")
    print("========================================")
    print(f"Cursos:   {cursos_creados}")
    print(f"Temas:    {temas_agregados}")
    print(f"Errores:  {errores}")
    print(f"Manifest: {manifest_path}")
    print("========================================")


if __name__ == "__main__":

    if len(sys.argv) < 2:
        print(
            f"Sin archivos indicados — reconstruyendo TODO desde: "
            f"{TEMAS_PATH}"
        )
        rutas = [str(TEMAS_PATH)]

    else:
        rutas = sys.argv[1:]

    archivos = encontrar_archivos_json(rutas)

    if not archivos:
        print("No se encontraron archivos .json.")
        sys.exit(1)

    reconstruir_manifest(
        archivos,
        MANIFEST_PATH
    )