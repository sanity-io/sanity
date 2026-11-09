import {LaunchIcon} from '@sanity/icons/Launch'
import {_responsive, Card} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {type ReactNode, Suspense, use, useEffect} from 'react'
import {type ObservablePromise} from 'react-rx'
import {css, styled} from 'styled-components'
import {Flex, Box, Container, type ContainerProps, type FlexParentProps} from 'ui5'

import {Button} from '../../../ui-components/button/Button'
import {LoadingBlock} from '../../components/loadingBlock/LoadingBlock'
import {type UpsellTelemetryLogs} from '../../hooks/useUpsellData'
import {type UpsellData, type UpsellDataResult} from './types'
import {UpsellDescriptionSerializer} from './upsellDescriptionSerializer/UpsellDescriptionSerializer'

type Layout = 'vertical' | 'horizontal'
const Image = styled.img<{$direction: FlexParentProps['flexDirection']}>((props) => {
  const {media} = getTheme_v2(props.theme)

  const responsiveStyles = _responsive(
    media,
    Array.isArray(props.$direction) ? props.$direction : [props.$direction],
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

/** What the panel needs from a feature's upsell context */
interface UpsellPanelSource {
  /** `null` outside the provider, where the panel renders `unavailable` */
  upsellDataPromise: ObservablePromise<UpsellDataResult> | null
  requestUpsellData: () => void
  telemetryLogs: Pick<UpsellTelemetryLogs, 'panelPrimaryClicked' | 'panelSecondaryClicked'>
}

interface UpsellCardProps {
  layout?: Layout
  border?: boolean
  align?: 'center' | 'flex-start'
  /** Rendered centered above the card, in place of the content's image */
  illustration?: ReactNode
  /** Wraps the card in a `Container` of this size, only once there is content to show */
  size?: ContainerProps['size']
}

interface UpsellPanelProps extends UpsellCardProps {
  /** The feature's upsell context value, as returned by its `use*Upsell()` hook */
  upsell: UpsellPanelSource
  /** Rendered when the content cannot be loaded. Nothing by default */
  unavailable?: ReactNode
}

/**
 * First 2 viewport sizes are always vertical, 3rd is horizontal
 */
const HORIZONTAL_PADDING_Y: [3, 3, 5] = [3, 3, 5]

/**
 * The inline upsell card for a feature. It starts the content request when it mounts (a no-op
 * when the provider preloaded it), shows a loading state until the content arrives, and renders
 * `unavailable` when it cannot be loaded, so a host only renders it.
 *
 * @internal
 */
export function UpsellPanel(props: UpsellPanelProps) {
  const {upsell, unavailable = null, ...cardProps} = props
  const {requestUpsellData, upsellDataPromise, telemetryLogs} = upsell

  useEffect(() => {
    requestUpsellData()
  }, [requestUpsellData])

  if (!upsellDataPromise) return unavailable
  // The content is read in a child: this component has to commit for its effect to start the request
  return (
    <Suspense fallback={<LoadingBlock />}>
      <UpsellPanelContent
        {...cardProps}
        upsellDataPromise={upsellDataPromise}
        telemetryLogs={telemetryLogs}
        unavailable={unavailable}
      />
    </Suspense>
  )
}

function UpsellPanelContent(
  props: UpsellCardProps & {
    upsellDataPromise: ObservablePromise<UpsellDataResult>
    telemetryLogs: UpsellPanelSource['telemetryLogs']
    unavailable: ReactNode
  },
) {
  const {upsellDataPromise, telemetryLogs, unavailable, ...cardProps} = props
  const {upsellData} = use(upsellDataPromise)

  if (!upsellData) return unavailable
  return (
    <UpsellCard
      {...cardProps}
      data={upsellData}
      onPrimaryClick={telemetryLogs.panelPrimaryClicked}
      onSecondaryClick={telemetryLogs.panelSecondaryClicked}
    />
  )
}

function UpsellCard(
  props: UpsellCardProps & {
    data: UpsellData
    onPrimaryClick: () => void
    onSecondaryClick: () => void
  },
) {
  const {
    data,
    onPrimaryClick,
    onSecondaryClick,
    layout = 'vertical',
    border = true,
    align = 'flex-start',
    illustration,
    size,
  } = props
  const direction: FlexParentProps['flexDirection'] = [
    'column',
    'column',
    layout === 'horizontal' ? 'row' : 'column',
  ]

  const card = (
    <Card radius={3} overflow={'hidden'} border={border}>
      <Flex flexDirection={direction} gap={2}>
        {!illustration && data.image && (
          <Image
            src={data.image.asset.url}
            alt={data.image.asset.altText ?? ''}
            $direction={direction}
          />
        )}
        <DescriptionRoot paddingX={3} paddingY={layout === 'horizontal' ? HORIZONTAL_PADDING_Y : 3}>
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
        </DescriptionRoot>
      </Flex>
    </Card>
  )

  const panel = illustration ? (
    <Flex alignItems="center" flexDirection="column">
      {illustration}
      <Box paddingTop={2}>{card}</Box>
    </Flex>
  ) : (
    card
  )

  return size === undefined ? panel : <Container size={size}>{panel}</Container>
}
