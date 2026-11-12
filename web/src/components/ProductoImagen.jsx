import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'

/**
 * Miniatura de un producto del catálogo.
 *
 * Usa `imagenUrl` que entrega la API y, si el producto no tiene imagen o el
 * archivo no carga, muestra un marcador con el icono de caja para no romper
 * la maquetación.
 */
export default function ProductoImagen({ producto, className = '', size = 20, alt }) {
  const src = producto?.imagenUrl || ''
  const [fallo, setFallo] = useState(false)

  useEffect(() => {
    setFallo(false)
  }, [src])

  if (!src || fallo) {
    return (
      <span
        className={`product-img product-img-empty ${className}`.trim()}
        role="img"
        aria-label={`Sin imagen disponible para ${producto?.nombre || 'el producto'}`}
      >
        <Icon name="box" size={size} />
      </span>
    )
  }

  return (
    <img
      className={`product-img ${className}`.trim()}
      src={src}
      alt={alt || `Imagen referencial de ${producto?.nombre || 'producto'}`}
      decoding="async"
      onError={() => setFallo(true)}
    />
  )
}
