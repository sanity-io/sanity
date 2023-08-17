import {parseJsonPath} from './parse'
import {Descender} from './Descender'
import {Expression} from './Expression'
import type {Probe} from './Probe'

interface Result<P = unknown> {
  leads: {
    target: Expression
    matcher: Matcher
  }[]

  delivery?: {
    targets: Expression[]
    payload: P
  }
}

/**
 * @internal
 */
export class Matcher {
  active: Descender[]
  recursives: Descender[]
  payload: unknown

  constructor(active: Descender[], parent?: Matcher) {
    this.active = active || []
    if (parent) {
      this.recursives = parent.recursives
      this.payload = parent.payload
    } else {
      this.recursives = []
    }
    this.extractRecursives()
  }

  setPayload(payload: unknown): this {
    this.payload = payload
    return this
  }

  // Moves any recursive descenders onto the recursive track, removing them from
  // the active set
  extractRecursives(): void {
    this.active = this.active.filter((descender) => {
      if (descender.isRecursive()) {
        this.recursives.push(...descender.extractRecursives())
        return false
      }
      return true
    })
  }

  // Find recursives that are relevant now and should be considered part of the active set
  activeRecursives(probe: Probe): Descender[] {
    return this.recursives.filter((descender) => {
      const head = descender.head
      if (!head) {
        return false
      }

      // Constraints are always relevant
      if (head.isConstraint()) {
        return true
      }

      // Index references are only relevant for indexable values
      if (probe.containerType() === 'array' && head.isIndexReference()) {
        return true
      }

      // Attribute references are relevant for plain objects
      if (probe.containerType() === 'object') {
        return head.isAttributeReference() && probe.hasAttribute(head.name())
      }

      return false
    })
  }

  match(probe: Probe): Result {
    return this.iterate(probe).extractMatches(probe)
  }

  iterate(probe: Probe): Matcher {
    const newActiveSet: Descender[] = []
    this.active.concat(this.activeRecursives(probe)).forEach((descender) => {
      newActiveSet.push(...descender.iterate(probe))
    })
    return new Matcher(newActiveSet, this)
  }

  // Returns true if any of the descenders in the active or recursive set
  // consider the current state a final destination
  isDestination(): boolean {
    return this.active.some((descender) => descender.hasArrived())
  }

  hasRecursives(): boolean {
    return this.recursives.length > 0
  }

  // Returns any payload delivieries and leads that needs to be followed to complete
  // the process.
  extractMatches(probe: Probe): Result {
    const leads: {target: Expression; matcher: Matcher}[] = []
    const targets: Expression[] = []
    this.active.forEach((descender) => {
      if (descender.hasArrived()) {
        // This was already arrived, so matches this value, not descenders
        targets.push(
          new Expression({
            type: 'alias',
            target: 'self',
          }),
        )
        return
      }

      const descenderHead = descender.head
      if (!descenderHead) {
        return
      }

      if (probe.containerType() === 'array' && !descenderHead.isIndexReference()) {
        // This descender does not match an indexable value
        return
      }

      if (probe.containerType() === 'object' && !descenderHead.isAttributeReference()) {
        // This descender never match a plain object
        return
      }

      if (descender.tail) {
        // Not arrived yet
        const matcher = new Matcher(descender.descend(), this)
        descenderHead.toFieldReferences().forEach(() => {
          leads.push({
            target: descenderHead,
            matcher: matcher,
          })
        })
      } else {
        // arrived
        targets.push(descenderHead)
      }
    })

    // If there are recursive terms, we need to add a lead for every descendant ...
    if (this.hasRecursives()) {
      // The recustives matcher will have no active set, only inherit recursives from this
      const recursivesMatcher = new Matcher([], this)
      if (probe.containerType() === 'array') {
        const length = probe.length()
        for (let i = 0; i < length; i++) {
          leads.push({
            target: Expression.indexReference(i),
            matcher: recursivesMatcher,
          })
        }
      } else if (probe.containerType() === 'object') {
        probe.attributeKeys().forEach((name) => {
          leads.push({
            target: Expression.attributeReference(name),
            matcher: recursivesMatcher,
          })
        })
      }
    }

    return targets.length > 0
      ? {leads: leads, delivery: {targets, payload: this.payload}}
      : {leads: leads}
  }

  static fromPath(jsonpath: string): Matcher {
    const path = parseJsonPath(jsonpath)
    if (!path) {
      throw new Error(`Failed to parse path from "${jsonpath}"`)
    }

    const descender = new Descender(null, new Expression(path))
    return new Matcher(descender.descend())
  }
}
