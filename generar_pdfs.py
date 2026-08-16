import json
import re
from pathlib import Path
from io import BytesIO

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image,
    KeepTogether,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


# ============================================================
# RUTAS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

INPUT_DIR = BASE_DIR / "public" / "temas"

OUTPUT_DIR = BASE_DIR / "public" / "PDFs"


# ============================================================
# COLORES
# ============================================================

COLOR_PRIMARY = HexColor("#4f7259")
COLOR_SECONDARY = HexColor("#4d6f8c")
COLOR_ACCENT = HexColor("#b06a4d")

COLOR_BG = HexColor("#f4f4f4")
COLOR_SURFACE = HexColor("#e9e9e9")

COLOR_TEXT = HexColor("#1c1c1c")
COLOR_TEXT_SOFT = HexColor("#4a4a4a")

COLOR_BORDER = HexColor("#dcdcdc")

COLOR_EXPLANATION_BG = HexColor("#e0e8e1")


# ============================================================
# PÁGINA
# ============================================================

PAGE_WIDTH, PAGE_HEIGHT = A4

MARGIN_LEFT = 18 * mm
MARGIN_RIGHT = 18 * mm
MARGIN_TOP = 18 * mm
MARGIN_BOTTOM = 18 * mm


# ============================================================
# FUENTES
# ============================================================

def registrar_fuentes():

    posibles = [
        (
            "Lato",
            r"C:\Windows\Fonts\Lato-Regular.ttf",
            r"C:\Windows\Fonts\Lato-Bold.ttf",
        ),
        (
            "Raleway",
            r"C:\Windows\Fonts\Raleway-Regular.ttf",
            r"C:\Windows\Fonts\Raleway-Bold.ttf",
        ),
    ]

    fuentes_registradas = set()

    for nombre, regular, bold in posibles:

        regular_path = Path(regular)
        bold_path = Path(bold)

        if regular_path.exists():

            try:
                pdfmetrics.registerFont(
                    TTFont(
                        nombre,
                        str(regular_path)
                    )
                )

                fuentes_registradas.add(nombre)

            except Exception:
                pass

        if bold_path.exists():

            try:
                pdfmetrics.registerFont(
                    TTFont(
                        nombre + "-Bold",
                        str(bold_path)
                    )
                )

                fuentes_registradas.add(
                    nombre + "-Bold"
                )

            except Exception:
                pass

    return fuentes_registradas


FUENTES = registrar_fuentes()


FONT_BODY = (
    "Lato"
    if "Lato" in FUENTES
    else "Helvetica"
)

FONT_BODY_BOLD = (
    "Lato-Bold"
    if "Lato-Bold" in FUENTES
    else "Helvetica-Bold"
)

FONT_DISPLAY = (
    "Raleway"
    if "Raleway" in FUENTES
    else FONT_BODY
)

FONT_DISPLAY_BOLD = (
    "Raleway-Bold"
    if "Raleway-Bold" in FUENTES
    else FONT_BODY_BOLD
)


# ============================================================
# ESTILOS
# ============================================================

styles = getSampleStyleSheet()


STYLE_TEMA = ParagraphStyle(
    "TemaPrincipal",
    parent=styles["Title"],
    fontName=FONT_DISPLAY_BOLD,
    fontSize=22,
    leading=27,
    textColor=COLOR_PRIMARY,
    alignment=TA_LEFT,
    spaceAfter=8 * mm,
)


STYLE_CURSO = ParagraphStyle(
    "Curso",
    parent=styles["Normal"],
    fontName=FONT_BODY_BOLD,
    fontSize=9,
    leading=11,
    textColor=COLOR_SECONDARY,
    spaceAfter=2 * mm,
)


STYLE_TITULO = ParagraphStyle(
    "TituloSeccion",
    parent=styles["Heading2"],
    fontName=FONT_DISPLAY_BOLD,
    fontSize=14,
    leading=18,
    textColor=COLOR_SECONDARY,
    spaceBefore=5 * mm,
    spaceAfter=4 * mm,
)


STYLE_TEXTO = ParagraphStyle(
    "TextoPrincipal",
    parent=styles["Normal"],
    fontName=FONT_BODY_BOLD,
    fontSize=12.5,
    leading=18,
    textColor=COLOR_TEXT,
    spaceAfter=3 * mm,
)


STYLE_EXPLICACION = ParagraphStyle(
    "Explicacion",
    parent=styles["Normal"],
    fontName=FONT_BODY,
    fontSize=10.2,
    leading=15,
    textColor=COLOR_TEXT_SOFT,
)


STYLE_ETIQUETA_EXPLICACION = ParagraphStyle(
    "EtiquetaExplicacion",
    parent=styles["Normal"],
    fontName=FONT_BODY_BOLD,
    fontSize=8.5,
    leading=10,
    textColor=COLOR_PRIMARY,
    spaceAfter=1.5 * mm,
)


STYLE_META = ParagraphStyle(
    "Meta",
    parent=styles["Normal"],
    fontName=FONT_BODY,
    fontSize=8,
    leading=10,
    textColor=HexColor("#767676"),
)


STYLE_FOOTER = ParagraphStyle(
    "Footer",
    parent=styles["Normal"],
    fontName=FONT_BODY,
    fontSize=7.5,
    textColor=HexColor("#767676"),
    alignment=TA_CENTER,
)


# ============================================================
# ESCAPAR HTML
# ============================================================

def escapar_html(texto):

    if texto is None:
        return ""

    texto = str(texto)

    texto = texto.replace(
        "&",
        "&amp;"
    )

    texto = texto.replace(
        "<",
        "&lt;"
    )

    texto = texto.replace(
        ">",
        "&gt;"
    )

    return texto


# ============================================================
# MARKDOWN BÁSICO
# ============================================================

def convertir_markdown_basico(texto):

    texto = escapar_html(texto)

    texto = re.sub(
        r"\*\*(.+?)\*\*",
        r"<b>\1</b>",
        texto
    )

    texto = re.sub(
        r"(?<!\*)\*([^*]+?)\*(?!\*)",
        r"<i>\1</i>",
        texto
    )

    return texto


# ============================================================
# LATEX
# ============================================================

LATEX_PATTERN = re.compile(
    r"\$(.+?)\$",
    re.DOTALL
)


def contiene_latex(texto):

    if not texto:
        return False

    return bool(
        LATEX_PATTERN.search(
            str(texto)
        )
    )


# ============================================================
# RENDERIZAR LATEX
# ============================================================

def renderizar_latex(
    latex,
    dpi=180
):

    latex = str(latex).strip()

    if not latex:
        return None

    try:

        formula = f"${latex}$"

        fig = plt.figure(
            figsize=(0.01, 0.01),
            dpi=dpi
        )

        fig.patch.set_alpha(0)

        ax = fig.add_axes(
            [0, 0, 1, 1]
        )

        ax.axis("off")

        ax.text(
            0,
            0,
            formula,
            fontsize=13,
            color="#4d6f8c",
            verticalalignment="bottom",
            horizontalalignment="left",
        )

        buffer = BytesIO()

        plt.savefig(
            buffer,
            format="png",
            dpi=dpi,
            transparent=True,
            bbox_inches="tight",
            pad_inches=0.03,
        )

        plt.close(fig)

        buffer.seek(0)

        return buffer

    except Exception as error:

        print(
            f"      ⚠ Error renderizando LaTeX: {latex}"
        )

        print(
            f"        {error}"
        )

        try:
            plt.close("all")
        except Exception:
            pass

        return None


# ============================================================
# TEXTO → FLOWABLES
# ============================================================

def texto_a_flowables(
    texto,
    estilo
):

    if texto is None:
        return []

    texto = str(texto)

    coincidencias = list(
        LATEX_PATTERN.finditer(
            texto
        )
    )

    if not coincidencias:

        contenido = convertir_markdown_basico(
            texto
        )

        if not contenido.strip():
            return []

        return [
            Paragraph(
                contenido,
                estilo
            )
        ]

    elementos = []

    posicion_actual = 0

    for coincidencia in coincidencias:

        inicio = coincidencia.start()
        fin = coincidencia.end()

        texto_normal = texto[
            posicion_actual:inicio
        ]

        if texto_normal.strip():

            contenido = convertir_markdown_basico(
                texto_normal
            )

            elementos.append(
                Paragraph(
                    contenido,
                    estilo
                )
            )

        latex = coincidencia.group(1)

        imagen_buffer = renderizar_latex(
            latex
        )

        if imagen_buffer is not None:

            try:

                imagen = Image(
                    imagen_buffer
                )

                imagen.drawHeight = 7.5 * mm
                imagen.drawWidth = 45 * mm

                max_width = PAGE_WIDTH - (
                    MARGIN_LEFT +
                    MARGIN_RIGHT
                )

                if imagen.drawWidth > max_width:

                    proporcion = (
                        max_width /
                        imagen.drawWidth
                    )

                    imagen.drawWidth = max_width

                    imagen.drawHeight *= proporcion

                elementos.append(
                    imagen
                )

                elementos.append(
                    Spacer(
                        1,
                        1.5 * mm
                    )
                )

            except Exception:

                elementos.append(
                    Paragraph(
                        convertir_markdown_basico(
                            latex
                        ),
                        estilo
                    )
                )

        else:

            elementos.append(
                Paragraph(
                    convertir_markdown_basico(
                        latex
                    ),
                    estilo
                )
            )

        posicion_actual = fin

    texto_final = texto[
        posicion_actual:
    ]

    if texto_final.strip():

        contenido = convertir_markdown_basico(
            texto_final
        )

        elementos.append(
            Paragraph(
                contenido,
                estilo
            )
        )

    return elementos


# ============================================================
# NOMBRE SEGURO
# ============================================================

def nombre_seguro(nombre):

    if not nombre:
        return "Sin_nombre"

    nombre = str(
        nombre
    ).strip()

    nombre = re.sub(
        r'[<>:"/\\|?*]',
        "",
        nombre
    )

    nombre = nombre.rstrip(
        ". "
    )

    if not nombre:
        nombre = "Sin_nombre"

    return nombre[:150]


# ============================================================
# VALIDAR JSON
# ============================================================

def validar_json(
    data,
    ruta
):

    if not isinstance(
        data,
        dict
    ):

        print(
            f"  ⚠ Ignorado: {ruta.name} no contiene un objeto JSON."
        )

        return False

    curso = data.get(
        "curso"
    )

    tema = data.get(
        "tema"
    )

    theory = data.get(
        "theory"
    )

    if not curso:

        print(
            f"  ⚠ Ignorado: {ruta.name} no tiene 'curso'."
        )

        return False

    if not tema:

        print(
            f"  ⚠ Ignorado: {ruta.name} no tiene 'tema'."
        )

        return False

    if not isinstance(
        theory,
        list
    ):

        print(
            f"  ⚠ Ignorado: {ruta.name} no tiene 'theory' válido."
        )

        return False

    if len(theory) == 0:

        print(
            f"  ⚠ Ignorado: {ruta.name} tiene 'theory' vacío."
        )

        return False

    cantidad_puntos = 0

    for bloque in theory:

        if not isinstance(
            bloque,
            dict
        ):
            continue

        puntos = bloque.get(
            "puntos",
            []
        )

        if not isinstance(
            puntos,
            list
        ):
            continue

        for punto in puntos:

            if not isinstance(
                punto,
                dict
            ):
                continue

            texto = punto.get(
                "texto"
            )

            if texto and str(texto).strip():

                cantidad_puntos += 1

    if cantidad_puntos == 0:

        print(
            f"  ⚠ Ignorado: {ruta.name} no contiene puntos con texto."
        )

        return False

    return True


# ============================================================
# FONDO DEL PDF
# ============================================================

def dibujar_fondo(
    canvas,
    doc
):

    canvas.saveState()

    canvas.setFillColor(
        COLOR_BG
    )

    canvas.rect(
        0,
        0,
        PAGE_WIDTH,
        PAGE_HEIGHT,
        fill=1,
        stroke=0,
    )

    canvas.setFillColor(
        COLOR_PRIMARY
    )

    canvas.rect(
        0,
        PAGE_HEIGHT - 4 * mm,
        PAGE_WIDTH,
        4 * mm,
        fill=1,
        stroke=0,
    )

    canvas.setFillColor(
        HexColor("#767676")
    )

    canvas.setFont(
        FONT_BODY,
        7.5
    )

    canvas.drawCentredString(
        PAGE_WIDTH / 2,
        8 * mm,
        f"{doc.page}"
    )

    canvas.restoreState()


# ============================================================
# CAJA DE EXPLICACIÓN
# ============================================================

def crear_caja_explicacion(
    explicacion
):

    if not explicacion:
        return None

    explicacion = str(
        explicacion
    ).strip()

    if not explicacion:
        return None

    elementos = []

    elementos.append(
        Paragraph(
            "Explicación",
            STYLE_ETIQUETA_EXPLICACION
        )
    )

    elementos.extend(
        texto_a_flowables(
            explicacion,
            STYLE_EXPLICACION
        )
    )

    tabla = Table(
        [[elementos]],
        colWidths=[
            PAGE_WIDTH -
            MARGIN_LEFT -
            MARGIN_RIGHT -
            8 * mm
        ],
    )

    tabla.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, -1),
                    COLOR_EXPLANATION_BG,
                ),

                (
                    "BOX",
                    (0, 0),
                    (-1, -1),
                    0.6,
                    COLOR_BORDER,
                ),

                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    5 * mm,
                ),

                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    5 * mm,
                ),

                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    3.5 * mm,
                ),

                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    3.5 * mm,
                ),
            ]
        )
    )

    return tabla


# ============================================================
# CREAR PDF
# ============================================================

def crear_pdf(
    data,
    ruta_json,
    ruta_pdf
):

    curso = str(
        data.get(
            "curso",
            "Sin curso"
        )
    ).strip()

    tema = str(
        data.get(
            "tema",
            "Sin tema"
        )
    ).strip()

    theory = data.get(
        "theory",
        []
    )

    doc = SimpleDocTemplate(
        str(ruta_pdf),
        pagesize=A4,

        rightMargin=MARGIN_RIGHT,
        leftMargin=MARGIN_LEFT,

        topMargin=MARGIN_TOP,
        bottomMargin=MARGIN_BOTTOM,

        title=tema,
        author="Mi Estudio",
        subject=curso,
    )

    story = []

    # --------------------------------------------------------
    # CURSO
    # --------------------------------------------------------

    story.append(
        Paragraph(
            escapar_html(
                curso
            ).upper(),
            STYLE_CURSO
        )
    )

    # --------------------------------------------------------
    # TEMA
    # --------------------------------------------------------

    story.append(
        Paragraph(
            convertir_markdown_basico(
                tema
            ),
            STYLE_TEMA
        )
    )

    # --------------------------------------------------------
    # LÍNEA
    # --------------------------------------------------------

    story.append(
        HRFlowable(
            width="100%",
            thickness=1,
            color=COLOR_PRIMARY,
            spaceBefore=0,
            spaceAfter=5 * mm,
        )
    )

    # --------------------------------------------------------
    # TEORÍA
    # --------------------------------------------------------

    for bloque in theory:

        if not isinstance(
            bloque,
            dict
        ):
            continue

        titulo = bloque.get(
            "titulo",
            ""
        )

        puntos = bloque.get(
            "puntos",
            []
        )

        if titulo:

            story.append(
                Paragraph(
                    convertir_markdown_basico(
                        str(titulo)
                    ),
                    STYLE_TITULO
                )
            )

        if not isinstance(
            puntos,
            list
        ):
            continue

        for punto in puntos:

            if not isinstance(
                punto,
                dict
            ):
                continue

            texto = punto.get(
                "texto",
                ""
            )

            explicacion = punto.get(
                "explicacion",
                ""
            )

            if (
                not texto
                or not str(texto).strip()
            ):
                continue

            bloque_elementos = []

            # ------------------------------------------------
            # TEXTO
            # ------------------------------------------------

            bloque_elementos.extend(
                texto_a_flowables(
                    str(texto).strip(),
                    STYLE_TEXTO
                )
            )

            # ------------------------------------------------
            # EXPLICACIÓN
            # ------------------------------------------------

            caja = crear_caja_explicacion(
                explicacion
            )

            if caja is not None:

                bloque_elementos.append(
                    Spacer(
                        1,
                        1 * mm
                    )
                )

                bloque_elementos.append(
                    caja
                )

            # ------------------------------------------------
            # ESPACIO ENTRE PUNTOS
            # ------------------------------------------------

            bloque_elementos.append(
                Spacer(
                    1,
                    4 * mm
                )
            )

            story.append(
                KeepTogether(
                    bloque_elementos
                )
            )

    # --------------------------------------------------------
    # CONSTRUIR PDF
    # --------------------------------------------------------

    doc.build(
        story,
        onFirstPage=dibujar_fondo,
        onLaterPages=dibujar_fondo,
    )


# ============================================================
# PROCESAR JSON
# ============================================================

def procesar_json(
    ruta_json
):

    print(
        f"\n📄 {ruta_json.relative_to(BASE_DIR)}"
    )

    # ========================================================
    # LEER JSON
    # ========================================================

    try:

        with open(
            ruta_json,
            "r",
            encoding="utf-8-sig"
        ) as archivo:

            data = json.load(
                archivo
            )

    except json.JSONDecodeError as error:

        print(
            f"  ❌ JSON inválido: {error}"
        )

        return False

    except Exception as error:

        print(
            f"  ❌ No se pudo leer: {error}"
        )

        return False

    # ========================================================
    # VALIDAR
    # ========================================================

    if not validar_json(
        data,
        ruta_json
    ):

        return False

    # ========================================================
    # NOMBRE COMPLETO DEL CURSO
    #
    # Este nombre SOLO se utiliza dentro del PDF.
    #
    # Ejemplo:
    #
    # "curso": "Educación Cívica"
    #
    # El PDF mostrará:
    #
    # EDUCACIÓN CÍVICA
    # ========================================================

    curso = str(
        data.get(
            "curso",
            "Sin curso"
        )
    ).strip()

    # ========================================================
    # OBTENER CÓDIGO DE LA CARPETA ORIGINAL
    #
    # Si el JSON está en:
    #
    # public/temas/civ/civ-01.json
    #
    # ruta_json.parent.name devuelve:
    #
    # civ
    #
    # Si está en:
    #
    # public/temas/alg/alg-01.json
    #
    # devuelve:
    #
    # alg
    # ========================================================

    codigo_curso = ruta_json.parent.name

    # ========================================================
    # SEGURIDAD
    #
    # Si por alguna razón el JSON está directamente dentro de
    # public/temas/, no queremos crear una carpeta llamada
    # "temas".
    # ========================================================

    if (
        not codigo_curso
        or codigo_curso.lower() == "temas"
    ):

        codigo_curso = "otros"

    codigo_curso = nombre_seguro(
        codigo_curso
    )

    # ========================================================
    # NOMBRE DEL PDF
    # ========================================================

    nombre_pdf = (
        ruta_json.stem +
        ".pdf"
    )

    # ========================================================
    # CARPETA DEL CURSO
    #
    # IMPORTANTE:
    #
    # AQUÍ YA NO SE USA "curso".
    #
    # Se usa el nombre de la carpeta original:
    #
    # civ
    # alg
    # psi
    # len
    # etc.
    # ========================================================

    carpeta_curso = (
        OUTPUT_DIR /
        codigo_curso
    )

    carpeta_curso.mkdir(
        parents=True,
        exist_ok=True
    )

    # ========================================================
    # RUTA FINAL
    # ========================================================

    ruta_pdf = (
        carpeta_curso /
        nombre_pdf
    )

    # ========================================================
    # CREAR PDF
    # ========================================================

    try:

        crear_pdf(
            data,
            ruta_json,
            ruta_pdf
        )

        print(
            f"  📚 Curso: {curso}"
        )

        print(
            f"  📁 Carpeta: {codigo_curso}"
        )

        print(
            f"  ✅ Creado: "
            f"{ruta_pdf.relative_to(BASE_DIR)}"
        )

        return True

    except Exception as error:

        print(
            f"  ❌ Error generando PDF:"
        )

        print(
            f"     {error}"
        )

        return False


# ============================================================
# OBTENER TODOS LOS JSON
# ============================================================

def obtener_jsons():

    if not INPUT_DIR.exists():

        print()

        print(
            "❌ No existe la carpeta:"
        )

        print(
            f"   {INPUT_DIR}"
        )

        return []

    archivos = list(
        INPUT_DIR.rglob(
            "*.json"
        )
    )

    return sorted(
        archivos,
        key=lambda ruta: str(
            ruta
        ).lower()
    )


# ============================================================
# MAIN
# ============================================================

def main():

    print()

    print(
        "=" * 70
    )

    print(
        "        GENERADOR DE PDFs — MI ESTUDIO"
    )

    print(
        "=" * 70
    )

    print()

    # ========================================================
    # ENTRADA
    # ========================================================

    print(
        "📂 Entrada:"
    )

    print(
        f"   {INPUT_DIR}"
    )

    print()

    # ========================================================
    # SALIDA
    # ========================================================

    print(
        "📂 Salida:"
    )

    print(
        f"   {OUTPUT_DIR}"
    )

    print()

    # ========================================================
    # CREAR CARPETA PDFs
    # ========================================================

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    # ========================================================
    # BUSCAR JSON
    # ========================================================

    archivos = obtener_jsons()

    if not archivos:

        print(
            "❌ No se encontraron archivos JSON."
        )

        print()

        input(
            "Presiona ENTER para salir..."
        )

        return

    print(
        f"🔎 JSON encontrados: {len(archivos)}"
    )

    print()

    # ========================================================
    # CONTADORES
    # ========================================================

    exitosos = 0
    fallidos = 0

    # ========================================================
    # PROCESAR
    # ========================================================

    for ruta_json in archivos:

        resultado = procesar_json(
            ruta_json
        )

        if resultado:

            exitosos += 1

        else:

            fallidos += 1

    # ========================================================
    # RESULTADO
    # ========================================================

    print()

    print(
        "=" * 70
    )

    print(
        "                    TERMINADO"
    )

    print(
        "=" * 70
    )

    print()

    print(
        f"📄 Archivos JSON encontrados : {len(archivos)}"
    )

    print(
        f"✅ PDFs generados            : {exitosos}"
    )

    print(
        f"⚠️ No generados              : {fallidos}"
    )

    print()

    print(
        "📂 PDFs:"
    )

    print(
        f"   {OUTPUT_DIR}"
    )

    print()

    print(
        "Los PDFs se encuentran separados automáticamente "
        "por el código de la carpeta original del curso."
    )

    print()

    input(
        "Presiona ENTER para cerrar..."
    )


# ============================================================
# EJECUTAR
# ============================================================

if __name__ == "__main__":

    main()