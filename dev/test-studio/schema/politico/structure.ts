import {type StructureResolver} from 'sanity/structure'

export const politicoStructure: StructureResolver = (S) =>
  S.list()
    .title('POLITICO')
    .items([
      S.listItem()
        .title('Home page')
        .id('politico-home')
        .child(
          S.document()
            .schemaType('politicoHomePage')
            .documentId('politico-home')
            .title('Home page'),
        ),
      S.divider(),
      S.documentTypeListItem('politicoArticle').title('Articles'),
      S.documentTypeListItem('politicoSponsor').title('Sponsors'),
    ])
