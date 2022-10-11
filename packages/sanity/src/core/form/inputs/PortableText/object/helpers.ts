/* eslint-disable no-nested-ternary */
import {ObjectSchemaType} from '@sanity/types'
import {get} from 'lodash'
import {ModalType, ModalWidth} from './renderers/types'

type ValuesOf<T extends readonly unknown[]> = T extends readonly (infer E)[] ? E : unknown[]

export interface ModalSchemaOption {
  type: ModalType
  width?: ModalWidth | ModalWidthPreset
}
export interface ParsedModalOption {
  type: ModalType
  width?: ModalWidth
}

const PRESETS = ['small', 'medium', 'large', 'full'] as const

type ModalWidthPreset = ValuesOf<typeof PRESETS>

export const DIALOG_WIDTH_TO_UI_WIDTH = {
  small: 0,
  medium: 1,
  large: 2,
  full: 'auto',
} as const

export const POPOVER_WIDTH_TO_UI_WIDTH = {
  small: 0,
  medium: 1,
  large: 2,
  full: 'auto',
} as const

function isModalWidthPreset(value: any): value is ModalWidthPreset {
  return PRESETS.includes(value)
}

function isModalSchemaOption(value: any): value is ModalSchemaOption {
  const type = value?.type
  return type === 'popover' || type === 'dialog'
}

const DEFAULT_MODAL_OPTION: ParsedModalOption = {
  type: 'dialog',
  width: DIALOG_WIDTH_TO_UI_WIDTH.medium,
}

function getUiWidth(type: 'popover' | 'dialog', preset: ModalWidthPreset) {
  return type === 'popover' ? POPOVER_WIDTH_TO_UI_WIDTH[preset] : DIALOG_WIDTH_TO_UI_WIDTH[preset]
}

export function _getModalOption(schemaType: ObjectSchemaType): ParsedModalOption {
  const option = get(schemaType, 'options.modal')

  if (!isModalSchemaOption(option)) {
    return DEFAULT_MODAL_OPTION
  }

  const {width, type} = option

  return {
    type,
    width:
      typeof width === 'undefined'
        ? getUiWidth(type, 'medium')
        : isModalWidthPreset(width)
        ? getUiWidth(type, width)
        : width,
  }
}
