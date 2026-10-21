import {type Path, type SchemaType} from '@sanity/types'
import {rem, Skeleton} from '@sanity/ui'
import {toString as pathToString} from '@sanity/util/paths'
import {type ComponentType, Suspense, useContext, useEffect} from 'react'
import {isLazy} from 'react-is'
import {FormValueContext} from 'sanity/_singletons'

/**
 * The `components` entries of a schema type that render a form node.
 *
 * @internal
 */
export type CustomComponentSlot = 'input' | 'field' | 'item'

interface FormNodeProps {
  schemaType: SchemaType
  path: Path
}

const wrapped: Record<CustomComponentSlot, WeakMap<object, ComponentType<never>>> = {
  input: new WeakMap(),
  field: new WeakMap(),
  item: new WeakMap(),
}

/**
 * Wraps a schema type's custom form component in a fallback boundary. A custom component can
 * suspend on data that only settles once the document exists (an SDK projection of a new document
 * never does). Without a boundary of its own it would suspend the whole form, leaving no field to
 * edit that could create the document. A custom component that declares its own `Suspense` never
 * reaches this one. A document type's own input is the whole form, so at the root it keeps
 * `FormBuilder`'s loading block instead.
 *
 * Cached per slot and component: resolvers run on every render in places, and a new component
 * identity would make React remount the node.
 *
 * @internal
 */
export function withCustomComponentSuspense<Props extends FormNodeProps>(
  slot: CustomComponentSlot,
  Component: ComponentType<Props>,
): ComponentType<Props> {
  // Erased to the props-agnostic type the cache and the warning work with
  const component = Component as ComponentType<never>
  const cached = wrapped[slot].get(component)
  if (cached) return cached as ComponentType<Props>

  function CustomComponentWithSuspense(props: Props) {
    if (props.path.length === 0) {
      return <Component {...props} />
    }
    return (
      <Suspense
        fallback={
          <CustomComponentSuspenseFallback
            slot={slot}
            component={component}
            schemaType={props.schemaType}
            path={props.path}
          />
        }
      >
        <Component {...props} />
      </Suspense>
    )
  }
  wrapped[slot].set(component, CustomComponentWithSuspense as ComponentType<never>)
  return CustomComponentWithSuspense
}

/**
 * The skeleton cannot know the size of the component it replaces, so it also tells the
 * component's author to declare a `Suspense` that does. An input's skeleton has the height of a
 * single-line input; boolean and datetime inputs render their own label, so for those the title is
 * missing until the input loads.
 */
function CustomComponentSuspenseFallback(
  props: FormNodeProps & {slot: CustomComponentSlot; component: ComponentType<never>},
) {
  const {slot, component, schemaType, path} = props
  // Read without `useFormValue`, which throws outside a provider: a fallback must not crash
  const documentType = useContext(FormValueContext)?.value?._type

  // An effect, not render: only a fallback React actually commits means the component suspended.
  useEffect(() => {
    warnCustomComponentSuspended({slot, component, schemaType, path, documentType})
  }, [slot, component, schemaType, path, documentType])

  return slot === 'input' ? (
    <Skeleton data-testid="custom-input-fallback" radius={1} animated style={{height: rem(35)}} />
  ) : (
    <Skeleton data-testid={`custom-${slot}-fallback`} padding={3} radius={1} animated />
  )
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
  component: ComponentType<never>
  schemaType: SchemaType
  path: Path
  documentType?: string
}): void {
  const {slot, component, schemaType, path, documentType} = options
  if (warned[slot].has(component)) return
  warned[slot].add(component)

  const document = documentType ? ` of a "${documentType}" document` : ''
  console.warn(
    `The custom ${slot} component ${describeComponent(component)} at "${pathToString(path)}"${document} ` +
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

function describeComponent(component: ComponentType<never>): string {
  const Component = component as ComponentType
  // react-is classifies elements, not component types
  if (isLazy(<Component />)) return '(a React.lazy component)'
  const name = Component.displayName || Component.name
  return name ? `<${name}>` : '(an anonymous component)'
}
