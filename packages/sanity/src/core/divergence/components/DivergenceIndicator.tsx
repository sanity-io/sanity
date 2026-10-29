import {EditIcon} from '@sanity/icons/Edit'
import {motion} from 'motion/react'
import {type ComponentType} from 'react'

import {Button} from '../../../ui-components/button/Button'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {type TargetPerspective} from '../../perspective/types'
import {type DivergenceNavigator, type ReachableDivergence} from '../divergenceNavigator'

/**
 * @internal
 */
export interface DivergenceIndicatorProps {
  divergence: ReachableDivergence
  divergenceNavigator: DivergenceNavigator
  upstreamBundle?: TargetPerspective
}

/**
 * @internal
 */
export const DivergenceIndicator: ComponentType<DivergenceIndicatorProps> = ({
  divergence,
  divergenceNavigator,
  upstreamBundle,
}) => {
  const {t} = useTranslation()

  return (
    <motion.div initial={{opacity: 0}} exit={{opacity: 0}} animate={{opacity: 1}}>
      <Button
        aria-label={t('divergence.unresolved-divergence', {
          count: 1,
          versionName:
            typeof upstreamBundle === 'string' ? upstreamBundle : upstreamBundle?.metadata.title,
        })}
        onClick={() =>
          divergenceNavigator.state.focusedDivergence === divergence.path
            ? divergenceNavigator.blurFocusedDivergence()
            : divergenceNavigator.focusDivergence(divergence.path)
        }
        selected={divergenceNavigator.state.focusedDivergence === divergence.path}
        mode="bleed"
        icon={EditIcon}
        tooltipProps={{
          content: t('divergence.unresolved-divergence', {
            count: 1,
            versionName:
              typeof upstreamBundle === 'string' ? upstreamBundle : upstreamBundle?.metadata.title,
          }),
          placement: 'left',
        }}
        radius="full"
        tone={upstreamBundle === 'published' ? 'positive' : 'suggest'}
      />
    </motion.div>
  )
}
