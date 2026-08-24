import {Stack, Text} from '@sanity/ui'
import {type ChangeEvent, type ComponentType, useState} from 'react'

import {LoadingBlock} from '../../components/loadingBlock/LoadingBlock'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../i18n/localeNamespaces'
import {useDocumentGroupSets} from '../hooks/useDocumentGroupSets'
import {type Variant} from '../machines/selectionMachine'
import {Body} from './Body'
import {Container} from './Container'
import {DocumentGroupEntry} from './DocumentGroupEntry'
import {DocumentGroupFilter} from './DocumentGroupFilter'
import {DocumentGroupSet} from './DocumentGroupSet'
import {Header} from './Header'

/**
 * @internal
 */
export interface DocumentGroupPickerProps {
  documentId: string
  /**
   * The id of the document version to mark as currently selected.
   */
  selectedId?: string
  onSelect: (variant: Variant) => void
}

/**
 * An action-free document group picker: renders the same named sets of document versions as the
 * document group inventory (variants, releases, draft/published, anonymous bundles), but purely
 * to guide a selection — no deletion, creation, checkbox selection, or context-menu actions.
 *
 * @internal
 */
export const DocumentGroupPicker: ComponentType<DocumentGroupPickerProps> = ({
  documentId,
  selectedId,
  onSelect,
}) => {
  const {t} = useTranslation(studioLocaleNamespace)
  const {sets, releases, loading, error} = useDocumentGroupSets({documentId})
  const [filterInput, setFilterInput] = useState('')
  const trimmedFilter = filterInput.trim()
  const filterString = trimmedFilter.length > 1 ? trimmedFilter.toLowerCase() : undefined

  return (
    <Container data-testid="document-group-picker">
      <Header>
        <DocumentGroupFilter
          value={filterInput}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setFilterInput(event.currentTarget.value)
          }
        />
      </Header>
      <Body>
        {loading ? (
          <LoadingBlock />
        ) : error ? (
          <Text size={1} muted>
            {t('document-group-inventory.error.load')}
          </Text>
        ) : (
          <Stack gap={5}>
            {sets.map((set) => (
              <DocumentGroupSet key={set.key} name={set.name}>
                {set.variants
                  .filter(({name}) => !filterString || name.toLowerCase().includes(filterString))
                  .map((variant) => (
                    <DocumentGroupEntry
                      key={variant.id}
                      variant={variant}
                      releases={releases}
                      isSelected={selectedId === variant.id}
                      onPrimaryAction={() => onSelect(variant)}
                    />
                  ))}
              </DocumentGroupSet>
            ))}
          </Stack>
        )}
      </Body>
    </Container>
  )
}
