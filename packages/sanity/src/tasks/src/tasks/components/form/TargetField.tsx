import {DocumentIcon, LaunchIcon, SyncIcon, TrashIcon} from '@sanity/icons'
import {Box, Card, Flex, LayerProvider, Menu, MenuDivider, Stack, Text} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {type ForwardedRef, forwardRef, useCallback, useMemo, useState} from 'react'
import {
  ContextMenuButton,
  FormFieldHeaderText,
  getPublishedId,
  type ObjectFieldProps,
  SearchPopover,
  SearchProvider,
  SearchResultItemPreview,
  set,
  unset,
  useDocumentPresence,
  useSchema,
  useWorkspace,
} from 'sanity'
import {IntentLink} from 'sanity/router'
import styled, {css} from 'styled-components'

import {MenuButton, MenuItem} from '../../../../../ui-components'
import {type TaskTarget} from '../../types'
import {CurrentWorkspaceProvider} from './CurrentWorkspaceProvider'

const EmptyReferenceRoot = styled(Card)((props) => {
  const theme = getTheme_v2(props.theme)

  return css`
    &:focus {
      border: 1px solid var(--card-focus-ring-color);
    }
    &:focus-visible {
      outline: none;
      border: 1px solid var(--card-focus-ring-color);
    }
    &:hover {
      border-color: ${theme.color.input.default.hovered.border};
    }
  `
})

const StyledIntentLink = styled(IntentLink)(() => {
  return css`
    text-decoration: none;
    width: 100%;
    overflow: hidden;
    cursor: pointer;
  `
})

function Preview(props: {
  value: TaskTarget
  handleRemove: () => void
  handleOpenSearch: () => void
}) {
  const {value, handleOpenSearch, handleRemove} = props
  const documentId = value.document._ref
  const documentType = value.documentType
  const schema = useSchema()
  const schemaType = schema.get(value.documentType)
  const documentPresence = useDocumentPresence(documentId)

  const CardLink = useMemo(
    () =>
      forwardRef(function LinkComponent(linkProps, ref: ForwardedRef<HTMLAnchorElement>) {
        return (
          <StyledIntentLink
            {...linkProps}
            intent="edit"
            params={{id: documentId, type: documentType}}
            ref={ref}
          />
        )
      }),
    [documentId, documentType],
  )

  const OpenLink = useMemo(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-shadow
      forwardRef(function OpenLink(restProps, _ref: ForwardedRef<HTMLAnchorElement>) {
        return (
          <IntentLink
            {...restProps}
            intent="edit"
            params={{id: documentId, type: documentType}}
            target="_blank"
            rel="noopener noreferrer"
            ref={_ref}
          />
        )
      }),
    [documentId, documentType],
  )

  if (!schemaType) {
    return <Text>Schema not found</Text>
  }

  return (
    <Flex gap={1} align={'center'} justify={'space-between'} paddingRight={1}>
      <Card as={CardLink} radius={2} data-as="button">
        <SearchResultItemPreview
          documentId={value.document._ref}
          layout={'compact'}
          presence={documentPresence}
          schemaType={schemaType}
          showBadge={false}
        />
      </Card>
      <Box flex="none">
        <MenuButton
          button={<ContextMenuButton paddingY={3} />}
          id={`reference-menuButton`}
          menu={
            <Menu>
              <MenuItem
                text={'Clear target'}
                tone="critical"
                icon={TrashIcon}
                onClick={handleRemove}
              />
              <MenuItem text={'Replace'} icon={SyncIcon} onClick={handleOpenSearch} />
              <MenuDivider />
              <MenuItem as={OpenLink} data-as="a" text={'Open in new tab'} icon={LaunchIcon} />
            </Menu>
          }
        />
      </Box>
    </Flex>
  )
}

export function TargetField(props: ObjectFieldProps) {
  const [open, setOpen] = useState(false)
  const {dataset, projectId} = useWorkspace()
  const {onChange} = props.inputProps
  const value = props.value as unknown as TaskTarget | undefined

  const handleItemSelect = useCallback(
    (item: {_id: string; _type: string}) => {
      const getTargetValue = (documentType: string, documentId: string): TaskTarget => ({
        documentType: documentType,
        document: {
          _ref: getPublishedId(documentId),
          _type: 'crossDatasetReference',
          _dataset: dataset,
          _projectId: projectId,
          _weak: true,
        },
      })

      onChange(set(getTargetValue(item._type, item._id)))
    },
    [dataset, projectId, onChange],
  )

  const handleRemove = useCallback(() => {
    onChange(unset())
  }, [onChange])

  const handleOpenSearch = useCallback(() => {
    setOpen(true)
  }, [setOpen])

  const handleCloseSearch = useCallback(() => {
    setOpen(false)
  }, [setOpen])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') setOpen(true)
  }, [])

  return (
    <>
      <LayerProvider zOffset={100}>
        <CurrentWorkspaceProvider>
          <Stack space={2}>
            <Box paddingY={2}>
              <FormFieldHeaderText
                description={props.description}
                inputId={props.inputId}
                title={props.title}
                validation={props.validation}
                deprecated={undefined}
              />
            </Box>
            {value ? (
              <Preview
                value={value}
                handleRemove={handleRemove}
                handleOpenSearch={handleOpenSearch}
              />
            ) : (
              <EmptyReferenceRoot
                border
                radius={2}
                paddingX={2}
                paddingY={3}
                onClick={handleOpenSearch}
                onKeyDown={handleKeyDown}
                tabIndex={0}
              >
                <Flex gap={1} justify={'flex-start'} align={'center'}>
                  <Box paddingX={1}>
                    <Text size={1}>
                      <DocumentIcon />
                    </Text>
                  </Box>
                  <Text size={1} muted>
                    Search document
                  </Text>
                </Flex>
              </EmptyReferenceRoot>
            )}
          </Stack>
          <SearchProvider>
            <SearchPopover
              open={open}
              onClose={handleCloseSearch}
              onOpen={handleOpenSearch}
              onItemSelect={handleItemSelect}
            />
          </SearchProvider>
        </CurrentWorkspaceProvider>
      </LayerProvider>
    </>
  )
}
