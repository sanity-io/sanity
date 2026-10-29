import {EditorState} from '@codemirror/state'
import {useEffect} from 'react'
import {type Schema, useSchema, useTranslation} from 'sanity'
import {useEffectEvent} from 'use-effect-event'

import {visionLocaleNamespace} from '../../i18n'
import {useResolvedRequest} from '../hooks/useResolvedRequest'
import {type VisionTab} from '../store/types'
import {useVisionActor, useVisionSelector} from '../store/VisionActorContext'
import {selectFunctionLibrary} from '../store/visionMachine'
import {getDocumentTypeNames} from '../util/documentTypes'
import {fetchQueryPlan} from '../util/explainQuery'
import {functionLibrary, querySchema} from '../util/groqEditorContext'
import {groqLintSource} from '../util/groqLint'
import {previewMutations, toMutations} from '../util/mutations'
import {readPlanInsights} from '../util/planInsights'
import {createQuerySchema} from '../util/schemaCheck'
import {summarizeSchema} from '../util/schemaSummary'
import {describeInsight} from './response/ExplainTab'

/**
 * WebMCP (`document.modelContext`, https://webmachinelearning.github.io/webmcp/): tools an agent
 * in the browser can call while Vision is open, acting through the user's own session the way
 * the tool does. They read: the active tab, query results, plans, lint findings and the schema;
 * the one that changes anything only opens a query in a tab of its own. Nothing writes data:
 * mutations only run as dry runs, and applying them is left to the user, in the Mutate panel.
 */

/** The parts of WebMCP Vision uses; the API is not in the DOM typings yet */
interface ModelContextTool {
  name: string
  title?: string
  description: string
  inputSchema?: object
  execute: (input: Record<string, unknown> | undefined) => Promise<ToolResult>
  annotations?: {readOnlyHint?: boolean}
}

interface ModelContext {
  registerTool: (tool: ModelContextTool, options?: {signal?: AbortSignal}) => Promise<unknown>
}

interface ToolResult {
  content: {type: 'text'; text: string}[]
  isError?: boolean
}

/** Results this long are cut, so a big result does not flood the agent's context */
const MAX_TOOL_TEXT_LENGTH = 50_000

function getModelContext(): ModelContext | undefined {
  const candidate: unknown = Reflect.get(document, 'modelContext')
  if (typeof candidate !== 'object' || candidate === null) return undefined
  const registerTool: unknown = Reflect.get(candidate, 'registerTool')
  if (typeof registerTool !== 'function') return undefined
  return {
    registerTool: (tool, options) => Promise.resolve(registerTool.call(candidate, tool, options)),
  }
}

function text(value: unknown, isError = false): ToolResult {
  const json = typeof value === 'string' ? value : (JSON.stringify(value, null, 2) ?? 'null')
  const cut =
    json.length > MAX_TOOL_TEXT_LENGTH
      ? `${json.slice(0, MAX_TOOL_TEXT_LENGTH)}\n… (cut at ${MAX_TOOL_TEXT_LENGTH} characters of ${json.length})`
      : json
  return {content: [{type: 'text', text: cut}], ...(isError ? {isError} : {})}
}

function readQuery(input: Record<string, unknown>): {
  query: string
  params: Record<string, unknown>
} {
  const {query, params} = input
  if (typeof query !== 'string' || !query.trim()) throw new Error('A GROQ query is required')
  const isParams = typeof params === 'object' && params !== null && !Array.isArray(params)
  return {query, params: isParams ? Object.fromEntries(Object.entries(params)) : {}}
}

const QUERY_INPUT = {
  type: 'object',
  properties: {
    query: {type: 'string', description: 'A GROQ query'},
    params: {
      type: 'object',
      description: 'Values of the $parameters the query uses, by name without the $',
    },
  },
  required: ['query'],
}

type ToolName =
  | 'vision_get_state'
  | 'vision_run_query'
  | 'vision_open_query'
  | 'vision_check_query'
  | 'vision_explain_query'
  | 'vision_describe_schema'
  | 'vision_preview_mutations'

const TOOLS: {name: ToolName; description: string; inputSchema: object; readOnly: boolean}[] = [
  {
    name: 'vision_get_state',
    description:
      'The GROQ query in the Vision tab the user is looking at, its params and request options (dataset, API version, perspective, API CDN), and its latest result or error.',
    inputSchema: {type: 'object', properties: {}},
    readOnly: true,
  },
  {
    name: 'vision_run_query',
    description:
      "Runs a GROQ query with the request options of the user's active Vision tab and returns the result, without changing what the tab shows.",
    inputSchema: QUERY_INPUT,
    readOnly: true,
  },
  {
    name: 'vision_open_query',
    description:
      'Opens a GROQ query in a new Vision tab for the user to see, with the options of the active tab, and runs it unless run is false.',
    inputSchema: {
      ...QUERY_INPUT,
      properties: {
        ...QUERY_INPUT.properties,
        title: {type: 'string', description: 'A title for the tab'},
        run: {type: 'boolean', description: 'Fetch the query once the tab opens (default true)'},
      },
    },
    readOnly: false,
  },
  {
    name: 'vision_check_query',
    description:
      'Lints a GROQ query: syntax errors, groq-lint performance rules, custom function checks, and the document types and fields the workspace schema does not have. Returns each finding with its line, column and rule.',
    inputSchema: {
      type: 'object',
      properties: {query: {type: 'string', description: 'A GROQ query'}},
      required: ['query'],
    },
    readOnly: true,
  },
  {
    name: 'vision_explain_query',
    description:
      "The Content Lake's query plan for a GROQ query, run with the active tab's options, with notes on what stands out (filters run in memory, sorting in the index, batched subqueries).",
    inputSchema: QUERY_INPUT,
    readOnly: true,
  },
  {
    name: 'vision_describe_schema',
    description:
      "The workspace's document types; with types, their fields, references and option lists.",
    inputSchema: {
      type: 'object',
      properties: {
        types: {
          type: 'array',
          items: {type: 'string'},
          description: 'Document type names to describe field by field',
        },
      },
    },
    readOnly: true,
  },
  {
    name: 'vision_preview_mutations',
    description:
      "Runs mutations as a dry run against the active Vision tab's dataset, which changes nothing, and returns each document they touch as it is now (before) and as they would leave it (after). No tool applies mutations: the user can, from Vision's Mutate panel.",
    inputSchema: {
      type: 'object',
      properties: {
        mutations: {
          type: 'array',
          items: {type: 'object'},
          description:
            'Mutations as the Mutations API takes them, each with one of create, createOrReplace, createIfNotExists, delete or patch (by id, or by a GROQ query)',
        },
        autoGenerateArrayKeys: {
          type: 'boolean',
          description: 'Give array items without a _key one, as the studio needs (default true)',
        },
      },
      required: ['mutations'],
    },
    readOnly: true,
  },
]

/** Registers Vision's WebMCP tools while it is open, in browsers that have WebMCP */
export function VisionWebMcp({tab}: {tab: VisionTab}) {
  const {t} = useTranslation(visionLocaleNamespace)
  const actorRef = useVisionActor()
  const resolved = useResolvedRequest(tab.options)
  const runnerRef = useVisionSelector((snapshot) => snapshot.context.runners[tab.id])
  const library = useVisionSelector(selectFunctionLibrary)
  const schema = useSchema() as Schema | undefined

  const execute = useEffectEvent(async (name: ToolName, input: Record<string, unknown>) => {
    switch (name) {
      case 'vision_get_state': {
        const runner = runnerRef?.getSnapshot()
        return text({
          title: tab.title,
          query: tab.query,
          params: tab.rawParams,
          dataset: resolved.dataset,
          apiVersion: resolved.apiVersion,
          perspective: resolved.perspective ?? null,
          variant: resolved.variant ?? null,
          useCdn: resolved.useCdn,
          status: runner?.matches({request: 'fetching'})
            ? 'fetching'
            : runner?.matches({request: 'failed'})
              ? 'failed'
              : runner?.context.meta
                ? 'settled'
                : 'idle',
          error: runner?.context.error?.message ?? null,
          ms: runner?.context.meta?.ms ?? null,
          result: runner?.context.meta ? runner.context.result : null,
        })
      }
      case 'vision_run_query': {
        const {query, params} = readQuery(input)
        const response = await resolved.client.fetch(query, params, {
          filterResponse: false,
          useCdn: resolved.useCdn,
          tag: 'vision.webmcp',
        })
        return text({ms: response.ms, result: response.result})
      }
      case 'vision_open_query': {
        const {query, params} = readQuery(input)
        const title =
          typeof input.title === 'string' && input.title.trim() ? input.title : undefined
        actorRef.send({
          type: 'tab.add',
          tab: {query, rawParams: JSON.stringify(params, null, 2), title, options: tab.options},
          fetch: input.run === false ? undefined : 'generated',
        })
        return text(`Opened the query in a new tab${input.run === false ? '' : ' and ran it'}.`)
      }
      case 'vision_check_query': {
        const {query} = readQuery(input)
        const state = EditorState.create({
          doc: query,
          extensions: [
            functionLibrary.of(library),
            ...(schema ? [querySchema.of(createQuerySchema(schema))] : []),
          ],
        })
        const diagnostics = await groqLintSource({state})
        return text(
          diagnostics.map((diagnostic) => {
            const line = state.doc.lineAt(diagnostic.from)
            return {
              line: line.number,
              column: diagnostic.from - line.from + 1,
              severity: diagnostic.severity,
              rule: diagnostic.source ?? null,
              message: diagnostic.message,
              text: query.slice(diagnostic.from, diagnostic.to),
            }
          }),
        )
      }
      case 'vision_explain_query': {
        const {query, params} = readQuery(input)
        const plan = await fetchQueryPlan(resolved.client, {query, params})
        return text({
          plan,
          standsOut: readPlanInsights(plan).map((insight) => ({
            note: describeInsight(insight, t),
            tone: insight.tone,
            ...(insight.kind === 'filter-in-memory' ? {expression: insight.expression} : {}),
          })),
        })
      }
      case 'vision_describe_schema': {
        if (!schema) return text('The workspace has no schema.', true)
        const types = Array.isArray(input.types)
          ? input.types.filter((type): type is string => typeof type === 'string')
          : []
        return text(
          types.length > 0
            ? summarizeSchema(schema, types.join(' '))
            : `Document types: ${getDocumentTypeNames(schema).join(', ')}`,
        )
      }
      case 'vision_preview_mutations': {
        const mutations = toMutations(input.mutations)
        if (mutations.status === 'empty') return text('There are no mutations to run.', true)
        if (mutations.status === 'invalid-mutation') {
          return text(
            `Mutation ${mutations.index} needs exactly one of create, createOrReplace, createIfNotExists, delete or patch.`,
            true,
          )
        }
        if (mutations.status !== 'valid') return text('mutations must be a list.', true)
        const preview = await previewMutations(resolved.client, mutations.mutations, {
          autoGenerateArrayKeys: input.autoGenerateArrayKeys !== false,
        })
        return text({
          dataset: resolved.dataset,
          documents: preview.changes,
          notCompared: preview.notShown,
        })
      }
      default: {
        const unhandled: never = name
        return text(`Unknown tool ${String(unhandled)}`, true)
      }
    }
  })

  // What the browser shows the user for each tool
  const titleOf = useEffectEvent((name: ToolName) => {
    switch (name) {
      case 'vision_get_state':
        return t('vision.webmcp.get-state')
      case 'vision_run_query':
        return t('vision.webmcp.run-query')
      case 'vision_open_query':
        return t('vision.webmcp.open-query')
      case 'vision_check_query':
        return t('vision.webmcp.check-query')
      case 'vision_explain_query':
        return t('vision.webmcp.explain-query')
      case 'vision_describe_schema':
        return t('vision.webmcp.describe-schema')
      case 'vision_preview_mutations':
        return t('vision.webmcp.preview-mutations')
      default: {
        const unhandled: never = name
        return String(unhandled)
      }
    }
  })

  useEffect(() => {
    const modelContext = getModelContext()
    if (!modelContext) return undefined
    const controller = new AbortController()
    for (const tool of TOOLS) {
      void modelContext
        .registerTool(
          {
            name: tool.name,
            title: titleOf(tool.name),
            description: tool.description,
            inputSchema: tool.inputSchema,
            annotations: {readOnlyHint: tool.readOnly},
            execute: async (input) => {
              try {
                return await execute(tool.name, input ?? {})
              } catch (error) {
                return text(error instanceof Error ? error.message : String(error), true)
              }
            },
          },
          {signal: controller.signal},
        )
        // Another Vision instance on the page has the names already
        .catch(() => undefined)
    }
    return () => controller.abort()
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- useEffectEvent callbacks must not be listed
  }, [])

  return null
}
