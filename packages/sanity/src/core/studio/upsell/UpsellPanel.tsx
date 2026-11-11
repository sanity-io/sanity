import {LaunchIcon} from '@sanity/icons/Launch'
import {Card} from '@sanity/ui'
import {clsx} from 'clsx'
import {Flex, Box, type FlexParentProps} from 'ui5'

import {Button} from '../../../ui-components/button/Button'
import {type UpsellData} from './types'
import {UpsellDescriptionSerializer} from './upsellDescriptionSerializer/UpsellDescriptionSerializer'
import {descriptionRoot, image, imageHorizontal} from './UpsellPanel.css'

type Layout = 'vertical' | 'horizontal'

interface CommentsUpsellPanelProps {
  data: UpsellData
  onPrimaryClick: () => void
  onSecondaryClick: () => void
  layout?: Layout
  border?: boolean
  align?: 'center' | 'flex-start'
}

/**
 * First 2 viewport sizes are always vertical, 3rd is horizontal
 */
const HORIZONTAL_PADDING_Y: [3, 3, 5] = [3, 3, 5]

export function UpsellPanel(props: CommentsUpsellPanelProps) {
  const {
    data,
    onPrimaryClick,
    onSecondaryClick,
    layout = 'vertical',
    border = true,
    align = 'flex-start',
  } = props
  const direction: FlexParentProps['flexDirection'] = [
    'column',
    'column',
    layout === 'horizontal' ? 'row' : 'column',
  ]

  return (
    <Card radius={3} overflow={'hidden'} border={border}>
      <Flex flexDirection={direction} gap={2}>
        {data.image && (
          <img
            className={clsx(image, layout === 'horizontal' && imageHorizontal)}
            src={data.image.asset.url}
            alt={data.image.asset.altText ?? ''}
          />
        )}
        <Box
          className={descriptionRoot}
          paddingX={3}
          paddingY={layout === 'horizontal' ? HORIZONTAL_PADDING_Y : 3}
        >
          <Flex gap={4} flexDirection={'column'} alignItems={align}>
            <UpsellDescriptionSerializer blocks={data.descriptionText} />
          </Flex>
          <Flex gap={2} justifyContent={align === 'center' ? 'center' : 'flex-end'} marginTop={5}>
            {data.secondaryButton.text && (
              <Button
                mode="bleed"
                text={data.secondaryButton.text}
                tone="default"
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
              tone="default"
              {...(data.ctaButton.url && {
                target: '_blank',
                rel: 'noopener noreferrer',
                as: 'a',
                href: data.ctaButton.url,
              })}
              onClick={onPrimaryClick}
            />
          </Flex>
        </Box>
      </Flex>
    </Card>
  )
}
