import assert from 'assert'
import blockContentTypeToOptions from '../../../src/util/blockContentTypeToOptions'
import customSchema from '../../fixtures/customSchema'
import defaultSchema from '../../fixtures/defaultSchema'

describe('blockContentTypeToOptions', () => {
  xit('will give sane default options for default schema', () => {
    const blockContentType = defaultSchema
      .get('blogPost')
      .fields.find(field => field.name === 'body').type
    const expected = JSON.parse(`
      {
        "styles": [
          { "title": "Normal", "value": "normal" },
          { "title": "Heading 1", "value": "h1" },
          { "title": "H2", "value": "h2" },
          { "title": "H3", "value": "h3" },
          { "title": "H4", "value": "h4" },
          { "title": "H5", "value": "h5" },
          { "title": "H6", "value": "h6" },
          { "title": "Quote", "value": "blockquote" }
        ],
        "decorators": [
          { "title": "Strong", "value": "strong" },
          { "title": "Emphasis", "value": "em" },
          { "title": "Code", "value": "code" },
          { "title": "Underline", "value": "underline" },
          { "title": "Strike", "value": "strike-through" }
        ],
        "annotations": [
          {
            "title": "Link",
            "type": {
              "jsonType": "object",
              "type": { "name": "object", "type": null, "jsonType": "object" },
              "name": "link",
              "fields": [
                {
                  "name": "href",
                  "type": {
                    "jsonType": "string",
                    "type": {
                      "name": "url",
                      "title": "Url",
                      "type": null,
                      "jsonType": "string"
                    },
                    "name": "url",
                    "title": "Url",
                    "preview": {}
                  }
                }
              ],
              "title": "Link",
              "options": {},
              "orderings": [],
              "fieldsets": [
                {
                  "single": true,
                  "field": {
                    "name": "href",
                    "type": {
                      "jsonType": "string",
                      "type": {
                        "name": "url",
                        "title": "Url",
                        "type": null,
                        "jsonType": "string"
                      },
                      "name": "url",
                      "title": "Url",
                      "preview": {}
                    }
                  }
                }
              ],
              "preview": { "select": { "href": "href" } }
            },
            "value": "link"
          }
        ],
        "lists": [
          { "title": "Bullet", "value": "bullet" },
          { "title": "Numbered", "value": "number" }
        ],
        "types": {
          "block": {
            "jsonType": "array",
            "type": { "name": "array", "type": null, "jsonType": "array", "of": [] },
            "name": "array",
            "title": "Body",
            "of": [
              {
                "type": { "name": "block", "type": null, "jsonType": "object" },
                "name": "block",
                "jsonType": "object",
                "options": {},
                "fields": [
                  {
                    "name": "children",
                    "type": {
                      "jsonType": "array",
                      "type": {
                        "name": "array",
                        "type": null,
                        "jsonType": "array",
                        "of": []
                      },
                      "name": "array",
                      "title": "Content",
                      "of": [
                        {
                          "type": {
                            "name": "span",
                            "type": null,
                            "jsonType": "object"
                          },
                          "name": "span",
                          "jsonType": "object",
                          "fields": [
                            {
                              "name": "text",
                              "type": {
                                "jsonType": "string",
                                "type": {
                                  "name": "text",
                                  "type": null,
                                  "jsonType": "string"
                                },
                                "name": "text",
                                "title": "Text",
                                "preview": {}
                              }
                            },
                            {
                              "name": "marks",
                              "type": {
                                "jsonType": "array",
                                "type": {
                                  "name": "array",
                                  "type": null,
                                  "jsonType": "array",
                                  "of": []
                                },
                                "name": "array",
                                "of": [
                                  {
                                    "jsonType": "string",
                                    "type": {
                                      "name": "string",
                                      "type": null,
                                      "jsonType": "string"
                                    },
                                    "name": "string",
                                    "preview": {}
                                  }
                                ],
                                "title": "Marks"
                              }
                            }
                          ],
                          "annotations": [
                            {
                              "jsonType": "object",
                              "type": {
                                "name": "object",
                                "type": null,
                                "jsonType": "object"
                              },
                              "name": "link",
                              "fields": [
                                {
                                  "name": "href",
                                  "type": {
                                    "jsonType": "string",
                                    "type": {
                                      "name": "url",
                                      "title": "Url",
                                      "type": null,
                                      "jsonType": "string"
                                    },
                                    "name": "url",
                                    "title": "Url",
                                    "preview": {}
                                  }
                                }
                              ],
                              "title": "Link",
                              "options": {},
                              "orderings": [],
                              "fieldsets": [
                                {
                                  "single": true,
                                  "field": {
                                    "name": "href",
                                    "type": {
                                      "jsonType": "string",
                                      "type": {
                                        "name": "url",
                                        "title": "Url",
                                        "type": null,
                                        "jsonType": "string"
                                      },
                                      "name": "url",
                                      "title": "Url",
                                      "preview": {}
                                    }
                                  }
                                }
                              ],
                              "preview": { "select": { "href": "href" } }
                            }
                          ],
                          "decorators": [
                            { "title": "Strong", "value": "strong" },
                            { "title": "Emphasis", "value": "em" },
                            { "title": "Code", "value": "code" },
                            { "title": "Underline", "value": "underline" },
                            { "title": "Strike", "value": "strike-through" }
                          ],
                          "options": {},
                          "marks": [],
                          "preview": {
                            "select": { "text": "text", "marks": "marks" }
                          }
                        }
                      ]
                    }
                  },
                  {
                    "name": "style",
                    "type": {
                      "jsonType": "string",
                      "type": {
                        "name": "string",
                        "type": null,
                        "jsonType": "string"
                      },
                      "name": "string",
                      "title": "Style",
                      "options": {
                        "list": [
                          { "title": "Normal", "value": "normal" },
                          { "title": "Heading 1", "value": "h1" },
                          { "title": "H2", "value": "h2" },
                          { "title": "H3", "value": "h3" },
                          { "title": "H4", "value": "h4" },
                          { "title": "H5", "value": "h5" },
                          { "title": "H6", "value": "h6" },
                          { "title": "Quote", "value": "blockquote" }
                        ]
                      },
                      "preview": {}
                    }
                  },
                  {
                    "name": "list",
                    "type": {
                      "jsonType": "string",
                      "type": {
                        "name": "string",
                        "type": null,
                        "jsonType": "string"
                      },
                      "name": "string",
                      "title": "List type",
                      "options": {
                        "list": [
                          { "title": "Bullet", "value": "bullet" },
                          { "title": "Numbered", "value": "number" }
                        ]
                      },
                      "preview": {}
                    }
                  }
                ],
                "preview": { "select": {} }
              }
            ]
          },
          "span": {
            "type": { "name": "span", "type": null, "jsonType": "object" },
            "name": "span",
            "jsonType": "object",
            "fields": [
              {
                "name": "text",
                "type": {
                  "jsonType": "string",
                  "type": { "name": "text", "type": null, "jsonType": "string" },
                  "name": "text",
                  "title": "Text",
                  "preview": {}
                }
              },
              {
                "name": "marks",
                "type": {
                  "jsonType": "array",
                  "type": {
                    "name": "array",
                    "type": null,
                    "jsonType": "array",
                    "of": []
                  },
                  "name": "array",
                  "of": [
                    {
                      "jsonType": "string",
                      "type": {
                        "name": "string",
                        "type": null,
                        "jsonType": "string"
                      },
                      "name": "string",
                      "preview": {}
                    }
                  ],
                  "title": "Marks"
                }
              }
            ],
            "annotations": [
              {
                "jsonType": "object",
                "type": { "name": "object", "type": null, "jsonType": "object" },
                "name": "link",
                "fields": [
                  {
                    "name": "href",
                    "type": {
                      "jsonType": "string",
                      "type": {
                        "name": "url",
                        "title": "Url",
                        "type": null,
                        "jsonType": "string"
                      },
                      "name": "url",
                      "title": "Url",
                      "preview": {}
                    }
                  }
                ],
                "title": "Link",
                "options": {},
                "orderings": [],
                "fieldsets": [
                  {
                    "single": true,
                    "field": {
                      "name": "href",
                      "type": {
                        "jsonType": "string",
                        "type": {
                          "name": "url",
                          "title": "Url",
                          "type": null,
                          "jsonType": "string"
                        },
                        "name": "url",
                        "title": "Url",
                        "preview": {}
                      }
                    }
                  }
                ],
                "preview": { "select": { "href": "href" } }
              }
            ],
            "decorators": [
              { "title": "Strong", "value": "strong" },
              { "title": "Emphasis", "value": "em" },
              { "title": "Code", "value": "code" },
              { "title": "Underline", "value": "underline" },
              { "title": "Strike", "value": "strike-through" }
            ],
            "options": {},
            "marks": [],
            "preview": { "select": { "text": "text", "marks": "marks" } }
          },
          "inlineObjects": [],
          "blockObjects": []
        }
      }
    `)
    assert.deepEqual(blockContentTypeToOptions(blockContentType), expected)
  })

  xit('will give spesific options for custom schema', () => {
    const blockContentType = customSchema
      .get('blogPost')
      .fields.find(field => field.name === 'body').type

    const expected = {
      annotations: [{title: 'Author', value: 'author'}],
      decorators: [{title: 'Strong', value: 'strong'}, {title: 'Emphasis', value: 'em'}],
      styles: [
        {title: 'Normal', value: 'normal'},
        {title: 'Heading 1', value: 'h1'},
        {title: 'H2', value: 'h2'}
      ]
    }
    console.log(JSON.stringify(blockContentTypeToOptions(blockContentType)))
    assert.deepEqual(blockContentTypeToOptions(blockContentType), expected)
  })
})
