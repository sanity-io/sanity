import {LaunchIcon} from '@sanity/icons'
import {_responsive, Box, Card, Flex, type FlexDirection, Stack} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

import {Button} from '../../../ui-components'
import {type UpsellData} from './types'
import {UpsellDescriptionSerializer} from './upsellDescriptionSerializer/UpsellDescriptionSerializer'

type Layout = 'vertical' | 'horizontal'
const Image = styled.img<{$direction: FlexDirection[]}>((props) => {
  const {media} = getTheme_v2(props.theme)

  const responsiveStyles = _responsive(media, props.$direction, (val) => {
    return {
      width: val === 'row' ? '50%' : '100%',
      height: val === 'row' ? 'auto' : '180px',
    }
  })

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
const HORIZONTAL_PADDING_Y = [3, 3, 5]

export function UpsellPanel(props: CommentsUpsellPanelProps) {
  const {data, onPrimaryClick, onSecondaryClick, layout = 'vertical'} = props
  const direction: FlexDirection[] = [
    'column',
    'column',
    layout === 'horizontal' ? 'row' : 'column',
  ]

  return (
    <Card radius={3} overflow={'hidden'} border>
      <Flex direction={direction} gap={2}>
        {data.image && (
          <Image
            src={data.image.asset.url}
            alt={data.image.asset.altText ?? ''}
            $direction={direction}
          />
        )}
        <DescriptionRoot paddingX={3} paddingY={layout === 'horizontal' ? HORIZONTAL_PADDING_Y : 3}>
          <Stack space={4}>
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
