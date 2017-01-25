// @flow

import lodash from 'lodash'

type Property = {
  name: string,
  required: boolean,
  overridable: boolean
}

type Type = {
  name: string
}

type AbstractType = Type & {
  name: string,
  properties: {
    [key: string]: Property
  }
}

const ObjectType : AbstractType = {
  name: 'object',
  properties: {
    title: {
      inherited: true,
      required: true
    },
    fields: {
      required: true,
      inherited: false
    }
  }
}
const StringType : AbstractType = {
  name: 'string',
  extensible: true,
  properties: {
    name: {
      required: true
    },
    title: {
      inherited: true,
      required: true
    },
    fields: {
      required: true,
      inherited: false
    }
  }
}

console.log(ObjectType)

function compileAs(typeDef : Object, abstractType : AbstractType) {
  if (!typeDef.name !== abstractType.name) {
    throw new Error(`Cannot compile type ${typeDef.name} as ${abstractType.name}`)
  }

}

console.log(compileAs({type: 'object'}, ObjectType))
