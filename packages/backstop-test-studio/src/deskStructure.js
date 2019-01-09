import React from 'react'
import S from '@sanity/desk-tool/structure-builder'

export default () =>
  S.list()
    .id('root')
    .title('Content')
    .items([
      ...S.documentTypeListItems(),
      S.listItem()
        .title('Deep panes')
        .child(
          S.list()
            .title('Depth 1')
            .items([
              S.listItem()
                .title('Deeper')
                .child(
                  S.list()
                    .title('Depth 2')
                    .items([
                      S.listItem()
                        .title('Even deeper')
                        .child(
                          S.list()
                            .title('Depth 3')
                            .items([
                              S.listItem()
                                .title('Keep digging')
                                .child(
                                  S.list()
                                    .title('Depth 4')
                                    .items([
                                      S.listItem()
                                        .title('Dig into the core of the earth')
                                        .child(
                                          S.list()
                                            .title('Depth 5')
                                            .items([
                                              S.documentListItem()
                                                .id('grrm')
                                                .schemaType('author')
                                            ])
                                        )
                                    ])
                                )
                            ])
                        )
                    ])
                )
            ])
        )
    ])
