import {ToggleArrowRightIcon} from '@sanity/icons'
import {Box, Flex, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {memo, type ReactNode} from 'react'

import {
  borderRadiusVar,
  focusBoxShadowVar,
  rootLegend,
  toggleButton,
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
  const {card, color, radius} = useThemeV2()

  const text = (
    <Text weight="medium" size={1}>
      {title}
    </Text>
  )

  if (!collapsible) {
    return <legend className={rootLegend}>{text}</legend>
  }

  return (
    <legend className={rootLegend}>
      <Flex
        as="button"
        type="button"
        className={toggleButton}
        onClick={onClick}
        style={assignInlineVars({
          [borderRadiusVar]: `${radius[2]}px`,
          [focusBoxShadowVar]: focusRingStyle({
            base: color,
            focusRing: card.focusRing,
          }),
        })}
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
