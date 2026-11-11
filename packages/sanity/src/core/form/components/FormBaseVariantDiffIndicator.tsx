import {AnimatePresence, motion} from 'motion/react'
import {type ComponentType, type CSSProperties, type ReactNode, useContext} from 'react'
import {BaseVariantComparisonContext} from 'sanity/_singletons'
import {Flex, Icon, Text} from 'ui5'

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
            <Icon
              size={3}
              icon={<RhombusIcon />}
              style={
                {
                  '--icon-color': 'var(--card-badge-suggest-icon-color)',
                } as CSSProperties
              }
            />
          </Tooltip>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** A glyph inside a chip, on the text line, 4px before the name (the release avatar is a block svg). */
function ChipGlyph({children}: {children: ReactNode}) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-flex',
        marginInline: '2px 4px',
        transform: 'scale(0.7)',
        verticalAlign: '-3px',
      }}
    >
      {children}
    </span>
  )
}

/**
 * The mark's tooltip, as chips: "Differs from [Default] [Draft]". It names the base variant and the slot
 * of the version actually compared (Published, Draft or the release), which can be a fallback below the
 * slot in view.
 */
function DiffersFrom() {
  const {t} = useTranslation()
  const compared = useContext(BaseVariantComparisonContext)
  const {selectedPerspective} = usePerspective()
  const release =
    isReleaseDocument(selectedPerspective) &&
    compared &&
    compared !== 'drafts' &&
    compared !== 'published'
      ? selectedPerspective
      : undefined
  const slot = release ? (
    <VersionInlineBadge $tone={getReleaseTone(release)}>
      <ChipGlyph>
        <ReleaseAvatarIcon release={release} />
      </ChipGlyph>
      {release.metadata.title || t('release.placeholder-untitled-release')}
    </VersionInlineBadge>
  ) : compared === 'published' ? (
    <VersionInlineBadge $tone="positive">
      <ChipGlyph>
        <ReleaseAvatarIcon release={PUBLISHED} />
      </ChipGlyph>
      {t('release.chip.published')}
    </VersionInlineBadge>
  ) : (
    <VersionInlineBadge $tone="caution">
      <ChipGlyph>
        <ReleaseAvatarIcon release={LATEST} />
      </ChipGlyph>
      {t('release.chip.draft')}
    </VersionInlineBadge>
  )
  return (
    <Flex
      alignItems="center"
      data-testid="base-variant-diff-tooltip"
      gap={1}
      padding={1}
      flexWrap="wrap"
    >
      <Text muted size={1}>
        {t('changes.from-base-variant.differs-from')}
      </Text>
      <Text size={1}>
        <VersionInlineBadge $tone="default">{t('document-group.base-variant')}</VersionInlineBadge>
      </Text>
      <Text size={1}>{slot}</Text>
    </Flex>
  )
}
