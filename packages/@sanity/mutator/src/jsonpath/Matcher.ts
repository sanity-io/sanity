import parse from './parse'
import Descender, {Probe} from './Descender'
import Expression from './Expression'

type Result = {
  leads: any[]
  delivery?: any
}
export default class Matcher {
  active: Array<Descender>
  recursives: Array<Descender>
  payload: any
  constructor(active: Array<Descender>, parent?: Matcher) {
    this.active = active || []
    if (parent) {
      this.recursives = parent.recursives
      this.payload = parent.payload
    } else {
      this.recursives = []
    }
    this.extractRecursives()
  }

  setPayload(payload: any) {
    this.payload = payload
    return this
  }

  // Moves any recursive descenders onto the recursive track, removing them from
  // the active set
  extractRecursives() {
    // console.log(JSON.stringify(this.active))
    this.active = this.active.filter(descender => {
      if (descender.isRecursive()) {
        this.recursives.push(...descender.extractRecursives())
        return false
      }
      return true
    })
  }

  // Find recursives that are relevant now and should be considered part of the active set
  activeRecursives(probe: Probe): Array<Descender> {
    return this.recursives.filter(descender => {
      const head = descender.head
      // Constraints are always relevant
      if (head.isConstraint()) {
        return true
      }
      // Index references are only relevant for indexable values
      if (probe.containerType() == 'array' && head.isIndexReference()) {
        return true
      }
      // Attribute references are relevant for plain objects
      if (probe.containerType() == 'object') {
        if (head.isAttributeReference() && probe.hasAttribute(head.name())) {
          return true
        }
      }
      return false
    })
  }

  match(probe: Probe): Object {
    return this.iterate(probe).extractMatches(probe)
  }

  iterate(probe: Probe): Matcher {
    const newActiveSet: Array<Descender> = []
    this.active.concat(this.activeRecursives(probe)).forEach(descender => {
      newActiveSet.push(...descender.iterate(probe))
    })
    return new Matcher(newActiveSet, this)
  }

  // Returns true if any of the descenders in the active or recursive set
  // consider the current state a final destination
  isDestination(): boolean {
    const arrival = this.active.find(descender => {
      if (descender.hasArrived()) {
        return true
      }
      return false
    })
    return !!arrival
  }

  hasRecursives(): boolean {
    return this.recursives.length > 0
  }

  // Returns any payload delivieries and leads that needs to be followed to complete
  // the process.
  extractMatches(probe: Probe): Result {
    const leads = []
    const targets = []
    this.active.forEach(descender => {
      if (descender.hasArrived()) {
        // This was allready arrived, so matches this value, not descenders
        targets.push(
          new Expression({
            type: 'alias',
            target: 'self'
          })
        )
        return
      }
      if (probe.containerType() == 'array' && !descender.head.isIndexReference()) {
        // This descender does not match an indexable value
        return
      }
      if (probe.containerType() == 'object' && !descender.head.isAttributeReference()) {
        // This descender never match a plain object
        return
      }
      // const newDescenders = descender.descend()
      // console.log('newDescenders', newDescenders)
      if (descender.tail) {
        // Not arrived yet
        const matcher = new Matcher(descender.descend(), this)
        descender.head.toFieldReferences().forEach(field => {
          leads.push({
            target: descender.head,
            matcher: matcher
          })
        })
      } else {
        // arrived
        targets.push(descender.head)
      }
    })

    // If there are recursive terms, we need to add a lead for every descendant ...
    if (this.hasRecursives()) {
      // The recustives matcher will have no active set, only inherit recursives from this
      const recursivesMatcher = new Matcher([], this)
      if (probe.containerType() == 'array') {
        const length = probe.length()
        for (let i = 0; i < length; i++) {
          leads.push({
            target: Expression.indexReference(i),
            matcher: recursivesMatcher
          })
        }
      } else if (probe.containerType() == 'object') {
        probe.attributeKeys().forEach(name => {
          leads.push({
            target: Expression.attributeReference(name),
            matcher: recursivesMatcher
          })
        })
      }
    }

    const result: Result = {
      leads: leads
    }
    if (targets.length > 0) {
      result.delivery = {
        targets: targets,
        payload: this.payload
      }
    }
    return result
  }

  static fromPath(jsonpath: string) {
    const descender = new Descender(null, new Expression(parse(jsonpath)))
    return new Matcher(descender.descend())
  }
}
