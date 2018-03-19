/*eslint-disable quotes,quote-props,max-len*/
export default {
  name: 'oma',
  types: [
    {
      name: 'client',
      type: 'object',
      fields: [
        {
          name: 'name',
          type: 'string',
          title: 'Name',
          required: true
        },
        {
          name: 'logo',
          type: 'reference',
          title: 'Logo',
          required: true,
          to: [
            {
              type: 'image',
              title: 'Image'
            }
          ]
        }
      ]
    },
    {
      name: 'project',
      type: 'object',
      fields: [
        {
          name: 'title',
          type: 'string',
          title: 'Title',
          placeholder: 'ex. CCTV Main building',
          description: 'This is the description',
          required: true
        },
        {
          name: 'key',
          type: 'string',
          title: 'URL-key',
          required: false
        },
        {
          name: 'mainImage',
          type: 'reference',
          title: 'Hero Image',
          description:
            'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
          required: false,
          to: [
            {
              type: 'image',
              title: 'Image'
            }
          ]
        },
        {
          name: 'mainMediaURL',
          type: 'string',
          title: 'Hero Video',
          required: false
        },
        {
          name: 'mainImageVertical',
          type: 'reference',
          title: 'Hero Image Vertical',
          required: false,
          to: [
            {
              type: 'image',
              title: 'Image'
            }
          ]
        },
        {
          name: 'description',
          type: 'text',
          title: 'Description',
          description:
            'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
          required: false
        },
        {
          name: 'extendedDescription',
          type: 'text',
          description:
            'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
          title: 'Extended description',
          required: false
        },
        {
          name: 'sortOrder',
          type: 'number',
          title: 'Sort Year',
          required: false
        },
        {
          name: 'priority',
          type: 'number',
          title: 'Priority',
          required: false
        },
        {
          name: 'ongoing',
          type: 'boolean',
          title: 'Project ongoing',
          required: false
        },
        {
          name: 'milestones',
          type: 'array',
          title: 'Milestones',
          required: false,
          of: [
            {
              type: 'milestone',
              title: 'Milestone'
            }
          ]
        },
        {
          name: 'hasTimeline',
          type: 'boolean',
          title: 'Display timeline?',
          required: false
        },
        {
          name: 'clients',
          type: 'array',
          title: 'Clients',
          required: false,
          of: [
            {
              type: 'string',
              required: false
            }
          ]
        },
        {
          name: 'status',
          type: 'string',
          title: 'Status',
          required: false
        },
        {
          type: 'geoPlace',
          name: 'geoPlace',
          title: 'Geo place',
          description: 'Set the lonlat with what you want.'
        },
        {
          name: 'isCurrentlyPhysical',
          type: 'boolean',
          title: 'Show map?',
          required: false
        },
        {
          name: 'isRelevantOnInstagram',
          type: 'boolean',
          title: 'Is it relevant on Instagram?',
          required: false
        },
        {
          name: 'locationRadius',
          type: 'number',
          title: 'Social feed radius (meters)',
          required: false
        },
        {
          name: 'totalSquareMeters',
          type: 'number',
          title: 'Total Square Meters',
          required: false
        },
        {
          name: 'program',
          type: 'array',
          title: 'Program',
          required: false,
          of: [
            {
              type: 'programItem',
              title: 'Program'
            }
          ]
        },
        {
          name: 'featuredCategories',
          type: 'array',
          title: 'Main program',
          required: false,
          of: [
            {
              type: 'string'
            }
          ]
        },
        {
          name: 'tags',
          type: 'array',
          title: 'Filter project as',
          required: false,
          of: [
            {
              type: 'string'
            }
          ]
        },
        {
          type: 'omaCredits',
          name: 'credits',
          title: 'Credits'
        },
        {
          name: 'collaborators',
          type: 'array',
          title: 'Collaborators',
          required: false,
          of: [
            {
              type: 'collaboratingCompany',
              title: 'Company'
            },
            {
              type: 'roleCredits',
              title: 'People '
            }
          ]
        },
        {
          name: 'icon',
          type: 'reference',
          title: 'Thumbnail',
          required: false,
          to: [
            {
              type: 'image',
              title: 'Image'
            }
          ]
        },
        {
          name: 'presentationImages',
          type: 'array',
          title: 'Elevator pitch',
          required: false,
          of: [
            {
              type: 'reference',
              to: [
                {
                  type: 'image',
                  title: 'Image'
                }
              ]
            },
            {
              type: 'videoUrl',
              title: 'Video URL'
            }
          ]
        },
        {
          type: 'array',
          title: 'Preoccupations',
          required: false,
          of: [
            {
              type: 'reference',
              to: [
                {
                  type: 'preoccupation',
                  title: 'Preoccupation'
                }
              ]
            }
          ]
        },
        {
          name: 'references',
          title: 'Exceptional Content',
          required: false,
          type: 'array',
          of: [
            {
              type: 'reference',
              to: [
                {
                  type: 'publication',
                  title: 'Publication'
                },
                {
                  type: 'publicationPDFExcerpt',
                  title: 'PDF Excerpt'
                },
                {
                  type: 'pressCoverageItem',
                  title: 'Coverage'
                },
                {
                  type: 'lecture',
                  title: 'Lecture'
                },
                {
                  type: 'project',
                  title: 'Project'
                }
              ]
            }
          ]
        },
        {
          name: 'archiveSection',
          type: 'array',
          title: 'Archive section',
          required: false,
          of: [
            {
              type: 'archiveSection',
              title: 'Archive section'
            }
          ]
        }
      ]
    },
    {
      name: 'pressCoverageItem',
      type: 'object',
      fields: [
        {
          name: 'title',
          type: 'string',
          title: 'Title',
          required: false
        },
        {
          name: 'publisher',
          type: 'string',
          title: 'Publisher',
          required: false
        },
        {
          name: 'date',
          type: 'date',
          title: 'Date',
          required: false
        },
        {
          name: 'mediaUrl',
          type: 'string',
          title: 'Link to story or video',
          required: false
        },
        {
          name: 'caption',
          type: 'string',
          title: 'Caption',
          required: false
        },
        {
          name: 'references',
          type: 'array',
          title: 'Links',
          required: false,
          of: [
            {
              type: 'reference',
              to: [
                {
                  type: 'project',
                  title: 'Project'
                },
                {
                  type: 'lecture',
                  title: 'Lecture'
                },
                {
                  type: 'publication',
                  title: 'Publication'
                }
              ]
            },
            {
              type: 'person',
              title: 'Person'
            }
          ]
        }
      ]
    },
    {
      name: 'publication',
      type: 'object',
      fields: [
        {
          name: 'title',
          type: 'string',
          title: 'Title',
          required: false
        },
        {
          name: 'key',
          type: 'string',
          title: 'URL-key',
          required: false
        },
        {
          name: 'aboutOMA',
          type: 'boolean',
          title: 'On OMA?',
          required: false
        },
        {
          name: 'description',
          type: 'string',
          title: 'Description',
          required: false
        },
        {
          name: 'extendedDescription',
          type: 'string',
          title: 'Extended description',
          required: false
        },
        {
          name: 'yearPublished',
          type: 'number',
          title: 'Year published',
          required: false
        },
        {
          name: 'authorLine',
          type: 'string',
          title: 'Author Line',
          required: false
        },
        {
          name: 'roleCredits',
          type: 'array',
          title: 'Credited roles',
          required: false,
          of: [
            {
              type: 'roleCredits',
              title: 'People '
            }
          ]
        },
        {
          name: 'frontCoverImage',
          type: 'reference',
          title: 'Front cover',
          required: false,
          to: [
            {
              type: 'image',
              title: 'Image'
            }
          ]
        },
        {
          name: 'backCoverImage',
          type: 'reference',
          title: 'Back cover',
          required: false,
          to: [
            {
              type: 'image',
              title: 'Image'
            }
          ]
        },
        {
          name: 'spineImage',
          type: 'reference',
          title: 'Spine',
          required: false,
          to: [
            {
              type: 'image',
              title: 'Image'
            }
          ]
        },
        {
          name: 'stackImage',
          type: 'reference',
          title: 'Stack',
          required: false,
          to: [
            {
              type: 'image',
              title: 'Image'
            }
          ]
        },
        {
          name: 'publisher',
          type: 'string',
          title: 'Publisher',
          required: false
        },
        {
          name: 'publisherUrl',
          type: 'string',
          title: 'Publisher URL',
          required: false
        },
        {
          name: 'purchaseUrl',
          type: 'string',
          title: 'Purchase URL',
          required: false
        },
        {
          name: 'language',
          type: 'string',
          title: 'Language',
          required: false
        },
        {
          name: 'meta',
          type: 'array',
          title: 'Meta',
          required: false,
          of: [
            {
              type: 'metaFact',
              title: 'Fact'
            }
          ]
        },
        {
          name: 'editions',
          type: 'array',
          title: 'Editions',
          required: false,
          of: [
            {
              type: 'publicationEdition',
              title: 'Edition'
            }
          ]
        },
        {
          name: 'excerpts',
          type: 'array',
          title: 'Excerpts',
          required: false,
          of: [
            {
              type: 'reference',
              to: [
                {
                  type: 'publicationPDFExcerpt',
                  title: 'PDF Excerpt'
                }
              ]
            }
          ]
        },
        {
          type: 'array',
          title: 'Preoccupations',
          required: false,
          of: [
            {
              type: 'reference',
              to: [
                {
                  type: 'preoccupation',
                  title: 'Preoccupation'
                }
              ]
            }
          ]
        },
        {
          name: 'references',
          type: 'array',
          title: 'Links',
          required: false,
          of: [
            {
              type: 'reference',
              to: [
                {
                  type: 'project',
                  title: 'Project'
                },
                {
                  type: 'lecture',
                  title: 'Lecture'
                },
                {
                  type: 'pressCoverageItem',
                  title: 'Coverage'
                },
                {
                  type: 'publication',
                  title: 'Publication'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'milestone',
      type: 'object',
      fields: [
        {
          name: 'label',
          type: 'string',
          title: 'Milestone kind',
          required: true
        },
        {
          name: 'labelOverride',
          type: 'string',
          title: 'Label',
          required: false
        },
        {
          type: 'approximateDate',
          name: 'approximateDate',
          title: 'Approximate date'
        }
      ]
    },
    {
      name: 'programItem',
      type: 'object',
      fields: [
        {
          name: 'usage',
          type: 'string',
          title: 'Usage',
          required: false
        },
        {
          name: 'squareMeters',
          type: 'number',
          title: 'Square Meters',
          required: false
        }
      ]
    },
    {
      name: 'metaFact',
      type: 'object',
      fields: [
        {
          name: 'label',
          type: 'string',
          title: 'Label',
          required: false
        },
        {
          name: 'value',
          type: 'string',
          title: 'Value',
          required: false
        },
        {
          name: 'url',
          type: 'string',
          title: 'URL',
          required: false
        }
      ]
    },
    {
      name: 'uberCredit',
      type: 'object',
      fields: [
        {
          name: 'role',
          type: 'string',
          title: 'Role',
          required: false
        },
        {
          name: 'credited',
          type: 'string',
          title: 'Name',
          required: false
        }
      ]
    },
    {
      name: 'imageMetaData',
      type: 'object',
      fields: [
        {
          name: 'caption',
          type: 'string',
          title: 'Caption',
          required: false
        },
        {
          name: 'attribution',
          type: 'string',
          title: 'Image credits',
          required: false
        },
        {
          name: 'altText',
          type: 'string',
          title: 'Alternate text',
          required: false
        }
      ]
    },
    {
      name: 'publicationEdition',
      type: 'object',
      fields: [
        {
          name: 'title',
          type: 'string',
          title: 'Title',
          required: false
        },
        {
          name: 'year',
          type: 'number',
          title: 'Year published',
          required: false
        },
        {
          name: 'roleCredits',
          type: 'array',
          title: 'Credited roles',
          required: false,
          of: [
            {
              type: 'roleCredits',
              title: 'People '
            }
          ]
        },
        {
          name: 'frontCoverImage',
          type: 'reference',
          title: 'Front cover',
          required: false,
          to: [
            {
              type: 'image',
              title: 'Image'
            }
          ]
        },
        {
          name: 'backCoverImage',
          type: 'reference',
          title: 'Back cover',
          required: false,
          to: [
            {
              type: 'image',
              title: 'Image'
            }
          ]
        },
        {
          name: 'spineImage',
          type: 'reference',
          title: 'Spine',
          required: false,
          to: [
            {
              type: 'image',
              title: 'Image'
            }
          ]
        },
        {
          name: 'publisher',
          type: 'string',
          title: 'Publisher',
          required: false
        },
        {
          name: 'publisherUrl',
          type: 'string',
          title: 'Publisher URL',
          required: false
        },
        {
          name: 'purchaseUrl',
          type: 'string',
          title: 'Purchase URL',
          required: false
        },
        {
          name: 'language',
          type: 'string',
          title: 'Language',
          required: false
        },
        {
          name: 'meta',
          type: 'array',
          title: 'Meta',
          required: false,
          of: [
            {
              type: 'metaFact',
              title: 'Fact'
            }
          ]
        }
      ]
    },
    {
      name: 'publicationPDFExcerpt',
      type: 'object',
      fields: [
        {
          name: 'title',
          type: 'string',
          title: 'Caption',
          required: false
        },
        {
          name: 'publication',
          type: 'reference',
          title: 'Publication',
          required: false,
          to: [
            {
              type: 'publication',
              title: 'Publication'
            }
          ]
        },
        {
          name: 'authorLine',
          type: 'string',
          title: 'Author line',
          required: false
        },
        {
          name: 'illustrationImage',
          type: 'reference',
          title: 'Illustration image',
          required: false,
          to: [
            {
              type: 'image',
              title: 'Image'
            }
          ]
        },
        {
          name: 'pdf',
          type: 'file',
          title: 'PDF',
          required: false
        },
        {
          name: 'orderIndex',
          type: 'number',
          title: 'Order',
          required: false
        }
      ]
    },
    {
      name: 'lecture',
      type: 'object',
      fields: [
        {
          name: 'title',
          type: 'string',
          title: 'Title',
          required: false
        },
        {
          name: 'key',
          type: 'string',
          title: 'URL-key',
          required: false
        },
        {
          name: 'lecturers',
          type: 'array',
          title: 'Lecturers',
          required: false,
          of: [
            {
              type: 'person',
              title: 'Person'
            }
          ]
        },
        {
          name: 'host',
          type: 'string',
          title: 'Host',
          required: false
        },
        {
          name: 'country',
          type: 'string',
          title: 'Country',
          required: false
        },
        {
          name: 'city',
          type: 'string',
          title: 'City',
          required: false
        },
        {
          name: 'happensAt',
          type: 'dateTime',
          title: 'Date',
          required: false
        },
        {
          name: 'description',
          type: 'string',
          title: 'Description',
          required: false
        },
        {
          name: 'extendedDescription',
          type: 'string',
          title: 'Extended Description',
          required: false
        },
        {
          name: 'mediaUrl',
          type: 'string',
          title: 'URL to video/media',
          required: false
        },
        {
          name: 'representativeImage',
          type: 'reference',
          title: 'Video still / representative image',
          required: false,
          to: [
            {
              type: 'image',
              title: 'Image'
            }
          ]
        },
        {
          name: 'videoCaption',
          type: 'string',
          title: 'Video Caption',
          required: false
        },
        {
          name: 'meta',
          type: 'array',
          title: 'Meta',
          required: false,
          of: [
            {
              type: 'metaFact',
              title: 'Fact'
            }
          ]
        },
        {
          name: 'images',
          type: 'array',
          title: 'Images',
          required: false,
          of: [
            {
              type: 'reference',
              to: [
                {
                  type: 'image',
                  title: 'Image'
                }
              ]
            }
          ]
        },
        {
          type: 'array',
          title: 'Preoccupations',
          required: false,
          of: [
            {
              type: 'reference',
              to: [
                {
                  type: 'preoccupation',
                  title: 'Preoccupation'
                }
              ]
            }
          ]
        },
        {
          name: 'references',
          type: 'array',
          title: 'Links',
          required: false,
          of: [
            {
              type: 'reference',
              to: [
                {
                  type: 'project',
                  title: 'Project'
                },
                {
                  type: 'lecture',
                  title: 'Lecture'
                },
                {
                  type: 'publication',
                  title: 'Publication'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'office',
      type: 'object',
      fields: [
        {
          name: 'prefix',
          type: 'string',
          title: 'Prefix',
          required: false
        },
        {
          name: 'name',
          type: 'string',
          title: 'Name',
          required: false
        },
        {
          name: 'building',
          type: 'string',
          title: 'Building',
          required: false
        },
        {
          name: 'address',
          type: 'string',
          title: 'Address',
          required: false
        },
        {
          name: 'pobox',
          type: 'number',
          title: 'PO Box',
          required: false
        },
        {
          name: 'zipcode',
          type: 'string',
          title: 'Zipcode',
          required: false
        },
        {
          type: 'geoPlace',
          name: 'geoPlace',
          title: 'Geo place'
        },
        {
          name: 'phone',
          type: 'string',
          title: 'Phone',
          required: false
        },
        {
          name: 'fax',
          type: 'string',
          title: 'Fax',
          required: false
        },
        {
          name: 'email',
          type: 'string',
          title: 'Email',
          required: false
        },
        {
          name: 'orderIndex',
          type: 'number',
          title: 'Order',
          required: false
        }
      ]
    },
    {
      name: 'officeContact',
      type: 'object',
      fields: [
        {
          name: 'department',
          type: 'string',
          title: 'Department',
          required: false
        },
        {
          name: 'names',
          type: 'string',
          title: 'Names',
          required: false
        },
        {
          name: 'bio',
          type: 'string',
          title: 'Bio',
          required: false
        },
        {
          name: 'email',
          type: 'string',
          title: 'Email',
          required: false
        },
        {
          name: 'orderIndex',
          type: 'number',
          title: 'Order',
          required: false
        }
      ]
    },
    {
      name: 'newsItem',
      type: 'object',
      fields: [
        {
          name: 'title',
          type: 'string',
          title: 'Title',
          required: false
        },
        {
          name: 'key',
          type: 'string',
          title: 'URL-key',
          required: false
        },
        {
          name: 'lede',
          type: 'string',
          title: 'Introduction',
          required: false
        },
        {
          name: 'body',
          type: 'string',
          title: 'Body',
          required: false
        },
        {
          name: 'publishAt',
          type: 'dateTime',
          title: 'Publish when',
          required: true
        },
        {
          name: 'happensOn',
          type: 'dateTime',
          title: 'Happens on',
          required: false
        },
        {
          name: 'images',
          type: 'array',
          title: 'Images',
          required: false,
          of: [
            {
              type: 'reference',
              to: [
                {
                  type: 'image',
                  title: 'Image'
                }
              ]
            }
          ]
        },
        {
          name: 'references',
          type: 'array',
          title: 'Links',
          required: false,
          of: [
            {
              type: 'reference',
              to: [
                {
                  type: 'project',
                  title: 'Project'
                },
                {
                  type: 'lecture',
                  title: 'Lecture'
                },
                {
                  type: 'publication',
                  title: 'Publication'
                }
              ]
            },
            {
              type: 'person',
              title: 'Person'
            }
          ]
        }
      ]
    },
    {
      name: 'videoUrl',
      type: 'object',
      fields: [
        {
          name: 'url',
          type: 'string',
          title: 'URL to video',
          required: false
        }
      ]
    },
    {
      name: 'geoPlace',
      type: 'object',
      fields: [
        {
          name: 'country',
          type: 'string',
          title: 'Country',
          required: false
        },
        {
          name: 'city',
          type: 'string',
          title: 'City',
          required: false
        },
        {
          name: 'latlon',
          type: 'object',
          title: 'Map Marker',
          description:
            'This is the map marker where you can define latitude and longitude. Thats kinda cool.',
          required: false,
          fields: [
            {
              name: 'lat',
              type: 'number'
            },
            {
              name: 'lon',
              type: 'number'
            }
          ]
        }
      ]
    },
    {
      name: 'preoccupation',
      type: 'object',
      fields: [
        {
          name: 'title',
          type: 'string',
          title: 'Title',
          required: false
        },
        {
          name: 'description',
          type: 'string',
          title: 'Description',
          required: false
        },
        {
          name: 'clusters',
          type: 'array',
          title: 'Cluster of posts',
          required: false,
          of: [
            {
              type: 'preoccupationCluster',
              title: 'Cluster'
            }
          ]
        }
      ]
    },
    {
      name: 'preoccupationCluster',
      type: 'object',
      fields: [
        {
          name: 'title',
          type: 'string',
          title: 'Title',
          required: false
        },
        {
          name: 'posts',
          type: 'array',
          title: 'Posts',
          required: false,
          of: [
            {
              type: 'preoccupationImage',
              title: 'Image'
            },
            {
              type: 'preoccupationLink',
              title: 'Link'
            },
            {
              type: 'preoccupationQuote',
              title: 'Quote'
            },
            {
              type: 'preoccupationVideo',
              title: 'Video'
            },
            {
              type: 'preoccupationText',
              title: 'Text'
            }
          ]
        }
      ]
    },
    {
      name: 'preoccupationQuote',
      type: 'object',
      fields: [
        {
          name: 'quote',
          type: 'string',
          title: 'Quote',
          required: false
        },
        {
          name: 'attribution',
          type: 'string',
          title: 'Attribution',
          required: false
        },
        {
          name: 'url',
          type: 'string',
          title: 'URL',
          required: false
        }
      ]
    },
    {
      name: 'preoccupationText',
      type: 'object',
      fields: [
        {
          name: 'text',
          type: 'string',
          title: 'Text',
          required: false
        },
        {
          name: 'image',
          type: 'reference',
          title: 'Image',
          required: false,
          to: [
            {
              type: 'image',
              title: 'Image'
            }
          ]
        }
      ]
    },
    {
      name: 'preoccupationImage',
      type: 'object',
      fields: [
        {
          name: 'image',
          type: 'reference',
          title: 'Image',
          required: false,
          to: [
            {
              type: 'image',
              title: 'Image'
            }
          ]
        },
        {
          name: 'url',
          type: 'string',
          title: 'URL',
          required: false
        }
      ]
    },
    {
      name: 'preoccupationVideo',
      type: 'object',
      fields: [
        {
          name: 'title',
          type: 'string',
          title: 'Title',
          required: false
        },
        {
          name: 'mediaUrl',
          type: 'string',
          title: 'URL to video/media',
          required: false
        }
      ]
    },
    {
      name: 'preoccupationLink',
      type: 'object',
      fields: [
        {
          name: 'linkTtitle',
          type: 'string',
          title: 'Link title',
          required: false
        },
        {
          name: 'linkURL',
          type: 'string',
          title: 'Link URL',
          required: false
        }
      ]
    },
    {
      name: 'approximateDate',
      type: 'object',
      fields: [
        {
          name: 'date',
          type: 'dateTime',
          title: 'Date',
          required: true
        },
        {
          name: 'approximation',
          type: 'string',
          title: 'Approximation',
          required: true
        }
      ]
    },
    {
      name: 'omaCredits',
      type: 'object',
      fields: [
        {
          name: 'partners',
          type: 'array',
          title: 'Partners',
          required: false,
          of: [
            {
              type: 'person',
              title: 'Person'
            }
          ]
        },
        {
          name: 'meta',
          type: 'array',
          title: 'Meta',
          required: false,
          of: [
            {
              type: 'metaFact',
              title: 'Fact'
            }
          ]
        },
        {
          name: 'phases',
          type: 'array',
          title: 'Phases',
          required: false,
          of: [
            {
              type: 'projectPhase',
              title: 'Project phase'
            }
          ]
        }
      ]
    },
    {
      name: 'collaboratingCompany',
      type: 'object',
      fields: [
        {
          name: 'role',
          type: 'string',
          title: 'Role',
          required: false
        },
        {
          name: 'title',
          type: 'string',
          title: 'Company name',
          required: false
        },
        {
          name: 'roleCredits',
          type: 'array',
          title: 'Credited roles',
          required: false,
          of: [
            {
              type: 'roleCredits',
              title: 'People '
            }
          ]
        }
      ]
    },
    {
      name: 'projectPhase',
      type: 'object',
      fields: [
        {
          name: 'title',
          type: 'string',
          title: 'Name of phase',
          required: false
        },
        {
          name: 'roleCredits',
          type: 'array',
          title: 'Credited roles',
          required: false,
          of: [
            {
              type: 'roleCredits',
              title: 'People '
            }
          ]
        },
        {
          name: 'team',
          type: 'array',
          title: 'Team',
          required: false,
          of: [
            {
              type: 'person',
              title: 'Person'
            }
          ]
        }
      ]
    },
    {
      name: 'roleCredits',
      type: 'object',
      fields: [
        {
          name: 'title',
          type: 'string',
          title: 'Role',
          required: false
        },
        {
          name: 'people',
          type: 'array',
          title: 'People',
          required: false,
          of: [
            {
              type: 'person',
              title: 'Person'
            }
          ]
        }
      ]
    },
    {
      name: 'person',
      type: 'object',
      fields: [
        {
          name: 'name',
          type: 'string',
          title: 'Name',
          required: false
        }
      ]
    },
    {
      name: 'profile',
      type: 'object',
      fields: [
        {
          name: 'name',
          type: 'string',
          title: 'Name',
          required: false
        },
        {
          name: 'key',
          type: 'string',
          title: 'Key',
          required: false
        },
        {
          name: 'role',
          type: 'string',
          title: 'Role',
          required: false
        },
        {
          name: 'orderIndex',
          type: 'number',
          title: 'Order',
          required: false
        },
        {
          name: 'bornOn',
          type: 'date',
          title: 'Date of Birth',
          required: false
        },
        {
          name: 'isPartner',
          type: 'boolean',
          title: 'Partner?',
          required: false
        },
        {
          name: 'shortBio',
          type: 'string',
          title: 'Short Bio',
          required: false
        },
        {
          name: 'longBio',
          type: 'string',
          title: 'Long Bio',
          required: false
        },
        {
          name: 'portrait',
          type: 'reference',
          title: 'Portrait',
          required: false,
          to: [
            {
              type: 'image',
              title: 'Image'
            }
          ]
        }
      ]
    },
    {
      name: 'archiveSection',
      type: 'object',
      fields: [
        {
          name: 'title',
          type: 'string',
          title: 'Title',
          required: false
        },
        {
          type: 'approximateDate',
          name: 'approximateDate',
          title: 'Approximate date'
        },
        {
          name: 'media',
          type: 'array',
          title: 'Images & media',
          required: false,
          of: [
            {
              type: 'reference',
              to: [
                {
                  type: 'image',
                  title: 'Image'
                },
                {
                  type: 'publicationPDFExcerpt',
                  title: 'PDF Excerpt'
                }
              ]
            },
            {
              type: 'archiveSectionMediaURL',
              title: 'Video URL'
            }
          ]
        }
      ]
    },
    {
      name: 'archiveSectionMediaURL',
      type: 'object',
      fields: [
        {
          name: 'url',
          type: 'string',
          title: 'URL',
          required: false
        }
      ]
    },
    {
      name: 'aboutOMA',
      type: 'object',
      fields: [
        {
          name: 'description',
          type: 'string',
          title: 'Description',
          required: false
        },
        {
          name: 'extendedDescription',
          type: 'string',
          title: 'Extended description',
          required: false
        },
        {
          name: 'awards',
          type: 'array',
          title: 'Awards and Prizes',
          required: false,
          of: [
            {
              type: 'award',
              title: 'Award'
            }
          ]
        },
        {
          name: 'superHeroes',
          type: 'array',
          title: 'Super Heroes',
          required: false,
          of: [
            {
              type: 'reference',
              to: [
                {
                  type: 'project',
                  title: 'Project'
                }
              ]
            }
          ]
        },
        {
          name: 'exceptionalProjects',
          type: 'array',
          title: 'Exceptional Projects',
          required: false,
          of: [
            {
              type: 'reference',
              to: [
                {
                  type: 'project',
                  title: 'Project'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'award',
      type: 'object',
      fields: [
        {
          name: 'year',
          type: 'number',
          title: 'Year',
          required: false
        },
        {
          name: 'title',
          type: 'string',
          title: 'Title',
          required: false
        }
      ]
    },
    {
      name: 'contactOMA',
      type: 'object',
      fields: [
        {
          name: 'contacts',
          type: 'array',
          title: 'Contact OMA',
          required: false,
          of: [
            {
              type: 'contactDetails',
              title: 'Contact Details'
            }
          ]
        }
      ]
    },
    {
      name: 'frontPageStaticContent',
      type: 'object',
      fields: [
        {
          name: 'title',
          type: 'string',
          title: 'Title',
          required: false
        },
        {
          name: 'url',
          type: 'string',
          title: 'URL',
          required: false
        },
        {
          name: 'targetBlank',
          type: 'boolean',
          title: 'Open in new window?',
          required: false
        },
        {
          name: 'displayStyle',
          type: 'string',
          title: 'Display style',
          required: true
        }
      ]
    },
    {
      name: 'frontPage',
      type: 'object',
      fields: [
        {
          name: 'modifiers',
          type: 'array',
          title: 'Modifiers',
          required: false,
          of: [
            {
              type: 'peggerModifier',
              title: 'Pegger'
            },
            {
              type: 'promoterModifier',
              title: 'Promoter'
            },
            {
              type: 'repressorModifier',
              title: 'Repressor'
            }
          ]
        }
      ]
    },
    {
      name: 'peggerModifier',
      type: 'object',
      fields: [
        {
          name: 'contentModified',
          type: 'reference',
          title: 'Content to be pegged',
          required: true,
          to: [
            {
              type: 'lecture',
              title: 'Lecture'
            },
            {
              type: 'publication',
              title: 'Publication'
            },
            {
              type: 'project',
              title: 'Project'
            },
            {
              type: 'person',
              title: 'Person'
            },
            {
              type: 'newsItem',
              title: 'News item'
            },
            {
              type: 'pressCoverageItem',
              title: 'Coverage'
            },
            {
              type: 'frontPageStaticContent',
              title: 'Front page static content'
            }
          ]
        },
        {
          name: 'position',
          type: 'number',
          title: 'Position',
          required: true
        }
      ]
    },
    {
      name: 'promoterModifier',
      type: 'object',
      fields: [
        {
          name: 'contentModified',
          type: 'reference',
          title: 'Content to be promoted',
          required: true,
          to: [
            {
              type: 'lecture',
              title: 'Lecture'
            },
            {
              type: 'publication',
              title: 'Publication'
            },
            {
              type: 'project',
              title: 'Project'
            },
            {
              type: 'person',
              title: 'Person'
            },
            {
              type: 'newsItem',
              title: 'News item'
            },
            {
              type: 'pressCoverageItem',
              title: 'Coverage'
            }
          ]
        },
        {
          type: 'powerCurve',
          name: 'powerCurve',
          title: 'Power Curve'
        },
        {
          type: 'timer',
          name: 'timer',
          title: 'Timer'
        }
      ]
    },
    {
      name: 'repressorModifier',
      type: 'object',
      fields: [
        {
          name: 'contentModified',
          type: 'reference',
          title: 'Repressed content',
          required: true,
          to: [
            {
              type: 'lecture',
              title: 'Lecture'
            },
            {
              type: 'publication',
              title: 'Publication'
            },
            {
              type: 'project',
              title: 'Project'
            },
            {
              type: 'person',
              title: 'Person'
            },
            {
              type: 'newsItem',
              title: 'News item'
            },
            {
              type: 'pressCoverageItem',
              title: 'Coverage'
            }
          ]
        },
        {
          type: 'powerCurve',
          name: 'powerCurve',
          title: 'Power Curve'
        },
        {
          type: 'timer',
          name: 'timer',
          title: 'Timer'
        }
      ]
    },
    {
      name: 'powerCurve',
      type: 'object',
      fields: [
        {
          name: 'force',
          type: 'string',
          title: 'Force',
          required: true
        },
        {
          name: 'halflife',
          type: 'string',
          title: 'Halflife',
          required: true
        }
      ]
    },
    {
      name: 'timer',
      type: 'object',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          title: 'Start date',
          required: false
        }
      ]
    },
    {
      name: 'contactDetails',
      type: 'object',
      fields: [
        {
          name: 'departmentName',
          type: 'string',
          title: 'Department name',
          required: false
        },
        {
          name: 'territory',
          type: 'string',
          title: 'Territory',
          required: false
        },
        {
          name: 'contactPerson',
          type: 'string',
          title: 'Contact person',
          required: false
        },
        {
          name: 'portrait',
          type: 'reference',
          title: 'Portrait',
          required: false,
          to: [
            {
              type: 'image',
              title: 'Image'
            }
          ]
        },
        {
          name: 'bio',
          type: 'string',
          title: 'Short bio',
          required: false
        },
        {
          name: 'email',
          type: 'string',
          title: 'E-mail',
          required: false
        }
      ]
    },
    {
      name: 'dateTime',
      type: 'object',
      fields: [
        {
          name: 'date',
          type: 'string'
        },
        {
          name: 'time',
          type: 'string'
        }
      ]
    }
  ]
}
