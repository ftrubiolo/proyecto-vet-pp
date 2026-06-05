import sys
import os
import csv
import re

# Intenta importar pdfplumber. Si no está, avisa al usuario cómo instalarlo.
try:
    # pyrefly: ignore [missing-import]
    import pdfplumber
except ImportError:
    print("\n[ERROR] La librería 'pdfplumber' no está instalada.")
    print("Por favor, instálala ejecutando: pip install pdfplumber\n")
    sys.exit(1)

def clean_text(text):
    if not text:
        return ""
    return text.strip().replace("\n", " ")

def parse_dni_and_category(text):
    """
    Parsea una cadena como "21.761.993 ACTIVO A" para extraer:
    - DNI: "21.761.993"
    - Categoría: "A"
    """
    if not text:
        return "", "A"

    # Limpiar espacios extras
    clean_str = " ".join(text.split())

    # Expresión regular para buscar el DNI (números con o sin puntos)
    dni_match = re.search(r'(\d[\d\.]*)', clean_str)
    dni = dni_match.group(1) if dni_match else ""

    # Expresión regular para buscar la condición (ACTIVO/INACTIVO) y la categoría (Letra A-Z)
    status_match = re.search(r'(ACTIVO|INACTIVO|ACTIVA|INACTIVA)\s+([A-Z])', clean_str, re.IGNORECASE)
    
    categoria = "A" # Valor por defecto

    if status_match:
        categoria = status_match.group(2).upper()
    else:
        # Fallback simple por si no coincide la regex: buscar la última letra de la línea
        words = clean_str.split()
        if words:
            last_word = words[-1]
            if len(last_word) == 1 and last_word.isalpha():
                categoria = last_word.upper()

    return dni, categoria

def main():
    if len(sys.argv) < 2:
        print("\nUso: python extract_vets.py <ruta_al_pdf> [ruta_de_salida_csv]")
        print("Ejemplo: python extract_vets.py veterinarios.pdf veterinarios.csv\n")
        sys.exit(1)

    pdf_path = sys.argv[1]
    csv_path = sys.argv[2] if len(sys.argv) > 2 else "veterinarios_limpios.csv"

    if not os.path.exists(pdf_path):
        print(f"\n[ERROR] El archivo PDF no existe en la ruta: {pdf_path}\n")
        sys.exit(1)

    print(f"Abriendo PDF: {pdf_path}...")
    
    registros = []
    
    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        print(f"Total de páginas a procesar: {total_pages}")
        
        for index, page in enumerate(pdf.pages):
            # Extraemos las tablas de la página
            tables = page.extract_tables()
            
            if tables:
                for table in tables:
                    for row in table:
                        # Filtrar filas vacías o encabezados
                        if not row or len(row) < 3:
                            continue
                        
                        nombre = clean_text(row[0])
                        matricula = clean_text(row[1])
                        dni_raw = clean_text(row[2])

                        # Evitar encabezados de columna del PDF (ej: "PROFESIONAL", "D.N.I.")
                        if "APELLIDO" in nombre.upper() or "MATR" in matricula.upper() or "D.N.I" in dni_raw.upper() or not matricula.isdigit():
                            continue
                        
                        dni, categoria = parse_dni_and_category(dni_raw)

                        registros.append({
                            'nombre_completo': nombre,
                            'numero_matricula': matricula,
                            'dni': dni,
                            'categoria_id': categoria
                        })
            else:
                # Fallback: Si no detecta tablas, parseamos el texto por línea
                text = page.extract_text()
                if not text:
                    continue
                
                # Buscar patrones en el texto crudo
                lines = text.split("\n")
                for line in lines:
                    # Buscamos un nombre seguido de número de matrícula y luego DNI con estado
                    # Ejemplo: "ABAD, VERONICA ROSANA  1592  21.761.993 ACTIVO A"
                    match = re.search(r'^([A-Z\s,]+)\s+(\d+)\s+([\d\.\sA-Z]+)$', line)
                    if match:
                        nombre = clean_text(match.group(1))
                        matricula = clean_text(match.group(2))
                        dni_raw = clean_text(match.group(3))

                        # Evitar encabezados
                        if "PAGINA" in nombre.upper() or "COLEGIO" in nombre.upper():
                            continue

                        dni, categoria = parse_dni_and_category(dni_raw)
                        registros.append({
                            'nombre_completo': nombre,
                            'numero_matricula': matricula,
                            'dni': dni,
                            'categoria_id': categoria
                        })

            if (index + 1) % 10 == 0 or (index + 1) == total_pages:
                print(f"Procesadas {index + 1}/{total_pages} páginas...")

    json_path = csv_path.replace(".csv", ".json") if csv_path.endswith(".csv") else csv_path
    if not json_path.endswith(".json"):
        json_path += ".json"

    print(f"\nExtracción finalizada. Se encontraron {len(registros)} registros.")
    
    # Escribir a JSON
    print(f"Guardando resultados en: {json_path}...")
    import json
    with open(json_path, mode='w', encoding='utf-8') as f:
        json.dump(registros, f, indent=2, ensure_ascii=False)

    print("¡Listo! El archivo JSON ha sido generado con éxito.\n")

if __name__ == "__main__":
    main()
