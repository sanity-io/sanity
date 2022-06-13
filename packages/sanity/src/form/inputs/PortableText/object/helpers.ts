import {ObjectSchemaType} from '@sanity/types'
import {get} from 'lodash'
import {ModalType, ModalWidth} from './renderers/types'

export interface ModalOption {
  type?: ModalType
  width?: ModalWidth
}

export function _getModalOption(opts: {schemaType?: ObjectSchemaType}): ModalOption {
  const {schemaType} = opts

  return (get(schemaType, 'options.modal') || {}) as ModalOption
}
