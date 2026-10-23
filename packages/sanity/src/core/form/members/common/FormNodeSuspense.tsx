import {type Path, type SchemaType} from '@sanity/types'
import {toString as pathToString} from '@sanity/util/paths'
import {type ComponentType, type ReactNode, Suspense, useContext, useEffect} from 'react'
import {isLazy} from 'react-is'
import {FormValueContext} from 'sanity/_singletons'

/**
 * The `components` entries of a schema type that can render under a form node's boundary.
 *
 * @internal
 */
export type FormNodeComponentKey = 'field' | 'input' | 'item'

interface FormNodeSuspenseProps {
  /** Rendered while the node suspends. Each render site sizes its own. */
  fallback: ReactNode
  schemaType: SchemaType
  path: Path
  /** Which of the schema type's custom components render under this boundary, for the warning. */
  components: readonly FormNodeComponentKey[]
  children: ReactNode
}

/**
 * The boundary a default component puts around each form node it renders (a field member, an
 * array item), so a form component that suspends without a `Suspense` of its own falls back to
 * this node's `fallback` instead of suspending the whole form. Custom components keep full
 * control: any boundary they declare, including one in a custom field around the input it
 * renders, is closer to whatever suspends than this one.
 *
 * @internal
 */
export function FormNodeSuspense(props: FormNodeSuspenseProps): React.JSX.Element {
  const {fallback, schemaType, path, components, children} = props
  return (
    <Suspense
      fallback={
        <>
          <SuspendedFormNodeWarning schemaType={schemaType} path={path} components={components} />
          {fallback}
        </>
      }
    >
      {children}
    </Suspense>
  )
}

function SuspendedFormNodeWarning(props: Omit<FormNodeSuspenseProps, 'fallback' | 'children'>) {
  const {schemaType, path, components} = props
  // Read without `useFormValue`, which throws outside a provider: a fallback must not crash
  const documentType = useContext(FormValueContext)?.value?._type

  // An effect, not render: only a fallback React actually commits means the node suspended.
  useEffect(() => {
    warnFormNodeSuspended({schemaType, path, components, documentType})
  }, [schemaType, path, components, documentType])

  return null
}

const warned = new Set<string>()

/** @internal */
export function resetFormNodeSuspendedWarningCache(): void {
  warned.clear()
}

/**
 * Warns once per message, in every environment. The custom components are passed along so
 * browser devtools render them as references that open their source. Production builds minify
 * component names, so the path and document type are what locate them there.
 *
 * @internal
 */
export function warnFormNodeSuspended(options: {
  schemaType: SchemaType
  path: Path
  components: readonly FormNodeComponentKey[]
  documentType?: string
}): void {
  const {schemaType, path, components, documentType} = options
  const declared = components.flatMap((key) => {
    const component = schemaType.components?.[key]
    return component ? [{key, component: component as ComponentType<never>}] : []
  })

  const subject =
    declared.length > 0
      ? `The ${declared.map(({key, component}) => `custom ${key} component ${describeComponent(component)}`).join(' or ')}`
      : 'A form component'
  const document = documentType ? ` of a "${documentType}" document` : ''
  const source =
    declared.length > 0
      ? ''
      : `The schema type declares no custom ${components.join(' or ')} component, so it likely ` +
        "comes from a plugin's form.components. "
  const message =
    `${subject} at "${pathToString(path)}"${document} (schema type "${schemaType.name}") ` +
    'suspended without a <Suspense> boundary of its own, so Studio shows a generic skeleton in ' +
    `its place. ${source}Wrap the part of the component that suspends in <Suspense> with a ` +
    'fallback that reserves the space the loaded UI needs, so the form does not shift when it ' +
    'loads. If it suspends on data that only exists once the document has been saved, such as ' +
    'an App SDK hook that reads the current document, skip that part until the document exists: ' +
    "on a new document the fallback would otherwise never go away. React DevTools' Suspense tab " +
    'shows which component suspended. An agent skill walks through the fix: npx skills add ' +
    'sanity-io/agent-toolkit --skill sanity-form-component-suspense.'

  if (warned.has(message)) return
  warned.add(message)

  if (declared.length === 0) {
    console.warn(message)
    return
  }
  console.warn(
    `${message} ${declared.length > 1 ? 'The components:' : 'The component:'}`,
    ...declared.map(({component}) => component),
  )
}

function describeComponent(component: ComponentType<never>): string {
  const Component = component as ComponentType
  // react-is classifies elements, not component types
  if (isLazy(<Component />)) return '(a React.lazy component)'
  const name = Component.displayName || Component.name
  return name ? `<${name}>` : '(an anonymous component)'
}
