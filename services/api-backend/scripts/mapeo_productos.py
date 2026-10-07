import json

# ==============================================================================
# Script de filtrado y mapeo final de productos veterinarios.
# 
# Propósito:
#   Filtra el catálogo global completo de productos veterinarios ('bulkProductos.json')
#   utilizando el mapa de relaciones previamente obtenido ('productos_categorias.json').
#   Genera un archivo optimizado ('productos.json') que contiene únicamente
#   los productos relevantes con información básica.
# 
# Requisitos:
#   - Contar con 'productos_categorias.json' y 'bulkProductos.json' en la misma carpeta.
# 
# Uso:
#   python3 mapeo_productos.py
# ==============================================================================

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data"))

def resolve_data_path(filename: str) -> str:
    path_in_data = os.path.join(DATA_DIR, filename)
    if os.path.exists(path_in_data):
        return path_in_data
    if os.path.exists(filename):
        return filename
    return path_in_data

# 1. Cargar el mapa de relaciones para saber qué IDs de producto necesitamos realmente
rel_file = resolve_data_path("productos_categorias.json")
try:
    with open(rel_file, "r", encoding="utf-8") as f:
        mappings = json.load(f)
    # Extraer IDs únicos utilizando un conjunto (set) para búsquedas rápidas de O(1)
    target_ids = set(
        item["id_producto"] for item in mappings if item.get("id_producto")
    )
    print(f"Cargados {len(target_ids)} IDs de productos únicos que coinciden con las categorías desde {rel_file}.")
except FileNotFoundError:
    print(f"Error: No se encontró 'productos_categorias.json' en {rel_file} ni en el directorio actual.")
    exit()

# 2. Cargar el archivo masivo que contiene todos los productos (aprox. 6.908 productos)
bulk_file = resolve_data_path("bulkProductos.json")
try:
    with open(bulk_file, "r", encoding="utf-8") as f:
        bulk_data = json.load(f)
    all_products = bulk_data.get("_embedded", {}).get("productosFarmacos", [])
    print(f"Cargados {len(all_products)} productos globales del archivo masivo desde {bulk_file}.")
except FileNotFoundError:
    print(f"Error: No se encontró 'bulkProductos.json' en {bulk_file} ni en el directorio actual.")
    exit()

# 3. Filtrar la lista global localmente usando los IDs objetivo
filtered_catalog = []

for p in all_products:
    prod_id = p.get("id")

    # Si este producto coincide con uno de los IDs de nuestro mapeo de categorías
    if prod_id in target_ids:
        filtered_catalog.append(
            {
                "id": prod_id,
                "numero_senasa": p.get("numeroInscripcion"),
                "nombre_comercial": p.get("nombreComercial"),
                "nombre_firma": p.get("nombreFirma"),
            }
        )

# 4. Guardar el resultado final limpio y optimizado
output_file = os.path.join(DATA_DIR, "productos.json")
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(filtered_catalog, f, indent=2, ensure_ascii=False)

print(
    f"🎉 ¡Éxito! Se extrajeron datos de {len(filtered_catalog)} productos relevantes en {output_file}"
)

