import * as React from 'react'
import type {Path} from '@sanity/types'

export const DiffContext = React.createContext({path: [] as Path})
