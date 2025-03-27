import {LaunchIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack} from '@sanity/ui'
import {BREAKPOINTS, type FlexDirection, type ResponsiveProp} from '@sanity/ui/css'
import {type Space} from '@sanity/ui/theme'
import {_responsive} from '@sanity/ui-v3'
import {css, styled} from 'styled-components'

import {Button} from '../../../ui-components'
import {type UpsellData} from './types'
import {UpsellDescriptionSerializer} from './upsellDescriptionSerializer/UpsellDescriptionSerializer'

type Layout = 'vertical' | 'horizontal'
const Image = styled.img<{$direction: FlexDirection[]}>((props) => {
  const responsiveStyles = _responsive(
    Object.values(BREAKPOINTS).slice(1),
    props.$direction,
    (val) => {
      return {
        width: val === 'row' ? '50%' : '100%',
        height: val === 'row' ? 'auto' : '180px',
      }
    },
  )

  return css`
    object-fit: cover;
    ${responsiveStyles}
  `
})

const DescriptionRoot = styled(Box)`
  margin: auto 0;
`

interface CommentsUpsellPanelProps {
  data: UpsellData
  onPrimaryClick: () => void
  onSecondaryClick: () => void
  layout?: Layout
}

/**
 * First 2 viewport sizes are always vertical, 3rd is horizontal
 */
const HORIZONTAL_PADDING_Y: ResponsiveProp<Space> = [3, 3, 5]

export function UpsellPanel(props: CommentsUpsellPanelProps) {
  const {data, onPrimaryClick, onSecondaryClick, layout = 'vertical'} = props
  const direction: FlexDirection[] = [
    'column',
    'column',
    layout === 'horizontal' ? 'row' : 'column',
  ]

  return (
    <Card radius={3} overflow={'hidden'} border>
      <Flex direction={direction as ResponsiveProp<FlexDirection>} gap={2}>
        {data.image && (
          <Image
            src={data.image.asset.url}
            alt={data.image.asset.altText ?? ''}
            $direction={direction}
          />
        )}
        <DescriptionRoot paddingX={3} paddingY={layout === 'horizontal' ? HORIZONTAL_PADDING_Y : 3}>
          <Stack gap={4}>
            <UpsellDescriptionSerializer blocks={data.descriptionText} />
          </Stack>
          <Flex gap={2} justify={'flex-end'} marginTop={5}>
            {data.secondaryButton.text && (
              <Button
                mode="bleed"
                text={data.secondaryButton.text}
                tone="primary"
                iconRight={LaunchIcon}
                {...(data.secondaryButton.url && {
                  target: '_blank',
                  rel: 'noopener noreferrer',
                  as: 'a',
                  href: data.secondaryButton.url,
                })}
                onClick={onSecondaryClick}
              />
            )}
            <Button
              text={data.ctaButton.text}
              tone="primary"
              {...(data.ctaButton.url && {
                target: '_blank',
                rel: 'noopener noreferrer',
                as: 'a',
                href: data.ctaButton.url,
              })}
              onClick={onPrimaryClick}
            />
          </Flex>
        </DescriptionRoot>
      </Flex>
    </Card>
  )
}
