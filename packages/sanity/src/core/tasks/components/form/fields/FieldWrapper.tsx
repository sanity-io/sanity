import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {type StringFieldProps} from '../../../../form/types/fieldProps'
import {fieldWrapperRoot, fontTextWeightRegularVar} from './FieldWrapper.css'

/**
 * @internal
 * Updates the padding and font weight of the field header content box.
 */
export function FieldWrapperRoot(props: ComponentProps<'div'>) {
  const {className, style, ...rest} = props
  const {font} = useThemeV2()

  return (
    <div
      {...rest}
      className={clsx(fieldWrapperRoot, className)}
      style={{
        ...assignInlineVars({[fontTextWeightRegularVar]: String(font.text.weights.regular)}),
        ...style,
      }}
    />
  )
}

export function FieldWrapper(props: StringFieldProps) {
  return <FieldWrapperRoot>{props.renderDefault(props)}</FieldWrapperRoot>
}
