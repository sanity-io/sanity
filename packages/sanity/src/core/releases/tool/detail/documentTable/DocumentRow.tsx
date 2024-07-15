import {CheckmarkCircleIcon, EmptyIcon, Progress50Icon} from '@sanity/icons'
import {type SanityDocument} from '@sanity/types'
import {AvatarStack, Box, Card, Flex, Text} from '@sanity/ui'
import {type ForwardedRef, forwardRef, useMemo} from 'react'
import {getPublishedId, RelativeTime, SanityDefaultPreview, UserAvatar} from 'sanity'
import {IntentLink} from 'sanity/router'

import {Tooltip} from '../../../../../ui-components'
import {type BundleDocument} from '../../../../store/bundles/types'
import {DocumentActions} from './DocumentActions'
import {useDocumentPreviewValues} from './useDocumentPreviewValues'
import {type DocumentHistory} from './useReleaseHistory'

const DOCUMENT_STATUS = {
  ready: {
    icon: CheckmarkCircleIcon,
    color: 'var(--card-badge-positive-icon-color)',
    text: 'This document is marked as ready',
  },
  noChanges: {
    icon: EmptyIcon,
    color: '',
    text: "This document doesn't have changes in this release",
  },
  edited: {
    icon: Progress50Icon,
    color: 'var(--card-badge-caution-icon-color)',
    text: 'This document has been edited in this release',
  },
} as const

const DocumentStatus = ({status}: {status: keyof typeof DOCUMENT_STATUS}) => {
  const Icon = DOCUMENT_STATUS[status].icon
  return (
    <Box paddingX={2}>
      <Text muted size={1}>
        <Tooltip content={DOCUMENT_STATUS[status].text} portal>
          {Icon && <Icon style={{color: DOCUMENT_STATUS[status].color}} />}
        </Tooltip>
      </Text>
    </Box>
  )
}

const getDocumentStatus = (document: SanityDocument): keyof typeof DOCUMENT_STATUS => {
  if (document._state === 'ready') {
    return 'ready'
  }
  if (document._updatedAt === document._createdAt) {
    return 'noChanges'
  }
  return 'edited'
}

export function DocumentRow(props: {
  searchTerm: string
  document: SanityDocument
  release: BundleDocument
  history: DocumentHistory | undefined
}) {
  const {
    document,
    release,
    searchTerm,
    history = {
      editors: [],
      createdBy: undefined,
      lastEditedBy: undefined,
    },
  } = props
  const documentId = document._id
  const documentTypeName = document._type
  const {previewValues, isLoading} = useDocumentPreviewValues({document, release})

  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function LinkComponent(linkProps, ref: ForwardedRef<HTMLAnchorElement>) {
        return (
          <IntentLink
            {...linkProps}
            intent="edit"
            params={{
              id: getPublishedId(documentId, true),
              type: documentTypeName,
            }}
            searchParams={[['perspective', `bundle.${release.name}`]]}
            ref={ref}
          />
        )
      }),
    [documentId, documentTypeName, release.name],
  )

  if (searchTerm) {
    // Early return to filter out documents that don't match the search term
    const fallbackTitle = typeof document.title === 'string' ? document.title : 'Untitled'
    const title = typeof previewValues.title === 'string' ? previewValues.title : fallbackTitle
    if (!title.toLowerCase().includes(searchTerm.toLowerCase())) return null
  }

  return (
    <Card border radius={3}>
      <Flex style={{margin: -1}}>
        <Box flex={1} padding={1}>
          <Card as={LinkComponent} radius={2} data-as="a">
            <SanityDefaultPreview {...previewValues} isPlaceholder={isLoading} />
          </Card>
        </Box>

        {/* Created */}
        <Flex align="center" paddingX={2} paddingY={3} sizing="border" style={{width: 130}}>
          {document._createdAt && (
            <Flex align="center" gap={2}>
              {history.createdBy && <UserAvatar size={0} user={history.createdBy} />}
              <Text muted size={1}>
                <RelativeTime time={document._createdAt} useTemporalPhrase minimal />
              </Text>
            </Flex>
          )}
        </Flex>

        {/* Updated */}
        <Flex align="center" paddingX={2} paddingY={3} sizing="border" style={{width: 130}}>
          {document._updatedAt && (
            <Flex align="center" gap={2}>
              {history.lastEditedBy && <UserAvatar size={0} user={history.lastEditedBy} />}
              <Text muted size={1}>
                <RelativeTime time={document._updatedAt} useTemporalPhrase minimal />
              </Text>
            </Flex>
          )}
        </Flex>

        {/* Published */}
        <Flex align="center" paddingX={2} paddingY={3} sizing="border" style={{width: 130}}>
          {/* TODO: How to get the publishedAt date from the document, consider history API */}
          {/* {document._publishedAt && (
            <Flex align="center" gap={2}>
              <UserAvatar size={0} user={document._publishedBy} />
              <Text muted size={1}>
                <RelativeTime time={document._publishedAt} />
              </Text>
            </Flex>
          )} */}

          {!document._publishedAt && (
            <Text muted size={1}>
              &nbsp;
            </Text>
          )}
        </Flex>

        {/* Contributors */}
        <Flex align="center" paddingX={2} paddingY={3} sizing="border" style={{width: 100}}>
          <AvatarStack maxLength={3} size={0}>
            {history.editors?.map((userId) => <UserAvatar key={userId} user={userId} />)}
          </AvatarStack>
        </Flex>

        {/* Status */}
        <Flex align="center" paddingX={2} paddingY={3} sizing="border" style={{width: 60}}>
          <DocumentStatus status={getDocumentStatus(document)} />
        </Flex>

        {/* Actions is empty - don't render yet */}
        <Flex align="center" flex="none" padding={3}>
          <DocumentActions document={document} />
        </Flex>
      </Flex>
    </Card>
  )
}
