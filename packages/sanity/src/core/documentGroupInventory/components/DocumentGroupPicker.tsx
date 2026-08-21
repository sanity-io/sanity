import {type ReleaseDocument} from '@sanity/client'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {SearchIcon} from '@sanity/icons/Search'
import {Stack, Text, TextInput} from '@sanity/ui'
import {type ChangeEvent, type ComponentType, useState} from 'react'

import {LoadingBlock} from '../../components/loadingBlock/LoadingBlock'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../i18n/localeNamespaces'
import {ReleaseAvatarIcon} from '../../releases/components/ReleaseAvatar'
import {isAgentBundleName} from '../../store/agent/createAgentBundlesStore'
import {useDocumentGroupSets} from '../hooks/useDocumentGroupSets'
import {type Variant} from '../machines/selectionMachine'
import {Body} from './Body'
import {Container} from './Container'
import {Header} from './Header'
import {StatusBadge} from './VariantSet/StatusBadge'
import {VariantSet} from './VariantSet/VariantSet'
import {VariantSetEntry} from './VariantSet/VariantSetEntry'
import {VariantSetHeader} from './VariantSet/VariantSetHeader'

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
  const {sets, releases, loading} = useDocumentGroupSets({documentId})
  const [filterInput, setFilterInput] = useState('')
  const trimmedFilter = filterInput.trim()
  const filterString = trimmedFilter.length > 1 ? trimmedFilter.toLowerCase() : undefined

  return (
    <Container data-testid="document-group-picker">
      <Header>
        <search>
          <TextInput
            name={t('document-group-inventory.filter-string.label', {
              subject: t('document-group.subject.version_other'),
            })}
            placeholder={t('document-group-inventory.filter-string.label', {
              subject: t('document-group.subject.version_other'),
            })}
            icon={<SearchIcon />}
            value={filterInput}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setFilterInput(event.currentTarget.value)
            }
          />
        </search>
      </Header>
      <Body>
        {loading ? (
          <LoadingBlock />
        ) : (
          <Stack gap={5}>
            {sets.map((set) => (
              <VariantSet key={set.key} data-variant-set={set.name}>
                <VariantSetHeader as="header">
                  <Text size={1} weight="medium">
                    {set.name}
                  </Text>
                </VariantSetHeader>
                {set.variants
                  .filter(({name}) => !filterString || name.toLowerCase().includes(filterString))
                  .map((variant) => (
                    <PickerEntry
                      key={variant.id}
                      variant={variant}
                      releases={releases}
                      isSelected={selectedId === variant.id}
                      onSelect={onSelect}
                    />
                  ))}
              </VariantSet>
            ))}
          </Stack>
        )}
      </Body>
    </Container>
  )
}

const PickerEntry: ComponentType<{
  variant: Variant
  releases: Map<string, ReleaseDocument>
  isSelected: boolean
  onSelect: (variant: Variant) => void
}> = ({variant, releases, isSelected, onSelect}) => {
  const {t} = useTranslation(studioLocaleNamespace)
  const {document} = variant
  const isPublishedVersion = !document._system.bundleId
  const isDraftVersion = document._system.bundleId === 'drafts'
  const agentBundleName = isAgentBundleName(document._system.bundleId)
    ? document._system.bundleId
    : undefined
  const releaseRef = document._system.release?._ref
  const release = variant.releaseDocument ?? (releaseRef ? releases.get(releaseRef) : undefined)

  return (
    <VariantSetEntry data-variant-name={variant.name} data-selected={isSelected || undefined}>
      <div className="atom">
        <button type="button" className="primary-action" onClick={() => onSelect(variant)}>
          {variant.name}
        </button>
        <Text size={1} weight="medium" className="inert">
          {variant.name}
        </Text>
      </div>
      <div className="atom inert">
        {isSelected && (
          <StatusBadge radius={2} tone="primary">
            <EyeOpenIcon /> {t('document-group-inventory.viewing-item-label')}
          </StatusBadge>
        )}
        <Text size={1}>
          {agentBundleName ? (
            // oxlint-disable-next-line no-deprecated -- mirrors the document group inventory entry; to be replaced together
            <ReleaseAvatarIcon tone="suggest" />
          ) : (
            <ReleaseAvatarIcon
              release={
                // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals -- this string is not shown to users
                (isDraftVersion ? 'drafts' : isPublishedVersion ? 'published' : release) ?? ''
              }
            />
          )}
        </Text>
      </div>
    </VariantSetEntry>
  )
}
