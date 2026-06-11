import json
import requests

# ==============================================================================
# Script de consulta y recopilación de productos asociados a categorías de SENASA.
# 
# Propósito:
#   Consulta la API pública de SENASA para buscar productos farmacológicos
#   asociados a cada una de las categorías (indicaciones o enfermedades)
#   cargadas desde 'categorias.json'. Recopila y genera un archivo de
#   salida ('productos_categorias.json') con las relaciones producto-enfermedad.
# 
# Requisitos:
#   - requests (Instalación: `pip install requests`)
#   - Archivo 'categorias.json' en el directorio de ejecución.
# 
# Uso:
#   python3 scrap_relacion_productos.py
# ==============================================================================

BULK_URL = "https://aps2.senasa.gov.ar/adt_api/api/productosFarmacos/search/publicSearchProductoFarmacoDTO"

# --- PASO 1: Cargar IDs dinámicamente desde el archivo ---
try:
    with open("categorias.json", "r", encoding="utf-8") as f:
        categorias_data = json.load(f)

    # Extraer únicamente los números de ID. (Maneja de forma segura tanto formato de array como de objeto único)
    if isinstance(categorias_data, list):
        enfermedades_ids = [item["id"] for item in categorias_data if "id" in item]
    else:
        # Caso alternativo si es un solo objeto
        enfermedades_ids = [categorias_data.get("id")]

    print(f"Cargadas un total de {len(enfermedades_ids)} categorías desde el archivo.")

except Exception as e:
    print(f"Error al leer categorias.json: {e}")
    exit()

# --- PASO 2: Limitar la lista para una ejecución de prueba segura ---
# Cambiar [:1] a [:5] más adelante si deseas probar más, o eliminarlo por completo para producción
# enfermedades_ids = enfermedades_ids[:1]
# print(f"⚠️ MODO DE PRUEBA ACTIVO: Consultando solo el primer ID de categoría: {enfermedades_ids}")

all_relationships = []

# --- PASO 3: Ejecutar el bucle optimizado ---
for cat_id in enfermedades_ids:
    if cat_id is None:
        continue

    page = 0
    while True:
        params = {
            "page": page,
            "size": 100,
            "idIndicaciones": cat_id,
        }

        print(f"Consultando Categoría {cat_id}, Página {page}...")
        response = requests.get(BULK_URL, params=params)

        if response.status_code != 200:
            print(f"Finalizado o error en la página {page}")
            break

        data = response.json()
        products = data.get("_embedded", {}).get("productosFarmacos", [])

        if not products:
            print(f"No se encontraron productos para la Categoría {cat_id} en esta página.")
            break

        for p in products:
            all_relationships.append(
                {"id_producto": p.get("id"), "id_enfermedad": cat_id}
            )

        print(
            f"Se obtuvieron exitosamente {len(products)} relaciones de productos en esta página."
        )
        break 

    print(f"Finalizada la prueba de la Categoría ID: {cat_id}")

# --- PASO 4: Inspeccionar los resultados de la prueba ---
print("\n--- RESUMEN DE PRUEBA ---")
print(json.dumps(all_relationships, indent=2))

with open("productos_categorias.json", "w") as f:
    json.dump(all_relationships, f, indent=2)
