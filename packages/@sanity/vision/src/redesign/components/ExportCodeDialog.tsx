import {CopyIcon} from '@sanity/icons/Copy'
import {Button, Card, Dialog, Stack} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {useTranslation} from 'sanity/i18n'
import {Text, Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../i18n'
import {useCopyToClipboard} from '../hooks/useCopyToClipboard'
import * as styles from './redesign.module.css'

export interface ExportCodeDialogProps {
  /** The dialog's ID, which also prefixes the test IDs of its parts */
  id: string
  header: string
  /** Where the code comes from, above it */
  note: string
  /**
   * Why the code is weaker than it could be, under the note: in a caution card, or as plain
   * muted text when the reason is expected and nothing is wrong (`neutral`)
   */
  warning?: {testId: string; text: string; tone?: 'caution' | 'neutral'}
  /** The generated TypeScript; without it there is only the note */
  code: string | undefined
  onClose: () => void
}

/** Generated TypeScript in a dialog, with a note on where it comes from and a button copying it */
export function ExportCodeDialog({
  id,
  header,
  note,
  warning,
  code,
  onClose,
}: ExportCodeDialogProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const copyToClipboard = useCopyToClipboard()

  return (
    <Dialog
      animate
      data-testid={`${id}-dialog`}
      header={header}
      id={`${id}-dialog`}
      onClickOutside={onClose}
      onClose={onClose}
      width={2}
    >
      <Box padding={4}>
        <Stack gap={4}>
          <Text data-testid={`${id}-source`} muted size={1} as="div" trim={true}>
            {note}
          </Text>
          {warning && warning.tone === 'neutral' && (
            <Text data-testid={warning.testId} muted size={1} as="div" trim={true}>
              {warning.text}
            </Text>
          )}
          {warning && warning.tone !== 'neutral' && (
            <Card border padding={3} radius={2} tone="caution">
              <Text data-testid={warning.testId} size={1} as="div" trim={true} tone="caution">
                {warning.text}
              </Text>
            </Card>
          )}
          {code && (
            <>
              <Card
                border
                className={styles.codeBlock}
                overflow="auto"
                padding={3}
                radius={2}
                tone="transparent"
              >
                <Code data-testid={`${id}-code`} language="typescript" size={1}>
                  {code}
                </Code>
              </Card>
              <Flex justifyContent="flex-end">
                <Button
                  icon={CopyIcon}
                  mode="ghost"
                  onClick={() => void copyToClipboard(code, t('vision.export-types.copied'))}
                  text={t('vision.export-types.copy')}
                />
              </Flex>
            </>
          )}
        </Stack>
      </Box>
    </Dialog>
  )
}
