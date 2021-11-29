import {useContext} from 'react'
import type {LayerContextValue} from './LayerContext'
import {LayerContext} from './LayerContext'

const DEFAULT_LAYER_VALUE: LayerContextValue = {
  depth: 0,
  mount: () => () => undefined,
  size: 0,
}

export function useLayer(): LayerContextValue {
  const layer = useContext(LayerContext)

  return layer || DEFAULT_LAYER_VALUE
}
