import {motion} from 'motion/react'
import {Suspense, use, useCallback} from 'react'
import {type ObservablePromise} from 'react-rx'
import {styled} from 'styled-components'
import {Container, Box, Flex} from 'ui5'

import {NO_UPSELL_DATA} from '../../../hooks/useUpsellData'
import {useSingleDocReleaseEnabled} from '../../../singleDocRelease/context/SingleDocReleaseEnabledProvider'
import {useSingleDocReleaseUpsell} from '../../../singleDocRelease/context/SingleDocReleaseUpsellProvider'
import {type UpsellDataResult} from '../../../studio/upsell/types'
import {UpsellPanel} from '../../../studio/upsell/UpsellPanel'
import {useReleasesUpsell} from '../../contexts/upsell/useReleasesUpsell'
import {ReleaseIllustration} from '../resources/ReleaseIllustration'
import {type CardinalityView} from './queryParamUtils'

const Panel = styled(Container)`
  width: auto;
  flex-shrink: 0;
`

interface UpsellIllustrationPanelProps {
  upsellDataPromise: ObservablePromise<UpsellDataResult> | null
  onPrimaryClick: () => void
  onSecondaryClick: () => void
}

/**
 * Waits for the upsell content at the leaf, under the boundary its caller renders; nothing when
 * the request failed.
 */
function UpsellIllustrationPanel({
  upsellDataPromise,
  onPrimaryClick,
  onSecondaryClick,
}: UpsellIllustrationPanelProps) {
  const {upsellData} = upsellDataPromise ? use(upsellDataPromise) : NO_UPSELL_DATA

  if (!upsellData) {
    return null
  }
  return (
    <Flex
      flexDirection="column"
      flexBasis="0%"
      flexGrow={1}
      justifyContent={'center'}
      alignItems={'center'}
    >
      <motion.div
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        transition={{duration: 0.3, ease: 'easeInOut'}}
      >
        <Panel size={0} padding={4} paddingY={1}>
          <Flex alignItems={'center'} flexDirection="column">
            <ReleaseIllustration />
            <Box paddingTop={2}>
              <UpsellPanel
                align="center"
                layout="vertical"
                data={{...upsellData, image: null}}
                border={false}
                onPrimaryClick={onPrimaryClick}
                onSecondaryClick={onSecondaryClick}
              />
            </Box>
          </Flex>
        </Panel>
      </motion.div>
    </Flex>
  )
}

const SingleDocReleasesUpsell = () => {
  const {mode} = useSingleDocReleaseEnabled()
  const {upsellDataPromise, telemetryLogs} = useSingleDocReleaseUpsell()
  const handlePrimaryClick = useCallback(() => {
    telemetryLogs.panelPrimaryClicked()
  }, [telemetryLogs])

  const handleSecondaryClick = useCallback(() => {
    telemetryLogs.panelSecondaryClicked()
  }, [telemetryLogs])

  if (mode !== 'upsell') {
    return null
  }
  return (
    <Suspense>
      <UpsellIllustrationPanel
        upsellDataPromise={upsellDataPromise}
        onPrimaryClick={handlePrimaryClick}
        onSecondaryClick={handleSecondaryClick}
      />
    </Suspense>
  )
}

const ReleasesUpsell = () => {
  const {upsellDataPromise, telemetryLogs, mode} = useReleasesUpsell()
  const handlePrimaryClick = useCallback(() => {
    telemetryLogs.panelPrimaryClicked()
  }, [telemetryLogs])

  const handleSecondaryClick = useCallback(() => {
    telemetryLogs.panelSecondaryClicked()
  }, [telemetryLogs])

  if (mode === 'default') {
    return null
  }
  return (
    <Suspense>
      <UpsellIllustrationPanel
        upsellDataPromise={upsellDataPromise}
        onPrimaryClick={handlePrimaryClick}
        onSecondaryClick={handleSecondaryClick}
      />
    </Suspense>
  )
}

export function SchedulesUpsell({cardinalityView}: {cardinalityView: CardinalityView}) {
  if (cardinalityView === 'drafts') {
    return <SingleDocReleasesUpsell />
  }
  if (cardinalityView === 'releases') {
    return <ReleasesUpsell />
  }
  return null
}
