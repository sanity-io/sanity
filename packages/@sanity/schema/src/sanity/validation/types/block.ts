import {omit, isPlainObject} from 'lodash'
import humanizeList from 'humanize-list'
import {error, HELP_IDS, warning} from '../createValidationResult'
import {isJSONTypeOf} from '../utils/isJSONTypeOf'

const getTypeOf = (thing) => (Array.isArray(thing) ? 'array' : typeof thing)
const quote = (str) => `"${str}"`
const allowedKeys = [
  'components',
  'lists',
  'marks',
  'name',
  'of',
  'options',
  'styles',
  'title',
  'type',
  'validation',
]
const allowedMarkKeys = ['decorators', 'annotations']
const allowedStyleKeys = ['blockEditor', 'title', 'value', 'component']
const allowedDecoratorKeys = ['blockEditor', 'title', 'value', 'icon', 'component']
const allowedListKeys = ['title', 'value', 'icon', 'component']

export default function validateBlockType(typeDef, visitorContext) {
  const problems = []
  let styles = typeDef.styles
  let lists = typeDef.lists
  let marks = typeDef.marks
  let members = typeDef.of

  const disallowedKeys = Object.keys(typeDef).filter(
    (key) => !allowedKeys.includes(key) && !key.startsWith('_'),
  )

  if (disallowedKeys.length > 0) {
    problems.push(
      error(
        `Found unknown properties for block declaration: ${humanizeList(
          disallowedKeys.map(quote),
        )}`,
      ),
    )
  }

  if (marks) {
    marks = validateMarks(typeDef.marks, visitorContext, problems)
  }

  if (styles) {
    styles = validateStyles(styles, visitorContext, problems)
  }

  if (lists) {
    lists = validateLists(lists, visitorContext, problems)
  }

  if (members) {
    members = validateMembers(members, visitorContext, problems)
  }
  return {
    ...omit(typeDef, disallowedKeys),
    marks,
    styles,
    name: typeDef.name || typeDef.type,
    of: members,
    _problems: problems,
  }
}

function validateMarks(marks, visitorContext, problems) {
  let decorators = marks.decorators
  let annotations = marks.annotations

  if (!isPlainObject(marks)) {
    problems.push(error(`"marks" declaration should be an object, got ${getTypeOf(marks)}`))
    return problems
  }

  const disallowedMarkKeys = Object.keys(marks).filter(
    (key) => !allowedMarkKeys.includes(key) && !key.startsWith('_'),
  )

  if (disallowedMarkKeys.length > 0) {
    problems.push(
      error(
        `Found unknown properties for block declaration: ${humanizeList(
          disallowedMarkKeys.map(quote),
        )}`,
      ),
    )
  }

  if (decorators && !Array.isArray(decorators)) {
    problems.push(
      error(`"marks.decorators" declaration should be an array, got ${getTypeOf(decorators)}`),
    )
  } else if (decorators) {
    decorators
      .filter((dec) => !!dec.blockEditor)
      .forEach((dec) => {
        dec.icon = dec.blockEditor.icon
        dec.component = dec.blockEditor.render
      })
    decorators = validateDecorators(decorators, visitorContext, problems)
  }

  if (annotations && !Array.isArray(annotations)) {
    problems.push(
      error(`"marks.annotations" declaration should be an array, got ${getTypeOf(annotations)}`),
    )
  } else if (annotations) {
    annotations = validateAnnotations(annotations, visitorContext, problems)
  }

  return {...marks, decorators, annotations}
}

function validateLists(lists, visitorContext, problems) {
  if (!Array.isArray(lists)) {
    problems.push(error(`"lists" declaration should be an array, got ${getTypeOf(lists)}`))
    return problems
  }

  lists.forEach((list, index) => {
    if (!isPlainObject(list)) {
      problems.push(error(`List must be an object, got ${getTypeOf(list)}`))
      return
    }

    const name = list.value || `#${index}`
    const disallowedKeys = Object.keys(list).filter(
      (key) => !allowedListKeys.includes(key) && !key.startsWith('_'),
    )

    if (disallowedKeys.length > 0) {
      problems.push(
        error(
          `Found unknown properties for list ${name}: ${humanizeList(disallowedKeys.map(quote))}`,
        ),
      )
    }

    if (!list.value) {
      problems.push(error(`List #${index} is missing required "value" property`))
    } else if (typeof list.value !== 'string') {
      problems.push(
        error(
          `List type #${index} has an invalid "value" property, expected string, got ${getTypeOf(
            list.value,
          )}`,
        ),
      )
    } else if (!list.title) {
      problems.push(warning(`List type ${name} is missing recommended "title" property`))
    }
  })
  return lists
}

function validateStyles(styles, visitorContext, problems) {
  if (!Array.isArray(styles)) {
    problems.push(error(`"styles" declaration should be an array, got ${getTypeOf(styles)}`))
    return problems
  }

  styles.forEach((style, index) => {
    if (!isPlainObject(style)) {
      problems.push(error(`Style must be an object, got ${getTypeOf(style)}`))
      return
    }

    const name = style.value || `#${index}`
    const disallowedKeys = Object.keys(style).filter(
      (key) => !allowedStyleKeys.includes(key) && !key.startsWith('_'),
    )

    if (disallowedKeys.length > 0) {
      problems.push(
        error(
          `Found unknown properties for style ${name}: ${humanizeList(disallowedKeys.map(quote))}`,
        ),
      )
    }

    if (!style.value) {
      problems.push(error(`Style #${index} is missing required "value" property`))
    } else if (typeof style.value !== 'string') {
      problems.push(
        error(
          `Style #${index} has an invalid "value" property, expected string, got ${getTypeOf(
            style.value,
          )}`,
        ),
      )
    } else if (!style.title) {
      problems.push(warning(`Style ${name} is missing recommended "title" property`))
    }
    if (typeof style.blockEditor !== 'undefined') {
      problems.push(
        warning(
          `Style has deprecated key "blockEditor", please refer to the documentation on how to configure the block type for version 3.`,
          HELP_IDS.DEPRECATED_BLOCKEDITOR_KEY,
        ),
      )
      // TODO remove this backward compatibility at some point.
      style.component = style.component || style.blockEditor.render
    }
  })
  return styles
}

function validateDecorators(decorators, visitorContext, problems) {
  decorators.forEach((decorator, index) => {
    if (!isPlainObject(decorator)) {
      problems.push(error(`Annotation must be an object, got ${getTypeOf(decorator)}`))
      return
    }

    const name = decorator.value || `#${index}`
    const disallowedKeys = Object.keys(decorator).filter(
      (key) => !allowedDecoratorKeys.includes(key) && !key.startsWith('_'),
    )

    if (disallowedKeys.length > 0) {
      problems.push(
        error(
          `Found unknown properties for decorator ${name}: ${humanizeList(
            disallowedKeys.map(quote),
          )}`,
        ),
      )
    }

    if (!decorator.value) {
      problems.push(error(`Decorator #${index} is missing required "value" property`))
    } else if (typeof decorator.value !== 'string') {
      problems.push(
        error(
          `Decorator #${index} has an invalid "value" property, expected string, got ${getTypeOf(
            decorator.value,
          )}`,
        ),
      )
    } else if (!decorator.title) {
      problems.push(warning(`Decorator ${name} is missing recommended "title" property`))
    }
    if (typeof decorator.blockEditor !== 'undefined') {
      problems.push(
        warning(
          `Decorator "${name}" has deprecated key "blockEditor", please refer to the documentation on how to configure the block type for version 3.`,
          HELP_IDS.DEPRECATED_BLOCKEDITOR_KEY,
        ),
      )
      // TODO remove this backward compatibility at some point.
      decorator.icon = decorator.icon || decorator.blockEditor.icon
      decorator.component = decorator.component || decorator.blockEditor.render
    }
  })
  return decorators
}

function validateAnnotations(annotations, visitorContext, problems) {
  return annotations.map((annotation) => {
    if (!isPlainObject(annotation)) {
      return {
        ...annotation,
        _problems: [error(`Annotation must be an object, got ${getTypeOf(annotation)}`)],
      }
    }

    const {_problems} = visitorContext.visit(annotation, visitorContext)
    const targetType = annotation.type && visitorContext.getType(annotation.type)
    if (targetType && !isJSONTypeOf(targetType, 'object', visitorContext)) {
      _problems.push(
        error(
          `Annotation cannot have type "${annotation.type}" - annotation types must inherit from object`,
        ),
      )
    }

    if (typeof annotation.blockEditor !== 'undefined') {
      problems.push(
        warning(
          `Annotation has deprecated key "blockEditor", please refer to the documentation on how to configure the block type for version 3.`,
          HELP_IDS.DEPRECATED_BLOCKEDITOR_KEY,
        ),
      )
      // TODO remove this backward compatibility at some point.
      annotation.icon = annotation.icon || annotation.blockEditor.icon
      if (annotation.blockEditor?.render && !annotation.components?.annotation) {
        annotation.components = annotation.components || {}
        annotation.components.annotation =
          annotation.components.annotation || annotation.blockEditor.render
      }
    }

    return {...annotation, _problems}
  })
}

function validateMembers(members, visitorContext, problems) {
  if (!Array.isArray(members)) {
    problems.push(error(`"of" declaration should be an array, got ${getTypeOf(members)}`))
    return undefined
  }

  return members.map((member) => {
    const {_problems} = visitorContext.visit(member, visitorContext)
    return {...member, _problems}
  })
}
