import {ArrowRightIcon} from '@sanity/icons/ArrowRight'
import {CloseIcon} from '@sanity/icons/Close'
import {LockIcon} from '@sanity/icons/Lock'
import {RestoreIcon} from '@sanity/icons/Restore'
import {
  Badge,
  // oxlint-disable-next-line no-restricted-imports -- we need more control over how the `Button` component is rendered
  Button,
  // oxlint-disable-next-line no-restricted-imports -- the resolved menu button props are spread onto the `@sanity/ui` Button above
  type ButtonProps,
  type ButtonTone,
} from '@sanity/ui'
import {
  // oxlint-disable-next-line no-restricted-imports -- the `VersionModeHeader` component needs more control over how the `MenuItem` component is rendered
  MenuItem,
} from '@sanity/ui/menu'
// oxlint-disable-next-line @sanity/i18n/no-i18next-import -- figure out how to have the linter be fine with importing types-only
import {type TFunction} from 'i18next'
import {type ComponentType, useMemo} from 'react'
import {
  type DocumentLayoutProps,
  getDraftId,
  getPublishedId,
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  getVersionFromId,
  getVersionId,
  isReleaseDocument,
  isReleaseScheduledOrScheduling,
  isSystemBundleName,
  LATEST,
  PUBLISHED,
  ReleaseAvatar,
  type ReleaseDocument,
  ReleaseTitle,
  type TargetPerspective,
  useActiveReleases,
  useDocumentVersions,
  useEditState,
  useFormatRelativeLocalePublishDate,
  useTranslation,
  useWorkspace,
} from 'sanity'
import {Text, Box, Flex, Icon} from 'ui5'

import {Menu} from '../../../../ui-components/menu/Menu'
import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {structureLocaleNamespace} from '../../../i18n'
import {useDiffViewRouter} from '../../hooks/useDiffViewRouter'
import {useDiffViewState} from '../../hooks/useDiffViewState'
import {findRelease} from '../../utils/findRelease'
import {DocumentGroupPickerMenu} from './DocumentGroupPickerMenu'
import {versionModeHeaderLayout, versionModeHeaderLayoutSection} from './VersionModeHeader.css'

/**
 * The header component that is rendered when diff view is being used to compare versions of a
 * document.
 *
 * @internal
 */
export const VersionModeHeader: ComponentType<
  {
    state: 'pending' | 'ready' | 'error'
    /** Whether the Changes and History panel is open, and the header button that toggles it */
    changesPanelOpen?: boolean
    onToggleChangesPanel?: () => void
  } & Pick<DocumentLayoutProps, 'documentId'>
> = ({documentId, state, changesPanelOpen = false, onToggleChangesPanel}) => {
  const {t} = useTranslation(structureLocaleNamespace)
  const {data: documentVersions} = useDocumentVersions({documentId})
  const {exitDiffView, navigateDiffView} = useDiffViewRouter()
  const {documents} = useDiffViewState()
  const activeReleases = useActiveReleases()
  const releasesIds = documentVersions.flatMap((id) => getVersionFromId(id) ?? [])
  const {beta} = useWorkspace()
  const hasDocumentGroupInventory = beta?.documentGroupInventory?.enabled === true

  const releases = useMemo(() => {
    return activeReleases.data.filter((release) => {
      const releaseId = getReleaseIdFromReleaseDocumentId(release._id)
      return typeof releaseId !== 'undefined' && releasesIds.includes(releaseId)
    })
  }, [activeReleases.data, releasesIds])

  const releasesState = fetchingState(activeReleases)

  const onSelectPreviousRelease = (selectedDocumentId: string): void => {
    if (typeof documents?.previous !== 'undefined') {
      navigateDiffView({
        previousDocument: {
          ...documents.previous,
          id: selectedDocumentId,
        },
      })
    }
  }

  const onSelectNextRelease = (selectedDocumentId: string): void => {
    // Before anything is picked the next side has no document; it compares within the same group,
    // so it takes the previous side's type
    const nextType = documents?.next?.type ?? documents?.previous?.type
    if (typeof nextType !== 'undefined') {
      navigateDiffView({
        nextDocument: {
          type: nextType,
          id: selectedDocumentId,
        },
      })
    }
  }

  return (
    <header className={versionModeHeaderLayout}>
      <div className={versionModeHeaderLayoutSection}>
        <Box padding={4}>
          <Text as="h1" size={1} muted trim={true}>
            {t('compare-versions.title')}
          </Text>
        </Box>
        <Flex alignItems="center" gap={2} style={{minWidth: 0}}>
          <Text size={1} muted data-testid="diff-view-side-label-previous">
            {t('compare-versions.side.reference')}
          </Text>
          {typeof documents?.previous !== 'undefined' &&
            (hasDocumentGroupInventory ? (
              <DocumentGroupPickerMenu
                role="previous"
                document={documents.previous}
                onSelectDocument={onSelectPreviousRelease}
              />
            ) : (
              // oxlint-disable-next-line no-deprecated -- Remove once `beta.documentGroupInventory.enabled` is not optional.
              <VersionMenu
                releases={releases}
                releasesState={releasesState}
                onSelectRelease={onSelectPreviousRelease}
                role="previous"
                documentId={documentId}
                state={state}
                document={documents.previous}
              />
            ))}
        </Flex>
      </div>
      <Flex alignItems="center" paddingX={3}>
        {/* The right side shows its changes against the left, so the two read as a direction,
            not as a swap (the menu item keeps its compare icon) */}
        <Icon size={1} icon={ArrowRightIcon} style={{margin: '-0.375rem'}} />
      </Flex>
      <div className={versionModeHeaderLayoutSection}>
        <Flex alignItems="center" gap={2} style={{minWidth: 0}}>
          <Text size={1} muted data-testid="diff-view-side-label-next">
            {t('compare-versions.side.compared')}
          </Text>
          {hasDocumentGroupInventory && typeof documents?.previous !== 'undefined' ? (
            <DocumentGroupPickerMenu
              role="next"
              // Empty until something is picked: the picker lists the previous side's group
              document={documents.next ?? {type: documents.previous.type}}
              groupDocumentId={documents.previous.id}
              onSelectDocument={onSelectNextRelease}
            />
          ) : (
            typeof documents?.next !== 'undefined' && (
              // oxlint-disable-next-line no-deprecated -- Remove once `beta.documentGroupInventory.enabled` is not optional.
              <VersionMenu
                releases={releases}
                releasesState={releasesState}
                onSelectRelease={onSelectNextRelease}
                role="next"
                documentId={documentId}
                state={state}
                document={documents.next}
              />
            )
          )}
        </Flex>
        <Box
          padding={3}
          style={{
            justifySelf: 'end',
          }}
        >
          {onToggleChangesPanel ? (
            <Button
              aria-label={t('compare-versions.panel.toggle')}
              aria-pressed={changesPanelOpen}
              data-testid="comparison-changes-panel-toggle"
              disabled={typeof documents?.next === 'undefined'}
              icon={RestoreIcon}
              mode="bleed"
              onClick={onToggleChangesPanel}
              padding={2}
              selected={changesPanelOpen}
            />
          ) : null}
          <Button icon={CloseIcon} mode="bleed" onClick={exitDiffView} padding={2} />
        </Box>
      </div>
    </header>
  )
}

interface VersionMenuProps {
  state: 'pending' | 'ready' | 'error'
  releases: ReleaseDocument[]
  releasesState: 'pending' | 'ready' | 'error'
  role: 'previous' | 'next'
  onSelectRelease: (releaseId: string) => void
  documentId: string
  document: {
    type: string
    id: string
  }
}

/**
 *
 * @deprecated Use `DocumentGroupPickerMenu` instead.
 * Remove once `beta.documentGroupInventory.enabled` is not optional.
 */
const VersionMenu: ComponentType<VersionMenuProps> = ({
  releases = [],
  releasesState,
  onSelectRelease,
  role,
  documentId,
  document,
}) => {
  // No `getTargetScopeId(useTargetDocumentState())` here: this menu inspects the draft/published pair of the
  // specific document selected for the diff pane, independent of the selected perspective.
  const {published, draft} = useEditState(getPublishedId(document.id), document.type)
  const selected = useMemo(() => findRelease(document.id, releases), [document.id, releases])
  const {t: tStructure} = useTranslation(structureLocaleNamespace)
  const {t: tCore} = useTranslation()

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  if (releasesState === 'error') {
    return (
      <Badge tone="critical" radius={3}>
        {tStructure('compare-version.error.loadReleases.title')}
      </Badge>
    )
  }

  return (
    <MenuButton
      id={role}
      button={
        <Button
          type="button"
          mode="bleed"
          padding={2}
          paddingRight={3}
          radius="full"
          selected
          {...getMenuButtonProps({selected, tCore, tStructure, releasesState})}
        />
      }
      menu={
        <Menu>
          {published && (
            <VersionMenuItem
              type="published"
              onSelect={onSelectRelease}
              isSelected={selected === 'published'}
              documentId={documentId}
            />
          )}
          {isDraftModelEnabled && draft && (
            <VersionMenuItem
              type="draft"
              onSelect={onSelectRelease}
              isSelected={selected === 'draft'}
              documentId={documentId}
            />
          )}
          {releases.map((release) => (
            <VersionMenuItem
              key={release._id}
              release={release}
              onSelect={onSelectRelease}
              isSelected={typeof selected !== 'string' && selected?._id === release._id}
              documentId={documentId}
            />
          ))}
        </Menu>
      }
    />
  )
}

type VersionMenuItemProps = {
  onSelect: (releaseId: string) => void
  isSelected?: boolean
  documentId: string
} & (
  | {
      release: ReleaseDocument
      type?: never
    }
  | {
      type: 'published' | 'draft'
      release?: never
    }
)

const VersionMenuItem: ComponentType<VersionMenuItemProps> = ({
  type,
  release,
  onSelect,
  isSelected,
  documentId,
}) => {
  const {t: tCore} = useTranslation()
  const {t: tStructure} = useTranslation(structureLocaleNamespace)
  const formatPublishDate = useFormatRelativeLocalePublishDate()

  const onClick = () => {
    if (type === 'draft') {
      onSelect(getDraftId(documentId))
      return
    }

    if (type === 'published') {
      onSelect(getPublishedId(documentId))
      return
    }

    if (typeof release?._id !== 'undefined') {
      onSelect(getVersionId(documentId, getReleaseIdFromReleaseDocumentId(release._id)))
    }
  }

  if (type) {
    const releasePerspective = type === 'published' ? PUBLISHED : LATEST

    return (
      <MenuItem padding={1} paddingRight={3} onClick={onClick} pressed={isSelected}>
        <Flex gap={1}>
          <ReleaseAvatar padding={2} release={releasePerspective} />
          <Box paddingY={2}>
            <Text
              size={1}
              weight="medium"
              style={{color: 'var(--card-fg-color)'}}
              as="div"
              trim={true}
            >
              {tStructure(['compare-versions.status', type].join('.'))}
            </Text>
          </Box>
        </Flex>
      </MenuItem>
    )
  }

  return (
    <MenuItem padding={1} paddingRight={3} onClick={onClick} pressed={isSelected}>
      <Flex gap={1}>
        <ReleaseAvatar padding={2} release={release} />
        <Flex
          flexBasis="0%"
          flexGrow={1}
          paddingY={2}
          paddingRight={2}
          gap={2}
          flexDirection="column"
        >
          <ReleaseTitle
            title={release.metadata.title}
            fallback={tCore('release.placeholder-untitled-release')}
            textProps={{size: 1, weight: 'medium'}}
          />
          {['asap', 'undecided'].includes(release.metadata.releaseType) && (
            <Text size={1} style={{color: 'var(--card-muted-fg-color)'}} as="div" trim={true}>
              {tCore(`release.type.${release.metadata.releaseType}`)}
            </Text>
          )}
          {release.metadata.releaseType === 'scheduled' && (
            <Text size={1} style={{color: 'var(--card-muted-fg-color)'}} as="div" trim={true}>
              {formatPublishDate(release)}
            </Text>
          )}
        </Flex>
        <Flex flexBasis="auto" flexGrow={0} flexShrink={0}>
          {isReleaseScheduledOrScheduling(release) && (
            <Box padding={2}>
              <Icon size={1} icon={LockIcon} style={{margin: '-0.375rem'}} />
            </Box>
          )}
        </Flex>
      </Flex>
    </MenuItem>
  )
}

function getMenuButtonProps({
  selected,
  tCore,
  tStructure,
  releasesState,
}: {
  releasesState: 'pending' | 'ready'
  selected?: TargetPerspective
  tCore: TFunction
  tStructure: TFunction
}): Pick<ButtonProps, 'text' | 'tone' | 'icon' | 'iconRight' | 'disabled'> {
  if (releasesState === 'pending') {
    return {
      text: tCore('common.loading'),
      tone: 'neutral',
      disabled: true,
    }
  }

  if (isReleaseDocument(selected)) {
    const tone: ButtonTone = selected ? getReleaseTone(selected) : 'neutral'

    return {
      text: selected?.metadata.title || tCore('release.placeholder-untitled-release'),
      icon: <ReleaseAvatar padding={1} release={selected} />,
      iconRight: selected && isReleaseScheduledOrScheduling(selected) ? <LockIcon /> : undefined,
      tone,
    }
  }

  if (isSystemBundleName(selected)) {
    const tone: ButtonTone = selected === 'published' ? 'positive' : 'caution'
    const releasePerspective = selected === 'published' ? PUBLISHED : LATEST

    return {
      text: tStructure(['compare-versions.status', selected].join('.')),
      icon: <ReleaseAvatar padding={1} release={releasePerspective} />,
      tone,
    }
  }

  return {
    text: selected,
    // oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals
    icon: <ReleaseAvatar padding={1} releaseType="undecided" />,
    tone: 'neutral',
  }
}

function fetchingState({
  loading,
  error,
}: {
  loading: boolean
  error?: Error
}): 'pending' | 'ready' | 'error' {
  if (loading) {
    return 'pending'
  }

  if (typeof error !== 'undefined') {
    return 'error'
  }

  return 'ready'
}
