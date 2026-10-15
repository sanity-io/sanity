import {type EditableReleaseDocument, type ReleaseType} from '@sanity/client'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {
  // oxlint-disable-next-line no-restricted-imports -- fine-grained control needed
  Button,
  TabPanel,
} from '@sanity/ui'
import {
  Menu,
  // oxlint-disable-next-line no-restricted-imports -- fine-grained control needed
  MenuItem,
} from '@sanity/ui/menu'
import {addHours} from 'date-fns/addHours'
import {startOfHour} from 'date-fns/startOfHour'
import {
  type ComponentType,
  type MouseEventHandler,
  useCallback,
  useEffect,
  useId,
  useState,
} from 'react'
import {Text, Flex, VStack, Icon} from 'ui5'

import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../../../studio/constants'
import {useWorkspace} from '../../../studio/workspace'
import {hasStoredReleaseData, useReleaseFormStorage} from '../../hooks/useReleaseFormStorage'
import {asReleaseMetadata, toReleaseMetadataRecord} from '../../metadata/mergeReleaseMetadata'
import {isReleaseType} from '../../store/types'
import {DEFAULT_RELEASE_TYPE, RELEASE_TYPES_TONES} from '../../util/const'
import {ReleaseAvatar} from '../ReleaseAvatar'
import {ScheduleDatePicker} from '../ScheduleDatePicker'
import {ReleaseMetadataForm} from './ReleaseMetadataForm'
import {TitleDescriptionForm} from './TitleDescriptionForm'

const NO_METADATA_FIELDS: readonly [] = []

/** @internal */
export function ReleaseForm(props: {
  onChange: (params: EditableReleaseDocument) => void
  onValidityChange?: (valid: boolean) => void
  value: EditableReleaseDocument
}): React.JSX.Element {
  const {onChange, onValidityChange, value} = props
  const {releaseType = DEFAULT_RELEASE_TYPE, intendedPublishAt} = value.metadata || {}
  const {t} = useTranslation()
  const {getStoredReleaseData, saveReleaseDataToStorage} = useReleaseFormStorage()
  const metadataFields = useWorkspace().releases?.metadata?.fields ?? NO_METADATA_FIELDS

  const id = value._id

  useEffect(() => {
    const storedData = getStoredReleaseData()
    if (!storedData || !hasStoredReleaseData(storedData)) return
    onChange({
      _id: id,
      metadata: asReleaseMetadata({
        title: storedData.title,
        description: storedData.description,
        releaseType: storedData.releaseType ?? DEFAULT_RELEASE_TYPE,
        intendedPublishAt: storedData.intendedPublishAt,
        ...storedData.fields,
      }),
    })
  }, [getStoredReleaseData, id, onChange])

  const handleOnChangeAndStorage = useCallback(
    (updatedValue: EditableReleaseDocument) => {
      onChange(updatedValue)
      const record = toReleaseMetadataRecord(updatedValue.metadata)
      const fields = Object.fromEntries(
        metadataFields.flatMap((field) => {
          const fieldValue = record[field.name]
          return fieldValue === undefined ? [] : [[field.name, fieldValue]]
        }),
      )
      saveReleaseDataToStorage({
        title: updatedValue.metadata.title,
        description: updatedValue.metadata.description,
        releaseType: updatedValue.metadata.releaseType,
        intendedPublishAt: updatedValue.metadata.intendedPublishAt,
        fields,
      })
    },
    [metadataFields, onChange, saveReleaseDataToStorage],
  )

  const handleBundlePublishAtCalendarChange = useCallback(
    (date: Date) => {
      handleOnChangeAndStorage({
        ...value,
        metadata: {...value.metadata, intendedPublishAt: date.toISOString()},
      })
    },
    [handleOnChangeAndStorage, value],
  )

  const handleReleaseTypeChange = useCallback<MouseEventHandler<HTMLButtonElement>>(
    (event) => {
      const pickedReleaseType = event.currentTarget.dataset.value

      if (!isReleaseType(pickedReleaseType)) {
        return
      }

      // select the start of the next hour
      const nextInputValue = startOfHour(addHours(new Date(), 1))

      handleOnChangeAndStorage({
        ...value,
        metadata: {
          ...value.metadata,
          releaseType: pickedReleaseType,
          intendedPublishAt:
            (pickedReleaseType === 'scheduled' && nextInputValue.toISOString()) || undefined,
        },
      })
    },
    [handleOnChangeAndStorage, value],
  )

  const handleTitleDescriptionChange = useCallback(
    (updatedRelease: EditableReleaseDocument) => {
      handleOnChangeAndStorage({
        ...value,
        metadata: {
          ...value.metadata,
          title: updatedRelease.metadata.title,
          description: updatedRelease.metadata.description,
        },
      })
    },
    [handleOnChangeAndStorage, value],
  )

  const handleMetadataChange = useCallback(
    (metadata: EditableReleaseDocument['metadata']) => {
      handleOnChangeAndStorage({
        ...value,
        metadata,
      })
    },
    [handleOnChangeAndStorage, value],
  )

  const menuButtonId = useId()
  const [menuButton, setMenuButton] = useState<HTMLElement | null>(null)

  return (
    <VStack gap={5}>
      <VStack gap={4}>
        <Flex gap={2} alignItems="center">
          <Text as="label" htmlFor={menuButtonId} trim={true}>
            {t('release.dialog.tooltip.title')}
          </Text>
          <Text muted size={1} as="div" trim={true}>
            <Tooltip
              content={
                <VStack gap={3} style={{maxWidth: 320 - 16}}>
                  <Text size={1} as="div" trim={true}>
                    {t('release.dialog.tooltip.description')}
                  </Text>
                  <Text muted size={1} as="div" trim={true}>
                    {t('release.dialog.tooltip.note')}
                  </Text>
                </VStack>
              }
              delay={0}
              placement="right-start"
              portal
            >
              <Icon muted size={1} icon={InfoOutlineIcon} />
            </Tooltip>
          </Text>
        </Flex>
        <VStack gap={3}>
          <MenuButton
            id={menuButtonId}
            ref={setMenuButton}
            button={
              <Button mode="ghost">
                <Flex justifyContent="space-between" alignItems="center">
                  <ReleaseTypeOption
                    text={t(`release.type.${releaseType}`)}
                    releaseType={releaseType}
                  />
                  <Icon size={1} icon={ChevronDownIcon} />
                </Flex>
              </Button>
            }
            popover={{
              placement: 'bottom',
              matchReferenceWidth: true,
              // Match pre-v4 `boundaryElement` (applied to both floating and reference).
              floatingBoundary: menuButton,
              referenceBoundary: menuButton,
            }}
            menu={
              <Menu>
                {/* oxlint-disable-next-line typescript/no-unsafe-type-assertion */}
                {(Object.keys(RELEASE_TYPES_TONES) as ReleaseType[]).map((type) => (
                  <MenuItem key={type} data-value={type} onClick={handleReleaseTypeChange}>
                    <ReleaseTypeOption text={t(`release.type.${type}`)} releaseType={type} />
                  </MenuItem>
                ))}
              </Menu>
            }
          />
          <Flex gap={1}>
            {releaseType === 'scheduled' && (
              <TabPanel
                aria-labelledby="release-timing-at-time-tab"
                flex={1}
                id="release-timing-at-time"
                style={{outline: 'none'}}
                tabIndex={-1}
              >
                <ScheduleDatePicker
                  value={intendedPublishAt ? new Date(intendedPublishAt) : undefined}
                  onChange={handleBundlePublishAtCalendarChange}
                  timeZoneScope={CONTENT_RELEASES_TIME_ZONE_SCOPE}
                />
              </TabPanel>
            )}
          </Flex>
        </VStack>
      </VStack>
      <TitleDescriptionForm release={value} onChange={handleTitleDescriptionChange} />
      <ReleaseMetadataForm
        metadata={value.metadata}
        onChange={handleMetadataChange}
        onValidityChange={onValidityChange}
      />
    </VStack>
  )
}

const ReleaseTypeOption: ComponentType<{
  text: string
  releaseType: ReleaseType
}> = ({releaseType, text}) => (
  <Flex gap={3} alignItems="center">
    <ReleaseAvatar padding={1} releaseType={releaseType} />
    <Text as="div" trim={true}>
      {text}
    </Text>
  </Flex>
)
