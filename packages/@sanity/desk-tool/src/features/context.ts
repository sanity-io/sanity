import {createContext} from 'react'
import {DEFAULT_STATE} from './constants'
import {DeskToolFeatures} from './types'

export const DeskToolFeaturesContext = createContext<DeskToolFeatures>(DEFAULT_STATE)
