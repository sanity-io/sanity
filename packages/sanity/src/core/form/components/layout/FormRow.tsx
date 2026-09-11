import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ComponentType, type PropsWithChildren, type ReactNode} from 'react'

import {useFormGutterEnabled} from '../../hooks/useFormGutterEnabled'
import {FormCell} from './FormCell'
import {gutterSpace3Var, gutterSpace4Var} from './formGutterCustomProperties.css'
import {type areas, formRowContainer} from './FormRow.css'

export type FormArea = (typeof areas)[number]

export interface FormRowProps extends PropsWithChildren {
  gutterStartCell?: ReactNode
}

/**
 * @internal
 */
export const FormRow: ComponentType<FormRowProps> = ({children, gutterStartCell}) => {
  const gutterEnabled = useFormGutterEnabled()
  const {space} = useThemeV2()

  return (
    <div
      className={formRowContainer}
      data-ui="FormRow"
      data-gutter={gutterEnabled ? 'true' : undefined}
      style={
        gutterEnabled
          ? assignInlineVars({
              [gutterSpace4Var]: `${space[4]}px`,
              [gutterSpace3Var]: `${space[3]}px`,
            })
          : undefined
      }
    >
      {gutterStartCell && <FormCell $area="gutterStart">{gutterStartCell}</FormCell>}
      <FormCell $area="body">{children}</FormCell>
    </div>
  )
}
