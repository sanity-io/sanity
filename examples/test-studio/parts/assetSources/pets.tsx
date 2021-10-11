import React from 'react'

const ASSET_SOURCE_NAME = 'pets'

export default {
  name: ASSET_SOURCE_NAME,
  title: 'Pets',
  component: SelectCatOrDog,
}

const kokos = {
  name: 'Kokos',
  imageUrl:
    'https://cdn.sanity.io/images/ppsg7ml5/test/8af1bb276b7dc7d2579561cedc3a083b8082a004-300x200.png',
}

const bamse = {
  name: 'Bamse',
  imageUrl:
    'https://cdn.sanity.io/images/ppsg7ml5/test/eeb1baf83b62177d2bbf858ec71d08fffc8d0555-1022x1024.jpg',
}

const pets = [kokos, bamse]

function createAssetDocumentFrom(pet) {
  return {
    kind: 'url',
    value: pet.imageUrl,
    assetDocumentProps: {
      source: ASSET_SOURCE_NAME,
      description: pet.name,
    },
  }
}

function SelectCatOrDog(props) {
  return (
    <div>
      {pets.map((pet) => {
        return (
          <div key={pet.name}>
            <div>
              <img src={`${pet.imageUrl}?w=100`} />
            </div>
            <button type="button" onClick={() => props.onSelect([createAssetDocumentFrom(pet)])}>
              Select {pet.name}
            </button>
          </div>
        )
      })}
      <button type="button" onClick={props.onClose}>
        Close
      </button>
    </div>
  )
}
