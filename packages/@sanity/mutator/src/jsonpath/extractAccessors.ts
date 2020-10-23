import {compact} from 'lodash'
import {Expression, Matcher} from '../jsonpath'
import PlainProbe from './PlainProbe'

export default function extract(path: string, value: Object): Array<any> {
  const result = []
  const appendResult = (values) => {
    result.push(...values)
  }
  const matcher = Matcher.fromPath(path).setPayload(appendResult)
  const accessor = new PlainProbe(value)
  descend(matcher, accessor)
  return result
}

function descend(matcher, accessor) {
  const {leads, delivery} = matcher.match(accessor)
  leads.forEach((lead) => {
    accessorsFromTarget(lead.target, accessor).forEach((childAccessor) => {
      descend(lead.matcher, childAccessor)
    })
  })
  if (delivery) {
    delivery.targets.forEach((target) => {
      delivery.payload(accessorsFromTarget(target, accessor))
    })
  }
}

function accessorsFromTarget(target: Expression, accessor: PlainProbe) {
  const result = []
  if (target.isIndexReference()) {
    target.toIndicies(accessor).forEach((i) => {
      result.push(accessor.getIndex(i))
    })
  } else if (target.isAttributeReference()) {
    result.push(accessor.getAttribute(target.name()))
  } else if (target.isSelfReference()) {
    result.push(accessor)
  } else {
    throw new Error(`Unable to derive accessor for target ${target.toString()}`)
  }
  return compact(result)
}
