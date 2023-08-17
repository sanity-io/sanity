import {flatten} from 'lodash'
import {Expression} from './Expression'
import type {Probe} from './Probe'

/**
 * Descender models the state of one partial jsonpath evaluation. Head is the
 * next thing to match, tail is the upcoming things once the head is matched.
 */
export class Descender {
  head: Expression | null
  tail: Expression | null

  constructor(head: Expression | null, tail: Expression | null) {
    this.head = head
    this.tail = tail
  }

  // Iterate this descender once processing any constraints that are
  // resolvable on the current value. Returns an array of new descenders
  // that are guaranteed to be without constraints in the head
  iterate(probe: Probe): Descender[] {
    let result: Descender[] = [this]
    if (this.head && this.head.isConstraint()) {
      let anyConstraints = true
      // Keep rewriting constraints until there are none left
      while (anyConstraints) {
        result = flatten(
          result.map((descender) => {
            return descender.iterateConstraints(probe)
          }),
        )
        anyConstraints = result.some((descender) => {
          return descender.head && descender.head.isConstraint()
        })
      }
    }
    return result
  }

  isRecursive(): boolean {
    return Boolean(this.head && this.head.isRecursive())
  }

  hasArrived(): boolean {
    return this.head === null && this.tail === null
  }

  extractRecursives(): Descender[] {
    if (this.head && this.head.isRecursive()) {
      const term = this.head.unwrapRecursive()
      return new Descender(null, term.concat(this.tail)).descend()
    }
    return []
  }

  iterateConstraints(probe: Probe): Descender[] {
    const head = this.head
    if (head === null || !head.isConstraint()) {
      // Not a constraint, no rewrite
      return [this]
    }

    const result: Descender[] = []

    if (probe.containerType() === 'primitive' && head.constraintTargetIsSelf()) {
      if (head.testConstraint(probe)) {
        result.push(...this.descend())
      }
      return result
    }

    // The value is an array
    if (probe.containerType() === 'array') {
      const length = probe.length()
      for (let i = 0; i < length; i++) {
        // Push new descenders with constraint translated to literal indices
        // where they match
        const constraint = probe.getIndex(i)
        if (constraint && head.testConstraint(constraint)) {
          result.push(new Descender(new Expression({type: 'index', value: i}), this.tail))
        }
      }
      return result
    }

    // The value is an object
    if (probe.containerType() === 'object') {
      if (head.constraintTargetIsSelf()) {
        // There are no matches for target self ('@') on a plain object
        return []
      }

      if (head.testConstraint(probe)) {
        return this.descend()
      }

      return result
    }

    return result
  }

  descend(): Descender[] {
    if (!this.tail) {
      return [new Descender(null, null)]
    }

    return this.tail.descend().map((ht) => {
      return new Descender(ht.head, ht.tail)
    })
  }

  toString(): string {
    const result = ['<']
    if (this.head) {
      result.push(this.head.toString())
    }
    result.push('|')
    if (this.tail) {
      result.push(this.tail.toString())
    }
    result.push('>')
    return result.join('')
  }
}
