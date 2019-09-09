import parse from './parse'
import ImmutableAccessor from './ImmutableAccessor'
import {Matcher} from '../jsonpath'

export default class Patcher {
  patches: Array<Object>
  constructor(patch: Object) {
    this.patches = parse(patch)
  }
  apply(value: Object) {
    // Apply just makes a root accessor around the provided
    // value, then applies the patches. Due to the use of
    // ImmutableAccessor it is guaranteed to return either the
    // exact same object it was provided (in the case of no changes),
    // or a completely new object. It will never mutate the object in place.
    const accessor = new ImmutableAccessor(value)
    return this.applyViaAccessor(accessor).get()
  }
  // If you want to use your own accessor implementation, you can use this method
  // to invoke the patcher. Since all subsequent accessors for children of this accessor
  // are obtained through the methods in the accessors, you retain full control of the
  // implementation throguhgout the application. Have a look in ImmutableAccessor
  // to see an example of how accessors are implemented.
  applyViaAccessor(accessor: Object) {
    let result = accessor
    const idAccessor = accessor.getAttribute('_id')
    let id
    if (idAccessor) {
      id = idAccessor.get()
    } else {
      throw new Error('Cannot apply patch to document with no _id')
    }
    this.patches.forEach(patch => {
      if (patch.id !== id) {
        // Ignore patches that are not targetted at this document
        // console.log("Ignored patch because id did not match document id", patch.id, id)
        return
      }
      const matcher = Matcher.fromPath(patch.path).setPayload(patch)
      result = process(matcher, result)
    })
    return result
  }
}

// Recursively (depth first) follows any leads generated by the matcher, expecting
// a patch to be the payload. When matchers report a delivery, the
// apply(targets, accessor) is called on the patch
function process(matcher, accessor) {
  let result = accessor
  // Every time we execute the matcher a new set of leads is generated. Each lead
  // is a target (being an index, an attribute name or a range) in the form of an
  // Expression instance. For each lead target there is also a matcher. Our job is to obtain
  // accessor(s) for each target (there might be more than one, since the targets may
  // be ranges) and run the provided matcher on those accessors.
  const {leads, delivery} = matcher.match(accessor)
  leads.forEach(lead => {
    if (lead.target.isIndexReference()) {
      lead.target.toIndicies().forEach(i => {
        result = result.setIndexAccessor(i, process(lead.matcher, result.getIndex(i)))
      })
    } else if (lead.target.isAttributeReference()) {
      if (!result.hasAttribute(lead.target.name())) {
        // Don't follow lead, no such attribute
        return
      }
      const oldValueAccessor = result.getAttribute(lead.target.name())
      const newValueAccessor = process(lead.matcher, result.getAttribute(lead.target.name()))
      if (oldValueAccessor !== newValueAccessor) {
        result = result.setAttributeAccessor(lead.target.name(), newValueAccessor)
      }
    } else {
      throw new Error(`Unable to handle target ${lead.target.toString()}`)
    }
  })
  // Each time we run the matcher, we might also get a delivery. This means that a
  // term in the jsonpath terminated here and the patch should be applied. The delivery
  // arrives in the form of an array of targets and a payload (which in this application
  // is the patch). Conveniently the patches accept an array of targets and an accessor
  // to do its work, so here we just pass those to the patch and we're done.
  if (delivery) {
    const patch = delivery.payload
    result = patch.apply(delivery.targets, result)
  }
  return result
}
