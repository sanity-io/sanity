//these texts dont need to be translated – dev only
/* eslint-disable i18next/no-literal-string */
import {InfoOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {Card, Stack, Text, useClickOutsideEvent, useGlobalKeyDown} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {Button, Popover} from '../../../ui-components'
import {useSanityCreateConfig} from '../context'
import {type CompatibleStudioAppId, type StudioApp} from '../studio-app/fetchCreateCompatibleAppId'

const WrapperCard = styled(Card)`
  max-width: 450px;
  max-height: 400px;
  overflow-y: auto;
`

export function StartInCreateDevInfoButton(props: {studioApp?: CompatibleStudioAppId}) {
  const {studioApp} = props

  const [open, setOpen] = useState(false)
  const toggleOpen = useCallback(() => setOpen((current) => !current), [])

  const popoverRef = useRef<HTMLDivElement | null>(null)
  const infoButtonRef = useRef<HTMLButtonElement | null>(null)

  const {fallbackStudioOrigin} = useSanityCreateConfig()

  useClickOutsideEvent(
    () => setOpen(false),
    () => [popoverRef.current, infoButtonRef.current],
  )

  useGlobalKeyDown(
    useCallback(
      (event: KeyboardEvent) => {
        if (event.key === 'Escape' && open) {
          setOpen(false)
        }
      },
      [open],
    ),
  )

  const defaultStudio = useMemo(
    () => studioApp?.studioApps.find((s) => s.id === studioApp?.appId),
    [studioApp],
  )

  const noFallbackOrigin = !studioApp?.appId && !fallbackStudioOrigin
  const invalidFallbackOrigin = fallbackStudioOrigin && !defaultStudio
  const activeFallbackOrigin = fallbackStudioOrigin && defaultStudio

  return (
    <Popover
      ref={popoverRef}
      open={open}
      placement="top"
      fallbackPlacements={['top-start', 'top-end', 'left', 'right']}
      content={
        <WrapperCard tone="default">
          <Stack space={4} padding={4}>
            <Text muted size={0}>
              This info button is only visible in development mode.
            </Text>

            <Text size={1}>
              The Create banner is shown for new documents without initial values in Studios
              deployed with a Create manifest.
            </Text>

            {noFallbackOrigin && (
              <Card tone="primary" padding={2} border>
                <Stack space={4}>
                  <Text size={1}>
                    The Start in Create button is disabled for development because{' '}
                    <code>beta.create.fallbackStudioOrigin</code> has not been set in{' '}
                    <code>sanity.config</code>.
                  </Text>
                  <DeployedApps studioApps={studioApp?.studioApps} />
                </Stack>
              </Card>
            )}

            {activeFallbackOrigin && (
              <>
                <Text size={1}>
                  For development Create will use the schema from a fallback origin deployment:
                </Text>
                <Text size={1}>
                  <code>{fallbackStudioOrigin}</code>
                </Text>
              </>
            )}

            {invalidFallbackOrigin && (
              <Card tone="critical" padding={2} border>
                <Stack space={4}>
                  <Text size={1}>
                    Fallback origin <code>{fallbackStudioOrigin}</code> set in{' '}
                    <code>beta.create.fallbackStudioOrigin</code> is invalid.
                  </Text>
                  <DeployedApps studioApps={studioApp?.studioApps} />
                </Stack>
              </Card>
            )}

            <Text size={1}>
              <a
                href={'https://www.sanity.io/docs/create-content-mapping'}
                target="_blank"
                rel="noreferrer"
              >
                Content mapping for Sanity Create
              </a>{' '}
              describes configuration details and when the banner will appear in deployed studios.
            </Text>
          </Stack>
        </WrapperCard>
      }
    >
      <Button
        ref={infoButtonRef}
        icon={invalidFallbackOrigin ? WarningOutlineIcon : InfoOutlineIcon}
        mode={invalidFallbackOrigin ? 'default' : 'bleed'}
        tone={invalidFallbackOrigin ? 'critical' : 'default'}
        onClick={toggleOpen}
        tooltipProps={{
          content: 'Developer info',
        }}
      />
    </Popover>
  )
}

function DeployedApps(props: {studioApps?: StudioApp[]}) {
  const {studioApps} = props
  if (!studioApps?.length) {
    return <Text size={1}>There are no deployed studios available.</Text>
  }

  return (
    <Stack space={4}>
      <Text size={1} weight="semibold">
        Available studio origin{studioApps.length > 1 ? 's' : ''}
      </Text>
      <Stack space={2}>
        {studioApps.map((app) => {
          return (
            <Text key={app.id} size={1}>
              • {app.studioUrl?.replace(`https://`, '')}
            </Text>
          )
        })}
      </Stack>
      <Text size={1}>To integrate with Create, a deployed studio must have a Create manifest.</Text>
    </Stack>
  )
}
