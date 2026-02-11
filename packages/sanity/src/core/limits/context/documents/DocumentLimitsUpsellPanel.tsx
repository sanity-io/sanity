import {Container, Flex} from '@sanity/ui'
import {motion} from 'motion/react'
import {useCallback} from 'react'

import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {UpsellPanel} from '../../../studio/upsell/UpsellPanel'
import {useDocumentLimitsUpsellContext} from './DocumentLimitUpsellProvider'

export function DocumentLimitsUpsellPanel() {
  const {upsellData, telemetryLogs} = useDocumentLimitsUpsellContext()

  const handlePrimaryButtonClick = useCallback(() => {
    telemetryLogs.panelPrimaryClicked()
  }, [telemetryLogs])

  const handleSecondaryButtonClick = useCallback(() => {
    telemetryLogs.panelSecondaryClicked()
  }, [telemetryLogs])

  if (!upsellData) {
    return <LoadingBlock title="Loading documents limit" showText />
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
