import React, {forwardRef, useCallback, useState} from 'react'
import ReactDOM from 'react-dom'
import Schema from '@sanity/schema'
import {of} from 'rxjs'
import {Path, SchemaType} from '@sanity/types'
import {
  Box,
  Card,
  Text,
  Heading,
  studioTheme,
  ThemeProvider,
  ToastProvider,
  Code,
  Inline,
} from '@sanity/ui'
import {capitalize} from 'lodash'
import FormBuilderContext from './FormBuilderContext'
import {FormBuilderInput} from './FormBuilderInput'
import is from './utils/is'
import {ObjectInput} from './inputs/ObjectInput'
import StringInput from './inputs/StringInput'
import PatchEvent from './PatchEvent'
import {applyAll} from './simplePatch'
import {ReferenceInput} from './inputs/ReferenceInput'

const INITIAL_DOCUMENT = {_id: 'blah', _type: 'person'}

const PETS_DB = 'alpaca,camel,cat,cattle,dog,donkey,ferret,goat,hedgehog,horse,llama,monkey,pig,rabbit,red fox,rat,mice,hamster,guinea pig,gerbil,chinchilla,sheep,suga glider,chicken,budgie,turkey,duck,geese,quail,goldfish,guppy,silk moth,ant'
  .split(',')
  .map((pet) => ({_id: pet, _type: 'pet', title: capitalize(pet), description: `Good ${pet}`}))

const schema = Schema.compile({
  name: 'lol',
  types: [
    {
      name: 'person',
      type: 'document',
      fields: [
        {name: 'name', type: 'string'},
        {name: 'preferredPet', type: 'reference', to: [{type: 'pet'}]},
        {
          name: 'address',
          type: 'address',
        },
      ],
    },
    {name: 'pet', type: 'document', fields: [{name: 'title', type: 'string'}]},
    {
      name: 'address',
      type: 'object',
      fields: [
        {name: 'street', type: 'string'},
        {name: 'city', type: 'string'},
      ],
    },
  ],
})

function GenericPreview(props) {
  return (
    <Box>
      <Text>{props.value.title}</Text>
      <Text muted>{props.value.subtitle}</Text>
    </Box>
  )
}

const FallbackInput = forwardRef(function FallbackInput(props, ref) {
  return <div ref={ref}>Missing input component for type {props.type.name} </div>
})

function search(kw: string) {
  return of(PETS_DB.filter((entry) => entry.title.toLowerCase().includes(kw.toLowerCase())))
}
function getPreviewSnapshot(ref: {_ref: string}) {
  return of(PETS_DB.find((entry) => entry._id === ref._ref))
}

const InMemoryReferenceInput = forwardRef(function InMemorReferenceInput(props, ref) {
  return (
    <ReferenceInput
      ref={ref}
      {...props}
      onSearch={search}
      getPreviewSnapshot={getPreviewSnapshot}
    />
  )
})

function resolveInputComponent(type: SchemaType) {
  if (is('object', type) || is('document', type)) {
    return ObjectInput
  }
  if (is('string', type)) {
    return StringInput
  }
  if (is('reference', type)) {
    return InMemoryReferenceInput
  }
  return FallbackInput
}

const noop = () => {}
const patchChannel = FormBuilderContext.createPatchChannel()
function App() {
  const [doc, setDoc] = useState(INITIAL_DOCUMENT)
  const [focusPath, setFocusPath] = useState([])

  const handleChange = useCallback((patchEvent: PatchEvent) => {
    setDoc((current) => applyAll(current, patchEvent.patches))
  }, [])

  const handleFocus = useCallback((nextFocusPath: Path) => setFocusPath(nextFocusPath), [])

  return (
    <>
      <FormBuilderContext
        schema={schema}
        value={doc}
        resolveInputComponent={resolveInputComponent}
        resolvePreviewComponent={() => GenericPreview}
        patchChannel={patchChannel}
      >
        <Card padding={4}>
          <Heading>Embeddable form-builder + Vite</Heading>
        </Card>
        <Box>
          <Inline>
            <Text size={1}>Focus path:</Text>
            <Code size={1}>{JSON.stringify(focusPath)}</Code>
          </Inline>
        </Box>
        <Card padding={4}>
          <FormBuilderInput
            value={doc}
            type={schema.get('person')}
            level={0}
            focusPath={focusPath}
            onChange={handleChange}
            onBlur={noop}
            onFocus={handleFocus}
          />
        </Card>
      </FormBuilderContext>
      <Card marginY={2} padding={2} tone="transparent">
        <Heading as="h2">Document</Heading>
        <pre>{JSON.stringify(doc, null, 2)}</pre>
      </Card>
    </>
  )
}

ReactDOM.render(
  <ThemeProvider theme={studioTheme}>
    <ToastProvider>
      <App />
    </ToastProvider>
  </ThemeProvider>,
  document.getElementById('root')
)
