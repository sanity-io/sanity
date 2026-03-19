import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'

import {type StringFieldProps} from '../../../../form'
import * as classes from './FieldWrapper.css'

/**
 * @internal
 * Updates the padding and font weight of the field header content box.
 */
export const FieldWrapperRoot = ({children}: {children: React.ReactNode}) => {
  const theme = useThemeV2()

  return (
    <div
      className={classes.fieldWrapperRoot}
      style={assignInlineVars({
        [classes.fontWeightVar]: String(theme.font.text.weights.regular),
      })}
    >
      {children}
    </div>
  )
}

export function FieldWrapper(props: StringFieldProps) {
  return <FieldWrapperRoot>{props.renderDefault(props)}</FieldWrapperRoot>
}
