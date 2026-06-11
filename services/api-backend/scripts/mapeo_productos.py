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

# 1. Cargar el mapa de relaciones para saber qué IDs de producto necesitamos realmente
try:
    with open("productos_categorias.json", "r", encoding="utf-8") as f:
        mappings = json.load(f)
    # Extraer IDs únicos utilizando un conjunto (set) para búsquedas rápidas de O(1)
    target_ids = set(
        item["id_producto"] for item in mappings if item.get("id_producto")
    )
    print(f"Cargados {len(target_ids)} IDs de productos únicos que coinciden con las categorías.")
except FileNotFoundError:
    print("Error: Asegúrate de que 'productos_categorias.json' esté en esta carpeta.")
    exit()

# 2. Cargar el archivo masivo que contiene todos los productos (aprox. 6.908 productos)
try:
    with open("bulkProductos.json", "r", encoding="utf-8") as f:
        bulk_data = json.load(f)
    all_products = bulk_data.get("_embedded", {}).get("productosFarmacos", [])
    print(f"Cargados {len(all_products)} productos globales del archivo masivo (bulk).")
except FileNotFoundError:
    print("Error: Asegúrate de que 'bulkProductos.json' esté en esta carpeta.")
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
output_file = "productos.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(filtered_catalog, f, indent=2, ensure_ascii=False)

print(
    f"🎉 ¡Éxito! Se extrajeron datos de {len(filtered_catalog)} productos relevantes en {output_file}"
)

