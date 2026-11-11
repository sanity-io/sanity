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
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {LATEST, PUBLISHED} from '../../releases/util/const'
import {getReleaseDocumentIdFromReleaseId} from '../../releases/util/getReleaseDocumentIdFromReleaseId'
import {getReleaseTone} from '../../releases/util/getReleaseTone'
import {type BaseFieldProps} from '../types/fieldProps'
import {chip, chipGlyph} from './FormBaseVariantDiffIndicator.css'

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

/** A glyph inside a chip, centred on the chip's text line. */
function ChipGlyph({children}: {children: ReactNode}) {
  return (
    <span aria-hidden className={chipGlyph}>
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
  const {byId: activeReleases} = useActiveReleases()
  // `compared` is `'drafts'`, `'published'` or a release id. The release comes from the perspective
  // when it is that release, and otherwise from the active releases, so the chip never reads Draft
  // for a comparison that was not the draft.
  const isReleaseSlot = Boolean(compared) && compared !== 'drafts' && compared !== 'published'
  const comparedReleaseDocumentId = isReleaseSlot
    ? getReleaseDocumentIdFromReleaseId(compared as string)
    : undefined
  const release =
    comparedReleaseDocumentId === undefined
      ? undefined
      : isReleaseDocument(selectedPerspective) &&
          selectedPerspective._id === comparedReleaseDocumentId
        ? selectedPerspective
        : activeReleases.get(comparedReleaseDocumentId)
  const slot = release ? (
    <VersionInlineBadge $tone={getReleaseTone(release)} className={chip}>
      <ChipGlyph>
        <ReleaseAvatarIcon release={release} size="small" />
      </ChipGlyph>
      {release.metadata.title || t('release.placeholder-untitled-release')}
    </VersionInlineBadge>
  ) : isReleaseSlot ? (
    <VersionInlineBadge $tone="default" className={chip}>
      {compared}
    </VersionInlineBadge>
  ) : compared === 'published' ? (
    <VersionInlineBadge $tone="positive" className={chip}>
      <ChipGlyph>
        <ReleaseAvatarIcon release={PUBLISHED} size="small" />
      </ChipGlyph>
      {t('release.chip.published')}
    </VersionInlineBadge>
  ) : (
    <VersionInlineBadge $tone="caution" className={chip}>
      <ChipGlyph>
        <ReleaseAvatarIcon release={LATEST} size="small" />
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
        <VersionInlineBadge $tone="default" className={chip}>
          {t('document-group.base-variant')}
        </VersionInlineBadge>
      </Text>
      <Text size={1}>{slot}</Text>
    </Flex>
  )
}
