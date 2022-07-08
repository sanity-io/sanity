// A utility wrapper class to process parsed jsonpath expressions

import type {Expr, HeadTail} from './types'
import type {Probe} from './Probe'
import {descend} from './descend'
import {toPath} from './toPath'
import {parseJsonPath} from './parse'

export interface Range {
  start: number
  end: number
  step: number
}

export class Expression {
  expr: Expr

  constructor(expr: Expr | Expression | null) {
    if (!expr) {
      throw new Error('Attempted to create Expression from null-value')
    }

    // This is a wrapped expr
    if ('expr' in expr) {
      this.expr = expr.expr
    } else {
      this.expr = expr
    }

    if (!('type' in this.expr)) {
      throw new Error('Attempt to create Expression for expression with no type')
    }
  }

  isPath(): boolean {
    return this.expr.type === 'path'
  }

  isUnion(): boolean {
    return this.expr.type === 'union'
  }

  isCollection(): boolean {
    return this.isPath() || this.isUnion()
  }

  isConstraint(): boolean {
    return this.expr.type === 'constraint'
  }

  isRecursive(): boolean {
    return this.expr.type === 'recursive'
  }

  isExistenceConstraint(): boolean {
    return this.expr.type === 'constraint' && this.expr.operator === '?'
  }

  isIndex(): boolean {
    return this.expr.type === 'index'
  }

  isRange(): boolean {
    return this.expr.type === 'range'
  }

  expandRange(probe?: Probe): Range {
    const probeLength = () => {
      if (!probe) {
        throw new Error('expandRange() required a probe that was not passed')
      }

      return probe.length()
    }

    let start = 'start' in this.expr ? this.expr.start || 0 : 0
    start = interpretNegativeIndex(start, probe)
    let end = 'end' in this.expr ? this.expr.end || probeLength() : probeLength()
    end = interpretNegativeIndex(end, probe)
    const step = 'step' in this.expr ? this.expr.step || 1 : 1
    return {start, end, step}
  }

  isAttributeReference(): boolean {
    return this.expr.type === 'attribute'
  }

  // Is a range or index -> something referencing indexes
  isIndexReference(): boolean {
    return this.isIndex() || this.isRange()
  }

  name(): string {
    return 'name' in this.expr ? this.expr.name : ''
  }

  isSelfReference(): boolean {
    return this.expr.type === 'alias' && this.expr.target === 'self'
  }

  constraintTargetIsSelf(): boolean {
    return (
      this.expr.type === 'constraint' &&
      this.expr.lhs.type === 'alias' &&
      this.expr.lhs.target === 'self'
    )
  }

  constraintTargetIsAttribute(): boolean {
    return this.expr.type === 'constraint' && this.expr.lhs.type === 'attribute'
  }

  testConstraint(probe: Probe): boolean {
    const expr = this.expr

    if (expr.type === 'constraint' && expr.lhs.type === 'alias' && expr.lhs.target === 'self') {
      if (probe.containerType() !== 'primitive') {
        return false
      }

      if (expr.type === 'constraint' && expr.operator === '?') {
        return true
      }

      const lhs = probe.get()
      const rhs = expr.rhs && 'value' in expr.rhs ? expr.rhs.value : undefined
      return testBinaryOperator(lhs, expr.operator, rhs)
    }

    if (expr.type !== 'constraint') {
      return false
    }

    const lhs = expr.lhs
    if (!lhs) {
      throw new Error('No LHS of expression')
    }

    if (lhs.type !== 'attribute') {
      throw new Error(`Constraint target ${lhs.type} not supported`)
    }

    if (probe.containerType() !== 'object') {
      return false
    }

    const lhsValue = probe.getAttribute(lhs.name)
    if (lhsValue === undefined || lhsValue === null || lhsValue.containerType() !== 'primitive') {
      // LHS is void and empty, or it is a collection
      return false
    }

    if (this.isExistenceConstraint()) {
      // There is no rhs, and if we're here the key did exist
      return true
    }

    const rhs = expr.rhs && 'value' in expr.rhs ? expr.rhs.value : undefined
    return testBinaryOperator(lhsValue.get(), expr.operator, rhs)
  }

  pathNodes(): Expr[] {
    return this.expr.type === 'path' ? this.expr.nodes : [this.expr]
  }

  prepend(node: Expression): Expression {
    if (!node) {
      return this
    }

    return new Expression({
      type: 'path',
      nodes: node.pathNodes().concat(this.pathNodes()),
    })
  }

  concat(other: Expression | null): Expression {
    return other ? other.prepend(this) : this
  }

  descend(): HeadTail[] {
    return descend(this.expr).map((headTail) => {
      const [head, tail] = headTail
      return {
        head: head ? new Expression(head) : null,
        tail: tail ? new Expression(tail) : null,
      }
    })
  }

  unwrapRecursive(): Expression {
    if (this.expr.type !== 'recursive') {
      throw new Error(`Attempt to unwrap recursive on type ${this.expr.type}`)
    }

    return new Expression(this.expr.term)
  }

  toIndicies(probe?: Probe): number[] {
    if (this.expr.type !== 'index' && this.expr.type !== 'range') {
      throw new Error('Node cannot be converted to indexes')
    }

    if (this.expr.type === 'index') {
      return [interpretNegativeIndex(this.expr.value, probe)]
    }

    const result: number[] = []
    const range = this.expandRange(probe)
    let {start, end} = range
    if (range.step < 0) {
      ;[start, end] = [end, start]
    }

    for (let i = start; i < end; i++) {
      result.push(i)
    }

    return result
  }

  toFieldReferences(): number[] | string[] {
    if (this.isIndexReference()) {
      return this.toIndicies()
    }
    if (this.expr.type === 'attribute') {
      return [this.expr.name]
    }
    throw new Error(`Can't convert ${this.expr.type} to field references`)
  }

  toString(): string {
    return toPath(this.expr)
  }

  static fromPath(path: string): Expression {
    const parsed = parseJsonPath(path)
    if (!parsed) {
      throw new Error(`Failed to parse path "${path}"`)
    }

    return new Expression(parsed)
  }

  static attributeReference(name: string): Expression {
    return new Expression({
      type: 'attribute',
      name: name,
    })
  }

  static indexReference(i: number): Expression {
    return new Expression({
      type: 'index',
      value: i,
    })
  }
}

// Tests an operator on two given primitive values
function testBinaryOperator(lhsValue: any, operator: string, rhsValue: any) {
  switch (operator) {
    case '>':
      return lhsValue > rhsValue
    case '>=':
      return lhsValue >= rhsValue
    case '<':
      return lhsValue < rhsValue
    case '<=':
      return lhsValue <= rhsValue
    case '==':
      return lhsValue === rhsValue
    case '!=':
      return lhsValue !== rhsValue
    default:
      throw new Error(`Unsupported binary operator ${operator}`)
  }
}

function interpretNegativeIndex(index: number, probe?: Probe): number {
  if (index >= 0) {
    return index
  }

  if (!probe) {
    throw new Error('interpretNegativeIndex() must have a probe when < 0')
  }

  return index + probe.length()
}
