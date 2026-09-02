import {Card, Text, type BadgeTone} from '@sanity/ui'
import {motion} from 'motion/react'
import {memo, type RefAttributes, type SVGProps} from 'react'
import {
  ReleaseAvatarIcon,
  ReleaseTitle,
  getReleaseTone,
  getVariantTitle,
  isDraftPerspective,
  isPublishedPerspective,
  isReleaseDocument,
  usePerspective,
  useTranslation,
  type SystemVariant,
  type TargetDocumentState,
  type TargetPerspective,
} from 'sanity'
import {styled} from 'styled-components'
import {Flex} from 'ui5'

import {Tooltip} from '../../../../../ui-components/tooltip/Tooltip'
import {isLiveEditEnabled} from '../../../../components/paneItem/helpers'
import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'
import {
  getBadgeSystemDocument,
  getTargetBadgePerspective,
  isTargetBadgeMissing,
} from './getTargetBadgePerspective'

/**
 * TODO: Replace by the RhombusIcon from Sanity icons once available.
 */
function RhombusIcon(props: SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>) {
  const {ref, ...rest} = props
  return (
    <svg
      data-sanity-icon="rhombus"
      width="1em"
      height="1em"
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
      ref={ref}
    >
      <path
        d="M10.5 3.78L17.22 10.5L10.5 17.22L3.78 10.5L10.5 3.78Z"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  )
}

const TargetBadge = styled(Card)`
  display: inline-flex;
  align-items: center;
  flex: none;
  /* Drawn as an inset shadow instead of the Card border prop so the 1px border
     does not make the badge taller than the box-shadow-bordered VersionChip pills. */
  box-shadow: inset 0 0 0 1px var(--card-border-color);
`
const BadgeContainer = styled(Flex)`
  user-select: none;
  flex: none;
`

const BadgeMotionWrapper = styled(motion.div)`
  flex: none;
`

function getSelectedVariantFromState(
  state: TargetDocumentState,
  selectedVariant: SystemVariant | undefined,
): SystemVariant | undefined {
  if (state.status === 'ready' || state.status === 'variant-missing') {
    return state.variant
  }

  return selectedVariant
}

function getPerspectiveBadgeTone(selectedPerspective: TargetPerspective): BadgeTone {
  if (isDraftPerspective(selectedPerspective)) {
    return 'caution'
  }

  return getReleaseTone(selectedPerspective)
}

const PerspectiveBadgeLabel = memo(function PerspectiveBadgeLabel({
  selectedPerspective,
}: {
  selectedPerspective: TargetPerspective
}) {
  const {t} = useTranslation()

  if (isPublishedPerspective(selectedPerspective) || isDraftPerspective(selectedPerspective)) {
    return (
      <BadgeContainer padding={2}>
        <Text size={1} weight="medium">
          {isPublishedPerspective(selectedPerspective)
            ? t('release.chip.published')
            : t('release.chip.global.drafts')}
        </Text>
      </BadgeContainer>
    )
  }

  if (isReleaseDocument(selectedPerspective)) {
    return (
      <BadgeContainer gap={2} padding={2} alignItems="center">
        <Text size={1}>
          <ReleaseAvatarIcon release={selectedPerspective} />
        </Text>

        <ReleaseTitle
          title={selectedPerspective.metadata?.title}
          fallback={t('release.placeholder-untitled-release')}
          enableTooltip={false}
          textProps={{size: 1, weight: 'medium'}}
        />
      </BadgeContainer>
    )
  }

  return (
    <BadgeContainer padding={2}>
      <Text size={1} textOverflow="ellipsis" weight="medium">
        {t('version.agent-bundle.proposed-changes')}
      </Text>
    </BadgeContainer>
  )
})

const VariantBadgeLabel = memo(function VariantBadgeLabel({variant}: {variant: SystemVariant}) {
  return (
    <BadgeContainer padding={2}>
      <Flex alignItems="center" gap={2}>
        <Text size={0}>
          <RhombusIcon />
        </Text>
        <Text size={1} weight="medium">
          {getVariantTitle(variant)}
        </Text>
      </Flex>
    </BadgeContainer>
  )
})

export const DocumentTargetBadges = memo(function DocumentTargetBadges() {
  const {displayed, schemaType, targetDocumentState} = useDocumentPane()
  const {bundle, selectedPerspective, selectedVariant} = usePerspective()
  const {t} = useTranslation(structureLocaleNamespace)
  const isLiveEdit = isLiveEditEnabled(schemaType)

  const badgePerspective = getTargetBadgePerspective({
    isLiveEdit,
    selectedPerspective,
    document: getBadgeSystemDocument(targetDocumentState, displayed),
  })
  const isTargetMissing = isTargetBadgeMissing({isLiveEdit, state: targetDocumentState, bundle})
  const badgeOpacity = isTargetMissing ? 0.5 : 1
  const selectedVariantBadge = getSelectedVariantFromState(targetDocumentState, selectedVariant)

  return (
    <Tooltip
      content={t('document-target-badges.not-in-target.tooltip')}
      disabled={!isTargetMissing}
    >
      <Flex
        alignItems="center"
        flexBasis="auto"
        flexGrow={0}
        flexShrink={0}
        gap={2}
        paddingRight={1}
      >
        <BadgeMotionWrapper animate={{opacity: badgeOpacity}} transition={{duration: 0.2}}>
          <TargetBadge
            tone={getPerspectiveBadgeTone(badgePerspective)}
            radius={4}
            data-ui="DocumentTargetPerspectiveBadge"
          >
            <PerspectiveBadgeLabel selectedPerspective={badgePerspective} />
          </TargetBadge>
        </BadgeMotionWrapper>
        {selectedVariantBadge ? (
          <BadgeMotionWrapper animate={{opacity: badgeOpacity}} transition={{duration: 0.2}}>
            <TargetBadge tone="suggest" radius={4} data-ui="DocumentTargetVariantBadge">
              <VariantBadgeLabel variant={selectedVariantBadge} />
            </TargetBadge>
          </BadgeMotionWrapper>
        ) : null}
      </Flex>
    </Tooltip>
  )
})
