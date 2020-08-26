import {createContext} from 'react'
import {DeskToolFeatures} from './types'

export const DeskToolFeaturesContext = createContext<DeskToolFeatures>({
  reviewChanges: false,
  splitViews: false
})
