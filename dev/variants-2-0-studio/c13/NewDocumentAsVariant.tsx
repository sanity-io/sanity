import {useToast} from '@sanity/ui/toast'
import {type ReactNode, useContext, useEffect, useMemo} from 'react'
import {
  type InitialValueTemplateItem,
  type NewDocumentCreationContext,
  type NewDocumentOptionsContext,
  type Source,
  type Template,
  type TemplateItem,
  useClient,
  useSchema,
  useTemplates,
} from 'sanity'
import {SourceContext} from 'sanity/_singletons'
import {useRouter} from 'sanity/router'

import {useInitialValueResolverContext} from '../../../packages/sanity/src/core/store/document/useInitialValue'
import {resolveInitialValue} from '../../../packages/sanity/src/core/templates/resolve'
import {VariantDiamond} from '../c1/dimensionIcons'
import {INVENTORY_INSPECTOR, requestCreateMode} from '../c4/inventory/CreateVersion'
import {getComponent} from '../options/registry'
import {getOptionState, resolveOption, useOption} from '../options/store'

// C13 B, the create points (27 Oct, Faheem): "<Type> as a variant…" in the navbar "+" (New document) and in a list pane's "+". Nothing in core
// is edited. The items are templates (schema.templates, below), so the Studio draws them where it draws any template. They are taken out of
// every create menu unless C13 is B, so option A is stock: the navbar's by a source wrapper (live), a list pane's by document.newDocumentOptions
// (read when the structure resolves: the structure tool provides its own source, so the wrapper does not reach it). A click on one is taken before the Studio's intent link: it saves a new
// draft of the type with the type's own initial value, opens it, and opens its version inventory in Create version mode (C4 E), where the
// editor picks the variant and where it goes. A draft first, because a variant is a version of a document that has one.

/** The template ids end with this, so the create points can tell them from the type's own templates. */
export const AS_VARIANT_SUFFIX = '--as-variant'

const isAsVariant = (templateId: string) => templateId.endsWith(AS_VARIANT_SUFFIX)

/** For `schema.templates`: one "<Type> as a variant…" template per type, after the type's own (its default template, the same initial value). */
export function asVariantTemplates(prev: Template[]): Template[] {
  const added = prev
    .filter((template) => template.id === template.schemaType)
    .map((template): Template => ({
      id: `${template.schemaType}${AS_VARIANT_SUFFIX}`,
      title: `${template.title} as a variant…`,
      schemaType: template.schemaType,
      icon: VariantDiamond,
      value: template.value,
    }))
  return [...prev, ...added]
}

/** The create menus without the C13 items: everywhere while C13 is not B, and always in a document's own menus (references and the like). */
function withoutAsVariant(
  items: InitialValueTemplateItem[],
  shown: boolean,
  context: NewDocumentCreationContext,
): InitialValueTemplateItem[] {
  if (shown && context.type !== 'document') return items
  return items.filter((item) => !isAsVariant(item.templateId))
}

const shownNow = () => {
  const component = getComponent('c13')
  return component ? resolveOption(component, getOptionState()) === 'b' : false
}

/**
 * For `document.newDocumentOptions`: a list pane's "+" and a document's own menus follow C13 when they resolve. The navbar's list keeps the
 * items here, because it is resolved once when the studio loads; AsVariantSourceProvider shows or hides them there as C13 changes.
 */
export function asVariantNewDocumentOptions(
  prev: TemplateItem[],
  {creationContext}: NewDocumentOptionsContext,
): TemplateItem[] {
  if (creationContext.type === 'global' || (shownNow() && creationContext.type !== 'document'))
    return prev
  return prev.filter((item) => !isAsVariant(item.templateId))
}

/**
 * Wraps the studio in a source whose navbar create list follows C13. The list is resolved once, when the studio loads; this filters it on
 * every change of C13, so switching shows at once. (The structure tool provides its own source, so the list panes are filtered above.)
 */
export function AsVariantSourceProvider({children}: {children: ReactNode}) {
  // The context itself, as useSource reads it (useSource is marked internal).
  const source = useContext(SourceContext)
  const shown = useOption('c13') === 'b'
  const value = useMemo((): Source | null => {
    if (!source) return null
    const resolve = source.document.resolveNewDocumentOptions
    return {
      ...source,
      document: {
        ...source.document,
        resolveNewDocumentOptions: (context) => withoutAsVariant(resolve(context), shown, context),
      },
      __internal: {
        ...source.__internal,
        staticInitialValueTemplateItems: withoutAsVariant(
          source.__internal.staticInitialValueTemplateItems,
          shown,
          {type: 'global'},
        ),
      },
    }
  }, [source, shown])
  return <SourceContext.Provider value={value}>{children}</SourceContext.Provider>
}

/** Reads the template and type out of an intent link (`/intent/create/template=book--as-variant;type=book/`). */
function readIntent(href: string): {type: string; template: string} | null {
  const path = decodeURIComponent(new URL(href, window.location.origin).pathname)
  const segment = path.split('/intent/create/')[1]?.split('/')[0]
  if (!segment) return null
  const params = Object.fromEntries(
    segment.split(';').map((pair) => {
      const [key, ...rest] = pair.split('=')
      return [key, rest.join('=')]
    }),
  )
  return params.type && params.template ? {type: params.type, template: params.template} : null
}

/** Mounted once in the studio layout. Takes the C13 items' clicks while C13 is B; renders nothing. */
export function AsVariantCreateHost() {
  const shown = useOption('c13') === 'b'
  const client = useClient({apiVersion: 'X'})
  const schema = useSchema()
  const templates = useTemplates()
  const router = useRouter()
  const toast = useToast()
  const initialValueContext = useInitialValueResolverContext()

  useEffect(() => {
    if (!shown) return undefined
    const create = async (type: string) => {
      const id = crypto.randomUUID()
      const base = templates.find((template) => template.id === type)
      const initial = base ? await resolveInitialValue(schema, base, {}, initialValueContext) : {}
      await client.create({
        ...(initial as Record<string, unknown>),
        _id: `drafts.${id}`,
        _type: type,
      })
      requestCreateMode(id)
      // One navigation opens the draft (Drafts, no variant in view) with the version inventory open on it.
      router.navigate({
        state: {intent: 'edit', params: {id, type, inspect: INVENTORY_INSPECTOR}},
        stickyParams: {excludedPerspectives: null, perspective: null, variant: null},
      })
    }
    const onClick = (event: MouseEvent) => {
      // A modified click keeps its browser meaning (a new tab, where the template opens as a plain new document).
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return
      const item = (event.target as Element | null)?.closest<HTMLAnchorElement>(
        `a[href*="${AS_VARIANT_SUFFIX}"]`,
      )
      const intent = item ? readIntent(item.getAttribute('href') ?? '') : null
      if (!intent || !isAsVariant(intent.template)) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      // The list the item sits in closes as it would on any choice: the navbar's by its own "+" (which toggles it), a pane's menu by Escape.
      if (item?.dataset.testid?.startsWith('create-new-'))
        document.querySelector<HTMLElement>('[data-testid="new-document-button"]')?.click()
      else item?.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}))
      create(intent.type).catch((err: unknown) => {
        toast.push({
          closable: true,
          description: err instanceof Error ? err.message : String(err),
          status: 'error',
          title: 'Could not create the document',
        })
      })
    }
    window.addEventListener('click', onClick, true)
    return () => window.removeEventListener('click', onClick, true)
  }, [client, initialValueContext, router, schema, shown, templates, toast])

  return null
}
