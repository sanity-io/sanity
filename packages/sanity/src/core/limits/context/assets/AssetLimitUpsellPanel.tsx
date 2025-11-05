import {Container, Flex} from '@sanity/ui'
import {motion} from 'framer-motion'
import {useCallback} from 'react'

import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {UpsellPanel} from '../../../studio/upsell/UpsellPanel'
import {useAssetLimitsUpsellContext} from './AssetLimitUpsellProvider'

export function AssetLimitsUpsellPanel() {
  const {upsellData, telemetryLogs} = useAssetLimitsUpsellContext()

  const handlePrimaryButtonClick = useCallback(() => {
    telemetryLogs.panelPrimaryClicked()
  }, [telemetryLogs])

  const handleSecondaryButtonClick = useCallback(() => {
    telemetryLogs.panelSecondaryClicked()
  }, [telemetryLogs])

  if (!upsellData) {
    return <LoadingBlock title="Loading assets limit" showText />
  }

  return (
    <Flex height="fill" width="fill" justify="center" align="center" padding={4}>
      <motion.div
        initial={{opacity: 0, scale: 0.95}}
        animate={{opacity: 1, scale: 1}}
        transition={{duration: 0.2}}
      >
        <Container width={0}>
          <UpsellPanel
            data={upsellData}
            onPrimaryClick={handlePrimaryButtonClick}
            onSecondaryClick={handleSecondaryButtonClick}
          />
        </Container>
      </motion.div>
    </Flex>
  )
}
