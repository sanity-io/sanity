// eslint-disable-next-line camelcase
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type HTMLProps, forwardRef} from 'react'

import {
  formContainer,
  maxWidthVar,
  paddingBlockEndVar,
  paddingBlockStartVar,
  paddingInlineVar,
} from './FormContainer.css'

/**
 * @internal
 */
export const FormContainer = forwardRef<HTMLDivElement, HTMLProps<HTMLDivElement>>(
  function FormContainer(props, ref) {
    const {space, container} = useThemeV2()

    return (
      <div
        {...props}
        ref={ref}
        className={formContainer}
        style={assignInlineVars({
          [paddingInlineVar]: `${space[4]}px`,
          [paddingBlockStartVar]: `${space[5]}px`,
          [paddingBlockEndVar]: `${space[9]}px`,
          [maxWidthVar]: `calc(${container[1]}px + (var(--formGutterSize, 0px) * 2) + (var(--formGutterGap, 0px) * 2))`,
        })}
      />
    )
  },
)
