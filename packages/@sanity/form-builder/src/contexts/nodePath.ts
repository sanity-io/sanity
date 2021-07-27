import {createContext} from 'react'
import {Path} from '@sanity/types'
import {emptyArray} from '../utils/empty'

export const NodePathContext = createContext<Path>(emptyArray())
