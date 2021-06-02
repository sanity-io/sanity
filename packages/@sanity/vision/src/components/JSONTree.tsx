import {Card, Code, Tree, TreeItem} from '@sanity/ui'
import React from 'react'

type JSONValue = boolean | string | number | null | {[key: string]: JSONValue} | JSONValue[]
type JSONObject = {[key: string]: JSONValue}

function isObject(value: JSONValue): value is JSONObject {
  return Boolean(value) && !Array.isArray(value) && typeof value === 'object'
}

function isArray(value: JSONValue): value is JSONValue[] {
  return Array.isArray(value)
}

export function JSONTree({value}: {value: JSONValue}) {
  return (
    <Tree>
      <JSONTreeValue value={value} />
    </Tree>
  )
}

function JSONTreeObject({value}: {value: JSONObject}) {
  return (
    <>
      {Object.keys(value).map((key) => (
        <TreeItem key={key} text={key}>
          <JSONTreeValue value={value[key]} />
        </TreeItem>
      ))}
    </>
  )
}

function JSONTreeArray({value}: {value: JSONValue[]}) {
  return (
    <>
      {value.map((item, itemIndex) => (
        <TreeItem key={itemIndex} text={`[${itemIndex}]`}>
          <JSONTreeValue value={item} />
        </TreeItem>
      ))}
    </>
  )
}

function JSONTreeValue({value}: {value: JSONValue}) {
  if (isArray(value)) return <JSONTreeArray value={value} />
  if (isObject(value)) return <JSONTreeObject value={value} />

  return (
    <Card padding={3} tone="transparent">
      <Code>{JSON.stringify(value)}</Code>
    </Card>
  )
}
