import {CheckmarkCircleIcon, EmptyIcon, Progress50Icon} from '@sanity/icons'
import {type SanityDocument} from '@sanity/types'
import {AvatarStack, Box, Card, Flex, Text} from '@sanity/ui'
import {
  type Dispatch,
  type ForwardedRef,
  forwardRef,
  type SetStateAction,
  useEffect,
  useMemo,
} from 'react'
import {useObservable} from 'react-rx'
import {
  getPreviewStateObservable,
  getPreviewValueWithFallback,
  getPublishedId,
  RelativeTime,
  SanityDefaultPreview,
  type SchemaType,
  useDocumentPreviewStore,
  UserAvatar,
  useSchema,
} from 'sanity'
import {IntentLink} from 'sanity/router'

import {Tooltip} from '../../../../../ui-components'
import {type BundleDocument} from '../../../../store/bundles/types'
import {useVersionHistory} from './useVersionHistory'

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

export function DocumentRow(props: {
  document: SanityDocument
  release: BundleDocument
  setCollaborators: Dispatch<SetStateAction<string[]>>
}) {
  const {document, release, setCollaborators} = props
  const documentId = document._id
  const documentTypeName = document._type
  const schema = useSchema()
  const schemaType = schema.get(documentTypeName) as SchemaType | undefined
  if (!schemaType) {
    throw new Error(`Schema type "${documentTypeName}" not found`)
  }

  const perspective = release.name
  const title = 'Document'
  const documentPreviewStore = useDocumentPreviewStore()

  const previewStateObservable = useMemo(
    () =>
      getPreviewStateObservable(documentPreviewStore, schemaType, documentId, title, perspective),
    [documentId, documentPreviewStore, perspective, schemaType],
  )

  const {draft, published, version, isLoading} = useObservable(previewStateObservable, {
    draft: null,
    isLoading: true,
    published: null,
  })

  const history = useVersionHistory(documentId, document?._rev)

  useEffect(() => {
    setCollaborators((pre) => Array.from(new Set([...pre, ...history.editors])))
  }, [history.editors, setCollaborators])

  const LinkComponent = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function LinkComponent(linkProps, ref: ForwardedRef<HTMLAnchorElement>) {
        return (
          // eslint-disable-next-line react/jsx-no-undef
          <IntentLink
            {...linkProps}
            intent="edit"
            params={{
              id: getPublishedId(documentId, true),
              type: documentTypeName,
              perspective: `bundle.${release.name}`,
            }}
            ref={ref}
          />
        )
      }),
    [documentId, documentTypeName, release.name],
  )

  const status =
    // eslint-disable-next-line no-nested-ternary
    document._state === 'ready'
      ? 'ready'
      : document._updatedAt === document._createdAt
        ? 'noChanges'
        : 'edited'

  return (
    <Card border radius={3}>
      <Flex style={{margin: -1}}>
        <Box flex={1} padding={1}>
          <Card as={LinkComponent} radius={2} data-as="a">
            <SanityDefaultPreview
              {...getPreviewValueWithFallback({
                value: document,
                draft,
                published,
                version,
                perspective,
              })}
              isPlaceholder={isLoading}
            />
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
          <DocumentStatus status={status} />
        </Flex>

        {/* Actions is empty - don't render yet */}
        {/* <Flex align="center" flex="none" padding={3}>
          <Button
            disabled={Boolean(release?.archived || release?.publishedAt)}
            icon={EllipsisHorizontalIcon}
            mode="bleed"
            padding={2}
          />
        </Flex> */}
      </Flex>
    </Card>
  )
}
