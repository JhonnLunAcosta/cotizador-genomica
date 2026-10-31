-- =====================================================================
-- V5: imágenes ilustrativas del catálogo
--
-- Los archivos viven en:
--   api/src/main/resources/static/media/productos/<sku>.svg
-- y se sirven desde el backend como:
--   /media/productos/<sku>.svg
--
-- Se puede reemplazar cualquier imagen por una foto real del producto
-- guardando el archivo con el mismo nombre o apuntando `imagen_url` a
-- una URL externa (https://...).
-- =====================================================================

UPDATE productos
   SET imagen_url = CONCAT('/media/productos/', LOWER(sku), '.svg')
 WHERE imagen_url IS NULL OR imagen_url = '';
