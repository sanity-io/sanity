import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CodeBlockIcon} from '@sanity/icons/CodeBlock'
import {CopyIcon} from '@sanity/icons/Copy'
import {Button, Hotkeys} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {useTranslation} from 'sanity/i18n'
import {Flex, Text} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {VISION_SHORTCUTS} from '../../util/shortcuts'

export interface EditorCornerActionsProps {
  /** Prefixes the buttons' test IDs: `<testIdPrefix>-format`, `<testIdPrefix>-copy` */
  testIdPrefix: string
  /** Accessible label of Format, naming what it formats; Format is left out without it */
  formatLabel?: string
  onFormat?: () => void
  /** Accessible label of Copy, naming what it copies */
  copyLabel: string
  onCopy: () => void
  /** Whether Copy reads Copied, with a checkmark, after a copy */
  copied: boolean
}

function ShortcutTooltipContent({label, keys}: {label: string; keys: string[]}) {
  return (
    <Flex alignItems="center" gap={2} padding={1}>
      <Text as="div" size={1} trim={true}>
        {label}
      </Text>
      <Hotkeys fontSize={0} keys={keys} />
    </Flex>
  )
}

/**
 * Format and Copy, in the top right corner of an editor. Copy confirms where it was clicked: it
 * reads Copied, with its copy icon turned into a checkmark, for a moment
 */
export function EditorCornerActions(props: EditorCornerActionsProps) {
  const {testIdPrefix, formatLabel, onFormat, copyLabel, onCopy, copied} = props
  const {t} = useTranslation(visionLocaleNamespace)

  return (
    <Flex alignItems="center" gap={1}>
      {formatLabel && onFormat && (
        <Tooltip
          animate
          content={
            <ShortcutTooltipContent keys={VISION_SHORTCUTS.prettify.keys} label={formatLabel} />
          }
          placement="bottom"
          portal
        >
          <Button
            aria-label={formatLabel}
            data-testid={`${testIdPrefix}-format`}
            fontSize={1}
            gap={2}
            icon={CodeBlockIcon}
            mode="bleed"
            onClick={onFormat}
            padding={2}
            text={t('vision.editor.format')}
          />
        </Tooltip>
      )}
      <Tooltip
        animate
        content={
          <ShortcutTooltipContent keys={VISION_SHORTCUTS['copy-query'].keys} label={copyLabel} />
        }
        placement="bottom"
        portal
      >
        <Button
          aria-label={copied ? t('vision.editor.copied') : copyLabel}
          data-copied={copied}
          data-testid={`${testIdPrefix}-copy`}
          fontSize={1}
          gap={2}
          icon={copied ? CheckmarkIcon : CopyIcon}
          mode="bleed"
          onClick={onCopy}
          padding={2}
          text={copied ? t('vision.editor.copied') : t('vision.editor.copy')}
        />
      </Tooltip>
    </Flex>
  )
}
