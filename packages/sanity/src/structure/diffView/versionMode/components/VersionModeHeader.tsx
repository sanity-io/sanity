import {CloseIcon, LockIcon, TransferIcon} from '@sanity/icons'
import {
  Badge,
  Box,
  // eslint-disable-next-line no-restricted-imports -- we need more control over how the `Button` component is rendered
  Button,
  type ButtonTone,
  Flex,
  Menu,
  // eslint-disable-next-line no-restricted-imports -- the `VersionModeHeader` component needs more control over how the `MenuItem` component is rendered
  MenuItem,
  Stack,
  Text,
} from '@sanity/ui'
// eslint-disable-next-line @sanity/i18n/no-i18next-import -- figure out how to have the linter be fine with importing types-only
import {type TFunction} from 'i18next'
import {type ComponentProps, type ComponentType, useMemo} from 'react'
import {
  type DocumentLayoutProps,
  formatRelativeLocalePublishDate,
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
  useTranslation,
  useWorkspace,
} from 'sanity'
import {styled} from 'styled-components'

import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {structureLocaleNamespace} from '../../../i18n'
import {useDiffViewRouter} from '../../hooks/useDiffViewRouter'
import {useDiffViewState} from '../../hooks/useDiffViewState'
import {findRelease} from '../../utils/findRelease'

const VersionModeHeaderLayout = styled.header`
  display: grid;
  grid-area: header;
  grid-template-columns: 1fr min-content 1fr;
  border-block-end: 1px solid var(--card-border-color);
`

const VersionModeHeaderLayoutSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

/**
 * The header component that is rendered when diff view is being used to compare versions of a
 * document.
 *
 * @internal
 */
export const VersionModeHeader: ComponentType<
  {
    state: 'pending' | 'ready' | 'error'
  } & Pick<DocumentLayoutProps, 'documentId'>
> = ({documentId, state}) => {
  const {t} = useTranslation(structureLocaleNamespace)
  const {data: documentVersions} = useDocumentVersions({documentId})
  const {exitDiffView, navigateDiffView} = useDiffViewRouter()
  const {documents} = useDiffViewState()
  const activeReleases = useActiveReleases()
  const releasesIds = documentVersions.flatMap((id) => getVersionFromId(id) ?? [])

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
    if (typeof documents?.next !== 'undefined') {
      navigateDiffView({
        nextDocument: {
          ...documents.next,
          id: selectedDocumentId,
        },
      })
    }
  }

  return (
    <VersionModeHeaderLayout>
      <VersionModeHeaderLayoutSection>
        <Box padding={4}>
          <Text as="h1" size={1} muted>
            {t('compare-versions.title')}
          </Text>
        </Box>
        {typeof documents?.previous !== 'undefined' && (
          <VersionMenu
            releases={releases}
            releasesState={releasesState}
            onSelectRelease={onSelectPreviousRelease}
            role="previous"
            documentId={documentId}
            state={state}
            document={documents.previous}
          />
        )}
      </VersionModeHeaderLayoutSection>
      <Flex align="center" paddingX={3}>
        <Text size={1}>
          <TransferIcon />
        </Text>
      </Flex>
      <VersionModeHeaderLayoutSection>
        {typeof documents?.next !== 'undefined' && (
          <VersionMenu
            releases={releases}
            releasesState={releasesState}
            onSelectRelease={onSelectNextRelease}
            role="next"
            documentId={documentId}
            state={state}
            document={documents.next}
          />
        )}
        <Box
          padding={3}
          style={{
            justifySelf: 'end',
          }}
        >
          <Button icon={CloseIcon} mode="bleed" onClick={exitDiffView} padding={2} />
        </Box>
      </VersionModeHeaderLayoutSection>
    </VersionModeHeaderLayout>
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

const VersionMenu: ComponentType<VersionMenuProps> = ({
  releases = [],
  releasesState,
  onSelectRelease,
  role,
  documentId,
  document,
}) => {
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
            <Text size={1} weight="medium">
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
        <Stack flex={1} paddingY={2} paddingRight={2} space={2} style={{minWidth: 0}}>
          <ReleaseTitle
            title={release.metadata.title}
            fallback={tCore('release.placeholder-untitled-release')}
            textProps={{size: 1, weight: 'medium'}}
          />
          {['asap', 'undecided'].includes(release.metadata.releaseType) && (
            <Text muted size={1}>
              {tCore(`release.type.${release.metadata.releaseType}`)}
            </Text>
          )}
          {release.metadata.releaseType === 'scheduled' && (
            <Text muted size={1}>
              {formatRelativeLocalePublishDate(release)}
            </Text>
          )}
        </Stack>
        <Flex flex="none">
          {isReleaseScheduledOrScheduling(release) && (
            <Box padding={2}>
              <Text size={1}>
                <LockIcon />
              </Text>
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
}): Pick<ComponentProps<typeof Button>, 'text' | 'tone' | 'icon' | 'iconRight' | 'disabled'> {
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
    // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals
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
