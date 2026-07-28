import {Card, Flex, Text, type BadgeTone} from '@sanity/ui'
import {motion} from 'motion/react'
import {
  forwardRef,
  memo,
  type ForwardRefExoticComponent,
  type RefAttributes,
  type SVGProps,
} from 'react'
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
  type TargetPerspective,
} from 'sanity'
import {styled} from 'styled-components'

import {Tooltip} from '../../../../../ui-components'
import {structureLocaleNamespace} from '../../../../i18n'
import {useDocumentPane} from '../../useDocumentPane'

/**
 * TODO: Replace by the RhombusIcon from @sanity/icons once available.
 */
const RhombusIcon: ForwardRefExoticComponent<
  Omit<SVGProps<SVGSVGElement>, 'ref'> & RefAttributes<SVGSVGElement>
> = forwardRef(function RhombusIcon(props, ref) {
  return (
    <svg
      data-sanity-icon="rhombus"
      width="1em"
      height="1em"
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
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
})

const TargetBadge = styled(Card)`
  display: inline-flex;
  align-items: center;
  flex: none;
`
const BadgeContainer = styled(Flex)`
  user-select: none;
  flex: none;
`

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
      <BadgeContainer gap={2} paddingY={1} paddingRight={2} align="center">
        <ReleaseAvatarIcon release={selectedPerspective} />

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
      <Flex align="center" gap={2}>
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
  const {targetDocumentState} = useDocumentPane()
  const {selectedPerspective, selectedVariant} = usePerspective()
  const {t} = useTranslation(structureLocaleNamespace)

  const isInCurrentTarget =
    targetDocumentState.status === 'ready' && Boolean(targetDocumentState.targetDocument)
  const badgeOpacity = isInCurrentTarget ? 1 : 0.5

  return (
    <Tooltip
      content={t('document-target-badges.not-in-target.tooltip')}
      disabled={isInCurrentTarget}
    >
      <Flex align="center" flex="none" gap={2} paddingRight={1}>
        <motion.div animate={{opacity: badgeOpacity}} transition={{duration: 0.2}}>
          <TargetBadge
            tone={getPerspectiveBadgeTone(selectedPerspective)}
            border
            radius={4}
            data-ui="DocumentTargetPerspectiveBadge"
          >
            <PerspectiveBadgeLabel selectedPerspective={selectedPerspective} />
          </TargetBadge>
        </motion.div>
        {selectedVariant ? (
          <motion.div animate={{opacity: badgeOpacity}} transition={{duration: 0.2}}>
            <TargetBadge tone="suggest" border radius={4} data-ui="DocumentTargetVariantBadge">
              <VariantBadgeLabel variant={selectedVariant} />
            </TargetBadge>
          </motion.div>
        ) : null}
      </Flex>
    </Tooltip>
  )
})
