export type TermsBlock =
  | { type: 'p'; text: string }
  | { type: 'sub'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'numbered'; items: string[] };

export type TermsSection = {
  title: string;
  blocks: TermsBlock[];
};

export const TERMS_LAST_UPDATED = 'September 2026';

export const TERMS_INTRO =
  'Hemera (“Hemera”, “the Company”, “we”, “us”, or “our”) operates an on-demand lifestyle platform offering multiple services through its mobile application and digital platforms.';

export const TERMS_CLOSING =
  'By creating an account, placing an order, activating a subscription, funding an E-Plan, or using any Hemera service, you acknowledge that you have read, understood, and agreed to these Terms of Service.';

export const termsSections: TermsSection[] = [
  {
    title: '1. THE SERVICE',
    blocks: [
      { type: 'p', text: 'Hemera provides access to:' },
      {
        type: 'list',
        items: [
          'Laundry and garment-care services.',
          'Cooked meals and food items.',
          'Soft drinks and bottled water.',
          'E-Plan automated meal subscription services.',
          'Other lifestyle services or features that may be introduced through the platform.',
        ],
      },
      {
        type: 'p',
        text: 'Hemera coordinates the ordering, scheduling, payment, pickup, preparation, and delivery of applicable services through its platform and service partners.',
      },
      {
        type: 'p',
        text: 'By accessing or using Hemera, creating an account, placing an order, purchasing a subscription, or using any service available through the platform, you agree to be bound by these Terms of Service.',
      },
    ],
  },
  {
    title: '2. SERVICE OPTIONS & SUBSCRIPTION STRUCTURE',
    blocks: [
      { type: 'sub', text: '2.1 Laundry & Garment Care' },
      { type: 'p', text: 'Hemera provides laundry and garment-care services through its platform.' },
      { type: 'p', text: 'Depending on the service selected, customers may request:' },
      {
        type: 'list',
        items: ['Laundry pickup.', 'Cleaning and garment care.', 'Processing and handling.', 'Return delivery.'],
      },
      {
        type: 'p',
        text: 'Applicable service fees, item limits, turnaround times, and subscription allowances will be displayed in the app.',
      },

      { type: 'sub', text: '2.2 Food & Beverage Services' },
      {
        type: 'p',
        text: 'Hemera offers cooked meals and selected food and beverage products through the app.',
      },
      { type: 'p', text: 'Available products may include:' },
      {
        type: 'list',
        items: [
          'Cooked meals.',
          'Breakfast, lunch, and dinner options.',
          'Meal combinations or curated meals.',
          'Soft drinks.',
          'Bottled water.',
          'Other non-alcoholic beverages or food products made available through the platform.',
        ],
      },
      {
        type: 'p',
        text: 'Hemera does not sell or facilitate the sale of alcoholic beverages through the platform.',
      },
      {
        type: 'p',
        text: 'Product availability, pricing, meal options, serving sizes, and delivery estimates may vary depending on location, availability, and applicable service conditions.',
      },

      { type: 'sub', text: '2.3 Subscription Tiers' },
      { type: 'p', text: 'Hemera may offer subscription packages across four (4) core tiers:' },
      { type: 'list', items: ['Basic', 'Standard', 'Premium', 'VIP'] },
      { type: 'p', text: 'Users may select an available subscription duration at checkout, including:' },
      { type: 'list', items: ['1 Month', '3 Months', '6 Months', '12 Months'] },
      {
        type: 'p',
        text: 'The benefits, service allowances, quotas, and access associated with each subscription are determined by the applicable tier and duration purchased.',
      },
      {
        type: 'p',
        text: 'A subscription becomes active upon successful activation and remains valid for the exact duration purchased. It expires automatically at the end of the applicable subscription period unless renewed.',
      },

      { type: 'sub', text: '2.4 One-Time / Pay-As-You-Go Services' },
      {
        type: 'p',
        text: 'Users may access eligible Hemera services without maintaining an active subscription.',
      },
      {
        type: 'p',
        text: 'One-time orders may include laundry services, individual meal orders, beverages, or other available products and services.',
      },
      { type: 'p', text: 'Applicable charges may include:' },
      {
        type: 'list',
        items: [
          'Product or meal price.',
          'Laundry service charges.',
          'Service fees.',
          'Dispatch or delivery fees.',
          'Other applicable charges disclosed before payment.',
        ],
      },
      { type: 'p', text: 'The applicable total will be displayed to the user before order confirmation.' },

      { type: 'sub', text: '2.5 Non-Rollover Policy' },
      {
        type: 'p',
        text: 'Unless expressly stated otherwise in the applicable plan, unused subscription benefits, service allowances, quotas, credits, or other allocated benefits do not roll over into a subsequent subscription period.',
      },
      { type: 'p', text: 'Unused benefits expire when the applicable period ends.' },
    ],
  },
  {
    title: '3. E-PLAN — AUTOMATED MEAL SUBSCRIPTION',
    blocks: [
      { type: 'sub', text: '3.1 What Is E-Plan?' },
      {
        type: 'p',
        text: 'E-Plan is Hemera’s automated meal subscription feature designed to simplify regular meal ordering.',
      },
      {
        type: 'p',
        text: 'Instead of manually placing a new meal order every day, users can create an E-Plan that allows Hemera to coordinate scheduled meal deliveries according to the user\'s selected budget, duration, meal preferences, and schedule.',
      },

      { type: 'sub', text: '3.2 E-Plan Setup' },
      { type: 'p', text: 'When creating an E-Plan, users may be required to select or provide:' },
      {
        type: 'list',
        items: [
          'Meal budget.',
          'Plan duration.',
          'Preferred meal period, such as lunch or dinner.',
          'Delivery address.',
          'Dietary preferences.',
          'Dietary restrictions.',
          'Allergen information.',
          'Other meal preferences or instructions requested through the app.',
        ],
      },
      {
        type: 'p',
        text: 'Available E-Plan durations and configurations are determined by the options displayed in the app at the time of purchase.',
      },

      { type: 'sub', text: '3.3 E-Plan Budget' },
      {
        type: 'p',
        text: 'Users must fund their E-Plan according to the amount required for the selected configuration.',
      },
      {
        type: 'p',
        text: 'The amount funded for an E-Plan is allocated specifically toward the scheduled meals and applicable services under that plan.',
      },
      {
        type: 'p',
        text: 'Where applicable, delivery charges, service charges, or other applicable fees will be disclosed before activation.',
      },

      { type: 'sub', text: '3.4 E-Plan Dedicated Balance' },
      {
        type: 'p',
        text: 'Funds allocated to an active E-Plan are designated for fulfillment of that E-Plan.',
      },
      {
        type: 'p',
        text: 'The E-Plan balance is not intended to function as a general-purpose wallet balance and may only be used for eligible E-Plan transactions during the active plan period.',
      },
      {
        type: 'p',
        text: 'Users may not use an E-Plan balance to purchase unrelated products or services unless the app expressly permits such use.',
      },

      { type: 'sub', text: '3.5 Automated Meal Fulfillment' },
      {
        type: 'p',
        text: 'Once an E-Plan is activated, Hemera coordinates meal fulfillment according to the user\'s selected schedule and preferences.',
      },
      { type: 'p', text: 'Meal selections may be curated based on:' },
      {
        type: 'list',
        items: [
          'Available meals.',
          'User preferences.',
          'Dietary restrictions.',
          'Allergen information provided by the user.',
          'Available meal options.',
          'The user\'s selected budget and plan configuration.',
        ],
      },
      {
        type: 'p',
        text: 'Where an E-Plan provides for curated or surprise meals, the exact meal may not be selected by the user in advance.',
      },

      { type: 'sub', text: '3.6 Dietary Information' },
      {
        type: 'p',
        text: 'Users are responsible for providing accurate dietary restrictions, allergies, intolerances, and other relevant meal information when creating or updating an E-Plan.',
      },
      {
        type: 'p',
        text: 'Hemera will use the information provided to coordinate suitable meal options where reasonably possible.',
      },
      {
        type: 'p',
        text: 'However, users acknowledge that food preparation environments may involve shared ingredients, equipment, or facilities, and Hemera cannot guarantee the complete absence of allergens or cross-contamination.',
      },
      {
        type: 'p',
        text: 'Users with serious food allergies or medical dietary requirements should exercise appropriate caution before consuming any meal.',
      },

      { type: 'sub', text: '3.7 E-Plan Changes' },
      {
        type: 'p',
        text: 'Subject to the options available within the app, users may be permitted to modify certain E-Plan settings before the relevant meal is processed or dispatched.',
      },
      { type: 'p', text: 'Changes may include:' },
      {
        type: 'list',
        items: [
          'Delivery schedule.',
          'Meal period.',
          'Delivery address.',
          'Dietary preferences.',
          'Other available preferences.',
        ],
      },
      {
        type: 'p',
        text: 'Certain changes may not be possible after a meal has entered preparation or dispatch.',
      },

      { type: 'sub', text: '3.8 E-Plan Cancellation' },
      {
        type: 'p',
        text: 'An active E-Plan may be cancelled subject to the cancellation rules displayed in the app and the stage of fulfillment.',
      },
      {
        type: 'p',
        text: 'Where a meal has not yet entered preparation or dispatch, cancellation may be permitted subject to the applicable refund rules.',
      },
      {
        type: 'p',
        text: 'Where a scheduled meal has already entered preparation, processing, or dispatch, the corresponding amount may become non-refundable.',
      },
      {
        type: 'p',
        text: 'Any remaining eligible balance after cancellation will be handled according to the applicable refund policy displayed in the app.',
      },

      { type: 'sub', text: '3.9 E-Plan Expiration' },
      { type: 'p', text: 'An E-Plan automatically ends when its selected duration expires.' },
      {
        type: 'p',
        text: 'Any unused benefits or allowances expire at the end of the plan unless Hemera expressly provides otherwise.',
      },
    ],
  },
  {
    title: '4. PICKUP, DELIVERY & ORDER PROTOCOL',
    blocks: [
      { type: 'sub', text: '4.1 Third-Party Recipients and Locations' },
      {
        type: 'p',
        text: 'Users may place orders for delivery or pickup by another person or to an alternative location.',
      },
      { type: 'p', text: 'Users must provide accurate:' },
      {
        type: 'list',
        items: [
          'Recipient name.',
          'Recipient phone number.',
          'Delivery address.',
          'Pickup address, where applicable.',
          'Other information reasonably required for successful fulfillment.',
        ],
      },
      {
        type: 'p',
        text: 'Hemera is not responsible for failed delivery, delays, or loss resulting from inaccurate or incomplete information supplied by the user.',
      },

      { type: 'sub', text: '4.2 Delivery and Dispatch' },
      {
        type: 'p',
        text: 'Hemera may use independent dispatch providers or other logistics providers to facilitate pickup and delivery.',
      },
      { type: 'p', text: 'Delivery times may vary based on:' },
      {
        type: 'list',
        items: [
          'Traffic.',
          'Weather.',
          'Distance.',
          'Dispatch availability.',
          'Vendor or meal preparation time.',
          'Order volume.',
          'Other operational circumstances.',
        ],
      },

      { type: 'sub', text: '4.3 Force Majeure' },
      {
        type: 'p',
        text: 'Hemera shall not be responsible for delays, interruptions, or failure to perform caused by circumstances beyond its reasonable control, including but not limited to:',
      },
      {
        type: 'list',
        items: [
          'Severe weather.',
          'Flooding.',
          'Fuel scarcity.',
          'Power outages or grid failures.',
          'Traffic gridlock.',
          'Civil unrest.',
          'Government restrictions.',
          'Road closures.',
          'Telecommunications or payment infrastructure failures.',
          'Other events beyond reasonable operational control.',
        ],
      },

      { type: 'sub', text: '4.4 Delivery Fees' },
      { type: 'p', text: 'Delivery or dispatch charges may:' },
      {
        type: 'list',
        items: [
          'Be included within an applicable subscription or E-Plan allocation; or',
          'Be charged separately for one-time orders.',
        ],
      },
      { type: 'p', text: 'Applicable charges will be displayed before order confirmation.' },
    ],
  },
  {
    title: '5. FOOD & BEVERAGE ORDERS',
    blocks: [
      { type: 'sub', text: '5.1 Meal Orders' },
      { type: 'p', text: 'Users may purchase cooked meals through the Hemera app.' },
      {
        type: 'p',
        text: 'Meal availability, ingredients, portion sizes, prices, and available options may vary.',
      },
      {
        type: 'p',
        text: 'Hemera may change or discontinue individual meal options where necessary due to availability or operational requirements.',
      },

      { type: 'sub', text: '5.2 Food Quality and Order Accuracy' },
      { type: 'p', text: 'Users should inspect their order promptly after delivery.' },
      { type: 'p', text: 'Complaints concerning:' },
      {
        type: 'list',
        items: [
          'Missing items.',
          'Incorrect meals.',
          'Incorrect quantities.',
          'Damaged packaging.',
          'Significant quality issues.',
        ],
      },
      {
        type: 'p',
        text: 'must be reported through the app within 30 minutes of delivery, together with clear photographic evidence where reasonably applicable.',
      },
      {
        type: 'p',
        text: 'Claims submitted outside this period may not be accepted due to the perishable nature of food.',
      },

      { type: 'sub', text: '5.3 Dietary Restrictions and Allergens' },
      {
        type: 'p',
        text: 'Users must provide accurate dietary and allergen information when placing an order or creating an E-Plan.',
      },
      {
        type: 'p',
        text: 'Hemera will take reasonable steps to communicate applicable dietary information for fulfillment.',
      },
      {
        type: 'p',
        text: 'However, users acknowledge that meals may be prepared in environments where different ingredients are handled, and Hemera does not guarantee that cross-contamination will never occur.',
      },

      { type: 'sub', text: '5.4 Beverages' },
      {
        type: 'p',
        text: 'Hemera may offer soft drinks, bottled water, and other non-alcoholic beverages through the platform.',
      },
      { type: 'p', text: 'Alcoholic beverages are not sold or offered through Hemera.' },
    ],
  },
  {
    title: '6. LAUNDRY ITEM COUNT & VERIFICATION',
    blocks: [
      { type: 'sub', text: '6.1 Final Item Count' },
      {
        type: 'p',
        text: 'For laundry orders, the official item count is determined during verification by the assigned laundry service provider when the laundry bag is opened.',
      },
      {
        type: 'p',
        text: 'The verified count will serve as the basis for applicable charges, subscription usage, or service allocation.',
      },

      { type: 'sub', text: '6.2 More Items Than Declared' },
      {
        type: 'p',
        text: 'Where more items are found than the quantity declared by the customer:',
      },
      {
        type: 'list',
        items: [
          'Additional charges may apply; or',
          'The applicable subscription allowance may be adjusted.',
        ],
      },
      {
        type: 'p',
        text: 'The customer may be notified before additional processing where confirmation is required.',
      },

      { type: 'sub', text: '6.3 Fewer Items Than Declared' },
      {
        type: 'p',
        text: 'Where fewer items are found than declared, the order may be paused while Hemera verifies the discrepancy.',
      },
      {
        type: 'p',
        text: 'Hemera may provide supporting evidence, including photographs, and request customer confirmation before processing continues.',
      },

      { type: 'sub', text: '6.4 Pre-Existing Conditions' },
      {
        type: 'p',
        text: 'Hemera is not responsible for damage caused by pre-existing conditions, including:',
      },
      {
        type: 'list',
        items: [
          'Weak or deteriorated fabric.',
          'Existing tears.',
          'Existing stains or defects.',
          'Color bleeding.',
          'Loose buttons.',
          'Broken zippers.',
          'Existing structural damage.',
        ],
      },
      {
        type: 'p',
        text: 'Laundry service providers may document the condition of items before processing.',
      },
    ],
  },
  {
    title: '7. PROHIBITED ITEMS',
    blocks: [
      { type: 'p', text: 'Users must not submit, transport, or request Hemera services for:' },
      {
        type: 'list',
        items: [
          'Hazardous or toxic materials.',
          'Illegal materials or substances.',
          'Items requiring specialized industrial treatment.',
          'Extremely high-value or irreplaceable items.',
          'Sentimental items where loss would cause disproportionate personal impact.',
          'Money or cash.',
          'Jewelry.',
          'Electronics.',
          'Other personal valuables.',
        ],
      },
      {
        type: 'p',
        text: 'Users are responsible for checking all garment pockets before handing laundry to Hemera.',
      },
      {
        type: 'p',
        text: 'Hemera is not responsible for valuables left inside garments or for prohibited items submitted without disclosure.',
      },
    ],
  },
  {
    title: '8. CANCELLATIONS',
    blocks: [
      { type: 'sub', text: '8.1 General Orders' },
      {
        type: 'p',
        text: 'An order may generally be cancelled before preparation, processing, or dispatch begins without a cancellation charge.',
      },
      {
        type: 'p',
        text: 'Once preparation, processing, pickup, or dispatch has commenced, cancellation may result in applicable charges.',
      },
      { type: 'p', text: 'Orders may not be cancellable once fulfillment has been completed.' },

      { type: 'sub', text: '8.2 Food Orders' },
      {
        type: 'p',
        text: 'Because cooked meals are perishable and may be prepared specifically for a customer, cancellation rights may be limited once meal preparation has commenced.',
      },
      {
        type: 'p',
        text: 'Any applicable cancellation charge or refund amount will be displayed or communicated according to the stage of the order.',
      },

      { type: 'sub', text: '8.3 Laundry Orders' },
      {
        type: 'p',
        text: 'Laundry cancellation may be restricted once pickup, processing, or cleaning has commenced.',
      },
      {
        type: 'p',
        text: 'Applicable refund or cancellation treatment depends on the stage of fulfillment.',
      },

      { type: 'sub', text: '8.4 E-Plan Cancellation' },
      {
        type: 'p',
        text: 'E-Plan cancellation is subject to Section 3 of these Terms and the applicable cancellation information presented during E-Plan activation.',
      },
      {
        type: 'p',
        text: 'Amounts allocated to meals that have already entered preparation or dispatch may not be refundable.',
      },
    ],
  },
  {
    title: '9. REFUNDS',
    blocks: [
      { type: 'sub', text: '9.1 Subscription Refunds' },
      {
        type: 'p',
        text: 'Subscription fees for 1-, 3-, 6-, or 12-month plans are generally non-refundable once the customer has used a subscription benefit or service during the applicable subscription period.',
      },
      {
        type: 'p',
        text: 'Any exception will be determined by Hemera\'s applicable refund policy or where required by law.',
      },

      { type: 'sub', text: '9.2 One-Time Orders' },
      { type: 'p', text: 'For eligible one-time orders:' },
      {
        type: 'list',
        items: [
          'Full refunds may be available where cancellation occurs before preparation, processing, or dispatch.',
          'Partial refunds may apply after fulfillment has commenced.',
          'No refund may apply after an order has been completed.',
        ],
      },

      { type: 'sub', text: '9.3 E-Plan Refunds' },
      { type: 'p', text: 'E-Plan refunds will depend on:' },
      {
        type: 'list',
        items: [
          'Whether the plan has commenced.',
          'Whether meals have already been scheduled or prepared.',
          'Whether any meals have been delivered.',
          'Applicable service or delivery charges.',
          'Any remaining eligible balance.',
        ],
      },
      {
        type: 'p',
        text: 'Where a refund is approved, the refundable amount will be processed according to the applicable payment method.',
      },

      { type: 'sub', text: '9.4 Refund Processing' },
      {
        type: 'p',
        text: 'Approved refunds are generally processed within 24–72 hours, subject to the applicable payment provider and banking system.',
      },
    ],
  },
  {
    title: '10. RE-CLEAN & SERVICE CLAIMS',
    blocks: [
      { type: 'sub', text: '10.1 Laundry Re-Clean' },
      {
        type: 'p',
        text: 'If a customer is dissatisfied with the cleaning quality of a laundry order, the issue must be reported within 24 hours of delivery.',
      },
      {
        type: 'p',
        text: 'Following review, Hemera may provide a one-time re-clean at no additional service charge where the complaint is validated.',
      },

      { type: 'sub', text: '10.2 Missing or Damaged Laundry' },
      {
        type: 'p',
        text: 'Claims concerning missing or damaged laundry items must be reported within 24–48 hours of delivery, together with clear evidence where applicable.',
      },
      {
        type: 'p',
        text: 'Claims submitted outside the applicable period may not be accepted.',
      },
    ],
  },
  {
    title: '11. SERVICE TIMELINES',
    blocks: [
      { type: 'sub', text: '11.1 Laundry' },
      {
        type: 'p',
        text: 'Standard laundry turnaround is generally 24–48 hours, depending on:',
      },
      {
        type: 'list',
        items: [
          'Garment type.',
          'Order volume.',
          'Cleaning requirements.',
          'Location.',
          'Operational circumstances.',
        ],
      },
      { type: 'p', text: 'Certain items or circumstances may require additional time.' },

      { type: 'sub', text: '11.2 Food Delivery' },
      {
        type: 'p',
        text: 'Food delivery ETAs are displayed dynamically within the app and may depend on:',
      },
      {
        type: 'list',
        items: [
          'Meal preparation time.',
          'Order volume.',
          'Dispatch availability.',
          'Traffic.',
          'Distance.',
          'Weather and other operational conditions.',
        ],
      },
      {
        type: 'p',
        text: 'ETAs are estimates and do not constitute guaranteed delivery times.',
      },

      { type: 'sub', text: '11.3 E-Plan Delivery' },
      {
        type: 'p',
        text: 'E-Plan meals are scheduled according to the active plan configuration.',
      },
      {
        type: 'p',
        text: 'Actual delivery times may be affected by meal preparation, dispatch availability, traffic, weather, and other operational circumstances.',
      },
    ],
  },
  {
    title: '12. LIMITATION OF LIABILITY',
    blocks: [
      { type: 'sub', text: '12.1 Laundry' },
      {
        type: 'p',
        text: 'Subject to applicable law, Hemera\'s liability for a lost or damaged laundry item is limited to the lesser of:',
      },
      {
        type: 'numbered',
        items: [
          'Three (3) times the allocated cleaning/service cost of the affected item; or',
          '₦25,000 per claim.',
        ],
      },
      {
        type: 'p',
        text: 'This limitation applies regardless of the item\'s original purchase price or sentimental value, except where such limitation is prohibited by applicable law.',
      },

      { type: 'sub', text: '12.2 Food and Beverage' },
      {
        type: 'p',
        text: 'Subject to applicable law, Hemera\'s liability for an eligible food or beverage order issue is limited to the total transaction value of the affected order.',
      },

      { type: 'sub', text: '12.3 No Liability for Indirect Loss' },
      {
        type: 'p',
        text: 'To the extent permitted by applicable law, Hemera shall not be liable for indirect, incidental, consequential, special, or purely sentimental losses arising from the use of its services.',
      },
    ],
  },
  {
    title: '13. USER RESPONSIBILITIES',
    blocks: [
      { type: 'p', text: 'Users agree to:' },
      {
        type: 'list',
        items: [
          'Provide accurate account information.',
          'Provide accurate delivery and pickup addresses.',
          'Provide correct recipient information.',
          'Provide accurate dietary and allergen information.',
          'Ensure laundry items are properly prepared for collection.',
          'Remove valuables from garments before laundry submission.',
          'Be reasonably available for scheduled pickup or delivery.',
          'Inspect delivered food and laundry within the applicable claim periods.',
          'Comply with these Terms and applicable laws.',
          'Maintain the confidentiality of their account credentials.',
        ],
      },
      {
        type: 'p',
        text: 'Users are responsible for activity conducted through their account unless unauthorized use is reported to Hemera promptly.',
      },
    ],
  },
  {
    title: '14. ACCOUNT SUSPENSION OR TERMINATION',
    blocks: [
      { type: 'p', text: 'Hemera may suspend, restrict, or terminate an account where a user:' },
      {
        type: 'list',
        items: [
          'Violates these Terms.',
          'Provides false or misleading information.',
          'Engages in fraudulent activity.',
          'Attempts to abuse refund or cancellation systems.',
          'Uses the platform for prohibited purposes.',
          'Engages in conduct that may compromise the security or operation of the platform.',
        ],
      },
      {
        type: 'p',
        text: 'Where appropriate, Hemera may investigate suspected misuse before taking action.',
      },
    ],
  },
  {
    title: '15. DATA PRIVACY & COMPLIANCE',
    blocks: [
      {
        type: 'p',
        text: 'Hemera may collect and process information necessary to provide its services, including:',
      },
      {
        type: 'list',
        items: [
          'Account information.',
          'Contact information.',
          'Delivery addresses.',
          'Location information.',
          'Order history.',
          'Transaction records.',
          'Payment information.',
          'Service preferences.',
          'Dietary preferences and instructions submitted by users.',
        ],
      },
      {
        type: 'p',
        text: 'Personal data is handled in accordance with the Nigeria Data Protection Act (NDPA) and Hemera\'s applicable Privacy Policy.',
      },
      {
        type: 'p',
        text: 'Users should review Hemera\'s Privacy Policy for further information concerning data collection, processing, storage, retention, and user rights.',
      },
    ],
  },
  {
    title: '16. INTELLECTUAL PROPERTY',
    blocks: [
      {
        type: 'p',
        text: 'All content and materials available through Hemera, including its software, branding, logos, designs, graphics, text, interfaces, and other platform materials, are owned by or licensed to Hemera and are protected by applicable intellectual property laws.',
      },
      {
        type: 'p',
        text: 'Users may not reproduce, modify, distribute, reverse engineer, or commercially exploit Hemera\'s platform or materials without prior authorization.',
      },
    ],
  },
  {
    title: '17. MODIFICATIONS TO THE SERVICE',
    blocks: [
      {
        type: 'p',
        text: 'Hemera may modify, suspend, discontinue, or introduce services, features, products, subscription tiers, E-Plan configurations, pricing structures, or other aspects of the platform from time to time.',
      },
      {
        type: 'p',
        text: 'Where changes materially affect an active service or subscription, Hemera may provide notice through the app or another appropriate communication channel.',
      },
    ],
  },
  {
    title: '18. TERMS UPDATES',
    blocks: [
      { type: 'p', text: 'Hemera may update these Terms from time to time.' },
      {
        type: 'p',
        text: 'The updated version will be made available through the Hemera platform and will become effective on the stated effective date.',
      },
      {
        type: 'p',
        text: 'Continued use of Hemera after the effective date of an updated Terms of Service constitutes acceptance of the updated Terms, subject to applicable law.',
      },
    ],
  },
  {
    title: '19. GOVERNING LAW & DISPUTE RESOLUTION',
    blocks: [
      { type: 'p', text: 'These Terms are governed by the laws of the Federal Republic of Nigeria.' },
      {
        type: 'p',
        text: 'Where a dispute arises, the parties shall first attempt to resolve the matter amicably.',
      },
      {
        type: 'p',
        text: 'Where the dispute cannot be resolved amicably, the parties may pursue mediation in Lagos or Abuja, subject to applicable law and the applicable dispute-resolution procedure.',
      },
      {
        type: 'p',
        text: 'Nothing in these Terms prevents a user from exercising any rights or remedies that cannot lawfully be excluded or restricted.',
      },
    ],
  },
  {
    title: '20. CONTACT',
    blocks: [
      {
        type: 'p',
        text: 'For questions, complaints, service requests, or support relating to these Terms or Hemera services, users may contact Hemera through the support channels provided within the Hemera application.',
      },
    ],
  },
];