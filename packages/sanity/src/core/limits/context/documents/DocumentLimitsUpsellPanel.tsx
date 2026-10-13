import {motion} from 'motion/react'
import {Suspense, use, useCallback} from 'react'
import {Container, Flex} from 'ui5'

import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {FallbackErrorScreen} from '../../../studio/screens/FallbackErrorScreen'
import {UpsellPanel} from '../../../studio/upsell/UpsellPanel'
import {useDocumentLimitsUpsellContext} from './DocumentLimitUpsellProvider'

interface DocumentLimitsUpsellPanelProps {
  /** The document limit error the tool failed on */
  error: Error
  /** Clears the error in the boundary that caught it */
  onReset: () => void
}

/**
 * The screen shown in place of a tool that failed on the document limit. Waits for the upsell
 * content behind its own boundary, so the wait never reaches the studio's loading screen; when
 * that content cannot be loaded, the error itself is shown the way the boundary would have shown
 * it, so the user is never left with an empty tool area.
 */
export function DocumentLimitsUpsellPanel(props: DocumentLimitsUpsellPanelProps) {
  return (
    <Suspense fallback={<LoadingBlock title="Loading documents limit" showText />}>
      <DocumentLimitsUpsellPanelContent {...props} />
    </Suspense>
  )
}

function DocumentLimitsUpsellPanelContent({error, onReset}: DocumentLimitsUpsellPanelProps) {
  const {upsellDataPromise, telemetryLogs} = useDocumentLimitsUpsellContext()
  const {upsellData} = use(upsellDataPromise)

  const handlePrimaryButtonClick = useCallback(() => {
    telemetryLogs.panelPrimaryClicked()
  }, [telemetryLogs])

  const handleSecondaryButtonClick = useCallback(() => {
    telemetryLogs.panelSecondaryClicked()
  }, [telemetryLogs])

  if (!upsellData) {
    return <FallbackErrorScreen error={error} onReset={onReset} />
  }

  return (
    <Flex height="100%" justifyContent="center" alignItems="center" padding={4}>
      <motion.div
        initial={{opacity: 0, scale: 0.95}}
        animate={{opacity: 1, scale: 1}}
        transition={{duration: 0.2}}
      >
        <Container size={0}>
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
