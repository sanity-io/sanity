// eslint-disable-next-line max-len
export default 'Alpaca;Bali cattle;Cat;Cattle;Chicken;Dog;Domestic Bactrian camel;Domestic canary;Domestic dromedary camel;Domestic duck;Domestic goat;Domestic goose;Domestic guineafowl;Domestic hedgehog;Domestic pig;Domestic pigeon;Domestic rabbit;Domestic silkmoth;Domestic silver fox;Domestic turkey;Donkey;Fancy mouse;Fancy rat and Lab rat;Ferret;Gayal;Goldfish;Guinea pig;Guppy;Horse;Koi;Llama;Ringneck dove;Sheep;Siamese fighting fish;Society finch;Water buffalo;Yak;Zebu'
  .split(';')
  .map(petName => {
    const id = petName.toLowerCase().replace(/\s/g, '-')
    return {
      _id: id,
      _type: 'pet',
      name: petName
    }
  })
