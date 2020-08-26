import {useContext} from 'react'
import {DeskToolFeaturesContext} from './context'

export function useDeskToolFeatures() {
  const features = useContext(DeskToolFeaturesContext)

  if (!features) {
    throw new Error('DeskTool: missing features in context')
  }

  return features
}
