import {Badge, Card, Stack, Text} from '@sanity/ui'
import {type TFunction, useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type LintSeverity, type QueryLintFinding, splitMessage} from '../../util/groqLint'
import {lintFindingButton} from '../vista.css'

function severityLabel(severity: LintSeverity, t: TFunction<'vision'>): string {
  switch (severity) {
    case 'error':
      return t('vista.lint.severity.error')
    case 'warning':
      return t('vista.lint.severity.warning')
    case 'info':
      return t('vista.lint.severity.info')
    case 'hint':
      return t('vista.lint.severity.hint')
    default: {
      const exhaustive: never = severity
      return String(exhaustive)
    }
  }
}

function severityTone(severity: LintSeverity): 'critical' | 'caution' | 'primary' | 'default' {
  switch (severity) {
    case 'error':
      return 'critical'
    case 'warning':
      return 'caution'
    case 'info':
      return 'primary'
    case 'hint':
      return 'default'
    default: {
      const exhaustive: never = severity
      return exhaustive
    }
  }
}

export interface LintTabProps {
  findings: QueryLintFinding[]
  /** Called with the finding to show in the editor */
  onReveal: (finding: QueryLintFinding) => void
}

/** The query editor's lint diagnostics as a list; each one selects its range in the editor */
export function LintTab({findings, onReveal}: LintTabProps) {
  const {t} = useTranslation(visionLocaleNamespace)

  if (findings.length === 0) {
    return (
      <Box padding={3}>
        <Text muted size={1}>
          {t('vista.lint.empty')}
        </Text>
      </Box>
    )
  }

  return (
    <Stack data-testid="vista-lint">
      {findings.map((finding) => (
        <Card
          as="button"
          borderBottom
          className={lintFindingButton}
          data-testid="vista-lint-finding"
          key={`${finding.from}:${finding.to}:${finding.source ?? ''}:${finding.message}`}
          onClick={() => onReveal(finding)}
          paddingX={3}
          paddingY={3}
          type="button"
        >
          <Flex alignItems="flex-start" gap={3}>
            <Box flexShrink={0} paddingTop={1}>
              <Badge fontSize={0} tone={severityTone(finding.severity)}>
                {severityLabel(finding.severity, t)}
              </Badge>
            </Box>
            <Stack flex={1} gap={2}>
              <Text size={1}>
                {splitMessage(finding.message).map((segment, index) =>
                  segment.code ? (
                    <code key={index}>{segment.text}</code>
                  ) : (
                    <span key={index}>{segment.text}</span>
                  ),
                )}
              </Text>
              <Text muted size={0}>
                {t('vista.lint.position', {line: finding.line, column: finding.column})}
                {finding.source ? ` · ${finding.source}` : ''}
              </Text>
            </Stack>
          </Flex>
        </Card>
      ))}
    </Stack>
  )
}
