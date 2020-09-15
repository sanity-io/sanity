import React from 'react'
import {Path} from '@sanity/util/lib/typedefs/path'

interface ChangeIndicatorContext {
  value?: any
  compareValue?: any
  hasFocus: boolean
  path: Path
}

const initial: ChangeIndicatorContext = {hasFocus: false, path: []}

export const ChangeIndicatorContext: React.Context<ChangeIndicatorContext> = React.createContext(initial)
