import React, {useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {LayerContext} from './LayerContext'

export function LayerProvider({children}: {children: React.ReactNode}) {
  const parentLayer = useContext(LayerContext)
  const [size, setSize] = useState(-1)

  const mount = useCallback(() => {
    setSize(val => val + 1)
    return () => setSize(val => val - 1)
  }, [])

  const layer = useMemo(() => {
    const depth = parentLayer ? parentLayer.depth + 1 : 0

    return {
      depth,
      mount: parentLayer?.mount || mount,
      size: parentLayer?.size || size
    }
  }, [mount, parentLayer, size])

  const mountFn = layer.mount

  useEffect(() => mountFn(), [mountFn])

  return <LayerContext.Provider value={layer}>{children}</LayerContext.Provider>
}
