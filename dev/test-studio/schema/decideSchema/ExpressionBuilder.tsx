import {AddIcon, EditIcon, TransferIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import * as PathUtils from '@sanity/util/paths'
import {uuid} from '@sanity/uuid'
import {Fragment, useState} from 'react'
import {
  DECISION_PARAMETERS_SCHEMA,
  FormInput,
  type FormPatch,
  insert,
  type ObjectInputProps,
  type Path,
  set,
  type TitledListValue,
  unset,
  useFormValue,
  useWorkspace,
} from 'sanity'
import {styled} from 'styled-components'

import {type AndExpr, type CmpExpr, type Decide, type Expr, type OrExpr} from './types'

function Node({
  expr,
  path,
  onHover,
  hoverPath = [],
}: {
  expr: Expr
  path: Path
  onHover: (path: Path) => void
  hoverPath: Path
}) {
  const isHovered = PathUtils.isEqual(hoverPath, path)
  if (expr.kind === 'cmp') {
    const attr = expr.attr || '?'
    const op = expr.op || '?'
    const value = expr.value ?? ''
    return (
      <span
        onMouseEnter={() => onHover(path)}
        onMouseLeave={() => onHover([])}
        style={{textDecoration: isHovered ? 'underline' : 'none'}}
      >{`${attr} ${op} ${value}`}</span>
    )
  }

  if (expr.kind === 'and' || expr.kind === 'or') {
    const exprs = expr.exprs || []

    return (
      <span style={{textDecoration: isHovered ? 'underline' : 'none'}}>
        <span onMouseEnter={() => onHover(path)} onMouseLeave={() => onHover([])}>
          {`(`}
        </span>
        {exprs.map((e, index) => (
          <Fragment key={e._key}>
            <Node
              expr={e}
              path={path.concat(['exprs', {_key: e._key}])}
              onHover={onHover}
              hoverPath={hoverPath}
            />
            <span onMouseEnter={() => onHover(path)} onMouseLeave={() => onHover([])}>
              {index < exprs.length - 1 ? (expr.kind === 'and' ? ` && ` : ` || `) : ''}
            </span>
          </Fragment>
        ))}{' '}
        <span onMouseEnter={() => onHover(path)} onMouseLeave={() => onHover([])}>
          {`)`}
        </span>
      </span>
    )
  }

  if (expr.kind === 'not') {
    return (
      <span style={{textDecoration: isHovered ? 'underline' : 'none'}}>
        <span onMouseEnter={() => onHover(path)} onMouseLeave={() => onHover([])}>
          {`!( `}
        </span>
        <Node
          hoverPath={hoverPath}
          expr={expr.expr}
          path={path.concat(['exprs', {_key: expr.expr._key}])}
          onHover={onHover}
        />
        <span onMouseEnter={() => onHover(path)} onMouseLeave={() => onHover([])}>
          {` )`}
        </span>
      </span>
    )
  }

  return null
}

const debug = false

const HoverCard = styled(Card)`
  &:hover {
    border-color: var(--card-focus-ring-color);
  }
`
export function ExpressionBuilder(props: ObjectInputProps) {
  const {onChange} = props
  const value = useFormValue(props.path) as Decide | undefined
  const handleRemoveVariant = (variantKey: string) => {
    onChange(unset(['variants', {_key: variantKey}]))
  }
  const [hoverPath, setHoverPath] = useState<Path>([])
  const handleHover = (path: Path) => {
    setHoverPath(path)
  }
  return (
    <Stack space={3}>
      {value?.variants?.map((variant) => {
        return (
          <Card key={variant._key} border paddingY={3} paddingX={3} radius={3}>
            <Flex justify="space-between" align="center" paddingBottom={2} paddingRight={1}>
              <Stack space={2}>
                <Text size={1} weight="medium">
                  Rule
                </Text>
              </Stack>
              <Button
                padding={2}
                fontSize={1}
                icon={TrashIcon}
                mode="bleed"
                onClick={() => handleRemoveVariant(variant._key)}
              />
            </Flex>
            <Stack space={2}>
              <Expression
                expr={variant.when}
                onChange={onChange}
                path={['variants', {_key: variant._key}, 'when']}
                inputProps={props}
                onHover={handleHover}
                hoverPath={hoverPath}
              />

              <FormInput
                {...props}
                includeField
                relativePath={['variants', {_key: variant._key}, 'value']}
              />
            </Stack>
          </Card>
        )
      })}

      <Button
        padding={2}
        icon={AddIcon}
        text="Add variant"
        mode="ghost"
        tone="default"
        onClick={() => {
          const key = uuid()
          const patches = []
          if (value?.variants) {
            patches.push(
              insert(
                [{_key: key, _type: 'variant', when: {_type: 'expr', _key: uuid(), kind: 'cmp'}}],
                'after',
                ['variants', -1],
              ),
            )
          } else {
            patches.push(
              set(
                [{_key: key, _type: 'variant', when: {_type: 'expr', _key: uuid(), kind: 'cmp'}}],
                ['variants'],
              ),
            )
          }
          onChange(patches)
        }}
      />
    </Stack>
  )
}

function Expression({
  expr,
  onChange,
  path,
  inputProps,
  onHover,
  hoverPath,
}: {
  expr: Expr | undefined
  onChange: (patch: FormPatch | FormPatch[]) => void
  path: Path
  inputProps: ObjectInputProps
  onHover: (path: Path) => void
  hoverPath: Path
}) {
  if (!expr)
    return (
      <Card border paddingY={1} paddingX={1} radius={3}>
        <Button
          text="Add rule"
          mode="bleed"
          tone="default"
          padding={2}
          fontSize={1}
          onClick={() => {
            onChange(set({_key: uuid(), _type: 'expr', kind: 'cmp'} satisfies CmpExpr, path))
          }}
        />
      </Card>
    )
  return (
    <>
      {expr?.kind === 'and' && (
        <AndOrExpression
          expr={expr as AndExpr}
          onChange={onChange}
          path={path}
          inputProps={inputProps}
          onHover={onHover}
          hoverPath={hoverPath}
        />
      )}
      {expr?.kind === 'or' && (
        <AndOrExpression
          expr={expr as OrExpr}
          onChange={onChange}
          path={path}
          inputProps={inputProps}
          onHover={onHover}
          hoverPath={hoverPath}
        />
      )}
      {expr?.kind === 'cmp' && (
        <CompareExpression
          expr={expr as CmpExpr}
          onChange={onChange}
          path={path}
          inputProps={inputProps}
          hoverPath={hoverPath}
        />
      )}
    </>
  )
}

function AndOrExpression({
  expr,
  onChange,
  path,
  inputProps,
  onHover,
  hoverPath,
}: {
  expr: AndExpr | OrExpr
  onChange: (patch: FormPatch | FormPatch[]) => void
  path: Path
  inputProps: ObjectInputProps
  onHover: (path: Path) => void
  hoverPath: Path
}) {
  const handleAddCmp = () => {
    const newCmpExpr: CmpExpr = {
      _type: 'expr',
      _key: uuid(),
      kind: 'cmp',
    }
    onChange(insert([newCmpExpr], 'after', path.concat(['exprs', -1])))
  }
  const handleRemoveExpression = () => {
    onChange(unset(path))
  }
  const handleChangeType = () => {
    onChange(set(expr.kind === 'and' ? 'or' : 'and', path.concat(['kind'])))
  }
  const isHovered = PathUtils.isEqual(hoverPath ?? [], path)
  return (
    <HoverCard border paddingY={3} paddingX={3} radius={3} tone={isHovered ? 'suggest' : undefined}>
      <Stack space={2}>
        <Flex justify="space-between" align="center">
          <Text size={1} weight="medium">
            {expr.kind === 'and' ? 'If all of' : 'If one of'}
          </Text>
          <Flex gap={2}>
            <Button
              padding={2}
              fontSize={1}
              icon={TransferIcon}
              text={`Change to ${expr.kind === 'and' ? 'OR' : 'AND'}`}
              mode="ghost"
              tone="default"
              onClick={handleChangeType}
            />
            <Button
              padding={2}
              fontSize={1}
              icon={TrashIcon}
              mode="ghost"
              tone="default"
              onClick={handleRemoveExpression}
            />
          </Flex>
        </Flex>
        <Text size={0} muted>
          <Node expr={expr} path={path} onHover={onHover} hoverPath={hoverPath} />
        </Text>
        <Stack space={2} paddingTop={2}>
          {expr?.exprs?.map((exprItem, index) => (
            <Stack key={exprItem._key} space={2}>
              <Expression
                expr={exprItem}
                onChange={onChange}
                path={path.concat(['exprs', {_key: exprItem._key}])}
                inputProps={inputProps}
                onHover={onHover}
                hoverPath={hoverPath}
              />
              {index < expr.exprs.length - 1 && (
                <Box paddingY={2}>
                  <Text size={1} muted>
                    {expr.kind === 'and' ? 'AND' : 'OR'}
                  </Text>
                </Box>
              )}
            </Stack>
          ))}
          <Flex>
            <Button
              padding={2}
              fontSize={1}
              text="Add"
              mode="ghost"
              tone="default"
              onClick={handleAddCmp}
            />
          </Flex>
        </Stack>
      </Stack>
    </HoverCard>
  )
}

const stringOperators: TitledListValue<string>[] = [
  {title: 'is equal to', value: 'eq'},
  {title: 'is not equal to', value: 'neq'},
  {title: 'is empty', value: 'empty'},
  {title: 'is not empty', value: 'nempty'},
  {title: 'contains', value: 'contains'},
  {title: 'does not contain', value: 'ncontains'},
]

const numberOperators: TitledListValue<string>[] = [
  {title: 'is equal to', value: 'eq'},
  {title: 'is not equal to', value: 'neq'},
  {title: 'is empty', value: 'empty'},
  {title: 'is not empty', value: 'nempty'},
  {title: 'is greater than', value: 'gt'},
  {title: 'is less than', value: 'lt'},
  {title: 'is greater than or equal to', value: 'gte'},
  {title: 'is less than or equal to', value: 'lte'},
]

const CompareFormInputWrapper = styled(Card)`
  // This CompareFormInputWrapper has 1 div with data-ui ="stack" whcih contains another one with data-ui="stack".
  // I want the inner data-ui="stack" gap to be smaller. Reduce it to 16px, can you help me write that?
  & [data-ui='Stack'] [data-ui='Stack'] {
    gap: 16px;
  }
`

function CompareExpression({
  expr,
  onChange,
  path,
  inputProps,
  hoverPath = [],
}: {
  expr: CmpExpr
  onChange: (patch: FormPatch | FormPatch[]) => void
  path: Path
  inputProps: ObjectInputProps
  hoverPath: Path
}) {
  const isHovered = PathUtils.isEqual(hoverPath, path)
  const isRootExpression = path[path.length - 1] === 'when'
  const [isEditing, setIsEditing] = useState(false)
  const decisionParametersConfig = useWorkspace().__internal.options[DECISION_PARAMETERS_SCHEMA]
  const decisionParameters = decisionParametersConfig ? decisionParametersConfig() : undefined
  const properties = decisionParameters ? Object.keys(decisionParameters) : []

  const optionsList = properties
    ?.map((property) => {
      const decisionParameter = decisionParameters?.[property]
      if (!decisionParameter) {
        return null
      }
      return {
        title: decisionParameter.title || property,
        value: property,
      }
    })
    .filter(Boolean) as TitledListValue<string>[]

  const attr = expr?.attr || '?'
  const attrLabel = optionsList.find((property) => property.value === attr)?.title || attr
  const op = expr?.op || '?'
  const opLabel =
    [...stringOperators, ...numberOperators].find((opItem) => opItem.value === op)?.title || '?'
  const value = expr?.value ?? ''
  const valueOptions = decisionParameters?.[attr]?.options
  const valueLabel = valueOptions?.find((option) =>
    typeof option === 'object' && 'value' in option && option.value === value
      ? option.title
      : value,
  )
  const displayValue = `${attrLabel} ${opLabel} ${
    typeof valueLabel === 'string' ? valueLabel : valueLabel?.title || value
  }`

  const handleAddAndCase = () => {
    // We are starting from a cmp expression, so to make it an and, we need to change this level
    // to an or expression, and moe this cmp expression as the first expression in the new or expression.
    // into the exprs array
    const newAndExpr: AndExpr = {
      _type: 'expr',
      _key: uuid(),
      kind: 'and',
      exprs: [expr, {_type: 'expr', _key: uuid(), kind: 'cmp'}],
    }
    onChange(set(newAndExpr, path))
  }

  const handleAddOrCase = () => {
    // We are starting from a cmp expression, so to make it an or, we need to change this level
    // to an or expression, and moe this cmp expression as the first expression in the new or expression.
    // into the exprs array
    const newOrExpr: OrExpr = {
      _type: 'expr',
      _key: uuid(),
      kind: 'or',
      exprs: [expr, {_type: 'expr', _key: uuid(), kind: 'cmp'}],
    }
    onChange(set(newOrExpr, path))
  }
  const handleRemoveExpression = () => {
    onChange(unset(path))
  }

  return (
    <HoverCard
      border={!isRootExpression}
      paddingY={isRootExpression ? 0 : 3}
      paddingX={isRootExpression ? 0 : 3}
      radius={isRootExpression ? 0 : 3}
      shadow={isRootExpression ? 0 : 1}
      tone={isHovered ? 'suggest' : undefined}
    >
      <Stack space={2}>
        <HoverCard
          border
          paddingLeft={2}
          radius={3}
          padding={2}
          shadow={2}
          tone={isHovered ? 'suggest' : undefined}
        >
          <Stack space={2}>
            <Card border paddingY={1} paddingX={2} radius={3}>
              <Flex align="center" justify="space-between" gap={2}>
                <Text size={1} weight="medium">
                  {displayValue}
                </Text>
                <Flex gap={2} align="center">
                  <Button
                    padding={2}
                    fontSize={1}
                    icon={TrashIcon}
                    mode="bleed"
                    onClick={handleRemoveExpression}
                  />
                  <Button
                    padding={2}
                    fontSize={1}
                    icon={EditIcon}
                    mode="bleed"
                    tone="default"
                    onClick={() => setIsEditing((prev) => !prev)}
                  />
                </Flex>
              </Flex>
              {debug && (
                <Text size={0} muted>
                  {PathUtils.toString(path)}
                </Text>
              )}
              {isEditing && (
                <Box paddingY={2}>
                  <CompareFormInputWrapper
                    tone="default"
                    data-ui="form-input-wrapper"
                    paddingY={2}
                    paddingX={3}
                    radius={3}
                  >
                    <FormInput {...inputProps} includeField={false} relativePath={path} />
                  </CompareFormInputWrapper>
                </Box>
              )}
            </Card>
            <Flex>
              <Button
                text="And"
                mode="ghost"
                tone="default"
                onClick={handleAddAndCase}
                padding={2}
                fontSize={1}
              />
            </Flex>
          </Stack>
        </HoverCard>
        <Flex>
          <Button
            text="Or"
            mode="ghost"
            tone="default"
            onClick={handleAddOrCase}
            padding={2}
            fontSize={1}
          />
        </Flex>
      </Stack>
    </HoverCard>
  )
}
