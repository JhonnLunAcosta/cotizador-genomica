import { useCallback, useEffect, useState } from 'react'

/**
 * Ejecuta una carga de datos y expone estados de carga, error y recarga.
 * `loader` debe ser estable o no depender de valores que cambien en cada render;
 * las dependencias reales se pasan en `deps`.
 */
export function useApi(loader, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  const reload = useCallback(() => setVersion((value) => value + 1), [])

  useEffect(() => {
    let activo = true
    setLoading(true)
    setError(null)

    Promise.resolve()
      .then(loader)
      .then((resultado) => {
        if (!activo) return
        setData(resultado)
        setLoading(false)
      })
      .catch((fallo) => {
        if (!activo || fallo?.name === 'AbortError') return
        setError(fallo)
        setLoading(false)
      })

    return () => {
      activo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  return { data, loading, error, reload, setData }
}
