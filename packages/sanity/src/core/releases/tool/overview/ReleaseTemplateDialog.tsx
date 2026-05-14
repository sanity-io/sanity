import {AddIcon, CommentIcon, TrashIcon} from '@sanity/icons'
import {Box, Flex, Stack, Text, TextArea, TextInput, useToast} from '@sanity/ui'
import {type ChangeEvent, useCallback, useEffect, useRef, useState} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseDescriptionSection} from '../../store/createReleaseSettingsStore'
import {useReleaseSettings} from '../../store/useReleaseSettings'

const MAX_SECTIONS = 8
const HINT_TEXTAREA_ROWS = 3

interface ReleaseTemplateDialogProps {
  onClose: () => void
}

function indicesWithHint(sections: ReleaseDescriptionSection[]): Set<number> {
  return sections.reduce<Set<number>>((accumulator, section, index) => {
    if ((section.hint ?? '').trim().length > 0) {
      accumulator.add(index)
    }
    return accumulator
  }, new Set<number>())
}

export function ReleaseTemplateDialog({onClose}: ReleaseTemplateDialogProps): React.JSX.Element {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {descriptionSections, setDescriptionSections} = useReleaseSettings()
  const toast = useToast()
  const [sections, setSections] = useState<ReleaseDescriptionSection[]>(() =>
    descriptionSections.length > 0 ? descriptionSections : [{title: ''}],
  )
  const [expandedHints, setExpandedHints] = useState<Set<number>>(() =>
    indicesWithHint(descriptionSections),
  )

  const hasSeededRef = useRef(false)
  useEffect(() => {
    if (hasSeededRef.current) return
    if (descriptionSections.length === 0) return
    setSections(descriptionSections)
    setExpandedHints(indicesWithHint(descriptionSections))
    hasSeededRef.current = true
  }, [descriptionSections])

  const commitSections = useCallback(
    (nextSections: ReleaseDescriptionSection[]) => {
      setSections(nextSections)
      setDescriptionSections(nextSections).catch((saveError: unknown) => {
        const message = saveError instanceof Error ? saveError.message : String(saveError)
        toast.push({
          status: 'error',
          title: t('release-template-dialog.save-error'),
          description: message,
        })
      })
    },
    [setDescriptionSections, t, toast],
  )

  const handleTitleChange = useCallback(
    (index: number, event: ChangeEvent<HTMLInputElement>) => {
      const nextTitle = event.target.value
      const next = sections.map((section, sectionIndex) =>
        sectionIndex === index ? {...section, title: nextTitle} : section,
      )
      commitSections(next)
    },
    [commitSections, sections],
  )

  const handleHintChange = useCallback(
    (index: number, event: ChangeEvent<HTMLTextAreaElement>) => {
      const nextHint = event.target.value
      const next = sections.map((section, sectionIndex) =>
        sectionIndex === index ? {...section, hint: nextHint} : section,
      )
      commitSections(next)
    },
    [commitSections, sections],
  )

  const handleAddSection = useCallback(() => {
    if (sections.length >= MAX_SECTIONS) return
    const nextSections = [...sections, {title: ''}]
    commitSections(nextSections)
    setExpandedHints(indicesWithHint(nextSections))
  }, [commitSections, sections])

  const handleDeleteSection = useCallback(
    (index: number) => {
      const nextSections = sections.filter((_unused, sectionIndex) => sectionIndex !== index)
      commitSections(nextSections)
      setExpandedHints(indicesWithHint(nextSections))
    },
    [commitSections, sections],
  )

  const handleToggleHint = useCallback((index: number) => {
    setExpandedHints((previous) => {
      const next = new Set(previous)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  const isAtLimit = sections.length >= MAX_SECTIONS
  const addLabel = t('release-template-dialog.add-section')
  const deleteLabel = t('release-template-dialog.delete-section')
  const titlePlaceholder = t('release-template-dialog.section-title-placeholder')
  const hintTogglePassiveLabel = t('release-template-dialog.section-hint-toggle')
  const hintToggleActiveLabel = t('release-template-dialog.section-hint-toggle-active')
  const hintPlaceholder = t('release-template-dialog.section-hint-placeholder')

  return (
    <Dialog
      id="release-template-dialog"
      header={t('release-template-dialog.header')}
      onClose={onClose}
      width={1}
      data-testid="release-template-dialog"
    >
      <Stack space={4}>
        <Text muted size={1}>
          {t('release-template-dialog.description')}
        </Text>

        <Stack space={3}>
          {sections.map((section, index) => {
            const isExpanded = expandedHints.has(index)
            const hasHint = (section.hint ?? '').trim().length > 0
            const toggleLabel = hasHint ? hintToggleActiveLabel : hintTogglePassiveLabel
            return (
              <Stack key={index} space={2}>
                <Flex align="center" gap={2}>
                  <Box flex={1}>
                    <TextInput
                      value={section.title}
                      onChange={(event) => handleTitleChange(index, event)}
                      placeholder={titlePlaceholder}
                      aria-label={titlePlaceholder}
                      data-testid={`release-template-section-input-${index}`}
                    />
                  </Box>
                  <Button
                    icon={CommentIcon}
                    mode="bleed"
                    selected={isExpanded || hasHint}
                    onClick={() => handleToggleHint(index)}
                    tooltipProps={{content: toggleLabel}}
                    aria-label={toggleLabel}
                    aria-expanded={isExpanded}
                    data-testid={`release-template-section-hint-toggle-${index}`}
                  />
                  <Button
                    icon={TrashIcon}
                    mode="bleed"
                    tone="critical"
                    onClick={() => handleDeleteSection(index)}
                    tooltipProps={{content: deleteLabel}}
                    aria-label={deleteLabel}
                    data-testid={`release-template-section-delete-${index}`}
                  />
                </Flex>
                {isExpanded && (
                  <Box paddingLeft={1} paddingRight={1}>
                    <TextArea
                      value={section.hint ?? ''}
                      onChange={(event) => handleHintChange(index, event)}
                      placeholder={hintPlaceholder}
                      aria-label={hintPlaceholder}
                      rows={HINT_TEXTAREA_ROWS}
                      data-testid={`release-template-section-hint-input-${index}`}
                    />
                  </Box>
                )}
              </Stack>
            )
          })}
        </Stack>

        <Box>
          <Button
            icon={AddIcon}
            mode="bleed"
            onClick={handleAddSection}
            disabled={isAtLimit}
            text={addLabel}
            tooltipProps={
              isAtLimit ? {content: t('release-template-dialog.section-limit-reached')} : undefined
            }
            data-testid="release-template-add-section"
          />
        </Box>
      </Stack>
    </Dialog>
  )
}
