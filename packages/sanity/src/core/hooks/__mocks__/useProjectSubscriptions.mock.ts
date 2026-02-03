import {type Mock, type Mocked} from 'vitest'

import {useProjectSubscriptions} from '../useProjectSubscriptions'

export const useProjectSubscriptionsMockReturn: Mocked<ReturnType<typeof useProjectSubscriptions>> =
  {
    error: null,
    isLoading: false,
    projectSubscriptions: {
      id: 'sub_123',
      projectId: 'proj_456',
      productType: 'premium',
      productId: 'prod_789',
      customerId: 'cust_101',
      planId: 'plan_202',
      previousSubscriptionId: null,
      status: 'active',
      startedAt: '2024-02-01T00:00:00Z',
      startedBy: 'user_303',
      endedAt: null,
      endedBy: null,
      trialUntil: '2024-02-15T00:00:00Z',
      plan: {
        id: 'plan_202',
        planTypeId: 'type_404',
        variantId: null,
        productType: 'premium',
        variantOfPlanId: null,
        name: 'Premium Plan',
        variantName: null,
        price: 49.99,
        trialDays: 14,
        createdAt: '2024-01-01T00:00:00Z',
        supersededAt: null,
        default: false,
        public: true,
        orderable: true,
        isBasePlan: true,
        pricingModel: 'flat-rate',
        resources: {},
        featureTypes: {},
      },
      resources: {},
      featureTypes: {
        retention: {
          features: [
            {
              attributes: {
                maxRetentionDays: 123,
              },
              id: '',
              variantId: null,
              name: '',
              price: 0,
              included: false,
              custom: false,
              startedAt: null,
              startedBy: null,
              endedAt: null,
              endedBy: null,
            },
          ],
          id: '',
          name: '',
          singular: false,
        },
      },
    },
  }

export const mockUseProjectSubscriptions = useProjectSubscriptions as Mock<
  typeof useProjectSubscriptions
>
