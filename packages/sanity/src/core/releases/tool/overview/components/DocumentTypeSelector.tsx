import {CheckmarkIcon, CloseIcon, DocumentIcon, SearchIcon, WarningOutlineIcon} from '@sanity/icons'
import {isDeprecatedSchemaType} from '@sanity/types'
import {Box, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {type ChangeEvent, useCallback, useMemo, useState} from 'react'

import {Button} from '../../../../../ui-components'
import {useSchema} from '../../../../hooks'
import {useTranslation} from '../../../../i18n'
import {releasesLocaleNamespace} from '../../../i18n'

interface DocumentTypeSelectorProps {
  selectedTypes: string[]
  onChange: (selectedTypes: string[]) => void
  disabled?: boolean
}

interface DocumentTypeOption {
  name: string
  title: string
}

/**
 * A simple document type selector that allows multi-selection of document types.
 *
 * @internal
 */
export function DocumentTypeSelector(props: DocumentTypeSelectorProps): React.JSX.Element {
  const {selectedTypes, onChange, disabled} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const schema = useSchema()
  const [searchQuery, setSearchQuery] = useState('')

  // Get document types from schema
  const documentTypes = useMemo(() => {
    return schema
      .getTypeNames()
      .map((typeName) => schema.get(typeName))
      .filter((type) => type && type.type?.name === 'document' && !isDeprecatedSchemaType(type))
      .map((type) => ({
        name: type!.name,
        title: type!.title || type!.name,
      }))
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [schema])

  // Get selected document type details and separate valid from invalid
  const {validSelectedTypes, invalidSelectedTypes} = useMemo(() => {
    const valid: DocumentTypeOption[] = []
    const invalid: string[] = []

    selectedTypes.forEach((typeName) => {
      const type = documentTypes.find((type) => type.name === typeName)
      if (type) {
        valid.push(type)
      } else {
        invalid.push(typeName)
      }
    })

    return {
      validSelectedTypes: valid,
      invalidSelectedTypes: invalid,
    }
  }, [selectedTypes, documentTypes])

  // Filter types based on search query
  const filteredTypes = useMemo(() => {
    if (!searchQuery.trim()) return documentTypes
    const query = searchQuery.toLowerCase()
    return documentTypes.filter(
      (type) => type.title.toLowerCase().includes(query) || type.name.toLowerCase().includes(query),
    )
  }, [documentTypes, searchQuery])

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.currentTarget.value)
  }, [])

  const handleTypeToggle = useCallback(
    (typeName: string) => {
      if (selectedTypes.includes(typeName)) {
        onChange(selectedTypes.filter((type) => type !== typeName))
      } else {
        onChange([...selectedTypes, typeName])
      }
    },
    [selectedTypes, onChange],
  )

  const handleTypeRemove = useCallback(
    (typeName: string) => {
      onChange(selectedTypes.filter((type) => type !== typeName))
    },
    [selectedTypes, onChange],
  )

  const handleClearAll = useCallback(() => {
    onChange([])
  }, [onChange])

  const totalSelectedCount = validSelectedTypes.length + invalidSelectedTypes.length

  return (
    <Stack space={4}>
      <Stack space={3}>
        <Text as="h4" size={1} weight="semibold">
          {t('template.document-types.title')}
        </Text>
        <Text muted size={1}>
          {t('template.document-types.description')}
        </Text>
      </Stack>

      {/* Selected document types */}
      {totalSelectedCount > 0 && (
        <Stack space={3}>
          <Flex align="center" justify="space-between">
            <Text size={1} weight="medium">
              {t('template.document-types.selected-header', {
                count: totalSelectedCount,
              })}
            </Text>
            {totalSelectedCount > 1 && (
              <Button
                mode="ghost"
                onClick={handleClearAll}
                text={t('template.document-types.clear-all')}
                tone="critical"
                disabled={disabled}
                size="default"
              />
            )}
          </Flex>

          <Stack space={2}>
            {/* Valid selected document types */}
            {validSelectedTypes.map((type) => (
              <Card
                key={type.name}
                padding={3}
                radius={2}
                tone="primary"
                border
                style={{position: 'relative'}}
              >
                <Flex align="center" justify="space-between">
                  <Flex align="center" gap={2}>
                    <DocumentIcon />
                    <Text size={1} weight="medium">
                      {type.title}
                    </Text>
                  </Flex>
                  <Button
                    icon={CloseIcon}
                    mode="bleed"
                    onClick={() => handleTypeRemove(type.name)}
                    size="default"
                    tone="critical"
                    disabled={disabled}
                    tooltipProps={{
                      content: t('template.document-types.remove-type', {
                        type: type.title,
                      }),
                      disabled: disabled,
                    }}
                  />
                </Flex>
              </Card>
            ))}

            {/* Invalid selected document types */}
            {invalidSelectedTypes.map((typeName) => (
              <Card
                key={typeName}
                padding={3}
                radius={2}
                tone="critical"
                border
                style={{position: 'relative'}}
              >
                <Flex align="center" justify="space-between">
                  <Flex align="center" gap={2}>
                    <WarningOutlineIcon />
                    <Stack space={1}>
                      <Text size={1} weight="medium">
                        {typeName}
                      </Text>
                      <Text size={0} muted>
                        {t('template.document-types.type-not-available')}
                      </Text>
                    </Stack>
                  </Flex>
                  <Button
                    icon={CloseIcon}
                    mode="bleed"
                    onClick={() => handleTypeRemove(typeName)}
                    size="default"
                    tone="critical"
                    disabled={disabled}
                    tooltipProps={{
                      content: t('template.document-types.remove-type', {
                        type: typeName,
                      }),
                      disabled: disabled,
                    }}
                  />
                </Flex>
              </Card>
            ))}
          </Stack>
        </Stack>
      )}

      <Card padding={0} border radius={2}>
        {/* Search header */}
        <Box padding={3}>
          <TextInput
            icon={SearchIcon}
            placeholder={t('template.document-types.search-placeholder')}
            value={searchQuery}
            onChange={handleSearchChange}
            disabled={disabled}
            fontSize={1}
          />
        </Box>

        {/* Document types list */}
        <Box style={{height: 240, overflow: 'auto'}}>
          {filteredTypes.length > 0 ? (
            <Stack space={1} padding={1}>
              {filteredTypes.map((type) => {
                const isSelected = selectedTypes.includes(type.name)
                return (
                  <Button
                    key={type.name}
                    iconRight={isSelected ? CheckmarkIcon : undefined}
                    justify="flex-start"
                    mode="bleed"
                    onClick={() => handleTypeToggle(type.name)}
                    width="fill"
                    size="large"
                    text={type.title}
                    tone={isSelected ? 'primary' : 'default'}
                    disabled={disabled}
                  />
                )
              })}
            </Stack>
          ) : (
            <Flex align="center" height="fill" justify="center" padding={4}>
              <Text muted size={1}>
                {searchQuery
                  ? t('template.document-types.no-results')
                  : t('template.document-types.no-types')}
              </Text>
            </Flex>
          )}
        </Box>
      </Card>

      {selectedTypes.length === 0 && (
        <Text muted size={1}>
          {t('template.document-types.empty-state')}
        </Text>
      )}
    </Stack>
  )
}
