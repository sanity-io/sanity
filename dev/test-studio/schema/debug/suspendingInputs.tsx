import {Card, Text} from '@sanity/ui'
import {type ComponentType, lazy, Suspense, use, useState} from 'react'
import {defineField, defineType, type StringInputProps} from 'sanity'

const SUSPEND_MS = 1_500

function sleep<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SUSPEND_MS))
}

const moduleCache = new Map<string, Promise<string>>()

function getCachedLabel(key: string): Promise<string> {
  let promise = moduleCache.get(key)
  if (!promise) {
    promise = sleep(`Loaded "${key}" from a module-scoped cache`)
    moduleCache.set(key, promise)
  }
  return promise
}

function CachedPromiseInput(props: StringInputProps) {
  const label = use(getCachedLabel(props.schemaType.name))
  return (
    <Card padding={2} tone="positive" border>
      <Text size={1}>{label}</Text>
      {props.renderDefault(props)}
    </Card>
  )
}

function PerInstancePromiseInput(props: StringInputProps) {
  const [promise] = useState(() => sleep('Loaded from a promise created when the input mounts'))
  const label = use(promise)
  return (
    <Card padding={2} tone="caution" border>
      <Text size={1}>{label}</Text>
      {props.renderDefault(props)}
    </Card>
  )
}

function WrappedPerInstancePromiseInput(props: StringInputProps) {
  return (
    <Suspense
      fallback={
        <Card padding={2} border>
          <Text size={1}>Loading inside the input's own Suspense boundary…</Text>
        </Card>
      }
    >
      <PerInstancePromiseInput {...props} />
    </Suspense>
  )
}

const LazyInput = lazy<ComponentType<StringInputProps>>(() =>
  sleep({
    default: function LazyLoadedInput(props: StringInputProps) {
      return (
        <Card padding={2} tone="primary" border>
          <Text size={1}>Loaded through React.lazy</Text>
          {props.renderDefault(props)}
        </Card>
      )
    },
  }),
)

function defineSuspendingInputType(options: {
  name: string
  title: string
  description: string
  input: ComponentType<StringInputProps>
}) {
  return defineType({
    name: options.name,
    title: options.title,
    type: 'document',
    fields: [
      defineField({name: 'title', title: 'Title', type: 'string'}),
      defineField({
        name: 'suspending',
        title: 'Suspending input',
        description: options.description,
        type: 'string',
        components: {input: options.input},
      }),
    ],
  })
}

export const suspendingInputCached = defineSuspendingInputType({
  name: 'suspendingInputCached',
  title: 'Suspending input: cached use()',
  description: 'Calls use() on a promise kept in a module-scoped cache. No Suspense boundary.',
  input: CachedPromiseInput,
})

export const suspendingInputPerInstance = defineSuspendingInputType({
  name: 'suspendingInputPerInstance',
  title: 'Suspending input: per-instance use()',
  description:
    'Calls use() on a promise created in useState when the input mounts. No Suspense boundary.',
  input: PerInstancePromiseInput,
})

export const suspendingInputPerInstanceWrapped = defineSuspendingInputType({
  name: 'suspendingInputPerInstanceWrapped',
  title: 'Suspending input: per-instance use() in Suspense',
  description:
    'Same input as the per-instance type, wrapped in its own Suspense boundary inside the input.',
  input: WrappedPerInstancePromiseInput,
})

export const suspendingInputLazy = defineSuspendingInputType({
  name: 'suspendingInputLazy',
  title: 'Suspending input: React.lazy',
  description: 'A React.lazy input whose module takes 1.5s to load. No Suspense boundary.',
  input: LazyInput,
})
