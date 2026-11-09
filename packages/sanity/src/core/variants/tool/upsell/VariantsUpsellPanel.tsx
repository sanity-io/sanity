import {motion} from 'motion/react'
import {Suspense, use} from 'react'
import {styled} from 'styled-components'
import {Container, Box, Flex} from 'ui5'

import {NO_UPSELL_DATA} from '../../../hooks/useUpsellData'
import {UpsellPanel} from '../../../studio/upsell/UpsellPanel'
import {useVariantsUpsell} from '../../contexts/upsell/useVariantsUpsell'
import {VariantIllustration} from '../resources/VariantIllustration'

const Panel = styled(Container)`
  width: auto;
  flex-shrink: 0;
`

/**
 * Empty state of the Variants tool when the plan lacks content variants. Same shape as the
 * releases schedules upsell: the variant illustration, then `UpsellPanel` with no cover image
 * (the illustration takes its place). Waits for the upsell content here, at the leaf.
 *
 * @internal
 */
export function VariantsUpsellPanel(): React.JSX.Element {
  return (
    <Suspense>
      <VariantsUpsellPanelContent />
    </Suspense>
  )
}

function VariantsUpsellPanelContent() {
  const {upsellDataPromise, telemetryLogs} = useVariantsUpsell()
  const {upsellData} = upsellDataPromise ? use(upsellDataPromise) : NO_UPSELL_DATA

  if (!upsellData) return null

  return (
    <Flex
      alignItems="center"
      data-testid="variants-upsell-panel"
      flexBasis="0%"
      flexDirection="column"
      flexGrow={1}
      justifyContent="center"
    >
      <motion.div
        animate={{opacity: 1}}
        initial={{opacity: 0}}
        transition={{duration: 0.3, ease: 'easeInOut'}}
      >
        <Panel padding={4} paddingY={1} size={0}>
          <Flex alignItems="center" flexDirection="column">
            <VariantIllustration />
            <Box paddingTop={2}>
              <UpsellPanel
                align="center"
                border={false}
                data={{...upsellData, image: null}}
                layout="vertical"
                onPrimaryClick={telemetryLogs.panelPrimaryClicked}
                onSecondaryClick={telemetryLogs.panelSecondaryClicked}
              />
            </Box>
          </Flex>
        </Panel>
      </motion.div>
    </Flex>
  )
}
