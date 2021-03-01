// Copied from packages/@sanity/cli/templates/ecommerce/plugins/barcode-input/BarcodeType.js

export default {
  name: 'barcode',
  title: 'Barcode',
  type: 'object',
  preview: {
    select: {
      title: 'barcode',
      subtitle: 'format',
    },
  },
  fields: [
    {
      name: 'barcode',
      title: 'Barcode',
      type: 'string',
    },
    {
      name: 'format',
      title: 'Barcode Format',
      type: 'string',
      options: {
        list: [
          'CODE39',
          'CODE128',
          'CODE128A',
          'CODE128B',
          'CODE128C',
          'EAN13',
          'EAN8',
          'EAN5',
          'EAN2',
          'UPC',
          'UPCE',
          'ITF14',
          'ITF',
          'MSI',
          'MSI10',
          'MSI11',
          'MSI1010',
          'MSI1110',
          'pharmacode',
          'codabar',
          'GenericBarcode',
        ],
      },
    },
  ],
}
