import {lazy, Suspense, use, useCallback} from 'react'
import {Container, Flex} from 'ui5'

import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {FallbackErrorScreen} from '../../../studio/screens/FallbackErrorScreen'
import {panel} from './DocumentLimitsUpsellPanel.css'
import {useDocumentLimitsUpsellContext} from './DocumentLimitUpsellProvider'

// The studio layout renders this panel only once a tool fails on the document limit
const UpsellPanel = lazy(() => import('../../../studio/upsell/UpsellPanel.lazy'))

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
      <div className={panel}>
        <Container size={0}>
          <UpsellPanel
            data={upsellData}
            onPrimaryClick={handlePrimaryButtonClick}
            onSecondaryClick={handleSecondaryButtonClick}
          />
        </Container>
      </div>
    </Flex>
  )
}
