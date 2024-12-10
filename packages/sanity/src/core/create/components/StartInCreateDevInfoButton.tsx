//these texts dont need to be translated – dev only
/* eslint-disable i18next/no-literal-string */
import {InfoOutlineIcon, WarningOutlineIcon} from '@sanity/icons'
import {Badge, Card, Stack, Text, useClickOutsideEvent, useGlobalKeyDown} from '@sanity/ui'
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
      tone="default"
      content={
        <WrapperCard radius={3} tone="default">
          <Stack padding={4} space={4}>
            <Text muted size={1}>
              This info button is only visible in development mode.
            </Text>

            {noFallbackOrigin && (
              <Card border padding={3} radius={3}>
                <Stack space={4}>
                  <div>
                    <Badge tone="caution">No fallback origin defined</Badge>
                  </div>
                  <Text muted size={1}>
                    The Start in Create button has been disabled in development as{' '}
                    <code>beta.create.fallbackStudioOrigin</code> is not defined in{' '}
                    <code>sanity.config</code>.
                  </Text>
                  <DeployedApps studioApps={studioApp?.studioApps} />
                </Stack>
              </Card>
            )}

            {activeFallbackOrigin && (
              <>
                <Card border padding={3} radius={3}>
                  <Stack space={2}>
                    <div>
                      <Badge tone="positive">Fallback studio origin</Badge>
                    </div>
                    <Text size={1} weight="medium">
                      <code>{fallbackStudioOrigin}</code>
                    </Text>
                  </Stack>
                </Card>
              </>
            )}

            {invalidFallbackOrigin && (
              <Card border padding={3} radius={3}>
                <Stack space={4}>
                  <div>
                    <Badge tone="critical">Invalid fallback origin</Badge>
                  </div>
                  <Text size={1}>
                    Fallback origin <code>{fallbackStudioOrigin}</code> set in{' '}
                    <code>beta.create.fallbackStudioOrigin</code> is invalid.
                  </Text>
                  <DeployedApps studioApps={studioApp?.studioApps} />
                </Stack>
              </Card>
            )}

            <Text muted size={1}>
              This banner is displayed in new documents on Studios deployed with a manifest.
              Documents containing initial values are ignored.
            </Text>

            <Text size={1} weight="medium">
              For more details, please refer to{' '}
              <a
                href="https://snty.link/create-config-guide?ref=studio"
                target="_blank"
                rel="noreferrer"
              >
                our configuration guide
              </a>
              .
            </Text>
          </Stack>
        </WrapperCard>
      }
    >
      <Button
        ref={infoButtonRef}
        icon={invalidFallbackOrigin ? WarningOutlineIcon : InfoOutlineIcon}
        mode="bleed"
        selected={open}
        tone={invalidFallbackOrigin ? 'critical' : 'default'}
        onClick={toggleOpen}
        tooltipProps={{
          content: 'Developer info',
          placement: 'top',
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
      <Text size={1} weight="medium">
        Available studio origin{studioApps.length > 1 ? 's' : ''}
      </Text>
      <Stack space={2}>
        {studioApps.map((app) => {
          return (
            <Text key={app.id} size={1}>
              <code>• {app.studioUrl?.replace(`https://`, '')}</code>
            </Text>
          )
        })}
      </Stack>
      <Text muted size={1}>
        To enable integration with Sanity Create, a deployed studio must have an accessible
        manifest.
      </Text>
    </Stack>
  )
}
