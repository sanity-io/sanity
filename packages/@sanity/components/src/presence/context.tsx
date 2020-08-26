import React from 'react'
import {FormFieldPresence} from './types'
import {EMPTY_PRESENCE} from './constants'

export const Context: React.Context<FormFieldPresence[]> = React.createContext(EMPTY_PRESENCE)
