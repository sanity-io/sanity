import {EditIcon} from '@sanity/icons'
import {type Path} from '@sanity/types'
import {motion} from 'motion/react'
import {type ComponentType} from 'react'
import {styled} from 'styled-components'

import {Button} from '../../../ui-components/button/Button'
import {pathToAnchorIdent} from '../../form/utils/pathToAnchorIdent'
import {useTranslation} from '../../i18n'
import {type TargetPerspective} from '../../perspective/types'
import {type DivergenceNavigator, type ReachableDivergence} from '../divergenceNavigator'

/**
 * @internal
 */
export interface DivergenceIndicatorProps {
  divergence: ReachableDivergence
  divergenceNavigator: DivergenceNavigator
  path: Path
  upstreamBundle?: TargetPerspective
}

/**
 * @internal
 */
export const DivergenceIndicator: ComponentType<DivergenceIndicatorProps> = ({
  divergence,
  divergenceNavigator,
  path,
  upstreamBundle,
}) => {
  const {t} = useTranslation()

  return (
    <Container path={path} initial={{opacity: 0}} exit={{opacity: 0}} animate={{opacity: 1}}>
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
    </Container>
  )
}

const Container = styled(motion.div)<{path: Path}>`
  @supports (position-anchor: --anchor) {
    position: absolute;
    ${({path}) => (path ? `position-anchor: ${pathToAnchorIdent('input', path)};` : undefined)}
    inset-block-start: anchor(center);
    transform: translateY(-50%);
    line-height: 0;
  }
`
