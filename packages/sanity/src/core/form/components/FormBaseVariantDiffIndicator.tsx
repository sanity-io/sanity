import {UsersIcon} from '@sanity/icons/Users'
import {Flex, Text} from '@sanity/ui'
import {AnimatePresence, motion} from 'motion/react'
import {type ComponentType, type CSSProperties} from 'react'

import {Tooltip} from '../../../ui-components/tooltip/Tooltip'
import {RhombusIcon} from '../../components/temporary-icons/Rhombus'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {usePerspective} from '../../perspective/usePerspective'
import {ReleaseAvatarIcon} from '../../releases/components/ReleaseAvatar'
import {VersionInlineBadge} from '../../releases/components/VersionInlineBadge'
import {isReleaseDocument} from '../../releases/store/types'
import {LATEST, PUBLISHED} from '../../releases/util/const'
import {getReleaseTone} from '../../releases/util/getReleaseTone'
import {type BaseFieldProps} from '../types/fieldProps'

type Props = Pick<BaseFieldProps, 'changedFromBaseVariant'>

export const FormBaseVariantDiffIndicator: ComponentType<Props> = ({changedFromBaseVariant}) => {
  const {t} = useTranslation()

  return (
    <AnimatePresence>
      {changedFromBaseVariant && (
        <motion.div
          data-testid="base-variant-diff-indicator"
          initial={{opacity: 0}}
          exit={{opacity: 0}}
          animate={{opacity: 1}}
        >
          <Tooltip content={<DiffersFrom />} placement="left">
            <Text
              size={3}
              style={
                {
                  '--card-icon-color': 'var(--card-badge-suggest-icon-color)',
                } as CSSProperties
              }
            >
              <RhombusIcon />
            </Text>
          </Tooltip>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * PROPOSED (Faheem, 23 Oct): what the mark means, as chips: "Differs from [All users (Default)] [Draft]", the base variant and the slot
 * (Published, Draft, or the release) the comparison is in. Display chips, not controls; they wrap between chips, never inside one.
 */
function DiffersFrom() {
  const {t} = useTranslation()
  const {selectedPerspective, selectedPerspectiveName} = usePerspective()
  const slot = isReleaseDocument(selectedPerspective) ? (
    <VersionInlineBadge
      $tone={getReleaseTone(selectedPerspective)}
      icon={<ReleaseAvatarIcon release={selectedPerspective} />}
    >
      {selectedPerspective.metadata.title || t('release.placeholder-untitled-release')}
    </VersionInlineBadge>
  ) : selectedPerspectiveName === 'published' ? (
    <VersionInlineBadge $tone="positive" icon={<ReleaseAvatarIcon release={PUBLISHED} />}>
      {t('release.chip.published')}
    </VersionInlineBadge>
  ) : (
    <VersionInlineBadge $tone="caution" icon={<ReleaseAvatarIcon release={LATEST} />}>
      {t('release.chip.draft')}
    </VersionInlineBadge>
  )
  return (
    <Flex align="center" data-testid="base-variant-diff-tooltip" gap={1} padding={1} wrap="wrap">
      <Text muted size={1}>
        {t('changes.from-base-variant.differs-from')}
      </Text>
      <Text size={1}>
        <VersionInlineBadge $tone="default" icon={<UsersIcon />}>
          {t('document-group.base-variant')}
        </VersionInlineBadge>
      </Text>
      <Text size={1}>{slot}</Text>
    </Flex>
  )
}
