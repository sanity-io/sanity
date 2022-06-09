import {ObjectSchemaType} from '@sanity/types'
import {get} from 'lodash'
import {ModalType, ModalWidth} from './renderers/types'

interface ModalOption {
  type?: ModalType
  width?: ModalWidth
}

export function _getModalOption(opts: {type?: ObjectSchemaType}): ModalOption {
  const {type} = opts
  const legacyEditModalOption: string | undefined = get(type, 'options.editModal')
  const modalOption: ModalOption = get(type, 'options.modal') || {}

  if (legacyEditModalOption) {
    console.warn(
      'The "editModal" option will be deprecated. Please use `options.modal.type` instead.'
    )
  }

  let modalType = modalOption.type || legacyEditModalOption

  if (modalType === 'fullscreen') {
    return {
      type: 'dialog',
      width: 'full',
    }
  }

  if (modalType === 'fold') {
    modalType = 'popover'
  }

  return {
    type: modalType as ModalType,
    width: modalOption.width,
  }
}
