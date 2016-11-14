// @flow
import parse from './parse'
import Descender from './Descender'
import Expression from './Expression'

type Probe = Object

export default class Matcher {
  active : Array<Descender>
  recursives: Array<Descender>
  payload : any
  constructor(active : Array<Descender>, parent? : Matcher) {
    this.active = active || []
    if (parent) {
      this.recursives = parent.recursives
      this.payload = parent.payload
    } else {
      this.recursives = []
    }
    this.extractRecursives()
  }

  setPayload(payload : any) {
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

  match(probe : Probe) : Object {
    return this.iterate(probe).extractMatches(probe)
  }

  iterate(probe : Probe) : Matcher {
    const newActiveSet : Array<Descender> = []
    this.active.concat(this.recursives).forEach(descender => {
      newActiveSet.push(...descender.iterate(probe))
    })
    return new Matcher(newActiveSet, this)
  }

  // Returns true if any of the descenders in the active or recursive set
  // consider the current state a final destination
  isDestination() : bool {
    const arrival = this.active.concat(this.recursives).find(descender => {
      if (descender.hasArrived()) {
        return true
      }
      return false
    })
    return !!arrival
  }

  // Returns any payload delivieries and leads that needs to be followed to complete
  // the process.
  extractMatches(probe : Probe) : Object {
    const leads = []
    const targets = []
    this.active.concat(this.recursives).forEach(descender => {
      if (descender.hasArrived()) {
        // This descender is done, no further processing
        return
      }
      if (probe.isIndexable() && !descender.head.isIndexReference()) {
        // This descender does not match an indexable value
        return
      }
      if (probe.isPlainObject() && !descender.head.isAttributeReference()) {
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
    const result : Object = {
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

  static fromPath(jsonpath : string) {
    const descender = new Descender(null, new Expression(parse(jsonpath)))
    return new Matcher(descender.descend())
  }
}
