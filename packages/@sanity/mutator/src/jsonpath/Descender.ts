// Descender models the state of one partial jsonpath evaluation. Head is the
// next thing to match, tail is the upcoming things once the head is matched.

import {flatten} from 'lodash'
import Expression from './Expression'

export type Probe = {
  containerType(): string,
  length(): number
  getIndex(index: number): any
  get: () => any
  getAttribute(string): any
  attributeKeys(): string[]
  hasAttribute(attr: string): boolean
}

export default class Descender {
  head: Expression
  tail: Expression
  constructor(head: Expression, tail: Expression) {
    this.head = head
    this.tail = tail
  }
  // Iterate this descender once processing any constraints that are
  // resolvable on the current value. Returns an array of new descenders
  // that are guaranteed to be without constraints in the head
  iterate(probe: Probe): Array<Descender> {
    let result: Array<Descender> = [this]
    if (this.head && this.head.isConstraint()) {
      let anyConstraints = true
      // Keep rewriting constraints until there are none left
      while (anyConstraints) {
        result = flatten(
          result.map(descender => {
            return descender.iterateConstraints(probe)
          })
        )
        anyConstraints = result.some(descender => {
          return descender.head && descender.head.isConstraint()
        })
      }
    }
    return result
  }

  isRecursive(): boolean {
    return this.head && this.head.isRecursive()
  }

  hasArrived(): boolean {
    return this.head === null && this.tail === null
  }

  extractRecursives(): Array<Descender> {
    if (this.head.isRecursive()) {
      const term = this.head.unwrapRecursive()
      return new Descender(null, term.concat(this.tail)).descend()
    }
    return []
  }
  iterateConstraints(probe: Probe): Array<Descender> {
    const head = this.head
    if (head === null || !head.isConstraint()) {
      // Not a constraint, no rewrite
      return [this]
    }

    const result: Array<Descender> = []

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
        if (head.testConstraint(probe.getIndex(i))) {
          result.push(new Descender(new Expression({type: 'index', value: i}), this.tail))
        }
      }
      return result
    }

    // The value is an object
    if (probe.containerType() == 'object') {
      if (this.head.constraintTargetIsSelf()) {
        // There are no matches for target self ('@') on a plain object
        return []
      }
      if (this.head.testConstraint(probe)) {
        return this.descend()
      }
      return result
    }

    return result
  }
  descend(): Array<Descender> {
    if (!this.tail) {
      return [new Descender(null, null)]
    }
    return this.tail.descend().map(ht => {
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
