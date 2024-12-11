'use no memo'
// The `use no memo` directive is due to a known issue with react-virtual and react compiler: https://github.com/TanStack/virtual/issues/736

import {Box, Card, Flex, Text} from '@sanity/ui'
import {AnimatePresence, motion} from 'framer-motion'
import {styled} from 'styled-components'

import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {Resizable} from '../../../form/studio/tree-editing/components/layout/resizer'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseDocument} from '../../store/types'
import {type ReleaseActivity} from './activity/useReleaseActivity'
import {ReleaseActivityList} from './ReleaseActivityList'

interface ReleaseDashboardActivityPanelProps {
  activity: ReleaseActivity
  release: ReleaseDocument
  show: boolean
}
const MotionFlex = motion(Flex)
const FillHeight = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`
export function ReleaseDashboardActivityPanel({
  activity,
  release,
  show,
}: ReleaseDashboardActivityPanelProps) {
  const {t} = useTranslation(releasesLocaleNamespace)
  return (
    <AnimatePresence>
      {show && (
        <>
          <Card flex="none" borderLeft marginY={2} style={{opacity: 0.6}} />
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
                {activity.loading && !activity.events.length && (
                  <LoadingBlock title={t('activity.panel.loading')} />
                )}
                <ReleaseActivityList
                  events={activity.events}
                  releaseTitle={release.metadata.title || release.name}
                  releaseId={release._id}
                  hasMore={activity.hasMore}
                  loadMore={activity.loadMore}
                  isLoading={activity.loading}
                />
              </MotionFlex>
            </Resizable>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
