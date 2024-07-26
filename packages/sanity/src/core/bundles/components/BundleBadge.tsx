import {type ColorHueKey, hues} from '@sanity/color'
import {ChevronDownIcon, Icon, type IconSymbol} from '@sanity/icons'
import {Box, Flex, rgba, Text} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

import {Tooltip} from '../../../ui-components'
import {type BundleDocument} from '../../store/bundles/types'

const BadgeRoot = styled(Flex)<{
  $hue: ColorHueKey
}>((props) => {
  const {color} = getTheme_v2(props.theme)
  const hue: ColorHueKey = props.$hue

  return css`
    --card-bg-color: ${rgba(hues[hue][color._dark ? 700 : 300].hex, 0.2)};
    --card-fg-color: ${hues[hue][color._dark ? 400 : 600].hex};
    --card-icon-color: ${hues[hue][color._dark ? 400 : 600].hex};
    background-color: var(--card-bg-color);
    border-radius: 9999px;
  `
})
/**
 * @internal
 */
export function BundleBadge(
  props: Partial<
    BundleDocument & {
      icon: IconSymbol
      hue: ColorHueKey
      openButton: boolean
      padding: number
      title: string
    }
  >,
): JSX.Element {
  const {hue = 'gray', icon, openButton, padding = 3, title} = props

  return (
    <BadgeRoot gap={padding} padding={padding} data-testid={`bundle-badge-color-${hue}`} $hue={hue}>
      {icon && (
        <Box flex="none">
          <Text size={1}>
            <Icon data-testid={`bundle-badge-icon-${icon.toString()}`} symbol={icon} />
          </Text>
        </Box>
      )}
      {title && (
        <Box flex="none">
          <Tooltip delay={1000} content={title} placement="bottom">
            <Text
              style={{
                maxWidth: 100,
              }}
              textOverflow="ellipsis"
              size={1}
            >
              {title}
            </Text>
          </Tooltip>
        </Box>
      )}
      {openButton && (
        <Box flex="none">
          <Text size={1}>
            <ChevronDownIcon />
          </Text>
        </Box>
      )}
    </BadgeRoot>
  )
}
