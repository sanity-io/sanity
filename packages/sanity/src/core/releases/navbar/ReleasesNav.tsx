import {CalendarIcon, CloseIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- Bundle Button requires more fine-grained styling than studio button
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {AnimatePresence, motion} from 'framer-motion'
import {type PropsWithChildren, useCallback, useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {IntentLink, useRouterState} from 'sanity/router'

import {Tooltip} from '../../../ui-components'
import {ToolLink} from '../../studio'
import {ReleaseAvatar} from '../components/ReleaseAvatar'
import {useStudioPerspectiveState} from '../hooks/useStudioPerspectiveState'
import {RELEASES_INTENT, RELEASES_TOOL_NAME} from '../plugin'
import {getBundleIdFromReleaseDocumentId} from '../util/getBundleIdFromReleaseDocumentId'
import {getReleaseTone} from '../util/getReleaseTone'
import {PUBLISHED_PERSPECTIVE} from '../util/perspective'
import {isDraftPerspective, isPublishedPerspective} from '../util/util'
import {GlobalPerspectiveMenu} from './GlobalPerspectiveMenu'

const AnimatedMotionDiv = ({children, ...props}: PropsWithChildren<any>) => (
  <motion.div
    {...props}
    initial={{width: 0, opacity: 0}}
    animate={{width: 'auto', opacity: 1}}
    exit={{width: 0, opacity: 0}}
    transition={{duration: 0.25, ease: 'easeInOut'}}
  >
    {children}
  </motion.div>
)

export function ReleasesNav(): JSX.Element {
  const activeToolName = useRouterState(
    useCallback(
      (routerState) => (typeof routerState.tool === 'string' ? routerState.tool : undefined),
      [],
    ),
  )

  const {currentGlobalRelease, current, setCurrent} = useStudioPerspectiveState()
  const {t} = useTranslation()

  const handleClearPerspective = () => setCurrent(PUBLISHED_PERSPECTIVE)

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
    if (!currentGlobalRelease || isDraftPerspective(current)) return null

    let displayTitle
    if (isPublishedPerspective(current)) {
      displayTitle = t('release.chip.published')
    } else {
      displayTitle =
        currentGlobalRelease.metadata?.title || t('release.placeholder-untitled-release')
    }

    const visibleLabelChildren = () => {
      const labelContent = (
        <Flex align="flex-start" gap={0}>
          <Box flex="none">
            <ReleaseAvatar padding={2} tone={getReleaseTone(currentGlobalRelease)} />
          </Box>
          <Stack flex={1} paddingY={2} paddingRight={2} space={2}>
            <Text size={1} textOverflow="ellipsis" weight="medium">
              {displayTitle}
            </Text>
          </Stack>
        </Flex>
      )

      if (isPublishedPerspective(current)) {
        return <Card tone="inherit">{labelContent}</Card>
      }

      const releasesIntentLink = ({children, ...intentProps}: PropsWithChildren) => (
        <IntentLink
          {...intentProps}
          intent={RELEASES_INTENT}
          params={{id: getBundleIdFromReleaseDocumentId(currentGlobalRelease._id!)}}
        >
          {children}
        </IntentLink>
      )

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
          {labelContent}
        </Button>
      )
    }

    return <AnimatedMotionDiv>{visibleLabelChildren()}</AnimatedMotionDiv>
  }, [currentGlobalRelease, current, t])

  return (
    <Card flex="none" border marginRight={1} radius="full" tone="inherit" style={{margin: -1}}>
      <Flex gap={0}>
        <Box flex="none">{releasesToolLink}</Box>
        <AnimatePresence>{currentGlobalPerspectiveLabel}</AnimatePresence>
        <GlobalPerspectiveMenu />
        {!isDraftPerspective(current) && (
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
