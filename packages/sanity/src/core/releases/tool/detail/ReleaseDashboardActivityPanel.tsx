'use no memo'
// The `use no memo` directive is due to a known issue with react-virtual and react compiler: https://github.com/TanStack/virtual/issues/736

import {Box, Card, Flex, Text} from '@sanity/ui'
import {AnimatePresence, motion} from 'framer-motion'
import {styled} from 'styled-components'

import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {Resizable} from '../../../components/resizer/Resizable'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseDocument} from '../../store/types'
import {type ReleaseEvents} from './events/useReleaseEvents'
import {ReleaseActivityList} from './ReleaseActivityList'

interface ReleaseDashboardActivityPanelProps {
  events: ReleaseEvents
  release: ReleaseDocument
  show: boolean
}
const MotionFlex = motion.create(Flex)
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
}: ReleaseDashboardActivityPanelProps) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  return (
    <AnimatePresence>
      {show && (
        <>
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
              <MotionFlex flex="none" height="fill" direction="column">
                <Box padding={4}>
                  <Text size={1} weight="medium">
                    {t('activity.panel.title')}
                  </Text>
                </Box>
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
                  releaseTitle={
                    release.metadata.title || tCore('release.placeholder-untitled-release')
                  }
                  releaseId={release._id}
                  events={events.events}
                  hasMore={events.hasMore}
                  loadMore={events.loadMore}
                  isLoading={events.loading}
                />
              </MotionFlex>
            </Resizable>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
