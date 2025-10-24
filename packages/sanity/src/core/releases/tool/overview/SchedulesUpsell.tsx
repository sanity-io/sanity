import {Container} from '@sanity/ui'
import {motion} from 'framer-motion'
import {useCallback} from 'react'
import {styled} from 'styled-components'

import {useSingleDocReleaseEnabled} from '../../../singleDocRelease/context/SingleDocReleaseEnabledProvider'
import {useSingleDocReleaseUpsell} from '../../../singleDocRelease/context/SingleDocReleaseUpsellProvider'
import {UpsellPanel} from '../../../studio/upsell/UpsellPanel'
import {useReleasesUpsell} from '../../contexts/upsell/useReleasesUpsell'
import {type CardinalityView} from './queryParamUtils'

const Panel = styled(Container)`
  width: auto;
  flex-shrink: 0;
`

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
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      transition={{duration: 0.3, ease: 'easeInOut'}}
    >
      <Panel width={1} padding={4} paddingY={1}>
        <UpsellPanel
          layout="horizontal"
          data={upsellData}
          onPrimaryClick={handlePrimaryClick}
          onSecondaryClick={handleSecondaryClick}
        />
      </Panel>
    </motion.div>
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
    <motion.div
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      transition={{duration: 0.3, ease: 'easeInOut'}}
    >
      <Panel width={1} padding={4} paddingY={1}>
        <UpsellPanel
          layout="horizontal"
          data={upsellData}
          onPrimaryClick={handlePrimaryClick}
          onSecondaryClick={handleSecondaryClick}
        />
      </Panel>
    </motion.div>
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
