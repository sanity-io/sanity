import {type EditableReleaseDocument} from '@sanity/client'
import {ChevronDownIcon, InfoOutlineIcon} from '@sanity/icons'
import {
  // eslint-disable-next-line no-restricted-imports -- fine-grained control needed
  Button,
  Flex,
  Menu,
  // eslint-disable-next-line no-restricted-imports -- fine-grained control needed
  MenuItem,
  Stack,
  TabPanel,
  Text,
} from '@sanity/ui'
import {type ElementTone} from '@sanity/ui/theme'
import {addHours, startOfHour} from 'date-fns'
import {
  type ComponentType,
  type MouseEventHandler,
  useCallback,
  useEffect,
  useId,
  useState,
} from 'react'

import {MenuButton, Tooltip} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {CONTENT_RELEASES_TIME_ZONE_SCOPE} from '../../../studio/constants'
import {useReleaseFormStorage} from '../../hooks/useReleaseFormStorage'
import {isReleaseType} from '../../store/types'
import {DEFAULT_RELEASE_TYPE, RELEASE_TYPES_TONES} from '../../util/const'
import {ReleaseAvatar} from '../ReleaseAvatar'
import {ScheduleDatePicker} from '../ScheduleDatePicker'
import {TitleDescriptionForm} from './TitleDescriptionForm'

/** @internal */
export function ReleaseForm(props: {
  onChange: (params: EditableReleaseDocument) => void
  value: EditableReleaseDocument
}): React.JSX.Element {
  const {onChange, value} = props
  const {releaseType, intendedPublishAt} = value.metadata || {}
  const {t} = useTranslation()
  const {getStoredReleaseData, saveReleaseDataToStorage} = useReleaseFormStorage()

  const id = value._id

  useEffect(() => {
    const storedData = getStoredReleaseData()
    if (storedData) {
      const updatedValue = {
        metadata: {
          title: storedData.title,
          description: storedData.description,
          releaseType: storedData.releaseType ?? DEFAULT_RELEASE_TYPE,
          intendedPublishAt: storedData.intendedPublishAt,
        },
      }
      onChange({_id: id, ...updatedValue})
    }
  }, [getStoredReleaseData, id, onChange])

  const handleOnChangeAndStorage = useCallback(
    (updatedValue: EditableReleaseDocument) => {
      onChange(updatedValue)
      saveReleaseDataToStorage({
        ...updatedValue.metadata,
      })
    },
    [onChange, saveReleaseDataToStorage],
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

  const menuButtonId = useId()
  const [menuButton, setMenuButton] = useState<HTMLElement | null>(null)

  return (
    <Stack gap={5}>
      <Stack gap={4}>
        <Flex gap={2} align="center">
          <Text as="label" htmlFor={menuButtonId}>
            {t('release.dialog.tooltip.title')}
          </Text>
          <Text muted size={1}>
            <Tooltip
              content={
                <Stack gap={3} style={{maxWidth: 320 - 16}}>
                  <Text size={1}>{t('release.dialog.tooltip.description')}</Text>
                  <Text muted size={1}>
                    {t('release.dialog.tooltip.note')}
                  </Text>
                </Stack>
              }
              delay={0}
              placement="right-start"
              portal
            >
              <InfoOutlineIcon />
            </Tooltip>
          </Text>
        </Flex>
        <Stack gap={3}>
          <MenuButton
            id={menuButtonId}
            ref={setMenuButton}
            button={
              <Button mode="ghost">
                <Flex justify="space-between" align="center">
                  <ReleaseTypeOption
                    text={t(`release.type.${releaseType}`)}
                    tone={releaseType ? RELEASE_TYPES_TONES[releaseType].tone : 'critical'}
                  />
                  <Text size={1}>
                    <ChevronDownIcon />
                  </Text>
                </Flex>
              </Button>
            }
            popover={{
              placement: 'bottom',
              matchReferenceWidth: true,
              boundaryElement: menuButton,
            }}
            menu={
              <Menu>
                {Object.entries(RELEASE_TYPES_TONES).map(([type, {tone}]) => (
                  <MenuItem key={type} data-value={type} onClick={handleReleaseTypeChange}>
                    <ReleaseTypeOption text={t(`release.type.${type}`)} tone={tone} />
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
        </Stack>
      </Stack>
      <TitleDescriptionForm release={value} onChange={handleTitleDescriptionChange} />
    </Stack>
  )
}

const ReleaseTypeOption: ComponentType<{text: string; tone: ElementTone}> = ({tone, text}) => (
  <Flex gap={3} align="center">
    <ReleaseAvatar padding={1} tone={tone} />
    <Text>{text}</Text>
  </Flex>
)
