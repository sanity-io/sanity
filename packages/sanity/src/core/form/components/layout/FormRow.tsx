import {type ComponentType, type PropsWithChildren, type ReactNode} from 'react'

import {FormCell} from './FormCell'
import {formRowContainer} from './FormRow.css'

const areas = ['gutterStart', 'body', 'gutterEnd'] as const
export type FormArea = (typeof areas)[number]

export interface FormRowProps extends PropsWithChildren {
  gutterStartCell?: ReactNode
}

/**
 * @internal
 */
export const FormRow: ComponentType<FormRowProps> = ({children, gutterStartCell}) => (
  <div className={formRowContainer}>
    {gutterStartCell && <FormCell $area="gutterStart">{gutterStartCell}</FormCell>}
    <FormCell $area="body">{children}</FormCell>
  </div>
)
