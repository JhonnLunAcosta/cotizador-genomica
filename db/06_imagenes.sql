-- =====================================================================
-- Imágenes ilustrativas del catálogo
--
-- Equivalente a la migración Flyway V5__imagenes_productos.sql.
-- Los archivos viven en:
--   api/src/main/resources/static/media/productos/<sku>.svg
-- y se sirven desde el backend como:
--   /media/productos/<sku>.svg
--
-- Para usar una foto real, guarda el archivo con el mismo nombre o
-- apunta `imagen_url` a una URL externa (https://...).
-- =====================================================================

UPDATE productos
   SET imagen_url = CONCAT('/media/productos/', LOWER(sku), '.svg')
 WHERE imagen_url IS NULL OR imagen_url = '';
