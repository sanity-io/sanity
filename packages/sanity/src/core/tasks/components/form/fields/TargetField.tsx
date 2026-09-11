import {CloseIcon} from '@sanity/icons/Close'
import {DocumentIcon} from '@sanity/icons/Document'
import {Card, LayerProvider, Stack, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {useCallback, useMemo, useState, type RefAttributes} from 'react'
import {IntentLink} from 'sanity/router'
import {Flex, Box} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {FormFieldHeaderText} from '../../../../form/components/formField/FormFieldHeaderText'
import {set, unset} from '../../../../form/patch/patch'
import {type ObjectFieldProps} from '../../../../form/types/fieldProps'
import {useSchema} from '../../../../hooks/useSchema'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useDocumentPresence} from '../../../../store/presence/useDocumentPresence'
import {SearchPopover} from '../../../../studio/components/navbar/search/components/SearchPopover'
import {SearchResultItemPreview} from '../../../../studio/components/navbar/search/components/searchResults/item/SearchResultItemPreview'
import {SearchProvider} from '../../../../studio/components/navbar/search/contexts/search/SearchProvider'
import {useWorkspace} from '../../../../studio/workspace'
import {getPublishedId, getVersionFromId} from '../../../../util/draftUtils'
import {tasksLocaleNamespace} from '../../../i18n'
import {type FormMode, type TaskTarget} from '../../../types'
import {CurrentWorkspaceProvider} from '../CurrentWorkspaceProvider'
import {getTargetValue} from '../utils'
import {FieldWrapperRoot} from './FieldWrapper'
import {
  emptyReferenceRoot,
  inputHoveredBorderColorVar,
  inputPlaceholderColorVar,
  placeholder,
  showOnHover,
  styledIntentLink,
  targetRoot,
} from './TargetField.css'

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
      function LinkComponent(
        linkProps: React.ComponentPropsWithoutRef<'a'> & RefAttributes<HTMLAnchorElement>,
      ) {
        const {className, ref, ...rest} = linkProps
        const versionId = getVersionFromId(documentId)

        return (
          <IntentLink
            {...rest}
            className={clsx(styledIntentLink, className)}
            intent="edit"
            params={{id: getPublishedId(documentId), type: documentType}}
            ref={ref}
            searchParams={versionId ? [['perspective', versionId]] : undefined}
          />
        )
      },
    [documentId, documentType],
  )
  if (!schemaType) {
    return <Text>{t('form.input.target.error.schema-not-found')}</Text>
  }

  return (
    <Card border className={targetRoot} radius={2} data-testid="task-target-field-preview">
      <Flex gap={1} alignItems={'center'} justifyContent={'space-between'}>
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

        <div className={showOnHover} data-ui="show-on-hover">
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
  const {color} = useThemeV2()
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
              <Stack gap={2}>
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
                    border
                    className={emptyReferenceRoot}
                    radius={2}
                    paddingX={2}
                    paddingY={3}
                    onClick={handleOpenSearch}
                    onKeyDown={handleKeyDown}
                    style={assignInlineVars({
                      [inputHoveredBorderColorVar]: color.input.default.hovered.border,
                    })}
                    tabIndex={0}
                  >
                    <Flex gap={1} justifyContent={'flex-start'} alignItems={'center'}>
                      <Box paddingX={1}>
                        <Text size={1}>
                          <DocumentIcon />
                        </Text>
                      </Box>
                      <Text
                        className={placeholder}
                        size={1}
                        style={assignInlineVars({
                          [inputPlaceholderColorVar]: color.input.default.enabled.placeholder,
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
