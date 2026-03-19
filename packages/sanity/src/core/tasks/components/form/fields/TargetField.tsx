import {CloseIcon, DocumentIcon} from '@sanity/icons'
import {Box, Card, Flex, LayerProvider, Stack, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ForwardedRef, forwardRef, useCallback, useMemo, useState} from 'react'
import {IntentLink} from 'sanity/router'

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
import * as classes from './TargetField.css'

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
          <IntentLink
            {...linkProps}
            className={classes.styledIntentLink}
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
    <Card className={classes.targetRoot} border radius={2}>
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

        <div data-ui="show-on-hover" className={classes.showOnHover}>
          <Button
            icon={CloseIcon}
            mode="bleed"
            onClick={handleRemove}
            tooltipProps={{content: t('form.input.target.buttons.remove.text')}}
          />
        </div>
      </Flex>
    </Card>
  )
}

export function TargetField(
  props: ObjectFieldProps & {
    mode: FormMode
  },
) {
  const [open, setOpen] = useState(false)
  const {dataset, projectId} = useWorkspace()
  const theme = useThemeV2()
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
                  <Card
                    className={classes.emptyReferenceRoot}
                    border
                    radius={2}
                    paddingX={2}
                    paddingY={3}
                    onClick={handleOpenSearch}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                    style={assignInlineVars({
                      [classes.hoveredBorderColorVar]: theme.color.input.default.hovered.border,
                    })}
                  >
                    <Flex gap={1} justify={'flex-start'} align={'center'}>
                      <Box paddingX={1}>
                        <Text size={1}>
                          <DocumentIcon />
                        </Text>
                      </Box>
                      <Text
                        className={classes.placeholder}
                        size={1}
                        style={assignInlineVars({
                          [classes.placeholderColorVar]: theme.color.input.default.enabled.placeholder,
                        })}
                      >
                        {t('form.input.target.search.placeholder')}
                      </Text>
                    </Flex>
                  </Card>
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
