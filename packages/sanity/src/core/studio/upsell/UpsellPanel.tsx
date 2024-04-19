import {LaunchIcon} from '@sanity/icons'
import {_responsive, Box, Card, Flex, type FlexDirection, Stack} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {UpsellDescriptionSerializer} from 'sanity'
import {css, styled} from 'styled-components'

import {Button} from '../../../ui-components'
import {type UpsellData} from './types'

type Layout = 'vertical' | 'horizontal'
const Image = styled.img<{$direction: FlexDirection[]}>((props) => {
  const {media, radius} = getTheme_v2(props.theme)

  const responsiveStyles = _responsive(media, props.$direction, (val) => {
    return {
      width: val === 'row' ? '50%' : '100%',
      height: val === 'row' ? 'auto' : '180px',
      borderRadius: val === 'row' ? `${radius[3]}px` : '0',
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
        <DescriptionRoot padding={3}>
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
