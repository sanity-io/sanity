import {type Path, type SchemaType} from '@sanity/types'
import {Skeleton} from '@sanity/ui'
import {toString as pathToString} from '@sanity/util/paths'
import {type ComponentType, type ReactNode, Suspense, useContext, useEffect} from 'react'
import {isLazy} from 'react-is'
import {FormValueContext} from 'sanity/_singletons'

/**
 * The `components` entries of a schema type that render a form node.
 *
 * @internal
 */
export type CustomComponentSlot = 'input' | 'field' | 'item'

interface CustomComponentSuspenseProps {
  slot: CustomComponentSlot
  schemaType: SchemaType
  path: Path
  children: ReactNode
}

/**
 * Wraps a form node in a fallback boundary when its schema type declares a custom component for
 * the slot. A custom component can suspend on data that only settles once the document exists (an
 * SDK projection of a new document never does). Without a boundary of its own it would suspend the
 * whole form, leaving no field to edit that could create the document. A custom component that
 * declares its own `Suspense` never reaches this one.
 *
 * @internal
 */
export function CustomComponentSuspense(props: CustomComponentSuspenseProps): ReactNode {
  const {slot, schemaType, path, children} = props
  if (!schemaType.components?.[slot]) {
    return children
  }
  return (
    <Suspense
      fallback={<CustomComponentSuspenseFallback slot={slot} schemaType={schemaType} path={path} />}
    >
      {children}
    </Suspense>
  )
}

/**
 * The skeleton cannot know the size of the component it replaces, so it also tells the
 * component's author to declare a `Suspense` that does.
 */
function CustomComponentSuspenseFallback(props: Omit<CustomComponentSuspenseProps, 'children'>) {
  const {slot, schemaType, path} = props
  // Read without `useFormValue`, which throws outside a provider: a fallback must not crash
  const documentType = useContext(FormValueContext)?.value?._type

  // An effect, not render: only a fallback React actually commits means the component suspended.
  useEffect(() => {
    warnCustomComponentSuspended({slot, schemaType, path, documentType})
  }, [slot, schemaType, path, documentType])

  return <Skeleton data-testid={`custom-${slot}-fallback`} padding={3} radius={1} animated />
}

const warned: Record<CustomComponentSlot, WeakSet<object>> = {
  input: new WeakSet(),
  field: new WeakSet(),
  item: new WeakSet(),
}

/**
 * Warns once per slot and custom component, in every environment. The component is passed along
 * so browser devtools render it as a reference that opens its source. Production builds minify
 * the component's name, so the path and document type are what locate it there.
 *
 * @internal
 */
export function warnCustomComponentSuspended(options: {
  slot: CustomComponentSlot
  schemaType: SchemaType
  path: Path
  documentType?: string
}): void {
  const {slot, schemaType, path, documentType} = options
  const component = schemaType.components?.[slot]
  if (!component || warned[slot].has(component)) return
  warned[slot].add(component)

  const location = path.length > 0 ? `at "${pathToString(path)}"` : 'at the document root'
  const document = documentType ? ` of a "${documentType}" document` : ''
  console.warn(
    `The custom ${slot} component ${describeComponent(component)} ${location}${document} ` +
      `(schema type "${schemaType.name}", components.${slot}) suspended without a <Suspense> ` +
      'boundary of its own, so Studio shows a generic skeleton in its place. Wrap the part of ' +
      'the component that suspends in <Suspense> with a fallback that reserves the space the ' +
      'loaded UI needs, so the form does not shift when it loads. If it suspends on data that ' +
      'only exists once the document has been saved, such as an App SDK hook that reads the ' +
      'current document, skip that part until the document exists: on a new document the ' +
      "fallback would otherwise never go away. React DevTools' Suspense tab shows which " +
      'component suspended. An agent skill walks through the fix: npx skills add ' +
      'sanity-io/sanity --skill sanity-form-component-suspense. The component:',
    component,
  )
}

function describeComponent(Component: ComponentType): string {
  // react-is classifies elements, not component types
  if (isLazy(<Component />)) return '(a React.lazy component)'
  const name = Component.displayName || Component.name
  return name ? `<${name}>` : '(an anonymous component)'
}
