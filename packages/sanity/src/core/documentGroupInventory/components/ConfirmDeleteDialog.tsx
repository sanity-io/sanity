import {type ReleaseDocument} from '@sanity/client'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CopyIcon} from '@sanity/icons/Copy'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {UnknownIcon} from '@sanity/icons/Unknown'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Badge, Card} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useSelector} from '@xstate/react'
import {type ComponentType, type ReactNode, useCallback, useId, useMemo} from 'react'
import {Text, VStack, Box, Flex, Icon} from 'ui5'
import {type ActorRefFromLogic} from 'xstate'

import {Button} from '../../../ui-components/button/Button'
import {Dialog} from '../../../ui-components/dialog/Dialog'
import {useSchema} from '../../hooks/useSchema'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../i18n/localeNamespaces'
import {Translate} from '../../i18n/Translate'
import {type TFunction} from '../../i18n/types'
import {type TargetPerspective} from '../../perspective/types'
import {SanityDefaultPreview} from '../../preview/components/SanityDefaultPreview'
import {ReleaseAvatarIcon} from '../../releases/components/ReleaseAvatar'
import {getReleaseTone} from '../../releases/util/getReleaseTone'
import {type SystemBundle} from '../../util/draftUtils'
import {readVersionType} from '../../util/versionsUtils'
import {
  type CrossDatasetReferences,
  type deletionMachine,
  type IncomingReference,
  type InternalReferences,
} from '../machines/deletionMachine'
import {type selectionMachine, type Variant} from '../machines/selectionMachine'
import {
  type DocumentGroupInventoryComponents,
  type DocumentGroupInventoryReferencePreviewLinkProps,
} from '../types'
import {type DeletionDescription, describeDeletion} from '../utils/describeDeletion'
import {
  ChevronWrapper,
  CrossDatasetReferencesDetails,
  CrossDatasetReferencesSummary,
  DocumentIdFlex,
  OtherReferenceCount,
  Table,
} from './ConfirmDeleteDialog.styles'

const PUBLISHED: SystemBundle = 'published'
const DRAFTS: SystemBundle = 'drafts'

const EMPTY_INTERNAL_REFERENCES: InternalReferences = {totalCount: 0, references: []}
const EMPTY_CROSS_DATASET_REFERENCES: CrossDatasetReferences = {totalCount: 0, references: []}

function DocumentTitle({documentTitle}: {children?: ReactNode; documentTitle?: ReactNode}) {
  return documentTitle
}

interface Props {
  documentId: string
  documentType: string
  deletionRef: ActorRefFromLogic<typeof deletionMachine>
  selectionRef: ActorRefFromLogic<typeof selectionMachine>
  portalElementName: string
  components: DocumentGroupInventoryComponents
}

export const ConfirmDeleteDialog: ComponentType<Props> = ({
  documentId,
  documentType,
  deletionRef,
  selectionRef,
  portalElementName,
  components,
}) => {
  const {t} = useTranslation(studioLocaleNamespace)
  const {DocTitle, ReferencePreviewLink} = components
  const blockedReasonId = useId()

  const selectedIdSet = useSelector(selectionRef, ({context}) => context.selectedIds)
  const variants = useSelector(selectionRef, ({context}) => context.variants)
  const variantIds = useSelector(deletionRef, ({context}) => context.variantIds)

  const internalReferences =
    useSelector(deletionRef, ({context}) => context.internalReferences) ?? EMPTY_INTERNAL_REFERENCES

  const crossDatasetReferences =
    useSelector(deletionRef, ({context}) => context.crossDatasetReferences) ??
    EMPTY_CROSS_DATASET_REFERENCES

  const datasetNames = useSelector(deletionRef, ({context}) => context.datasetNames)

  const hasUnknownDatasetNames = useSelector(
    deletionRef,
    ({context}) => context.hasUnknownDatasetNames,
  )
  const hasCheckedReferences = useSelector(
    deletionRef,
    ({context}) => context.incomingReferencesChecked,
  )
  const isDeletionError = useSelector(deletionRef, (snapshot) =>
    snapshot.matches({active: {deletion: 'error'}}),
  )

  const deletionError = useSelector(deletionRef, ({context}) => context.error)
  const error = isDeletionError ? deletionError : undefined

  const canConfirmDeletion = useSelector(deletionRef, (snapshot) =>
    snapshot.can({type: 'delete.confirm'}),
  )
  const canConfirmDeletionExcludingPublished = useSelector(deletionRef, (snapshot) =>
    snapshot.can({type: 'delete.confirmExcludingPublished'}),
  )

  const selectedIds = [...selectedIdSet]
  const description = describeDeletion({
    selectedIds,
    variantIds,
    internalReferences,
    crossDatasetReferences,
  })
  const {includesDefault, deletableIds, blockedIds, strength} = description
  const isDefaultBlocked = blockedIds.length > 0
  const hasLinks = description.totalLinkCount > 0

  const header = getHeader({t, description, selectedCount: selectedIds.length})

  const confirmButton = isDefaultBlocked
    ? {
        text:
          deletableIds.length > 0
            ? t('document-group.delete.confirm-count-button.text', {count: deletableIds.length})
            : t('document-group.delete.confirm-button.text'),
        onClick: () => deletionRef.send({type: 'delete.confirmExcludingPublished'}),
        disabled: !canConfirmDeletionExcludingPublished,
      }
    : {
        text: t('document-group.delete.confirm-count-button.text', {count: deletableIds.length}),
        onClick: () => deletionRef.send({type: 'delete.confirm'}),
        disabled: !canConfirmDeletion,
      }

  const documentTitle = (
    <DocTitle
      document={useMemo(
        () => ({
          _id: documentId,
          _type: documentType,
        }),
        [documentId, documentType],
      )}
    />
  )

  const variantsById = new Map(variants.map((variant) => [variant.id, variant]))

  return (
    <Dialog
      id="confirmVariantDeletion"
      width={1}
      // The dialog would focus its first focusable element, the close button. Cancel takes the
      // initial focus instead (below), so Enter never deletes by accident.
      __unstable_autoFocus={false}
      portal={portalElementName}
      header={header}
      footer={{
        cancelButton: {
          onClick: () => deletionRef.send({type: 'delete.cancel'}),
          text: t('document-group.delete.cancel-button.text'),
          autoFocus: true,
        },
        confirmButton: {
          ...confirmButton,
          // The reason a blocked Default stays is read with the button, not only on screen.
          'aria-describedby': isDefaultBlocked ? blockedReasonId : undefined,
        },
      }}
      onClose={() => deletionRef.send({type: 'delete.cancel'})}
    >
      <VStack gap={4}>
        {error ? (
          <Card tone="critical" padding={3} radius={2}>
            <Text size={1} as="div" trim={true} tone="critical">
              {t('document-group.delete.error.message')}
            </Text>
          </Card>
        ) : null}
        <VersionGroups
          deletableIds={deletableIds}
          blockedIds={blockedIds}
          variantsById={variantsById}
        />
        {isDefaultBlocked && (
          <BlockedNotice
            id={blockedReasonId}
            variantCount={description.blockingVariantCount}
            requiredLinkCount={description.requiredLinkCount}
          />
        )}
        {!includesDefault && (
          <Notice
            tone="neutral"
            title={t('document-group.delete.no-links.title')}
            description={t('document-group.delete.no-links.description')}
            testId="no-links"
          />
        )}
        {includesDefault && hasCheckedReferences && (
          <>
            {description.failsLaterCount > 0 && (
              <Notice
                tone="caution"
                title={t('document-group.delete.fails-later.text', {
                  count: description.failsLaterCount,
                })}
                testId="fails-later"
              />
            )}
            {!isDefaultBlocked && strength === 'partial' && hasLinks && (
              <Notice
                tone="caution"
                title={t('document-group.delete.partial-links.text', {
                  count: description.totalLinkCount,
                })}
                testId="partial-links"
              />
            )}
            {!isDefaultBlocked && strength === 'known' && description.optionalLinkCount > 0 && (
              <Card padding={3} radius={2} tone="caution" flex="none" data-testid="optional-links">
                <Text size={1} as="div" trim={true} tone="caution">
                  <Translate
                    i18nKey="document-group.delete.optional-links.text"
                    components={{DocumentTitle}}
                    componentProps={{documentTitle}}
                    t={t}
                    values={{count: description.optionalLinkCount}}
                  />
                </Text>
              </Card>
            )}
            {strength === 'unknown' && hasLinks && (
              <Card padding={3} radius={2} tone="caution" flex="none" data-testid="unknown-links">
                <Flex>
                  <Icon
                    icon={WarningOutlineIcon}
                    aria-hidden="true"
                    size={1}
                    style={{margin: '-0.375rem'}}
                    tone="caution"
                  />
                  <Box flexBasis="0%" flexGrow={1} marginLeft={3}>
                    <Text size={1} as="div" trim={true} tone="caution">
                      <Translate
                        i18nKey="document-group.delete.referring-document-count.text"
                        components={{DocumentTitle}}
                        componentProps={{documentTitle}}
                        t={t}
                        values={{count: description.totalLinkCount}}
                      />
                    </Text>
                  </Box>
                </Flex>
              </Card>
            )}
            <References
              documentId={documentId}
              documentTitle={documentTitle}
              isStrengthKnown={strength !== 'unknown'}
              internalReferences={internalReferences}
              crossDatasetReferences={crossDatasetReferences}
              datasetNames={datasetNames}
              hasUnknownDatasetNames={hasUnknownDatasetNames}
              ReferencePreviewLink={ReferencePreviewLink}
            />
          </>
        )}
      </VStack>
    </Dialog>
  )
}

function getHeader({
  t,
  description,
  selectedCount,
}: {
  t: TFunction
  description: DeletionDescription
  selectedCount: number
}): string {
  const {includesDefault, deletableIds, blockedIds} = description
  if (blockedIds.length > 0 && deletableIds.length > 0) {
    // The title counts what the button deletes, out of what was selected.
    return t('document-group.delete.some-of-title', {
      count: deletableIds.length,
      total: selectedCount,
    })
  }
  if (includesDefault) {
    return selectedCount === 1
      ? t('document-group.delete.default-title')
      : t('document-group.delete.with-default-title', {count: selectedCount})
  }
  return t('document-group.delete.question-title', {count: selectedCount})
}

/**
 * The selected versions, split into the ones the confirm action deletes and the ones that stay
 * because they can't be deleted yet.
 */
function VersionGroups({
  deletableIds,
  blockedIds,
  variantsById,
}: {
  deletableIds: string[]
  blockedIds: string[]
  variantsById: Map<string, Variant>
}) {
  const {t} = useTranslation(studioLocaleNamespace)
  const showHeadings = blockedIds.length > 0 && deletableIds.length > 0

  return (
    <VStack gap={3}>
      {deletableIds.length > 0 && (
        <VersionGroup
          heading={showHeadings ? t('document-group.delete.deletable-versions.heading') : undefined}
          ids={deletableIds}
          variantsById={variantsById}
          testId="deletable-versions"
        />
      )}
      {blockedIds.length > 0 && (
        <VersionGroup
          heading={t('document-group.delete.blocked-versions.heading')}
          ids={blockedIds}
          variantsById={variantsById}
          testId="blocked-versions"
        />
      )}
    </VStack>
  )
}

function VersionGroup({
  heading,
  ids,
  variantsById,
  testId,
}: {
  heading?: string
  ids: string[]
  variantsById: Map<string, Variant>
  testId: string
}) {
  const headingId = useId()
  return (
    <VStack gap={2} data-testid={testId}>
      {heading && (
        <Text size={1} weight="medium" muted as="div" trim={true} id={headingId}>
          {heading}
        </Text>
      )}
      <Card border radius={2} padding={1}>
        <VStack as="ul" gap={1} aria-labelledby={heading ? headingId : undefined}>
          {ids.map((id) => (
            <Box as="li" key={id} padding={2}>
              <VersionChipRow id={id} variant={variantsById.get(id)} />
            </Box>
          ))}
        </VStack>
      </Card>
    </VStack>
  )
}

/**
 * One version by its variant and bundle, the way the inventory rows name it: "RP de-DE" with a
 * "Draft" chip, rather than the copy's raw id.
 */
function VersionChipRow({id, variant}: {id: string; variant: Variant | undefined}) {
  const {t} = useTranslation(studioLocaleNamespace)
  const document = variant?.document
  const versionType = readVersionType(document)
  const release = variant?.releaseDocument

  const bundleLabel =
    versionType === 'published'
      ? t('release.chip.published')
      : versionType === 'draft'
        ? t('release.chip.draft')
        : versionType === 'agent'
          ? t('version.agent-bundle.proposed-changes')
          : (release?.metadata?.title ?? t('release.placeholder-untitled-release'))

  const tone =
    versionType === 'published'
      ? 'positive'
      : versionType === 'draft'
        ? 'caution'
        : release
          ? getReleaseTone(release)
          : 'default'

  // Without Content Variants, the row's name is the bundle itself, so it is not repeated.
  const name = variant?.name ?? id
  const showName = name !== bundleLabel

  return (
    <Flex alignItems="center" gap={3} data-testid={`delete-version-${id}`}>
      {showName && (
        <Box flexBasis="0%" flexGrow={1}>
          <Text size={1} weight="medium" as="div" trim={true} truncate={1}>
            {name}
          </Text>
        </Box>
      )}
      <Flex flexGrow={showName ? 0 : 1}>
        <Card border radius="full" tone={tone} style={{backgroundColor: 'transparent'}}>
          <Flex alignItems="center" gap={2} paddingY={2} paddingRight={3} paddingLeft={2}>
            <ReleaseAvatarIcon release={getAvatarPerspective(versionType, release)} />
            <Text size={1} weight="medium" as="div" trim={true} truncate={1}>
              {bundleLabel}
            </Text>
          </Flex>
        </Card>
      </Flex>
    </Flex>
  )
}

function BlockedNotice({
  id,
  variantCount,
  requiredLinkCount,
}: {
  id: string
  variantCount: number
  requiredLinkCount: number
}) {
  const {t} = useTranslation(studioLocaleNamespace)
  return (
    <Card padding={3} radius={2} tone="critical" flex="none" data-testid="default-blocked" id={id}>
      <Flex>
        <Icon
          icon={WarningOutlineIcon}
          aria-hidden="true"
          size={1}
          style={{margin: '-0.375rem'}}
          tone="critical"
        />
        <Box flexBasis="0%" flexGrow={1} marginLeft={3}>
          <VStack gap={3}>
            <Text size={1} as="div" trim={true} weight="medium" tone="critical">
              {t('document-group.delete.blocked.heading')}
            </Text>
            {/* Variants first: they are the reason that can always be resolved from here. */}
            <VStack as="ul" gap={3} style={{paddingInlineStart: 0, listStyle: 'none', margin: 0}}>
              {variantCount > 0 && (
                <li data-testid="blocked-by-variants">
                  <Text size={1} as="div" trim={true}>
                    {t('document-group.delete.blocked.variants-reason', {count: variantCount})}
                  </Text>
                </li>
              )}
              {requiredLinkCount > 0 && (
                <li data-testid="blocked-by-links">
                  <Text size={1} as="div" trim={true}>
                    {t('document-group.delete.blocked.links-reason', {count: requiredLinkCount})}
                  </Text>
                </li>
              )}
            </VStack>
          </VStack>
        </Box>
      </Flex>
    </Card>
  )
}

function Notice({
  tone,
  title,
  description,
  testId,
}: {
  tone: 'neutral' | 'caution' | 'critical'
  title: string
  description?: string
  testId?: string
}) {
  return (
    <Card padding={3} radius={2} tone={tone} flex="none" data-testid={testId}>
      <Flex>
        <Icon
          icon={tone === 'neutral' ? InfoOutlineIcon : WarningOutlineIcon}
          aria-hidden="true"
          size={1}
          style={{margin: '-0.375rem'}}
          tone={tone === 'neutral' ? undefined : tone}
        />
        <Box flexBasis="0%" flexGrow={1} marginLeft={3}>
          <VStack gap={3}>
            <Text
              size={1}
              as="div"
              trim={true}
              weight="medium"
              tone={tone === 'neutral' ? undefined : tone}
            >
              {title}
            </Text>
            {description ? (
              <Text size={1} as="div" trim={true} muted>
                {description}
              </Text>
            ) : null}
          </VStack>
        </Box>
      </Flex>
    </Card>
  )
}

/**
 * Required references first, so the ones that block the delete lead the list, then the release
 * copies that make a release fail later, then the optional ones.
 */
function sortRequiredFirst(references: IncomingReference[]): IncomingReference[] {
  const rank = (reference: IncomingReference) =>
    reference.required === true ? 0 : reference.failsLater === true ? 1 : 2
  return [...references].sort((a, b) => rank(a) - rank(b))
}

interface ReferencesProps {
  documentId: string
  documentTitle: ReactNode
  /** Whether each link's strength was read, so the list can tag it. */
  isStrengthKnown: boolean
  internalReferences: InternalReferences
  crossDatasetReferences: CrossDatasetReferences
  datasetNames: string[]
  hasUnknownDatasetNames: boolean
  onReferenceLinkClick?: () => void
  ReferencePreviewLink: ComponentType<DocumentGroupInventoryReferencePreviewLinkProps>
}

const References: ComponentType<ReferencesProps> = ({
  documentId,
  documentTitle,
  isStrengthKnown,
  internalReferences,
  crossDatasetReferences,
  datasetNames,
  hasUnknownDatasetNames,
  onReferenceLinkClick,
  ReferencePreviewLink,
}) => {
  const schema = useSchema()
  const toast = useToast()
  const {t} = useTranslation(studioLocaleNamespace)

  const renderPreviewItem = useCallback(
    (item: IncomingReference) => {
      const type = schema.get(item._type)
      if (type) {
        const preview = (
          <ReferencePreviewLink
            type={type}
            value={{_id: item._id, _type: item._type}}
            onClick={onReferenceLinkClick}
          />
        )
        if (typeof item.required !== 'boolean') return preview
        return (
          <Flex alignItems="center" gap={2}>
            <Box flexBasis="0%" flexGrow={1}>
              {preview}
            </Box>
            <Box paddingRight={2} flexShrink={0}>
              <ReferenceTag reference={item} />
            </Box>
          </Flex>
        )
      }

      return (
        <Box padding={2}>
          <SanityDefaultPreview
            icon={UnknownIcon}
            title={t('document-group.delete.preview-item.preview-unavailable.title')}
            subtitle={t('document-group.delete.preview-item.preview-unavailable.subtitle', {
              documentId: item._id,
            })}
            layout="default"
          />
        </Box>
      )
    },
    [schema, t, onReferenceLinkClick, ReferencePreviewLink],
  )

  if (internalReferences.totalCount === 0 && crossDatasetReferences.totalCount === 0) {
    return null
  }

  // We do some extra checks to handle cases where you have unavailable dataset
  // name(s) due to permissions, both alone and in combination with known datasets.
  // This normalizes one or more undefined dataset names to the catch-all `unavailable`.
  const normalizedDatasetNames = [
    ...datasetNames,
    ...(hasUnknownDatasetNames ? ['unavailable'] : []),
  ]

  const datasetSubtitle = t('document-group.delete.cdr-summary.subtitle', {
    count: normalizedDatasetNames.length,
    datasets: normalizedDatasetNames.join(', '),
    context: hasUnknownDatasetNames && normalizedDatasetNames.length ? 'unavailable' : '',
  })

  return (
    <>
      <Box flexBasis="auto" flexGrow={0} flexShrink={0}>
        <Text size={1} as="div" trim={true}>
          <Translate
            // Main's descriptor ("You may not be able to delete …") only stays while the
            // strength of the links is unknown: otherwise the notices above say what happens.
            i18nKey={
              isStrengthKnown
                ? 'document-group.delete.linked-from.text'
                : 'document-group.delete.referring-documents-descriptor.text'
            }
            t={t}
            components={{DocumentTitle}}
            componentProps={{documentTitle}}
          />
        </Text>
      </Box>
      <Card radius={2} shadow={1} flex="auto" padding={1}>
        <Flex flexDirection="column">
          {internalReferences.totalCount > 0 && (
            <VStack as="ul" gap={2} data-testid="internal-references">
              {sortRequiredFirst(internalReferences.references).map((item) => (
                <Box key={item._id} as="li">
                  {renderPreviewItem(item)}
                </Box>
              ))}
              {internalReferences.totalCount > internalReferences.references.length && (
                <Box as="li" padding={3}>
                  <OtherReferenceCount {...internalReferences} />
                </Box>
              )}
            </VStack>
          )}
          {crossDatasetReferences.totalCount > 0 && (
            <CrossDatasetReferencesDetails
              data-testid="cross-dataset-references"
              style={{
                // only add the border if needed
                borderTop:
                  internalReferences.totalCount > 0
                    ? '1px solid var(--card-shadow-outline-color)'
                    : undefined,
              }}
            >
              <CrossDatasetReferencesSummary>
                <Card
                  as="a"
                  marginTop={internalReferences.totalCount > 0 ? 2 : 0}
                  radius={2}
                  shadow={1}
                  paddingY={1}
                >
                  <Flex alignItems="center" gap={3} paddingX={3} paddingY={1}>
                    <Icon icon={DocumentsIcon} size={1} />
                    <VStack gap={2}>
                      <Text truncate={1} size={1} as="div" trim={true}>
                        {t('document-group.delete.cdr-summary.title', {
                          count: normalizedDatasetNames.length,
                          documentCount: t('document-group.delete.cdr-summary.document-count', {
                            count: crossDatasetReferences.totalCount,
                          }),
                        })}
                      </Text>
                      <Text
                        title={datasetSubtitle}
                        truncate={1}
                        size={1}
                        muted
                        as="div"
                        trim={true}
                      >
                        {datasetSubtitle}
                      </Text>
                    </VStack>
                    <ChevronWrapper>
                      <Icon icon={ChevronDownIcon} size={1} muted />
                    </ChevronWrapper>
                  </Flex>
                </Card>
              </CrossDatasetReferencesSummary>
              <Box overflow="auto" paddingTop={2}>
                <Table>
                  <thead>
                    <tr>
                      <th>
                        <Text
                          muted
                          size={1}
                          style={{minWidth: '5rem'}}
                          weight="medium"
                          as="div"
                          trim={true}
                        >
                          {t('document-group.delete.cdr-table.project-id.label')}
                        </Text>
                      </th>
                      <th>
                        <Text muted size={1} weight="medium" as="div" trim={true}>
                          {t('document-group.delete.cdr-table.dataset.label')}
                        </Text>
                      </th>
                      <th>
                        <Text muted size={1} weight="medium" as="div" trim={true}>
                          {t('document-group.delete.cdr-table.document-id.label')}
                        </Text>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {crossDatasetReferences.references
                      .filter((reference): reference is Required<typeof reference> => {
                        return 'projectId' in reference
                      })
                      .map(({projectId, datasetName, documentId: referenceId}, index) => (
                        <tr key={`${documentId}-${index}`}>
                          <td>
                            <Text size={1} as="div" trim={true}>
                              {projectId}
                            </Text>
                          </td>
                          <td>
                            <Text size={1} as="div" trim={true}>
                              {datasetName || 'unavailable'}
                            </Text>
                          </td>
                          <td>
                            <DocumentIdFlex alignItems="center" gap={2} justifyContent="flex-end">
                              <Text truncate={1} size={1} as="div" trim={true}>
                                {referenceId || 'unavailable'}
                              </Text>
                              {referenceId && (
                                <Button
                                  mode="bleed"
                                  icon={CopyIcon}
                                  tooltipProps={{
                                    content: t(
                                      'document-group.delete.cdr-table.copy-id-button.tooltip',
                                    ),
                                  }}
                                  onClick={() => {
                                    navigator.clipboard.writeText(referenceId).catch(() => {
                                      toast.push({
                                        status: 'error',
                                        title: t(
                                          'document-group.delete.cdr-table.id-copied-toast.title-failed',
                                        ),
                                      })
                                    })
                                  }}
                                />
                              )}
                            </DocumentIdFlex>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </Table>
                <OtherReferenceCount {...crossDatasetReferences} />
              </Box>
            </CrossDatasetReferencesDetails>
          )}
        </Flex>
      </Card>
    </>
  )
}

function ReferenceTag({reference}: {reference: IncomingReference}) {
  const {t} = useTranslation(studioLocaleNamespace)
  const [tone, key] = reference.required
    ? (['critical', 'document-group.delete.reference-tag.required'] as const)
    : reference.failsLater
      ? (['caution', 'document-group.delete.reference-tag.fails-later'] as const)
      : (['default', 'document-group.delete.reference-tag.optional'] as const)
  return (
    <Badge radius={2} tone={tone} data-testid={`reference-tag-${reference._id}`}>
      {t(key)}
    </Badge>
  )
}

function getAvatarPerspective(
  versionType: ReturnType<typeof readVersionType>,
  release: ReleaseDocument | undefined,
): TargetPerspective {
  if (versionType === 'published') return PUBLISHED
  if (versionType === 'release' && release) return release
  return DRAFTS
}
