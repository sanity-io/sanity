import {
  autocompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
  pickedCompletion,
  snippetCompletion,
} from '@codemirror/autocomplete'
import {syntaxTree} from '@codemirror/language'
import {EditorSelection, type EditorState, type Extension, StateField} from '@codemirror/state'
import {
  type Command,
  EditorView,
  hoverTooltip,
  keymap,
  showTooltip,
  type Tooltip,
} from '@codemirror/view'

import {type VisionSavedFunction} from '../store/types'
import {functionLibrary, type GroqEditorLabels, groqEditorLabels} from './groqEditorContext'
import {
  GROQ_FUNCTIONS,
  GROQ_FUNCTIONS_REFERENCE_URL,
  findGroqFunction,
  functionId,
  type GroqFunctionDoc,
} from './groqFunctionReference'
import {
  callId,
  declarationInsertion,
  extractFunction,
  type FunctionDeclaration,
  type GroqNode,
  parseDeclaration,
  readQueryFunctions,
} from './groqFunctions'
import {renderMessage} from './groqLint'

/** Completions open on their own once this much of a name is typed; Ctrl-Space opens them anytime */
const MIN_TYPED_LENGTH = 2
/** A name before the cursor, with or without its namespace: `co`, `pt::`, `pt::te` */
const NAME_BEFORE_CURSOR = /[A-Za-z_]\w*(?:::\w*)?$/
/** `|` that pipes into a function, not the `||` of a condition */
const PIPE_BEFORE = /(?:^|[^|])\|\s*$/

/**
 * IntelliJ's "show context actions". Free in browsers on every platform, unlike IntelliJ's
 * Extract Method (`Mod-Alt-m`), which minimizes the browser's windows on macOS. The shortcuts
 * dialog lists it as `EXTRACT_FUNCTION_SHORTCUT`.
 */
const EXTRACT_FUNCTION_KEY = 'Alt-Enter'

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  content?: string | Node,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  if (content !== undefined) node.append(content)
  return node
}

/** A function's documentation: its signature or declaration, then what it does and how to use it */
function renderDoc(parts: {
  code: string
  description?: string
  notes?: string[]
  link?: {href: string; text: string}
}): HTMLElement {
  const dom = element('div', 'cm-vision-function-doc')
  dom.append(element('pre', 'cm-vision-function-code', parts.code))
  if (parts.description) {
    dom.append(element('p', 'cm-vision-function-description', renderMessage(parts.description)))
  }
  for (const note of parts.notes ?? []) {
    dom.append(element('p', 'cm-vision-function-note', renderMessage(note)))
  }
  if (parts.link) {
    const link = element('a', 'cm-vision-function-link', parts.link.text)
    link.href = parts.link.href
    link.target = '_blank'
    link.rel = 'noreferrer'
    dom.append(link)
  }
  return dom
}

function renderBuiltinDoc(doc: GroqFunctionDoc, labels: GroqEditorLabels): HTMLElement {
  const notes: string[] = []
  if (doc.apiVersion) notes.push(labels.apiVersion(doc.apiVersion))
  if (doc.deltaOnly) notes.push(labels.deltaOnly)
  return renderDoc({
    code: doc.signature,
    description: doc.description,
    notes,
    link: {href: GROQ_FUNCTIONS_REFERENCE_URL, text: labels.reference},
  })
}

/** The call whose name (or namespace) `node` is part of; not its arguments, nor a declaration */
function callOfName(node: GroqNode): GroqNode | null {
  const part = node.name === 'Identifier' ? node.parent : node
  if (!part || !['FunctionName', 'Namespace', 'NamespaceSep'].includes(part.name)) return null
  const call = part.parent
  return call && (call.name === 'FunctionCall' || call.name === 'NamespacedCall') ? call : null
}

function lineOf(state: EditorState, position: number): number {
  return state.doc.lineAt(position).number
}

/** Documentation for the function called where the pointer is */
export function functionHoverAt(state: EditorState, pos: number, side: -1 | 1): Tooltip | null {
  const labels = state.facet(groqEditorLabels)
  const call = labels ? callOfName(syntaxTree(state).resolveInner(pos, side)) : null
  if (!labels || !call) return null
  const query = state.doc.toString()
  const nameNode = call.getChild('FunctionName')
  if (!nameNode) return null
  const namespaceNode = call.getChild('Namespace')
  const namespace = namespaceNode ? query.slice(namespaceNode.from, namespaceNode.to) : undefined
  const id = callId({namespace, name: query.slice(nameNode.from, nameNode.to)})
  const range = {pos: namespaceNode?.from ?? nameNode.from, end: nameNode.to, above: true}

  const declaration = namespace
    ? readQueryFunctions(syntaxTree(state), query).declarations.find((it) => it.id === id)
    : undefined
  if (declaration) {
    return {
      ...range,
      create: () => ({
        dom: renderDoc({
          code: declaration.text,
          notes: [labels.declaredOn(lineOf(state, declaration.range.from))],
        }),
      }),
    }
  }
  const doc = findGroqFunction(namespace, query.slice(nameNode.from, nameNode.to))
  if (doc) {
    return {...range, create: () => ({dom: renderBuiltinDoc(doc, labels)})}
  }
  const saved = state.facet(functionLibrary).find((it) => it.id === id)
  if (saved) {
    return {
      ...range,
      create: () => ({dom: renderDoc({code: saved.declaration, notes: [labels.inLibrary]})}),
    }
  }
  return null
}

function callSnippet(id: string, takesArguments: boolean): string {
  return takesArguments ? `${id}(\${})` : `${id}()\${}`
}

function builtinCompletion(doc: GroqFunctionDoc, labels: GroqEditorLabels): Completion {
  const id = functionId(doc)
  return snippetCompletion(callSnippet(id, doc.args?.max !== 0), {
    label: id,
    type: 'function',
    info: () => renderBuiltinDoc(doc, labels),
  })
}

function declaredCompletion(
  declaration: FunctionDeclaration,
  labels: GroqEditorLabels,
): Completion {
  return snippetCompletion(callSnippet(declaration.id, true), {
    label: declaration.id,
    type: 'function',
    detail: labels.completionDeclared,
    info: () => renderDoc({code: declaration.text}),
  })
}

/** A library function the query does not declare: picking it declares it at the top too */
function libraryCompletion(saved: VisionSavedFunction, labels: GroqEditorLabels): Completion {
  return {
    label: saved.id,
    type: 'function',
    detail: labels.completionLibrary,
    info: () => renderDoc({code: saved.declaration, notes: [labels.inLibrary]}),
    apply: (view, completion, from, to) => {
      const call = `${saved.id}()`
      const insertion = declarationInsertion(view.state.doc.toString(), saved.declaration)
      // Typed in a declaration's body, the call comes before the new declaration
      const callFrom = insertion.from <= from ? from + insertion.insert.length : from
      view.dispatch({
        changes:
          insertion.from === from
            ? {from, to, insert: insertion.insert + call}
            : [insertion, {from, to, insert: call}],
        selection: EditorSelection.cursor(callFrom + call.length - 1),
        annotations: pickedCompletion.of(completion),
        scrollIntoView: true,
      })
    },
  }
}

function startsWithIgnoringCase(text: string, prefix: string): boolean {
  return text.toLowerCase().startsWith(prefix.toLowerCase())
}

/**
 * Function names, in this order: the query's custom functions, the library's (which come with
 * their declaration) and the built-in ones. Only names that start with what is typed are
 * offered, and after `|` only the pipe functions, so field names do not keep opening the list.
 */
export function functionCompletions(context: CompletionContext): CompletionResult | null {
  const {state, pos, explicit} = context
  const labels = state.facet(groqEditorLabels)
  if (!labels) return null
  const word = context.matchBefore(NAME_BEFORE_CURSOR)
  if (!explicit && (!word || word.to - word.from < MIN_TYPED_LENGTH)) return null
  const from = word?.from ?? pos
  const typed = word?.text ?? ''
  const charBefore = state.sliceDoc(from - 1, from)
  if (charBefore === '.' || charBefore === '$' || charBefore === '>') return null
  for (
    let node: GroqNode | null = syntaxTree(state).resolveInner(pos, -1);
    node;
    node = node.parent
  ) {
    if (node.name === 'String' || node.name === 'LineComment') return null
    // Naming a function or its parameter in its own declaration
    if (node.name === 'FunctionDef') {
      const equals = node.getChild('=')
      if (!equals || pos <= equals.from) return null
    }
  }

  const query = state.doc.toString()
  const piped = PIPE_BEFORE.test(state.sliceDoc(Math.max(0, from - 20), from))
  const matches = (id: string) =>
    startsWithIgnoringCase(id, typed) || startsWithIgnoringCase(id.split('::').pop() ?? id, typed)
  const options: Completion[] = []
  if (!piped) {
    const {declarations} = readQueryFunctions(syntaxTree(state), query)
    const declaredIds = new Set(declarations.map((declaration) => declaration.id))
    for (const declaration of declarations) {
      if (declaration.namespace && matches(declaration.id)) {
        options.push(declaredCompletion(declaration, labels))
      }
    }
    for (const saved of state.facet(functionLibrary)) {
      if (!declaredIds.has(saved.id) && matches(saved.id) && parseDeclaration(saved.declaration)) {
        options.push(libraryCompletion(saved, labels))
      }
    }
  }
  for (const doc of GROQ_FUNCTIONS) {
    if (Boolean(doc.pipe) === piped && matches(functionId(doc))) {
      options.push(builtinCompletion(doc, labels))
    }
  }
  if (options.length === 0) return null
  return {from, options, filter: false}
}

/**
 * Makes the selection a custom function when it is a projection that can be one, or with nothing
 * selected the projection around the cursor
 */
export const extractSelectionToFunction: Command = (view) => {
  const extraction = extractFunction(
    view.state.doc.toString(),
    view.state.selection.main,
    view.state.facet(functionLibrary),
  )
  if (!extraction) return false
  const changes = view.state.changes(extraction.changes)
  view.dispatch({
    changes,
    selection: EditorSelection.cursor(extraction.call.to),
    scrollIntoView: true,
    userEvent: 'input.extract',
  })
  view.focus()
  return true
}

function extractTooltips(state: EditorState): readonly Tooltip[] {
  const selection = state.selection.main
  const labels = state.facet(groqEditorLabels)
  if (selection.empty || !labels) return []
  const extraction = extractFunction(state.doc.toString(), selection, state.facet(functionLibrary))
  if (!extraction) return []
  return [
    {
      pos: selection.from,
      above: true,
      strictSide: false,
      arrow: false,
      create: (view) => {
        const button = element('button', 'cm-vision-extract-button', labels.extract)
        button.type = 'button'
        button.dataset.testid = 'vision-extract-function'
        // Keeps the editor focused and the selection in place until the click lands
        button.addEventListener('mousedown', (event) => event.preventDefault())
        button.addEventListener('click', () => extractSelectionToFunction(view))
        const dom = element('div', 'cm-vision-extract', button)
        return {dom}
      },
    },
  ]
}

const extractTooltip = StateField.define<readonly Tooltip[]>({
  create: extractTooltips,
  update: (tooltips, transaction) =>
    transaction.docChanged || transaction.selection ? extractTooltips(transaction.state) : tooltips,
  provide: (field) => showTooltip.computeN([field], (state) => state.field(field)),
})

/** Layout only; fonts and colors come with the studio theme (`useCodemirrorTheme`) */
const functionEditorTheme = EditorView.baseTheme({
  '.cm-vision-function-doc': {maxWidth: '420px', padding: '8px 10px', lineHeight: '1.45'},
  '.cm-completionInfo .cm-vision-function-doc': {padding: 0},
  '.cm-vision-function-code': {margin: 0, whiteSpace: 'pre-wrap'},
  '.cm-vision-function-description, .cm-vision-function-note': {margin: '6px 0 0'},
  '.cm-vision-function-link': {display: 'inline-block', marginTop: '6px'},
  '.cm-vision-extract': {padding: '2px'},
  '.cm-vision-extract-button': {
    border: 'none',
    borderRadius: '2px',
    padding: '4px 8px',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
  },
})

/**
 * Custom functions in the query editor: hover documentation for every function called,
 * completions of function names (the library's declare themselves), and extracting a projection
 * to a function: with a button over a selected one, and with `Alt-Enter` for the selection or
 * the projection around the cursor
 */
export function createGroqFunctionExtensions(labels: GroqEditorLabels): Extension[] {
  return [
    groqEditorLabels.of(labels),
    hoverTooltip((view, pos, side) => functionHoverAt(view.state, pos, side)),
    autocompletion({override: [functionCompletions], selectOnOpen: false, icons: false}),
    extractTooltip,
    keymap.of([{key: EXTRACT_FUNCTION_KEY, run: extractSelectionToFunction}]),
    functionEditorTheme,
  ]
}
