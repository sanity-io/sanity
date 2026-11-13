import {motion} from 'motion/react'
import {Container, Flex} from 'ui5'

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
 * The screen shown in place of a tool that failed on the document limit. When the upsell content
 * cannot be loaded, the error screen is shown instead, so the user is never left with an empty
 * tool area.
 */
export function DocumentLimitsUpsellPanel({error, onReset}: DocumentLimitsUpsellPanelProps) {
  const upsell = useDocumentLimitsUpsellContext()

  return (
    <Flex height="100%" justifyContent="center" alignItems="center" padding={4}>
      <motion.div
        initial={{opacity: 0, scale: 0.95}}
        animate={{opacity: 1, scale: 1}}
        transition={{duration: 0.2}}
      >
        <Container size={0}>
          <UpsellPanel
            upsell={upsell}
            unavailable={<FallbackErrorScreen error={error} onReset={onReset} />}
          />
        </Container>
      </motion.div>
    </Flex>
  )
}
