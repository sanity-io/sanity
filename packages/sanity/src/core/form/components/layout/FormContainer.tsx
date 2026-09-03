import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps, type ComponentType} from 'react'

import {useFormGutterEnabled} from '../../hooks/useFormGutterEnabled'
import {
  container1Var,
  formContainerRoot,
  space4Var,
  space5Var,
  space9Var,
} from './FormContainer.css'
import {gutterSpace3Var, gutterSpace4Var} from './formGutterCustomProperties.css'

/**
 * @internal
 */
export const FormContainer: ComponentType<ComponentProps<'div'>> = (props) => {
  const {className, style, ...rest} = props
  const gutterEnabled = useFormGutterEnabled()
  const {container, space} = useThemeV2()

  return (
    <div
      {...rest}
      className={clsx(formContainerRoot, className)}
      data-gutter={gutterEnabled ? 'true' : undefined}
      style={{
        ...assignInlineVars({
          [gutterSpace4Var]: `${space[4]}px`,
          [gutterSpace3Var]: `${space[3]}px`,
          [space4Var]: `${space[4]}px`,
          [space5Var]: `${space[5]}px`,
          [space9Var]: `${space[9]}px`,
          [container1Var]: `${container[1]}px`,
        }),
        ...style,
      }}
    />
  )
}
