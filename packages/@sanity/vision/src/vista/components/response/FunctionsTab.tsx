import {TrashIcon} from '@sanity/icons/Trash'
import {Badge, Button, Card, Label, Stack, Text} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {Tooltip} from '@sanity/ui/tooltip'
import {useMemo} from 'react'
import {useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type VistaSavedFunction} from '../../store/types'
import {cx} from '../../util/cx'
import {
  declarationInsertion,
  describeBody,
  describeSignature,
  type FunctionDeclaration,
  isSameDeclaration,
  parseDeclaration,
  type TextRange,
} from '../../util/groqFunctions'
import {EXTRACT_FUNCTION_SHORTCUT} from '../../util/shortcuts'
import * as styles from '../vista.module.css'

const DECLARATION_EXAMPLE = 'fn my::author($ref) = $ref->{name, "slug": slug.current};'

/** A change to the query, in positions of the query as it is */
export interface QueryEdit {
  from: number
  to: number
  insert: string
}

export interface FunctionsTabProps {
  query: string
  /** The query's declarations of custom functions */
  declarations: FunctionDeclaration[]
  library: readonly VistaSavedFunction[]
  onSave: (fn: VistaSavedFunction) => void
  onRemove: (id: string) => void
  /** Changes the query in the editor */
  onEdit: (edit: QueryEdit) => void
  /** Selects part of the query in the editor */
  onReveal: (range: TextRange) => void
}

function FunctionPreview({signature, body}: {signature: string; body: string}) {
  return (
    <Stack gap={2}>
      <Box className={styles.previewCode}>
        <Code size={1}>{signature}</Code>
      </Box>
      <Box className={styles.previewCode}>
        <Code size={0}>{body}</Code>
      </Box>
    </Stack>
  )
}

function DeclaredFunction(props: {
  declaration: FunctionDeclaration
  saved: VistaSavedFunction | undefined
  onSave: FunctionsTabProps['onSave']
  onReveal: FunctionsTabProps['onReveal']
}) {
  const {declaration, saved, onSave, onReveal} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const upToDate = saved !== undefined && isSameDeclaration(saved.declaration, declaration.text)

  return (
    <Flex alignItems="center" data-testid="vista-declared-function" gap={2}>
      <Card
        aria-label={t('vista.functions.reveal', {name: declaration.id})}
        as="button"
        className={cx(styles.lintFindingButton, styles.shrinkable)}
        flex={1}
        onClick={() => onReveal(declaration.range)}
        paddingX={3}
        paddingY={2}
        radius={2}
        type="button"
      >
        <FunctionPreview
          body={describeBody(declaration)}
          signature={describeSignature(declaration)}
        />
      </Card>
      <Box flexShrink={0} paddingRight={2}>
        {upToDate ? (
          <Badge data-testid="vista-function-saved" fontSize={0} tone="positive">
            {t('vista.functions.saved')}
          </Badge>
        ) : (
          <Button
            data-testid="vista-function-save"
            fontSize={1}
            mode="ghost"
            onClick={() => onSave({id: declaration.id, declaration: declaration.text})}
            padding={2}
            text={saved ? t('vista.functions.update') : t('vista.functions.save')}
          />
        )}
      </Box>
    </Flex>
  )
}

function LibraryFunction(props: {
  saved: VistaSavedFunction
  query: string
  declared: FunctionDeclaration | undefined
  onEdit: FunctionsTabProps['onEdit']
  onRemove: FunctionsTabProps['onRemove']
}) {
  const {saved, query, declared, onEdit, onRemove} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const parsed = useMemo(() => parseDeclaration(saved.declaration), [saved.declaration])

  let action = null
  if (parsed && !declared) {
    action = (
      <Button
        data-testid="vista-function-add"
        fontSize={1}
        mode="ghost"
        onClick={() => onEdit(declarationInsertion(query, saved.declaration))}
        padding={2}
        text={t('vista.functions.add')}
      />
    )
  } else if (parsed && declared && !isSameDeclaration(declared.text, saved.declaration)) {
    action = (
      <Button
        data-testid="vista-function-replace"
        fontSize={1}
        mode="ghost"
        onClick={() => onEdit({...declared.range, insert: saved.declaration})}
        padding={2}
        text={t('vista.functions.replace')}
      />
    )
  } else if (declared) {
    action = (
      <Badge data-testid="vista-function-declared" fontSize={0}>
        {t('vista.functions.declared')}
      </Badge>
    )
  }

  return (
    <Flex alignItems="center" data-testid="vista-library-function" gap={2}>
      <Box flexBasis="0%" flexGrow={1} minWidth="0" paddingX={3} paddingY={2}>
        <FunctionPreview
          body={parsed ? describeBody(parsed) : saved.declaration}
          signature={parsed ? describeSignature(parsed) : saved.id}
        />
      </Box>
      <Flex alignItems="center" flexShrink={0} gap={1} paddingRight={1}>
        {action}
        <Tooltip
          animate
          content={<Text size={1}>{t('vista.functions.remove')}</Text>}
          placement="top"
          portal
        >
          <Button
            aria-label={t('vista.functions.remove')}
            data-testid="vista-function-remove"
            fontSize={1}
            icon={TrashIcon}
            mode="bleed"
            onClick={() => onRemove(saved.id)}
            padding={2}
            tone="critical"
          />
        </Tooltip>
      </Flex>
    </Flex>
  )
}

/**
 * The custom functions the query declares, each of which can go to the library, and the library,
 * whose functions can be declared in the query (or put back over a declaration that differs)
 */
export function FunctionsTab(props: FunctionsTabProps) {
  const {query, declarations, library, onSave, onRemove, onEdit, onReveal} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const savedById = useMemo(() => new Map(library.map((saved) => [saved.id, saved])), [library])
  const declaredById = useMemo(() => {
    const byId = new Map<string, FunctionDeclaration>()
    for (const declaration of declarations) {
      if (!byId.has(declaration.id)) byId.set(declaration.id, declaration)
    }
    return byId
  }, [declarations])

  return (
    <Box data-testid="vista-functions" padding={3}>
      <Stack gap={4}>
        <Stack gap={2}>
          <Label muted size={0}>
            {t('vista.functions.query.title')}
          </Label>
          {declarations.length === 0 ? (
            <Stack gap={3}>
              <Text muted size={1}>
                {t('vista.functions.query.empty', {
                  shortcut: EXTRACT_FUNCTION_SHORTCUT.keys.join('+'),
                })}
              </Text>
              <Code size={1}>{DECLARATION_EXAMPLE}</Code>
            </Stack>
          ) : (
            declarations.map((declaration) => (
              <DeclaredFunction
                declaration={declaration}
                key={`${declaration.id}:${declaration.range.from}`}
                onReveal={onReveal}
                onSave={onSave}
                saved={savedById.get(declaration.id)}
              />
            ))
          )}
        </Stack>
        <Stack gap={2}>
          <Label muted size={0}>
            {t('vista.functions.library.title')}
          </Label>
          <Text muted size={1}>
            {library.length === 0
              ? t('vista.functions.library.empty')
              : t('vista.functions.library.description')}
          </Text>
          {library.map((saved) => (
            <LibraryFunction
              declared={declaredById.get(saved.id)}
              key={saved.id}
              onEdit={onEdit}
              onRemove={onRemove}
              query={query}
              saved={saved}
            />
          ))}
        </Stack>
      </Stack>
    </Box>
  )
}
