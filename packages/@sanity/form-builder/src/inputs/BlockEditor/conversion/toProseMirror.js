import {createFieldValue} from '../../../state/FormBuilderState'
// Converts a persisted array to a prosemirror compatible json document

const TRANSFORMS = {
  paragraph(item) {
    return {
      type: 'paragraph',
      content: (item.content || []).map(convertPMType)
    }
  },
  listItem(node) {
    return {
      type: 'list_item',
      content: (node.content || []).map(convertPMType)
    }
  },
  bulletList(node) {
    return {
      type: 'bullet_list',
      content: (node.content || []).map(convertPMType)
    }
  },
  hardBreak(node) {
    return {
      type: 'hard_break',
      content: (node.content || []).map(convertPMType)
    }
  },
  text(item) {
    return {
      type: 'text',
      text: item.text,
      marks: item.marks.map(convertMark)
    }
  }
}

function convertMark(mark) {
  return {_: mark.type, ...mark.attributes}
}

function convertPMType(item) {
  const pmConverter = TRANSFORMS[item._type]
  if (pmConverter) {
    return pmConverter(item)
  }
  throw new Error(`Not a prosemirror type: ${item}`)
}

export default function toProseMirror(array, context) {
  return {
    type: 'doc',
    content: array.map(item => {
      const isPMType = TRANSFORMS[item._type]
      if (isPMType) {
        return convertPMType(item)
      }

      const itemField = context.field.of.find(ofType => ofType.type === item._type)
      const value = createFieldValue(item, {
        field: itemField,
        schema: context.schema,
        resolveInputComponent: context.resolveInputComponent
      })
      return {
        type: itemField.type,
        attrs: {value: value}
      }
    })
  }
}
