import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CopyIcon} from '@sanity/icons/Copy'
import {Button} from '@sanity/ui'
import {useTranslation} from 'sanity/i18n'
import {Flex, VisuallyHidden} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {VISION_SHORTCUTS} from '../../util/shortcuts'
import {PrettifyIcon} from '../PrettifyIcon'
import {VisionTooltip} from '../VisionTooltip'

export interface EditorCornerActionsProps {
  /** Prefixes the buttons' test IDs: `<testIdPrefix>-format`, `<testIdPrefix>-copy` */
  testIdPrefix: string
  /** Accessible label of Format, naming what it formats; Format is left out without it */
  formatLabel?: string
  onFormat?: () => void
  /** Accessible label of Copy, naming what it copies */
  copyLabel: string
  onCopy: () => void
  /** Whether Copy shows a checkmark, labelled Copied, after a copy */
  copied: boolean
}

/**
 * Format and Copy, in the top right corner of an editor. Copy is an icon, and confirms where it
 * was clicked: its copy icon turns into a checkmark, and its label into Copied, for a moment
 */
export function EditorCornerActions(props: EditorCornerActionsProps) {
  const {testIdPrefix, formatLabel, onFormat, copyLabel, onCopy, copied} = props
  const {t} = useTranslation(visionLocaleNamespace)

  return (
    <Flex alignItems="center" gap={1}>
      {formatLabel && onFormat && (
        <VisionTooltip
          content={formatLabel}
          hotkeys={VISION_SHORTCUTS.prettify.keys}
          placement="bottom"
        >
          <Button
            aria-label={formatLabel}
            data-testid={`${testIdPrefix}-format`}
            fontSize={1}
            gap={2}
            icon={PrettifyIcon}
            mode="bleed"
            onClick={onFormat}
            padding={2}
            text={t('vision.editor.format')}
          />
        </VisionTooltip>
      )}
      <VisionTooltip
        content={copied ? t('vision.editor.copied') : copyLabel}
        hotkeys={VISION_SHORTCUTS['copy-query'].keys}
        placement="bottom"
      >
        <Button
          aria-label={copied ? t('vision.editor.copied') : copyLabel}
          data-copied={copied}
          data-testid={`${testIdPrefix}-copy`}
          fontSize={1}
          icon={copied ? CheckmarkIcon : CopyIcon}
          mode="bleed"
          onClick={onCopy}
          padding={2}
        />
      </VisionTooltip>
      <VisuallyHidden aria-live="polite">{copied ? t('vision.editor.copied') : ''}</VisuallyHidden>
    </Flex>
  )
}
