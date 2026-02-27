import {CloseIcon, DocumentIcon} from '@sanity/icons'
import {Box, Card, Flex, LayerProvider, Stack, Text} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {type ForwardedRef, forwardRef, useCallback, useMemo, useState} from 'react'
import {IntentLink} from 'sanity/router'
import {css, styled} from 'styled-components'

import {Button} from '../../../../../ui-components'
import {FormFieldHeaderText, type ObjectFieldProps, set, unset} from '../../../../form'
import {useSchema} from '../../../../hooks'
import {useTranslation} from '../../../../i18n'
import {useDocumentPresence} from '../../../../store'
import {
  SearchPopover,
  SearchProvider,
  SearchResultItemPreview,
  useWorkspace,
} from '../../../../studio'
import {getPublishedId, getVersionFromId} from '../../../../util/draftUtils'
import {tasksLocaleNamespace} from '../../../i18n'
import {type FormMode, type TaskTarget} from '../../../types'
import {CurrentWorkspaceProvider} from '../CurrentWorkspaceProvider'
import {getTargetValue} from '../utils'
import {FieldWrapperRoot} from './FieldWrapper'

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

// This allows to hide and show the remove button on hover or focus.
const TargetRoot = styled(Card)`
  position: relative;
  [data-ui='show-on-hover'] {
    opacity: 0;
    position: absolute;
    right: 6px;
    top: 4px;
    display: flex;
  }
  &:focus-within,
  &:hover {
    padding-right: 36px;
    /* Hides the preview status dot, the button will take it's position. */
    [data-testid='compact-preview__status'] {
      opacity: 0;
    }
    [data-ui='show-on-hover'] {
      transition: opacity 200ms;
      opacity: 1;
    }
  }
`
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

function Preview(props: {value: TaskTarget; handleRemove: () => void}) {
  const {value, handleRemove} = props
  const documentId = value.document._ref
  const documentType = value.documentType
  const schema = useSchema()
  const schemaType = schema.get(value.documentType)
  const documentPresence = useDocumentPresence(documentId)
  const {t} = useTranslation(tasksLocaleNamespace)
  const CardLink = useMemo(
    () =>
      forwardRef(function LinkComponent(linkProps, ref: ForwardedRef<HTMLAnchorElement>) {
        const versionId = getVersionFromId(documentId)

        return (
          <StyledIntentLink
            {...linkProps}
            intent="edit"
            params={{id: getPublishedId(documentId), type: documentType}}
            ref={ref}
            searchParams={versionId ? [['perspective', versionId]] : undefined}
          />
        )
      }),
    [documentId, documentType],
  )
  if (!schemaType) {
    return <Text>{t('form.input.target.error.schema-not-found')}</Text>
  }

  return (
    <TargetRoot border radius={2}>
      <Flex gap={1} align={'center'} justify={'space-between'}>
        <Card as={CardLink} radius={2} data-as="button">
          <SearchResultItemPreview
            documentType={documentType}
            documentId={value.document._ref}
            layout={'compact'}
            presence={documentPresence}
            schemaType={schemaType}
            showBadge={false}
          />
        </Card>

        <div data-ui="show-on-hover">
          <Button
            icon={CloseIcon}
            mode="bleed"
            onClick={handleRemove}
            tooltipProps={{content: t('form.input.target.buttons.remove.text')}}
          />
        </div>
      </Flex>
    </TargetRoot>
  )
}

export function TargetField(
  props: ObjectFieldProps & {
    mode: FormMode
  },
) {
  const [open, setOpen] = useState(false)
  const {dataset, projectId} = useWorkspace()
  const {
    mode,
    inputProps: {onChange},
    value: _propValue,
  } = props

  const value = _propValue as unknown as TaskTarget | undefined

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

  const {t} = useTranslation(tasksLocaleNamespace)

  return (
    <Card borderBottom={mode === 'edit'} paddingBottom={mode === 'edit' ? 4 : 0}>
      <FieldWrapperRoot>
        <LayerProvider zOffset={100}>
          <CurrentWorkspaceProvider>
            <SearchProvider>
              <Stack space={2}>
                {mode === 'create' && (
                  <Box data-ui="fieldHeaderContentBox">
                    <FormFieldHeaderText
                      description={props.description}
                      inputId={props.inputId}
                      title={props.title}
                      validation={props.validation}
                      deprecated={undefined}
                    />
                  </Box>
                )}

                {value ? (
                  <Preview value={value} handleRemove={handleRemove} />
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
                      <Placeholder size={1}>
                        {t('form.input.target.search.placeholder')}
                      </Placeholder>
                    </Flex>
                  </EmptyReferenceRoot>
                )}
              </Stack>
              <SearchPopover
                open={open}
                onClose={handleCloseSearch}
                onItemSelect={handleItemSelect}
                disableIntentLink
              />
            </SearchProvider>
          </CurrentWorkspaceProvider>
        </LayerProvider>
      </FieldWrapperRoot>
    </Card>
  )
}
