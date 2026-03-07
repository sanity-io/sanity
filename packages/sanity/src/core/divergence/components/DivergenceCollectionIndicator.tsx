import {EditIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- Indicator requires more fine-grained styling than Studio button
import {Button} from '@sanity/ui'
import {motion} from 'motion/react'
import {type ComponentType, type HTMLProps} from 'react'

import {isPublishedId} from '../../../core/util/draftUtils'
import {Tooltip} from '../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../i18n'
import {type TargetPerspective} from '../../perspective/types'

/**
 * @internal
 */
export interface DivergenceCollectionIndicatorProps extends Pick<
  HTMLProps<HTMLButtonElement>,
  'onClick'
> {
  divergenceCount: number
  upstreamId: string
  upstreamBundle?: TargetPerspective
}

export const DivergenceCollectionIndicator: ComponentType<DivergenceCollectionIndicatorProps> = ({
  divergenceCount,
  upstreamId,
  upstreamBundle,
  ...props
}) => {
  const {t} = useTranslation()

  return (
    <motion.div initial={{opacity: 0}} animate={{opacity: 1}}>
      <Tooltip
        content={t('divergence.unresolved-divergence', {
          count: divergenceCount,
          versionName:
            typeof upstreamBundle === 'string' ? upstreamBundle : upstreamBundle?.metadata.title,
        })}
        portal
      >
        <Button
          {...props}
          aria-label={t('divergence.unresolved-divergence', {
            count: divergenceCount,
            versionName:
              typeof upstreamBundle === 'string' ? upstreamBundle : upstreamBundle?.metadata.title,
          })}
          radius="full"
          // TODO: This should use the `ForkRight` icon, but it hasn't yet been added to `@sanity/icons`.
          icon={EditIcon}
          text={divergenceCount}
          tone={isPublishedId(upstreamId) ? 'positive' : 'suggest'}
          paddingX={3}
          paddingY={2}
        />
      </Tooltip>
    </motion.div>
  )
}
