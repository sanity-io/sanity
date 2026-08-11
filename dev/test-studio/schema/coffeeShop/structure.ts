import {type StructureResolver} from 'sanity/structure'

export const coffeeShopStructure: StructureResolver = (S) =>
  S.list()
    .title('Coffee Shop')
    .items([
      S.listItem()
        .title('Landing page')
        .id('demo-coffee-landing')
        .child(
          S.document()
            .schemaType('demoCoffeeLandingPage')
            .documentId('demo-coffee-landing')
            .title('Landing page'),
        ),
      S.listItem()
        .title('Loyalty page')
        .id('demo-coffee-loyalty')
        .child(
          S.document()
            .schemaType('demoCoffeeLoyaltyPage')
            .documentId('demo-coffee-loyalty')
            .title('Loyalty page'),
        ),
      S.divider(),
      S.documentTypeListItem('demoCoffeeProduct').title('Products'),
      S.documentTypeListItem('demoCoffeeOrigin').title('Origins'),
      S.documentTypeListItem('demoCoffeePromo').title('Promos'),
    ])
