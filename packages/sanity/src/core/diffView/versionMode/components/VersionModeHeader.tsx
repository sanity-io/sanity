import {CloseIcon, LockIcon, TransferIcon} from '@sanity/icons'
import {
  Box,
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
import {styled} from 'styled-components'

import {Button} from '../../../../ui-components/button/Button'
import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {type DocumentLayoutProps} from '../../../config/types'
import {useEditState} from '../../../hooks/useEditState'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {ReleaseAvatar} from '../../../releases/components/ReleaseAvatar'
import {useDocumentVersions} from '../../../releases/hooks/useDocumentVersions'
import {isReleaseDocument, type ReleaseDocument} from '../../../releases/store/types'
import {getReleaseIdFromReleaseDocumentId} from '../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {getReleaseTone} from '../../../releases/util/getReleaseTone'
import {
  formatRelativeLocalePublishDate,
  isReleaseScheduledOrScheduling,
} from '../../../releases/util/util'
import {
  getDraftId,
  getPublishedId,
  getVersionFromId,
  getVersionId,
  isDraftId,
  isPublishedId,
} from '../../../util/draftUtils'
import {useDiffViewRouter} from '../../hooks/useDiffViewRouter'
import {useDiffViewState} from '../../hooks/useDiffViewState'
import {diffViewLocaleNamespace} from '../../i18n'

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
  const {t} = useTranslation(diffViewLocaleNamespace)
  const {data: releases} = useDocumentVersions({documentId})
  const {exitDiffView, navigateDiffView} = useDiffViewRouter()
  const {documents} = useDiffViewState()

  const onSelectPreviousRelease = useCallback(
    (selectedDocumentId: string): void => {
      if (typeof documents?.previous !== 'undefined') {
        navigateDiffView({
          previousDocument: {
            ...documents?.previous,
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
          <Button
            icon={CloseIcon}
            mode="bleed"
            onClick={exitDiffView}
            padding={2}
            tooltipProps={null}
          />
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
  const {t} = useTranslation(diffViewLocaleNamespace)

  return (
    <MenuButton
      id={role}
      button={
        <Button
          type="button"
          mode="bleed"
          padding={2}
          paddingRight={3}
          round
          selected
          tooltipProps={null}
          {...getMenuButtonProps({selected, t})}
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
  const {t} = useTranslation(diffViewLocaleNamespace)

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
      <MenuItem padding={1} onClick={onClick} pressed={isSelected}>
        <Flex gap={1}>
          <ReleaseAvatar padding={2} tone={tone} />
          <Box paddingY={2}>
            <Text size={1} weight="medium">
              {t(['compare-versions.status', type].join('.'))}
            </Text>
          </Box>
        </Flex>
      </MenuItem>
    )
  }

  const tone: ButtonTone = release ? getReleaseTone(release) : 'neutral'

  return (
    <MenuItem padding={1} onClick={onClick} pressed={isSelected}>
      <Flex gap={1}>
        <ReleaseAvatar padding={2} tone={tone} />
        <Stack flex={1} paddingY={2} paddingRight={2} space={2}>
          <Text size={1} weight="medium">
            {release.metadata.title}
          </Text>
          {['asap', 'undecided'].includes(release.metadata.releaseType) && (
            <Text muted size={1}>
              {t(`release.type.${release.metadata.releaseType}`)}
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
  t,
}: {
  selected?: ReleaseDocument | 'published' | 'draft'
  t: TFunction
}): Pick<ComponentProps<typeof Button>, 'text' | 'tone' | 'icon' | 'iconRight'> {
  if (isReleaseDocument(selected)) {
    const tone: ButtonTone = selected ? getReleaseTone(selected) : 'neutral'

    return {
      text: selected?.metadata.title,
      icon: <ReleaseAvatar padding={1} tone={tone} />,
      iconRight: selected && isReleaseScheduledOrScheduling(selected) ? <LockIcon /> : undefined,
      tone,
    }
  }

  const tone: ButtonTone = selected === 'published' ? 'positive' : 'caution'

  return {
    text: t(['compare-versions.status', selected].join('.')),
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
