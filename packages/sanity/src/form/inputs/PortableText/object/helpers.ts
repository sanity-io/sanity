import {ObjectSchemaType} from '@sanity/types'
import {get} from 'lodash'
import {ModalType, ModalWidth} from './renderers/types'

export interface ModalOption {
  type?: ModalType
  width?: ModalWidth
}

export function _getModalOption(opts: {type?: ObjectSchemaType}): ModalOption {
  const {type} = opts

  return (get(type, 'options.modal') || {}) as ModalOption
}
