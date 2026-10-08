import {motion} from 'motion/react'
import {Suspense, use, useCallback} from 'react'
import {Container, Flex, Text} from 'ui5'

import {LoadingBlock} from '../../../components/loadingBlock/LoadingBlock'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {UpsellPanel} from '../../../studio/upsell/UpsellPanel'
import {useDocumentLimitsUpsellContext} from './DocumentLimitUpsellProvider'

/**
 * The screen shown in place of a tool that failed on the document limit. Waits for the upsell
 * content behind its own boundary, so the wait never reaches the studio's loading screen.
 */
export function DocumentLimitsUpsellPanel() {
  return (
    <Suspense fallback={<LoadingBlock title="Loading documents limit" showText />}>
      <DocumentLimitsUpsellPanelContent />
    </Suspense>
  )
}

function DocumentLimitsUpsellPanelContent() {
  const {upsellDataPromise, telemetryLogs} = useDocumentLimitsUpsellContext()
  const {upsellData} = use(upsellDataPromise)
  const {t} = useTranslation()

  const handlePrimaryButtonClick = useCallback(() => {
    telemetryLogs.panelPrimaryClicked()
  }, [telemetryLogs])

  const handleSecondaryButtonClick = useCallback(() => {
    telemetryLogs.panelSecondaryClicked()
  }, [telemetryLogs])

  // The content request failed: this panel stands in for the whole tool, so it has to say
  // something rather than leave it blank
  if (!upsellData) {
    return (
      <Flex height="100%" justifyContent="center" alignItems="center" padding={4}>
        <Container size={0}>
          <Text muted size={1}>
            {t('document-limit.unavailable.text')}
          </Text>
        </Container>
      </Flex>
    )
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
