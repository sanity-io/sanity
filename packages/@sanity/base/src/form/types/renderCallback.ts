import * as React from 'react'

import {ArrayOfObjectsMember, FieldMember, FieldSetMember} from '../types'

export type RenderFieldCallbackArg = FieldMember & {
  focusRef: React.Ref<any>
}
export type RenderFieldCallback = (renderFieldProps: FieldMember) => React.ReactNode

export type RenderArrayItemCallback = (
  renderArrayItemProps: ArrayOfObjectsMember
) => React.ReactNode

export type RenderFieldSetCallback = (member: FieldSetMember) => React.ReactNode
