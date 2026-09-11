import {type Expression} from './Expression'
import {Matcher} from './Matcher'
import {PlainProbe} from './PlainProbe'
import {type Probe} from './Probe'

export function extractAccessors(path: string, value: unknown): Probe[] {
  const result: Probe[] = []
  const matcher = Matcher.fromPath(path).setPayload(function appendResult(values: Probe[]) {
    result.push(...values)
  })
  const accessor = new PlainProbe(value)
  descend(matcher, accessor)
  return result
}

function descend(matcher: Matcher, accessor: Probe) {
  const {leads, delivery} = matcher.match(accessor)

  leads.forEach((lead) => {
    accessorsFromTarget(lead.target, accessor).forEach((childAccessor) => {
      descend(lead.matcher, childAccessor)
    })
  })

  if (delivery) {
    delivery.targets.forEach((target) => {
      if (typeof delivery.payload === 'function') {
        delivery.payload(accessorsFromTarget(target, accessor))
      }
    })
  }
}

function accessorsFromTarget(target: Expression, accessor: Probe): Probe[] {
  const result: Probe[] = []
  if (target.isIndexReference()) {
    target.toIndicies(accessor).forEach((i) => {
      const item = accessor.getIndex(i)
      if (item) {
        result.push(item)
      }
    })
  } else if (target.isAttributeReference()) {
    const attribute = accessor.getAttribute(target.name())
    if (attribute) {
      result.push(attribute)
    }
  } else if (target.isSelfReference()) {
    result.push(accessor)
  } else {
    throw new Error(`Unable to derive accessor for target ${target.toString()}`)
  }
  return result
}
