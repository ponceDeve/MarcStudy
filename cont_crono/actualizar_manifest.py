# -*- coding: utf-8 -*-
"""
Actualiza src/data/manifest.json a partir de uno o varios archivos
de tema (los mismos JSON generados con el prompt inicial, que traen
las llaves "curso" y "tema" al principio).

Uso:
    python actualizar_manifest.py
        (sin argumentos: escanea TODA la carpeta public/temas/)
    python actualizar_manifest.py public/temas/fil/fil-05.json
        (un archivo puntual)
    python actualizar_manifest.py public/temas/fil/
        (una carpeta puntual)

Reglas para deducir datos del tema:
    - El "código" del curso se toma del NOMBRE DE LA CARPETA donde
      está el archivo (ej. temas/fil/fil-05.json -> código "FIL").
    - La ruta "archivo" que se guarda en el manifest es relativa a
      "public/" (ej. "temas/fil/fil-05.json"), tal como ya se usa
      en el resto del manifest.
    - Si el curso (por código) todavía no existe en el manifest, se
      crea uno nuevo usando el campo "curso" del JSON como "nombre".
    - Si el tema (por "archivo") ya existía, se actualiza su nombre
      por si lo cambiaste; si no existía, se agrega al final de la
      lista de temas de ese curso.

No borra ni reordena nada que ya esté — solo agrega o actualiza.
"""

import json
import sys
from pathlib import Path

RAIZ_PROYECTO = Path(__file__).resolve().parent  # ajustar si hace falta
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
    """Devuelve (codigo, archivo_relativo_a_public) a partir de la ruta del archivo."""
    partes = path_json.resolve().parts
    if "temas" not in partes:
        raise ValueError(f"'{path_json}' no está dentro de una carpeta 'temas/' — no puedo deducir el código.")
    idx = partes.index("temas")
    carpeta_codigo = partes[idx + 1]  # ej. "fil"
    codigo = carpeta_codigo.upper()
    archivo_relativo = "/".join(partes[idx:])  # ej. "temas/fil/fil-05.json"
    return codigo, archivo_relativo


def actualizar_manifest(archivos_json, manifest_path: Path):
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    cursos_por_codigo = {c["codigo"]: c for c in manifest["cursos"]}

    agregados, actualizados, sin_cambios = 0, 0, 0

    for path_json in archivos_json:
        try:
            with open(path_json, "r", encoding="utf-8") as f:
                tema_data = json.load(f)
        except json.JSONDecodeError as e:
            print(f"  [!] JSON inválido en {path_json}: {e}")
            continue

        if "curso" not in tema_data or "tema" not in tema_data:
            print(f"  [!] {path_json} no tiene 'curso' o 'tema' — se salta.")
            continue

        codigo, archivo_relativo = deducir_codigo_y_archivo_relativo(path_json)
        nombre_curso = tema_data["curso"]
        nombre_tema = tema_data["tema"]

        curso = cursos_por_codigo.get(codigo)
        if curso is None:
            curso = {"nombre": nombre_curso, "codigo": codigo, "temas": []}
            manifest["cursos"].append(curso)
            cursos_por_codigo[codigo] = curso
            print(f"  + Curso nuevo: {nombre_curso} ({codigo})")

        existente = next((t for t in curso["temas"] if t["archivo"] == archivo_relativo), None)
        if existente is None:
            curso["temas"].append({"tema": nombre_tema, "archivo": archivo_relativo})
            agregados += 1
            print(f"  + Agregado: [{codigo}] {nombre_tema}")
        elif existente["tema"] != nombre_tema:
            existente["tema"] = nombre_tema
            actualizados += 1
            print(f"  ~ Actualizado nombre: [{codigo}] {nombre_tema}")
        else:
            sin_cambios += 1

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"\nListo. Agregados: {agregados} | Actualizados: {actualizados} | Sin cambios: {sin_cambios}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        # Sin argumentos: escanea toda la carpeta public/temas/
        print(f"Sin archivo indicado — escaneando toda la carpeta: {TEMAS_PATH}")
        rutas = [str(TEMAS_PATH)]
    else:
        rutas = sys.argv[1:]

    archivos = encontrar_archivos_json(rutas)
    if not archivos:
        print("No se encontraron archivos .json en las rutas dadas.")
        sys.exit(1)

    actualizar_manifest(archivos, MANIFEST_PATH)