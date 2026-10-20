import {type Path, type SchemaType} from '@sanity/types'
import {Skeleton} from '@sanity/ui'
import {toString as pathToString} from '@sanity/util/paths'
import {type ComponentType, useEffect} from 'react'
import {isLazy} from 'react-is'

const warned = new WeakSet<object>()

/**
 * Stands in for a schema type's custom input while it suspends without a boundary of its own.
 * The skeleton cannot know the size of the input it replaces, so it also tells the input's author
 * to declare a `Suspense` that does.
 *
 * @internal
 */
export function CustomInputSuspenseFallback(props: {schemaType: SchemaType; path: Path}) {
  const {schemaType, path} = props

  // An effect, not render: only a fallback React actually commits means the input suspended.
  useEffect(() => {
    warnCustomInputSuspended(schemaType, path)
  }, [schemaType, path])

  return <Skeleton data-testid="custom-input-fallback" padding={3} radius={1} animated />
}

/**
 * Warns once per custom input component, in every environment. The component is passed along so
 * browser devtools render it as a reference that opens its source.
 *
 * @internal
 */
export function warnCustomInputSuspended(schemaType: SchemaType, path: Path): void {
  const component = schemaType.components?.input
  if (!component || warned.has(component)) return
  warned.add(component)

  const field = path.length > 0 ? `the field "${pathToString(path)}"` : 'the document root'
  console.warn(
    `The custom input ${describeComponent(component)} for ${field} (schema type "${schemaType.name}") ` +
      'suspended without a <Suspense> boundary of its own, so Studio shows a generic skeleton in ' +
      'its place. Wrap the part of the input that suspends in <Suspense> with a fallback that ' +
      'reserves the space the loaded input needs, so the form does not shift when it loads. ' +
      'If it suspends on data that only exists once the document has been saved, such as an App ' +
      'SDK hook that reads the current document, skip that part until the document exists: on a ' +
      'new document the fallback would otherwise never go away. ' +
      "React DevTools' Suspense tab shows which component suspended. An agent skill walks " +
      'through the fix: npx skills add sanity-io/sanity --skill sanity-custom-input-suspense. ' +
      'The input component:',
    component,
  )
}

function describeComponent(Component: ComponentType): string {
  // react-is classifies elements, not component types
  if (isLazy(<Component />)) return '(a React.lazy component)'
  const name = Component.displayName || Component.name
  return name ? `<${name}>` : '(an anonymous component)'
}
