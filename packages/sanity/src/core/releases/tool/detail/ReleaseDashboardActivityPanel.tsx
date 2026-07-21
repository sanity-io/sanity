import {type ReleaseDocument} from '@sanity/client'
import {CloseIcon} from '@sanity/icons/Close'
import {Box, Card, Flex, Text} from '@sanity/ui'
import {AnimatePresence, motion} from 'motion/react'
import {useEffect} from 'react'
import {styled} from 'styled-components'

import {Button} from '../../../../ui-components/button/Button'
import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {Resizable} from '../../../components/resizer/Resizable'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseEvents} from './events/useReleaseEvents'
import {ReleaseActivityList} from './ReleaseActivityList'

interface ReleaseDashboardActivityPanelProps {
  events: ReleaseEvents
  release: ReleaseDocument
  show: boolean
  /**
   * When true, the panel floats over the content as a right-anchored overlay (dismissed via the
   * header close button or Escape) instead of pushing the layout aside. Activity is transient
   * reference, not a co-editing surface, so it should not reflow the rail and table beneath it.
   */
  overlay?: boolean
  onClose?: () => void
}
const MotionFlex = motion.create(Flex)
const MotionCard = motion.create(Card)
const FillHeight = styled.div`
  --card-border-color: transparent;
  height: 100%;
  display: flex;
  flex-direction: column;
`
export function ReleaseDashboardActivityPanel({
  events,
  release,
  show,
  overlay = false,
  onClose,
}: ReleaseDashboardActivityPanelProps) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()

  // In overlay mode the panel is not part of the layout, so Escape is the keyboard escape hatch
  // (in addition to the header close button and the Activity toggle).
  useEffect(() => {
    if (!overlay || !show) return undefined
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [overlay, show, onClose])

  const content = (
    <MotionFlex flex="none" height="fill" direction="column">
      <Flex align="center" gap={2} justify="space-between" padding={4}>
        <Text size={1} weight="medium">
          {t('activity.panel.title')}
        </Text>
        {overlay && onClose && (
          <Button
            icon={CloseIcon}
            mode="bleed"
            onClick={onClose}
            tooltipProps={{content: t('activity.panel.close')}}
          />
        )}
      </Flex>
      {events.error && !events.events.length && (
        <Card padding={3} tone="caution">
          <Box padding={2}>
            <Text size={0}>{t('activity.panel.error')}</Text>
          </Box>
        </Card>
      )}
      {events.loading && !events.events.length && (
        <LoadingBlock title={t('activity.panel.loading')} />
      )}
      <ReleaseActivityList
        releaseTitle={release.metadata.title || tCore('release.placeholder-untitled-release')}
        releaseId={release._id}
        events={events.events}
        hasMore={events.hasMore}
        loadMore={events.loadMore}
        isLoading={events.loading}
      />
    </MotionFlex>
  )

  if (overlay) {
    // Floats over the content (position:absolute against the relatively-positioned parent in
    // ReleaseDetail), sliding in from the right; the rail and table beneath it do not move.
    return (
      <AnimatePresence>
        {show && (
          <MotionCard
            borderLeft
            shadow={4}
            initial={{x: '100%'}}
            animate={{x: 0}}
            exit={{x: '100%'}}
            transition={{type: 'spring', bounce: 0, duration: 0.2}}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              zIndex: 200,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Resizable
              as={FillHeight}
              minWidth={320}
              maxWidth={800}
              initialWidth={360}
              resizerPosition="left"
              style={{display: 'flex', flexDirection: 'column', flex: 'none', height: '100%'}}
            >
              {content}
            </Resizable>
          </MotionCard>
        )}
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          animate={{width: 'auto', opacity: 1}}
          initial={{width: 0, opacity: 0}}
          exit={{width: 0, opacity: 0}}
          transition={{type: 'spring', bounce: 0, duration: 0.2}}
        >
          <Resizable
            as={FillHeight}
            minWidth={320}
            maxWidth={800}
            initialWidth={320}
            resizerPosition="left"
            style={{display: 'flex', flexDirection: 'column', flex: 'none', maxHeight: '100%'}}
          >
            {content}
          </Resizable>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
