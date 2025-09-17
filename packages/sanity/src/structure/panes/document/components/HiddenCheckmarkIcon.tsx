import {CheckmarkIcon} from '@sanity/icons'
import {type ComponentType} from 'react'

export const HiddenCheckmarkIcon: ComponentType = () => (
  <CheckmarkIcon style={{visibility: 'hidden'}} />
)
