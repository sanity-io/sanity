import {CloseIcon, LockIcon, TransferIcon} from '@sanity/icons'
import {
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
import {type TFunction} from 'i18next'
import {type ComponentProps, type ComponentType, useCallback, useMemo} from 'react'
import {
  type DocumentLayoutProps,
  formatRelativeLocalePublishDate,
  getDraftId,
  getPublishedId,
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  getVersionFromId,
  getVersionId,
  isDraftId,
  isPublishedId,
  isReleaseDocument,
  isReleaseScheduledOrScheduling,
  ReleaseAvatar,
  type ReleaseDocument,
  useActiveReleases,
  useDocumentVersions,
  useEditState,
  useTranslation,
} from 'sanity'
import {styled} from 'styled-components'

import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {structureLocaleNamespace} from '../../../i18n'
import {useDiffViewRouter} from '../../hooks/useDiffViewRouter'
import {useDiffViewState} from '../../hooks/useDiffViewState'

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
  {state: 'pending' | 'ready' | 'error'} & Pick<DocumentLayoutProps, 'documentId'>
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

  const onSelectPreviousRelease = useCallback(
    (selectedDocumentId: string): void => {
      if (typeof documents?.previous !== 'undefined') {
        navigateDiffView({
          previousDocument: {
            ...documents.previous,
            id: selectedDocumentId,
          },
        })
      }
    },
    [documents?.previous, navigateDiffView],
  )

  const onSelectNextRelease = useCallback(
    (selectedDocumentId: string): void => {
      if (typeof documents?.next !== 'undefined') {
        navigateDiffView({
          nextDocument: {
            ...documents.next,
            id: selectedDocumentId,
          },
        })
      }
    },
    [documents?.next, navigateDiffView],
  )

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
  onSelectRelease,
  role,
  documentId,
  document,
}) => {
  const {published, draft} = useEditState(getPublishedId(document.id), document.type)
  const selected = useMemo(() => findRelease(document.id, releases), [document.id, releases])
  const {t: tStructure} = useTranslation(structureLocaleNamespace)
  const {t: tCore} = useTranslation()

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
          {...getMenuButtonProps({selected, tCore, tStructure})}
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
          {draft && (
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

  const onClick = useCallback(() => {
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
  }, [type, onSelect, documentId, release?._id])

  if (type) {
    const tone: ButtonTone = type === 'published' ? 'positive' : 'caution'

    return (
      <MenuItem padding={1} paddingRight={3} onClick={onClick} pressed={isSelected}>
        <Flex gap={1}>
          <ReleaseAvatar padding={2} tone={tone} />
          <Box paddingY={2}>
            <Text size={1} weight="medium">
              {tStructure(['compare-versions.status', type].join('.'))}
            </Text>
          </Box>
        </Flex>
      </MenuItem>
    )
  }

  const tone: ButtonTone = release ? getReleaseTone(release) : 'neutral'

  return (
    <MenuItem padding={1} paddingRight={3} onClick={onClick} pressed={isSelected}>
      <Flex gap={1}>
        <ReleaseAvatar padding={2} tone={tone} />
        <Stack flex={1} paddingY={2} paddingRight={2} space={2}>
          <Text size={1} weight="medium">
            {release.metadata.title || tCore('release.placeholder-untitled-release')}
          </Text>
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
}: {
  selected?: ReleaseDocument | 'published' | 'draft'
  tCore: TFunction
  tStructure: TFunction
}): Pick<ComponentProps<typeof Button>, 'text' | 'tone' | 'icon' | 'iconRight' | 'disabled'> {
  if (typeof selected === 'undefined') {
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
      icon: <ReleaseAvatar padding={1} tone={tone} />,
      iconRight: selected && isReleaseScheduledOrScheduling(selected) ? <LockIcon /> : undefined,
      tone,
    }
  }

  const tone: ButtonTone = selected === 'published' ? 'positive' : 'caution'

  return {
    text: tStructure(['compare-versions.status', selected].join('.')),
    icon: <ReleaseAvatar padding={1} tone={tone} />,
    tone,
  }
}

/**
 * If the provided document id represents a version, find and return the corresponding release
 * document. Otherwise, return a string literal signifying whether the document id represents a
 * published or draft document.
 */
function findRelease(
  documentId: string,
  releases: ReleaseDocument[],
): ReleaseDocument | 'published' | 'draft' | undefined {
  if (isPublishedId(documentId)) {
    return 'published'
  }

  if (isDraftId(documentId)) {
    return 'draft'
  }

  return releases.find(
    ({_id}) => getReleaseIdFromReleaseDocumentId(_id) === getVersionFromId(documentId),
  )
}
