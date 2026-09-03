import {ToggleArrowRightIcon} from '@sanity/icons/ToggleArrowRight'
import {Flex, rem, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {memo, type ReactNode} from 'react'
import {Box} from 'ui5'

import {
  root,
  toggleButton,
  toggleButtonFocusRingVar,
  toggleButtonRadiusVar,
  toggleIconBox,
} from './FormFieldSetLegend.css'
import {focusRingStyle} from './styles'

export interface FormFieldSetLegendProps {
  collapsed: boolean
  collapsible?: boolean
  onClick?: () => void
  title: ReactNode
}

export const FormFieldSetLegend = memo(function FormFieldSetLegend(props: FormFieldSetLegendProps) {
  const {collapsed, collapsible, onClick, title} = props
  const {color, input, radius} = useThemeV2()

  const text = (
    <Text weight="medium" size={1}>
      {title}
    </Text>
  )

  if (!collapsible) {
    return <legend className={root}>{text}</legend>
  }

  return (
    <legend className={root}>
      <Flex
        as="button"
        className={toggleButton}
        onClick={onClick}
        style={assignInlineVars({
          [toggleButtonRadiusVar]: `${rem(radius[2])}`,
          [toggleButtonFocusRingVar]: focusRingStyle({
            base: color,
            focusRing: input.text.focusRing,
          }),
        })}
        type="button"
      >
        <Box className={toggleIconBox}>
          <Text muted size={1}>
            <ToggleArrowRightIcon
              style={{
                transform: `rotate(${collapsed ? '0' : '90deg'}) translate3d(0, 0, 0)`,
              }}
            />
          </Text>
        </Box>

        {text}
      </Flex>
    </legend>
  )
})
