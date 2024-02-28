import {CloseIcon, DocumentIcon} from '@sanity/icons'
import {Box, Card, Flex, LayerProvider, Stack, Text} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {type ForwardedRef, forwardRef, useCallback, useMemo, useState} from 'react'
import {
  FormFieldHeaderText,
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

import {Button} from '../../../../../ui-components'
import {type TaskTarget} from '../../types'
import {CurrentWorkspaceProvider} from './CurrentWorkspaceProvider'
import {getTargetValue} from './utils'

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

const Placeholder = styled(Text)((props) => {
  const theme = getTheme_v2(props.theme)
  return `
      color: ${theme.color.input.default.enabled.placeholder};
      margin-left: 3px;
  `
})
const StyledIntentLink = styled(IntentLink)(() => {
  return css`
    text-decoration: none;
    width: 100%;
    overflow: hidden;
    cursor: pointer;
    &:focus {
      box-shadow: 0 0 0 1px var(--card-focus-ring-color);
    }
    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 1px var(--card-focus-ring-color);
    }
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
    <Card>
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
          <Button
            icon={CloseIcon}
            mode="bleed"
            onClick={handleRemove}
            tooltipProps={{content: 'Remove target content'}}
          />
        </Box>
      </Flex>
    </Card>
  )
}

export function TargetField(props: ObjectFieldProps) {
  const [open, setOpen] = useState(false)
  const {dataset, projectId} = useWorkspace()
  const {onChange} = props.inputProps
  const value = props.value as unknown as TaskTarget | undefined

  const handleItemSelect = useCallback(
    (item: {_id: string; _type: string}) => {
      onChange(
        set(
          getTargetValue({
            documentId: item._id,
            documentType: item._type,
            dataset,
            projectId,
          }),
        ),
      )
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
                  <Placeholder size={1}>Search document</Placeholder>
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
