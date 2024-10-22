import {CalendarIcon, CloseIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {type PropsWithChildren, useCallback, useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {LATEST, ToolLink} from 'sanity'
import {IntentLink, useRouterState} from 'sanity/router'

import {Tooltip} from '../../../ui-components'
import {ReleaseAvatar} from '../components/ReleaseAvatar'
import {usePerspective} from '../hooks/usePerspective'
import {RELEASES_INTENT, RELEASES_TOOL_NAME} from '../plugin'
import {getReleaseTone} from '../util/getReleaseTone'
import {GlobalPerspectiveMenu} from './GlobalPerspectiveMenu'

export function ReleasesNav(): JSX.Element {
  const activeToolName = useRouterState(
    useCallback(
      (routerState) => (typeof routerState.tool === 'string' ? routerState.tool : undefined),
      [],
    ),
  )

  const {currentGlobalBundle, setPerspective} = usePerspective()
  const {t} = useTranslation()

  const handleClearPerspective = () => setPerspective(LATEST._id)

  const releasesToolLink = useMemo(
    () => (
      <Tooltip content={t('release.navbar.tooltip')}>
        <Button
          as={ToolLink}
          name={RELEASES_TOOL_NAME}
          data-as="a"
          icon={CalendarIcon}
          mode="bleed"
          padding={2}
          radius="full"
          selected={activeToolName === RELEASES_TOOL_NAME}
          space={2}
        />
      </Tooltip>
    ),
    [activeToolName, t],
  )

  const currentGlobalPerspectiveLabel = useMemo(() => {
    if (!currentGlobalBundle || currentGlobalBundle._id === LATEST._id) return null
    if (currentGlobalBundle._id === 'published') {
      return (
        <Card tone="inherit">
          <Flex align="flex-start" gap={0}>
            <Stack flex={1} paddingY={2} paddingX={2} space={2}>
              <Text size={1} textOverflow="ellipsis" weight="medium">
                {currentGlobalBundle.metadata?.title}
              </Text>
            </Stack>
          </Flex>
        </Card>
      )
    }

    const releasesIntentLink = ({children, ...intentProps}: PropsWithChildren) => (
      <IntentLink {...intentProps} intent={RELEASES_INTENT} params={{id: currentGlobalBundle._id}}>
        {children}
      </IntentLink>
    )

    const tone = currentGlobalBundle.metadata?.releaseType
      ? getReleaseTone(currentGlobalBundle)
      : 'default'

    return (
      <Button
        as={releasesIntentLink}
        data-as="a"
        rel="noopener noreferrer"
        mode="bleed"
        padding={0}
        radius="full"
        style={{maxWidth: '180px'}}
      >
        <Flex align="flex-start" gap={0}>
          <Box flex="none">
            <ReleaseAvatar padding={2} tone={tone} />
          </Box>
          <Stack flex={1} paddingY={2} paddingRight={2} space={2}>
            <Text size={1} textOverflow="ellipsis" weight="medium">
              {currentGlobalBundle.metadata?.title}
            </Text>
          </Stack>
        </Flex>
      </Button>
    )
  }, [currentGlobalBundle])

  return (
    <Card flex="none" border marginRight={1} radius="full" tone="inherit" style={{margin: -1}}>
      <Flex gap={0}>
        <Box flex="none">{releasesToolLink}</Box>
        {currentGlobalPerspectiveLabel}
        <GlobalPerspectiveMenu />
        {currentGlobalBundle._id !== LATEST._id && (
          <div>
            <Button
              icon={CloseIcon}
              mode="bleed"
              onClick={handleClearPerspective}
              data-testid="clear-perspective-button"
              padding={2}
              radius="full"
            />
          </div>
        )}
      </Flex>
    </Card>
  )
}
