import {traverseSanitySchema} from './traverseSchema'
import {type _FIXME_} from './typedefs'
import array from './validation/types/array'
import block from './validation/types/block'
import common from './validation/types/common'
import crossDatasetReference from './validation/types/crossDatasetReference'
import documentVisitor from './validation/types/document'
import file from './validation/types/file'
import image from './validation/types/image'
import object from './validation/types/object'
import reference from './validation/types/reference'
import rootType from './validation/types/rootType'
import slug from './validation/types/slug'

const typeVisitors = {
  array,
  object,
  slug,
  file,
  image,
  block,
  document: documentVisitor,
  reference: reference,
  crossDatasetReference: crossDatasetReference,
}

const getNoopVisitor = (visitorContext) => (schemaDef) => ({
  name: `<unnamed_type_@_index_${visitorContext.index}>`,
  ...schemaDef,
  _problems: [],
})

function combine(...visitors) {
  return (schemaType, visitorContext) => {
    return visitors.reduce(
      (result, visitor) => {
        const res = visitor(result, visitorContext)
        return {
          ...res,
          _problems: result._problems.concat(res._problems),
        }
      },
      {_problems: [], ...schemaType},
    )
  }
}

/**
 * @internal
 */
export function validateSchema(schemaTypes: _FIXME_) {
  return traverseSanitySchema(schemaTypes, (schemaDef, visitorContext) => {
    const typeVisitor =
      (schemaDef && schemaDef.type && typeVisitors[schemaDef.type]) ||
      getNoopVisitor(visitorContext)

    if (visitorContext.isRoot) {
      return combine(rootType, common, typeVisitor)(schemaDef, visitorContext)
    }

    return combine(common, typeVisitor)(schemaDef, visitorContext)
  })
}
