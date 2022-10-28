import {useString} from '@sanity/ui-workshop'
import React from 'react'
import {Changelog} from '../changelog/module-status'
import {ChangelogDialog} from '../changelog'

export default function ChangelogDialogStory() {
  const currentVersion = useString('Current version', '2.9.0')
  const latestVersion = useString('Latest version', '3.0.0')

  return (
    <ChangelogDialog
      changelog={changelog as Changelog}
      currentVersion={currentVersion}
      latestVersion={latestVersion}
    />
  )
}

const changelog = [
  {
    version: '3.0.0',
    isLatest: true,
    changeItems: [
      {
        changeType: 'feature',
        description: [
          {
            _type: 'block',
            style: 'normal',
            children: [
              {
                _type: 'span',
                text: 'The main configuration file for the studio is now written in either JavaScript or TypeScript instead of JSON.',
                _key: 'e5d47dc5df7d0',
              },
            ],
            _key: '55e7b09d1f79',
          },
          {
            _key: '527d1e404b08',
            _type: 'code',
            code: "import {defineConfig} from 'sanity'\nimport {deskTool} from 'sanity/desk'\nimport {schemaTypes} from './schema/schema'\n\nexport default defineConfig({\n  name: 'default',\n  title: 'My Cool Project',\n  projectId: 'my-project-id',\n  dataset: 'production',\n  plugins: [\n    deskTool(),\n  ],\n  schema: {\n    types: schemaTypes,\n  },\n})",
            language: 'javascript',
          },
        ],
        title: 'New Config API ',
      },
    ],
  },
  {
    version: '2.9.5',
    isLatest: false,
    changeItems: [
      {
        _type: 'changeItem',
        _key: 'ad849c77d2a8',
        changeType: 'feature',
        title: 'Some Feature',
        description: [
          {
            _type: 'block',
            markDefs: [],
            style: 'normal',
            children: [
              {
                _type: 'span',
                marks: [],
                text: 'Lorem ipsum dolor sit amet, ',
                _key: '4ccf45c6c1190',
              },
              {
                _type: 'span',
                marks: ['em'],
                _key: '9c7a44f507a8',
                text: 'consectetur adipiscing elit',
              },
              {
                _type: 'span',
                marks: [],
                _key: '37f89d1f8c31',
                text: ', sed do eiusmod tempor ',
              },
              {
                _type: 'span',
                marks: ['code'],
                _key: '38a01b81a0be',
                text: 'incididunt',
              },
              {
                _type: 'span',
                marks: [],
                _key: '22436de9f399',
                text: ' ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ',
              },
              {
                _type: 'span',
                marks: ['strong'],
                _key: '65e4b5aa28b3',
                text: 'ullamco',
              },
              {
                _type: 'span',
                marks: [],
                _key: '4570e3e0eab6',
                text: ' laboris nisi ut aliquip ex ea commodo consequat.',
              },
            ],
            _key: '53b73f6acb9d',
          },
          {
            _key: '5b46acd7278c',
            _type: 'image',
            alt: 'Presence avatars in document lists alt',
            asset: {
              metadata: {
                dimensions: {
                  aspectRatio: 1.7802503477051461,
                  height: 719,
                  width: 1280,
                },
                lqip: 'data:image/jpeg;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAALABQDASIAAhEBAxEB/8QAGAAAAwEBAAAAAAAAAAAAAAAAAAUGBAf/xAAfEAABBAIDAQEAAAAAAAAAAAABAAIDBAUREiExMoL/xAAWAQEBAQAAAAAAAAAAAAAAAAAEAgP/xAAdEQACAgIDAQAAAAAAAAAAAAABEQACAyEEEhNh/9oADAMBAAIRAxEAPwDrxoZid3OkyqYT4ZCdlOKtTLMbxkx1GR+vQ86Warania1schaAfFUVpXkb5dnS2NjUshxnMOUHdtfJMW4p2S6sVooZNfLHbCExz3d/8BCvs9qNwPzqzP/Z',
              },
              path: 'images/3do82whm/herman_test/cf6078f389bf1374dded2caa7053fb6f06972a2b-1280x719.jpg',
              url: 'https://cdn.sanity.io/images/3do82whm/herman_test/cf6078f389bf1374dded2caa7053fb6f06972a2b-1280x719.jpg',
            },
            caption: 'Presence avatars in document lists',
          },
        ],
      },
      {
        _type: 'changeItem',
        _key: 'a778b6e12a5c',
        changeType: 'bugfix',
        description: [
          {
            _type: 'block',
            markDefs: [],
            style: 'normal',
            level: 1,
            listItem: 'bullet',
            children: [
              {
                _type: 'span',
                marks: [],
                text: 'Fixes hovering issue in array input with portable text block',
                _key: 'f60d7c3dc4de0',
              },
            ],
            _key: '5e163a46a8fb',
          },
          {
            _type: 'block',
            markDefs: [],
            style: 'normal',
            level: 1,
            listItem: 'bullet',
            children: [
              {
                _type: 'span',
                marks: [],
                text: 'Fixes issue where selected list ordering in desk structure would not be respected',
                _key: 'ca661d5003b20',
              },
            ],
            _key: '9b7ab5640940',
          },
          {
            _type: 'block',
            markDefs: [],
            style: 'normal',
            level: 1,
            listItem: 'bullet',
            children: [
              {
                _type: 'span',
                marks: [],
                text: 'Fixes issue where document list appeared to be loading forever when changing the ordering',
                _key: 'a0389e18e2800',
              },
            ],
            _key: 'f28d1122b8ad',
          },
          {
            _type: 'block',
            markDefs: [],
            style: 'normal',
            level: 1,
            listItem: 'bullet',
            children: [
              {
                _type: 'span',
                marks: [],
                text: 'Fixes issue where the the code input file name field would disappear when the ',
                _key: '5204ae83acc20',
              },
              {
                _type: 'span',
                marks: ['code'],
                text: 'language',
                _key: '5204ae83acc21',
              },
              {
                _type: 'span',
                marks: [],
                text: ' option was set',
                _key: '5204ae83acc22',
              },
            ],
            _key: 'fa57b39a8b3f',
          },
          {
            _type: 'block',
            markDefs: [],
            style: 'normal',
            level: 1,
            listItem: 'bullet',
            children: [
              {
                _type: 'span',
                marks: [],
                text: 'Improves error message when copying a dataset and the target dataset already exists, but a copy operation is already in progress',
                _key: 'e8eaf4a80f960',
              },
            ],
            _key: '699dcdc63716',
          },
        ],
      },
    ],
  },
]
