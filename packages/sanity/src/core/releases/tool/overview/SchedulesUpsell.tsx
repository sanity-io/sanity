import {Container} from '@sanity/ui'
import {motion} from 'motion/react'
import {useCallback} from 'react'
import {Box, Flex} from 'ui5'

import {useSingleDocReleaseEnabled} from '../../../singleDocRelease/context/SingleDocReleaseEnabledProvider'
import {useSingleDocReleaseUpsell} from '../../../singleDocRelease/context/SingleDocReleaseUpsellProvider'
import {UpsellPanel} from '../../../studio/upsell/UpsellPanel'
import {useReleasesUpsell} from '../../contexts/upsell/useReleasesUpsell'
import {ReleaseIllustration} from '../resources/ReleaseIllustration'
import {type CardinalityView} from './queryParamUtils'
import {panel} from './SchedulesUpsell.css'

const SingleDocReleasesUpsell = () => {
  const {mode} = useSingleDocReleaseEnabled()
  const {upsellData, telemetryLogs} = useSingleDocReleaseUpsell()
  const handlePrimaryClick = useCallback(() => {
    telemetryLogs.panelPrimaryClicked()
  }, [telemetryLogs])

  const handleSecondaryClick = useCallback(() => {
    telemetryLogs.panelSecondaryClicked()
  }, [telemetryLogs])

  if (mode !== 'upsell' || !upsellData) {
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
        <Container className={panel} width={0} padding={4} paddingY={1}>
          <Flex alignItems={'center'} flexDirection="column">
            <ReleaseIllustration />
            <Box paddingTop={2}>
              <UpsellPanel
                align="center"
                layout="vertical"
                data={{...upsellData, image: null}}
                border={false}
                onPrimaryClick={handlePrimaryClick}
                onSecondaryClick={handleSecondaryClick}
              />
            </Box>
          </Flex>
        </Container>
      </motion.div>
    </Flex>
  )
}

const ReleasesUpsell = () => {
  const {upsellData, telemetryLogs, mode} = useReleasesUpsell()
  const handlePrimaryClick = useCallback(() => {
    telemetryLogs.panelPrimaryClicked()
  }, [telemetryLogs])

  const handleSecondaryClick = useCallback(() => {
    telemetryLogs.panelSecondaryClicked()
  }, [telemetryLogs])

  if (!upsellData || mode === 'default') {
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
        <Container className={panel} width={0} padding={4} paddingY={1}>
          <Flex alignItems={'center'} flexDirection="column">
            <ReleaseIllustration />
            <Box paddingTop={2}>
              <UpsellPanel
                align="center"
                layout="vertical"
                data={{...upsellData, image: null}}
                border={false}
                onPrimaryClick={handlePrimaryClick}
                onSecondaryClick={handleSecondaryClick}
              />
            </Box>
          </Flex>
        </Container>
      </motion.div>
    </Flex>
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
