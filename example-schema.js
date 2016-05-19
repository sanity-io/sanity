export default {
  types: {

    federation: {
      type: 'object',
      fields: {
        name: {
          type: 'string'
        }
      }
    },

    venue: {
      type: 'object',
      fields: {
        title: {
          type: 'string',
          title: 'Title'
        },
        federation: {
          type: 'reference',
          to: {type: 'federation'}
        },
        fieldsOfInterest: {
          title: 'Fields of interest',
          type: 'array',
          of: [{type: 'string'}]
        },
        homePageUrl: {
          type: 'url',
        },
        logo: {
          type: 'image',
        },
        email: {
          type: 'email',
          title: 'Contact email',
          placeholder: 'post@journal-of-snah.org'
        },
        phone: {
          type: 'telephone',
          placeholder: '+47 55512345'
        }
      }
    },

    track: {
      type: 'object',
      fields: {
        name: {
          type: 'string',
          title: 'Name'
        },
        venue: {
          type: 'reference',
          to: {type: 'venue'}
        },
        purpose: {
          type: 'string',
          title: 'Purpose'
        },
        subFieldOfInterest: {
          type: 'string',
          title: 'Sub-field of interest'
        },
        reviewModel: {
          type: 'reviewModel'
        },
        reviewPolicy: {
          type: 'text',
          title: 'Review policy'
        },
        submissionPolicy: {
          type: 'text',
          title: 'Submission policy'
        },
        editorialPolicy: {
          type: 'text',
          title: 'Editorial policy'
        },
        requriedSlots: {
          type: 'array',
          of: [{type: 'reference', to: {type: 'slot'}}]
        },
        availableSlots: {
          type: 'array',
          of: [{type: 'reference', to: {type: 'slot'}}]
        },
        stages: {
          type: 'array',
          of: [
            {type: 'reference', to: {type: 'stageEstablishing'}},
            {type: 'reference', to: {type: 'stageConsideration'}},
            {type: 'reference', to: {type: 'stageDevelopment'}},
            {type: 'reference', to: {type: 'stageReview'}},
            {type: 'reference', to: {type: 'stageProofing'}},
            {type: 'reference', to: {type: 'stageProduction'}},
            {type: 'reference', to: {type: 'stageCompleted'}}
          ]
        }
      }
    },

    issue: {
      type: 'object',
      fields: {
        venue: {
          type: 'reference',
          to: {type: 'venue'}
        },
        number: {
          type: 'number',
          title: 'Issue number'
        },
        volume: {
          type: 'string',
          title: 'Volume'
        },
        publishAt: {
          type: 'date',
          title: 'Publish at'
        }
      }
    },

    section: {
      type: 'object',
      fields: {
        name: {
          type: 'string',
          title: 'Name'
        },
        order: {
          type: 'number',
          title: 'Order'
        },
        issue: {
          type: 'reference',
          to: {type: 'issue'}
        }
      }
    },

    article: {
      type: 'object',
      fields: {
        title: {
          type: 'string',
          title: 'Title'
        },
        track: {
          type: 'reference',
          to: {type: 'track'}
        },
        section: {
          type: 'reference',
          to: {type: 'section'}
        },
        state: {
          type: 'any',
          of: [
            {type: 'string', value: 'establishing'},
            {type: 'string', value: 'consideration'},
            {type: 'string', value: 'development'},
            {type: 'string', value: 'review'},
            {type: 'string', value: 'proofing'},
            {type: 'string', value: 'production'},
            {type: 'string', value: 'completed'},
            {type: 'string', value: 'rejected'},
            {type: 'string', value: 'withdrawn'},
            {type: 'string', value: 'archived'},
            {type: 'string', value: 'retracted'}
          ],
          title: 'State'
        },
        assets: {
          type: 'array',
          of: [{type: 'asset'}]
        },
      }
    },

    asset: {
      type: 'object',
      fields: {
        contentType: {
          type: 'string',
          title: 'Content Type'
        },
        content: {
          type: 'any',
          of: [
            {type: 'string'},
            {type: 'text'},
            {type: 'url'},
            {type: 'image'},
            {type: 'audio'},
            {type: 'video'}
          ]
        },
        nativeAsset: {
          type: 'boolean'
        },
        slot: {
          type: 'reference',
          to: {type: 'slot'}
        }
      }
    },

    role: {
      type: 'object',
      fields: {
        name: {
          title: 'Role name',
          description: 'Hierarchy',
          type: 'any',
          of: [
            {title: 'Admin', type: 'string'},
            {title: 'Managing Editor', type: 'string'},
            {title: 'Copy-Editor', type: 'string'},
            {title: 'Author', type: 'string'},
            {title: 'Referee', type: 'string'},
            {title: 'Reader', type: 'string'},
            {title: 'Visitor', type: 'string'}
          ]
        },
        scope: {
          title: 'Role scope',
          description: 'Level of specificity',
          type: 'any',
          of: [
            {title: 'Federation', type: 'string'},
            {title: 'Venue', type: 'string'},
            {title: 'Track', type: 'string'},
            {title: 'Article', type: 'string'}
          ]
        },
        scopeTarget: {
          title: 'Scope target',
          description: 'Which specific thing does the role apply to?',
          type: 'any',
          of: [
            {type: 'reference', to: {type: 'federation'}},
            {type: 'reference', to: {type: 'venue'}},
            {type: 'reference', to: {type: 'track'}},
            {type: 'reference', to: {type: 'article'}}
          ]
        },
        user: {
          title: 'User',
          description: 'Which user has this role?',
          type: 'reference',
          to: {type: 'user'}
        }
      }
    },

    slot: {
      type: 'object',
      fields: {
        name: {
          type: 'string'
        },
        acceptedContentTypes: {
          type: 'array',
          of: [
            {type: 'string'},
            {type: 'text'},
            {type: 'url'},
            {type: 'image'},
            {type: 'audio'},
            {type: 'video'}
          ]
        }
      }
    },

    stageEstablishing: {
      type: 'object',
      fields: {
        name: {
          type: 'string',
          title: 'Establishing'
        }
      }
    },

    stageConsideration: {
      type: 'object',
      fields: {
        name: {
          type: 'string',
          title: 'Consideration'
        }
      }
    },

    stageDevelopment: {
      type: 'object',
      fields: {
        name: {
          type: 'string',
          title: 'Development'
        }
      }
    },

    stageReview: {
      type: 'object',
      fields: {
        name: {
          type: 'string',
          title: 'Review'
        }
      }
    },

    stageProofing: {
      type: 'object',
      fields: {
        name: {
          type: 'string',
          title: 'Proofing'
        }
      }
    },

    stageProduction: {
      type: 'object',
      fields: {
        name: {
          type: 'string',
          title: 'Production'
        }
      }
    },

    stageCompleted: {
      type: 'object',
      fields: {
        name: {
          type: 'string',
          title: 'Completed'
        }
      }
    },

    image: {
      type: 'object',
      fields: {
        imageLocation: {
          type: 'string'
        }
      }
    },

    audio: {
      type: 'object',
      fields: {
        audioLocation: {
          type: 'string'
        }
      }
    },

    video: {
      type: 'object',
      fields: {
        videoLocation: {
          type: 'string'
        }
      }
    },

    reviewModel: {
      type: 'object',
      fields: {
        name: {
          type: 'string'
        }
      }
    },

    user: {
      type: 'object',
      fields: {
        name: {
          type: 'string'
        },
        email: {
          type: 'email'
        }
      }
    }
  }
}
