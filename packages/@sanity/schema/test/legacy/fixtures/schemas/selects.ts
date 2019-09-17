// eslint-disable-next-line max-len
const pets = 'Alpaca;Bali cattle;Cat;Cattle;Chicken;Dog;Domestic Bactrian camel;Domestic canary;Domestic dromedary camel;Domestic duck;Domestic goat;Domestic goose;Domestic guineafowl;Domestic hedgehog;Domestic pig;Domestic pigeon;Domestic rabbit;Domestic silkmoth;Domestic silver fox;Domestic turkey;Donkey;Fancy mouse;Fancy rat and Lab rat;Ferret;Gayal;Goldfish;Guinea pig;Guppy;Horse;Koi;Llama;Ringneck dove;Sheep;Siamese fighting fish;Society finch;Water buffalo;Yak;Zebu'.split(
  ';'
)

export default {
  name: 'selects',
  types: [
    {
      name: 'pokemon',
      type: 'object',
      fields: [
        {
          name: 'title',
          type: 'string',
          title: 'Name of your pokemon'
        },
        {
          name: 'color',
          type: 'string',
          title: 'Color',
          options: {
            list: ['Red', 'Blue', 'Yellow']
          }
        },
        {
          name: 'lookalike',
          type: 'string',
          title: 'Look alike',
          options: {
            list: pets
          }
        },
        {
          name: 'lookalikeSearchable',
          type: 'string',
          title: 'Look alike (searchable)',
          options: {
            searchable: true,
            list: pets
          }
        }
      ]
    }
  ]
}
