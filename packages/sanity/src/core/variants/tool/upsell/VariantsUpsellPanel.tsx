import {motion} from 'motion/react'
import {styled} from 'styled-components'
import {Container, Box, Flex} from 'ui5'

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
 * (the illustration takes its place). The panel starts the content request when it mounts.
 *
 * @internal
 */
export function VariantsUpsellPanel(): React.JSX.Element {
  const upsell = useVariantsUpsell()

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
                hideImage
                layout="vertical"
                upsell={upsell}
              />
            </Box>
          </Flex>
        </Panel>
      </motion.div>
    </Flex>
  )
}
