import {motion} from 'motion/react'
import {type ComponentProps} from 'react'
import {styled} from 'styled-components'
import {Container, Flex} from 'ui5'

import {useSingleDocReleaseEnabled} from '../../../singleDocRelease/context/SingleDocReleaseEnabledProvider'
import {useSingleDocReleaseUpsell} from '../../../singleDocRelease/context/SingleDocReleaseUpsellProvider'
import {UpsellPanel} from '../../../studio/upsell/UpsellPanel'
import {useReleasesUpsell} from '../../contexts/upsell/useReleasesUpsell'
import {ReleaseIllustration} from '../resources/ReleaseIllustration'
import {type CardinalityView} from './queryParamUtils'

const Panel = styled(Container)`
  width: auto;
  flex-shrink: 0;
`

function UpsellIllustrationPanel({upsell}: Pick<ComponentProps<typeof UpsellPanel>, 'upsell'>) {
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
        <Panel size={0} padding={4} paddingY={1}>
          <UpsellPanel
            align="center"
            layout="vertical"
            border={false}
            illustration={<ReleaseIllustration />}
            upsell={upsell}
          />
        </Panel>
      </motion.div>
    </Flex>
  )
}

const SingleDocReleasesUpsell = () => {
  const {mode} = useSingleDocReleaseEnabled()
  const upsell = useSingleDocReleaseUpsell()

  if (mode !== 'upsell') {
    return null
  }
  return <UpsellIllustrationPanel upsell={upsell} />
}

const ReleasesUpsell = () => {
  const upsell = useReleasesUpsell()

  if (upsell.mode === 'default') {
    return null
  }
  return <UpsellIllustrationPanel upsell={upsell} />
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
