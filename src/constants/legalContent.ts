export type LegalBlock =
  | { type: 'p'; text: string }
  | { type: 'sub'; text: string }
  | { type: 'list'; items: string[] };

export type LegalSection = {
  title: string;
  blocks: LegalBlock[];
};

export type LegalDoc = {
  title: string;
  updated: string;
  intro: string[];
  sections: LegalSection[];
  closing?: string;
};

export const termsOfUse: LegalDoc = {
  title: 'Terms of Use',
  updated: 'September 2026',
  intro: ['By creating a Hemera account or using the Hemera app, you agree to these Terms of Use.'],
  sections: [
    {
      title: '1. Our Services',
      blocks: [
        {
          type: 'p',
          text: 'Hemera provides access to laundry and garment-care services, cooked meals, soft drinks, bottled water, E-Plan meal subscriptions, and other services available through the app.',
        },
        { type: 'p', text: 'Hemera does not sell alcoholic beverages.' },
      ],
    },
    {
      title: '2. Orders & Payments',
      blocks: [
        {
          type: 'p',
          text: 'You agree to provide accurate information when creating an account and placing orders. Prices, applicable service charges, delivery fees, and other charges will be shown before you confirm an order.',
        },
      ],
    },
    {
      title: '3. E-Plan',
      blocks: [
        {
          type: 'p',
          text: 'E-Plan allows you to fund and schedule meals for a selected period based on your preferences and budget. E-Plan funds are dedicated to eligible meals and services under the active plan and are subject to the applicable E-Plan cancellation and refund rules.',
        },
      ],
    },
    {
      title: '4. Cancellations & Refunds',
      blocks: [
        {
          type: 'p',
          text: 'Cancellation and refund eligibility depends on the type and stage of your order. Orders that have entered preparation, processing, pickup, or dispatch may be subject to cancellation charges or may become non-refundable.',
        },
      ],
    },
    {
      title: '5. Laundry',
      blocks: [
        {
          type: 'p',
          text: 'Laundry items are verified when received by the assigned laundry service provider. The verified count may determine applicable charges or subscription usage. Users should remove valuables and prohibited items from garments before submission.',
        },
      ],
    },
    {
      title: '6. Food & Dietary Information',
      blocks: [
        {
          type: 'p',
          text: 'You are responsible for providing accurate dietary, allergy, and meal preference information. Hemera cannot guarantee the complete absence of allergens or cross-contamination.',
        },
      ],
    },
    {
      title: '7. Delivery',
      blocks: [
        {
          type: 'p',
          text: 'Delivery times are estimates and may be affected by traffic, weather, dispatch availability, meal preparation, and other circumstances beyond reasonable control.',
        },
      ],
    },
    {
      title: '8. Your Account',
      blocks: [
        {
          type: 'p',
          text: 'You are responsible for keeping your account information accurate and your login details secure. Hemera may suspend or restrict accounts involved in fraud, misuse, or violations of these Terms.',
        },
      ],
    },
    {
      title: '9. Privacy',
      blocks: [
        {
          type: 'p',
          text: "Your personal information is handled in accordance with applicable Nigerian data protection laws and Hemera's Privacy Policy.",
        },
      ],
    },
    {
      title: '10. Agreement',
      blocks: [
        {
          type: 'p',
          text: 'By selecting “I Agree” or creating a Hemera account, you confirm that you have read and agree to these Terms of Use and the applicable Hemera Privacy Policy.',
        },
      ],
    },
  ],
  closing:
    'For the complete terms governing Hemera services, please review the full Terms of Service available in the app.',
};

export const privacyPolicy: LegalDoc = {
  title: 'Privacy Policy',
  updated: 'September 2026',
  intro: [
    'Hemera (“Hemera”, “we”, “us”, or “our”) respects your privacy and is committed to protecting the personal information you provide when using the Hemera mobile application, website, and related services.',
    'This Privacy Policy explains what information we collect, how we use it, how we protect it, and your rights regarding your personal information.',
  ],
  sections: [
    {
      title: '1. INFORMATION WE COLLECT',
      blocks: [
        { type: 'p', text: 'Depending on how you use Hemera, we may collect:' },
        { type: 'sub', text: 'Account Information' },
        {
          type: 'list',
          items: ['Full name', 'Phone number', 'Email address', 'Account login information', 'Profile information'],
        },
        { type: 'sub', text: 'Order & Service Information' },
        {
          type: 'list',
          items: [
            'Laundry orders and item information',
            'Food and beverage orders',
            'E-Plan preferences and schedules',
            'Delivery and pickup addresses',
            'Recipient information',
            'Dietary preferences, restrictions, and allergy information provided by you',
            'Order history and service preferences',
          ],
        },
        { type: 'sub', text: 'Payment & Transaction Information' },
        {
          type: 'p',
          text: 'We may collect information relating to your payments, transactions, refunds, and order charges.',
        },
        {
          type: 'p',
          text: 'Where payments are processed through third-party payment providers, payment card or banking details may be processed directly by those providers in accordance with their own privacy policies and security requirements.',
        },
        { type: 'sub', text: 'Location Information' },
        {
          type: 'p',
          text: 'With your permission, Hemera may collect location information to help provide services such as:',
        },
        {
          type: 'list',
          items: [
            'Pickup and delivery',
            'Address verification',
            'Delivery tracking',
            'Service availability based on location',
          ],
        },
        { type: 'p', text: 'You may control location permissions through your device settings.' },
        { type: 'sub', text: 'Device & Technical Information' },
        {
          type: 'p',
          text: 'We may automatically collect certain technical information, including:',
        },
        {
          type: 'list',
          items: [
            'Device type',
            'Operating system',
            'IP address',
            'App version',
            'Device identifiers',
            'Browser information',
            'Log information',
            'Usage and interaction data',
          ],
        },
      ],
    },
    {
      title: '2. HOW WE USE YOUR INFORMATION',
      blocks: [
        { type: 'p', text: 'We may use your information to:' },
        {
          type: 'list',
          items: [
            'Create and manage your account.',
            'Process and fulfill orders.',
            'Coordinate laundry pickup and delivery.',
            'Coordinate meal and beverage orders.',
            'Manage E-Plan schedules and preferences.',
            'Process payments, refunds, and transactions.',
            'Communicate with you about your orders and account.',
            'Provide customer support.',
            'Verify and secure accounts.',
            'Improve our services and app.',
            'Detect and prevent fraud, abuse, and unauthorized activity.',
            'Send important service-related notifications.',
            'Comply with applicable laws and regulatory requirements.',
          ],
        },
        {
          type: 'p',
          text: 'Where permitted by law, we may also use certain information for service improvement, analytics, research, and product development.',
        },
      ],
    },
    {
      title: '3. DIETARY & ALLERGY INFORMATION',
      blocks: [
        {
          type: 'p',
          text: 'If you voluntarily provide dietary restrictions, allergies, intolerances, or other meal-related information, Hemera may use that information to help coordinate suitable meals and E-Plan fulfillment.',
        },
        {
          type: 'p',
          text: 'Because food may be prepared in environments where different ingredients are handled, providing dietary or allergy information does not guarantee that a meal will be completely free from a particular allergen.',
        },
        {
          type: 'p',
          text: 'Users should exercise appropriate caution when ordering food, particularly where they have serious allergies or medical dietary requirements.',
        },
      ],
    },
    {
      title: '4. HOW WE SHARE INFORMATION',
      blocks: [
        {
          type: 'p',
          text: 'Hemera may share relevant information with trusted third parties where necessary to provide our services.',
        },
        { type: 'p', text: 'These may include:' },
        {
          type: 'list',
          items: [
            'Laundry service providers.',
            'Food preparation partners or vendors.',
            'Dispatch and delivery providers.',
            'Payment processors.',
            'Technology and infrastructure providers.',
            'Customer-support providers.',
            'Professional advisers where necessary.',
            'Government authorities or law-enforcement bodies where required by law.',
          ],
        },
        {
          type: 'p',
          text: 'We only share information that is reasonably necessary for the relevant purpose, subject to applicable legal and contractual requirements.',
        },
        { type: 'p', text: 'Hemera does not sell your personal information as a commercial product.' },
      ],
    },
    {
      title: '5. THIRD-PARTY SERVICE PROVIDERS',
      blocks: [
        {
          type: 'p',
          text: 'Some Hemera services rely on third-party providers, including payment processors, logistics providers, technology providers, and service partners.',
        },
        {
          type: 'p',
          text: 'These providers may process information on our behalf or independently where applicable.',
        },
        {
          type: 'p',
          text: 'Their handling of information may also be governed by their own privacy policies and applicable laws.',
        },
      ],
    },
    {
      title: '6. PAYMENTS',
      blocks: [
        { type: 'p', text: 'Payments may be processed through third-party payment providers.' },
        { type: 'p', text: 'Hemera may receive transaction information such as:' },
        {
          type: 'list',
          items: ['Amount paid.', 'Transaction status.', 'Payment reference.', 'Payment method.', 'Refund information.'],
        },
        {
          type: 'p',
          text: 'Where applicable, sensitive payment credentials are handled by the relevant payment provider rather than stored directly by Hemera.',
        },
      ],
    },
    {
      title: '7. COMMUNICATIONS',
      blocks: [
        { type: 'p', text: 'We may contact you through:' },
        {
          type: 'list',
          items: [
            'In-app notifications.',
            'SMS.',
            'Email.',
            'Phone calls.',
            'WhatsApp or other supported communication channels.',
          ],
        },
        {
          type: 'p',
          text: 'Communications may include order updates, delivery information, account notices, security alerts, E-Plan notifications, support responses, and other service-related information.',
        },
        {
          type: 'p',
          text: 'Where required, you may be given the option to manage promotional communications.',
        },
      ],
    },
    {
      title: '8. COOKIES & ANALYTICS',
      blocks: [
        {
          type: 'p',
          text: 'Our website and digital services may use cookies, analytics tools, SDKs, or similar technologies to:',
        },
        {
          type: 'list',
          items: [
            'Keep services functioning.',
            'Understand how users interact with our platform.',
            'Improve performance.',
            'Measure usage.',
            'Detect technical problems.',
            'Improve user experience.',
          ],
        },
        {
          type: 'p',
          text: 'You may be able to control certain cookie or device permissions through your browser or device settings.',
        },
      ],
    },
    {
      title: '9. DATA SECURITY',
      blocks: [
        {
          type: 'p',
          text: 'Hemera takes reasonable technical and organizational measures to protect personal information against unauthorized access, loss, misuse, alteration, or disclosure.',
        },
        {
          type: 'p',
          text: 'However, no internet-based system or electronic transmission can be guaranteed to be completely secure.',
        },
        {
          type: 'p',
          text: 'Users should also protect their passwords, verification codes, and account credentials and should not share them with others.',
        },
      ],
    },
    {
      title: '10. DATA RETENTION',
      blocks: [
        { type: 'p', text: 'We retain personal information for as long as reasonably necessary to:' },
        {
          type: 'list',
          items: [
            'Provide our services.',
            'Maintain account and transaction records.',
            'Resolve disputes.',
            'Prevent fraud and abuse.',
            'Meet legal, regulatory, accounting, or reporting obligations.',
          ],
        },
        {
          type: 'p',
          text: 'When information is no longer required, we may delete, anonymize, or securely dispose of it in accordance with applicable requirements.',
        },
      ],
    },
    {
      title: '11. YOUR PRIVACY RIGHTS',
      blocks: [
        {
          type: 'p',
          text: 'Subject to applicable law, you may have rights regarding your personal information, including the right to:',
        },
        {
          type: 'list',
          items: [
            'Request access to information we hold about you.',
            'Request correction of inaccurate information.',
            'Request deletion where legally permitted.',
            'Request restriction of certain processing.',
            'Object to certain processing.',
            'Withdraw consent where processing is based on consent.',
            'Request information about how your personal data is processed.',
            'Lodge a complaint regarding the handling of your personal information.',
          ],
        },
        { type: 'p', text: 'Some requests may be subject to legal or operational limitations.' },
      ],
    },
    {
      title: "12. CHILDREN'S PRIVACY",
      blocks: [
        {
          type: 'p',
          text: 'Hemera services are intended for users who are legally able to enter into agreements and use the applicable services.',
        },
        {
          type: 'p',
          text: 'We do not knowingly collect personal information from children in violation of applicable law.',
        },
        {
          type: 'p',
          text: 'If you believe a child has provided personal information to Hemera without appropriate authorization, please contact us so that we can review and take appropriate action.',
        },
      ],
    },
    {
      title: '13. DATA TRANSFERS',
      blocks: [
        {
          type: 'p',
          text: 'Where necessary to provide our services, personal information may be processed or stored using service providers located in Nigeria or other jurisdictions.',
        },
        {
          type: 'p',
          text: 'Where information is transferred across borders, Hemera will take reasonable steps to ensure that the transfer and processing comply with applicable data-protection requirements.',
        },
      ],
    },
    {
      title: '14. CHANGES TO THIS PRIVACY POLICY',
      blocks: [
        {
          type: 'p',
          text: 'We may update this Privacy Policy from time to time to reflect changes in our services, technology, legal requirements, or privacy practices.',
        },
        {
          type: 'p',
          text: 'The updated version will be published through the Hemera app or website with a revised “Last Updated” date.',
        },
        {
          type: 'p',
          text: 'Where required by law, we will provide additional notice or obtain consent for material changes.',
        },
      ],
    },
    {
      title: '15. CONTACT US',
      blocks: [
        {
          type: 'p',
          text: 'If you have questions, requests, complaints, or concerns about this Privacy Policy or the way Hemera handles your personal information, please contact Hemera through the support channels provided in the Hemera app or on the official Hemera website.',
        },
      ],
    },
  ],
  closing: 'By using Hemera, you acknowledge that you have read and understood this Privacy Policy.',
};