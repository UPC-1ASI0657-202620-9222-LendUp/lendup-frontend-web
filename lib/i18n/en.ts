import type { Messages } from '@/lib/i18n/types';

export const en: Messages = {
  meta: {
    title: 'LendUp — Student-to-student lending',
    tagline: "Lend what you don't use. Get what you need.",
  },
  common: {
    language: 'Language',
    locales: { es: 'Spanish', en: 'English' },
    close: 'Close',
    cancel: 'Cancel',
    continue: 'Continue',
    retry: 'Try again',
    processing: 'Processing…',
    loading: 'Loading information',
    pending: 'Pending',
    requestFailed:
      'The operation could not be completed by the backend. Check the data and try again.',
    backendGap: 'This capability is not available in the LendUp API yet.',
    selectOption: 'Select an option',
    saveChanges: 'Save changes',
    viewDetail: 'View details',
    showDetails: 'Show details',
    hideDetails: 'Hide details',
    backHome: 'Back to home',
    skipToContent: 'Skip to main content',
    verifiedUser: 'Verified student',
    avatarOf: "{name}'s profile photo",
    loadError: {
      title: "We couldn't load the information",
      description: 'Check your connection and try again in a few seconds.',
    },
  },
  roles: {
    STUDENT: 'Student',
    ADMIN: 'Administrator',
    LENDER: 'Lender',
    BORROWER: 'Borrower',
  },
  nav: {
    main: 'Main navigation',
    public: 'Public navigation',
    mobile: 'Mobile navigation',
    mobileSecondary: 'All sections',
    brandHome: 'LendUp, go to home',
    goToApp: 'Go to my dashboard',
    groups: {
      main: 'Main',
      operations: 'Operations',
      account: 'My account',
      admin: 'Administration',
    },
    home: 'Home',
    explore: 'Explore',
    myItems: 'My items',
    requests: 'Requests',
    reservations: 'Reservations',
    loans: 'Loans',
    calendar: 'Calendar',
    transactions: 'Transactions',
    incidents: 'Incidents',
    notifications: 'Notifications',
    profile: 'Profile',
    adminIncidents: 'Incident inbox',
    unreadCount: '{count} unread',
    notificationsWithCount: 'Notifications, {count} unread',
    searchLabel: 'Search items on LendUp',
    searchPlaceholder: 'Search cameras, calculators, books…',
    signOut: 'Sign out',
    menu: 'Menu',
    menuTitle: 'LendUp menu',
    menuDescription: 'Access all your operations and account settings.',
  },
  banners: {
    verification:
      'Request verification of your student status to publish items and request loans.',
    verificationAction: 'Request verification',
    terms:
      'Before your first operation you must review and accept the terms and conditions.',
    termsAction: 'Review terms',
  },
  auth: {
    hero: {
      title:
        'Student-to-student lending with clear rules and a protected deposit.',
      point1: 'University email access with student-status verification.',
      point2: 'Terms, rate and deposit frozen in every reservation.',
      point3: "Evidence of the item's condition before and after each loan.",
    },
    login: {
      title: 'Welcome',
      description:
        'Sign in to continue with your reservations, loans and items.',
      submit: 'Sign in',
      submitting: 'Signing in…',
      noAccount: "Don't have an account yet?",
    },
    register: {
      completeTitle: 'Complete your university profile',
      completeDescription:
        'Your account already exists. Save the missing details to access LendUp.',
      recoveryNotice:
        'Your profile registration was not completed. Retry without creating another account or changing your password.',
      completeSubmit: 'Save my profile',
      changeAccount: 'Use another account',
      title: 'Create your university account',
      description:
        'Your university email will be the sign-in identity associated with your university profile.',
      cta: 'Create account',
      submit: 'Create my account',
      submitting: 'Creating account…',
      detectedHint: 'Your university is identified from your email domain.',
      detectedPlaceholder: 'Enter your university email',
      unknownDomain:
        'We do not recognize your university email domain yet. Request that it be added.',
      catalogFailed: 'We could not load the universities. Retry to continue.',
      campusOptional: 'Optional. Enter your campus if you wish.',
      campusLength: 'Campus allows up to 150 characters.',
      domainHint: 'Use your university email ({domains}).',
      phoneHint:
        'Only shared with your counterpart during an active reservation.',
      passwordHint: 'At least 8 characters, with letters and numbers.',
      termsNotice: "Before your first operation we'll ask you to accept the",
      termsLink: 'terms and conditions',
      haveAccount: 'Already have an account?',
      successTitle: 'Your account was created!',
      successNext:
        'The next step is to request verification of your student status so you can publish and request items.',
    },
    verify: {
      linkTitle: 'Verify your email to enter',
      linkDescription: 'Verify {email} to access LendUp.',
      linkInstructions:
        'Open the link in your email, then click “I verified my email”. Check your spam folder too. You can resend the message if it did not arrive.',
      linkCheck: 'I verified my email',
      linkSent: 'Link sent. Check your email.',
      linkPending:
        'Your email is not verified yet. Open the link and try again.',
      linkError:
        'We could not complete the request. Wait a moment and try again.',
      title: 'Request student verification',
      description:
        'Your account uses the university email {email}. Enter a valid reference for the backend to process the verification.',
      referenceLabel: 'Verification reference',
      referenceHint:
        'Use the reference requested by your institution, such as your university ID code.',
      referencePlaceholder: 'Institutional code or reference',
      send: 'Request verification',
      resend: 'Update request',
      continue: 'Continue',
      later: 'Do it later',
      messages: {
        UNVERIFIED:
          'Your student status is not verified yet. Enter the required reference to request validation.',
        PENDING:
          'Your request was submitted and the backend keeps it pending review.',
        VERIFIED:
          'Your student status is verified. You can now operate on LendUp.',
      },
    },
    errors: {
      USER_NOT_FOUND: 'There is no account with that email.',
      INVALID_CREDENTIALS: 'The email or password is not valid.',
      SESSION_EMAIL_MISMATCH:
        'The current Firebase session belongs to another email. Sign out before registering this account.',
      ACCOUNT_SUSPENDED:
        'This account is suspended. Please contact the LendUp team.',
      EMAIL_TAKEN: 'An account with that email already exists.',
      EMAIL_NOT_INSTITUTIONAL:
        "The email doesn't belong to the selected university's domain.",
    },
  },
  fields: {
    fullName: 'Full name',
    university: 'University',
    campus: 'Campus',
    career: 'Degree program',
    cycle: 'Term',
    institutionalEmail: 'University email',
    phone: 'Phone',
    password: 'Password',
    confirmPassword: 'Confirm password',
    title: 'Title',
    category: 'Category',
    description: 'Description',
    condition: 'Condition',
    district: 'District',
    exchangePlace: 'Exchange point',
    usage: 'Usage terms',
    delivery: 'Handover terms',
    returnPolicy: 'Return terms',
    cancellation: 'Cancellation terms',
    dailyRate: 'Daily rate',
    dailyRateCurrency: 'Daily rate (S/)',
    guarantee: 'Deposit',
    guaranteeCurrency: 'Security deposit (S/)',
    from: 'From',
    to: 'To',
  },
  validation: {
    required: 'This field is required.',
    select: 'Select an option.',
    email: 'Enter a valid email.',
    institutionalEmail: "Use the selected university's email.",
    fullName: 'Enter your full name.',
    min: 'Enter at least {count} characters.',
    max: 'Use at most {count} characters.',
    cycle: 'Enter a term between 1 and 14.',
    phone: 'Enter a valid phone number with 9 to 15 digits.',
    passwordLength: 'The password must have at least 8 characters.',
    passwordLetter: 'The password must include at least one letter.',
    passwordNumber: 'The password must include at least one number.',
    passwordMatch: "Passwords don't match.",
    number: 'Enter a valid number.',
    dailyRate: 'The daily rate must be greater than zero.',
    nonNegative: 'The amount cannot be negative.',
    endAfterStart: 'The end date must be after the start date.',
    photoRequired: 'Add at least one photo of the item.',
    reviewFields: 'Review the highlighted fields before continuing.',
  },
  categories: {
    CALCULATORS: 'Calculators',
    CAMERAS: 'Cameras',
    BOOKS: 'Books',
    TOOLS: 'Tools',
    ELECTRONICS: 'Electronics',
    OTHER: 'Other',
  },
  conditions: {
    NEW: 'New',
    EXCELLENT: 'Excellent',
    VERY_GOOD: 'Very good',
    GOOD: 'Good',
    FAIR: 'Fair',
  },
  status: {
    request: {
      PENDING: 'Pending',
      ACCEPTED: 'Accepted',
      REJECTED: 'Rejected',
      CANCELLED: 'Cancelled',
    },
    reservation: {
      CONFIRMED: 'Confirmed',
      ACTIVATED: 'On loan',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    },
    loan: {
      PENDING_RECEIPT: 'Delivered · awaiting confirmation',
      ACTIVE: 'Active',
      OVERDUE: 'Overdue',
      RETURN_RECORDED: 'Returned · awaiting confirmation',
      RETURN_CONFIRMED_PENDING_INCIDENT: 'Under incident',
      COMPLETED: 'Completed',
    },
    payment: {
      PENDING: 'Payment pending',
      PROCESSING: 'Processing',
      PENDING_RELEASE: 'Paid · pending release',
      RELEASED: 'Released to lender',
      REFUNDED: 'Refunded',
      FAILED: 'Declined',
      CANCELLED: 'Cancelled',
    },
    guarantee: {
      NOT_REQUIRED: 'Not required',
      PENDING: 'Pending',
      PROCESSING: 'Processing',
      HELD: 'Held',
      FAILED: 'Declined',
      CANCELLED: 'Cancelled',
      RELEASED: 'Returned',
      PARTIALLY_CAPTURED: 'Partially applied',
      CAPTURED: 'Fully applied',
    },
    transaction: {
      PENDING: 'Pending',
      PROCESSING: 'Processing',
      PENDING_RELEASE: 'Pending release',
      RELEASED: 'Completed',
      REFUNDED: 'Refunded',
      FAILED: 'Declined',
      CANCELLED: 'Cancelled',
      NOT_REQUIRED: 'Not required',
      HELD: 'Held',
      PARTIALLY_CAPTURED: 'Partially applied',
      CAPTURED: 'Applied',
    },
    incident: {
      OPEN: 'Pending',
      UNDER_REVIEW: 'Under review',
      RESOLVED: 'Resolved',
    },
    extension: {
      PENDING: 'Pending',
      PAYMENT_PENDING: 'Accepted · payment pending',
      ACCEPTED: 'Accepted',
      REJECTED: 'Rejected',
    },
    reschedule: {
      PENDING: 'Pending',
      ACCEPTED: 'Accepted',
      REJECTED: 'Rejected',
    },
    analysis: {
      IDLE: 'Not run',
      ANALYZING: 'Analyzing',
      SUCCESS: 'Completed',
      TIMEOUT: 'Timed out',
      ERROR: 'Unavailable',
    },
    listing: {
      ACTIVE: 'Published',
      PAUSED: 'Paused',
      ARCHIVED: 'Removed',
    },
    verification: {
      UNVERIFIED: 'Not verified',
      PENDING: 'Verification pending',
      VERIFIED: 'Verified',
    },
  },
  reputation: {
    aria: '{value} out of 5 stars',
    ariaWithCount: '{value} out of 5 stars, {count} ratings',
    none: 'No ratings yet',
  },
  listing: {
    perDay: '/ day',
    card: {
      open: 'View {title}',
      available: 'Available',
      yours: 'Your listing',
      distance: '{km} km away',
    },
    notFound: {
      title: 'Item not found',
      description: "The listing doesn't exist or is no longer available.",
    },
    backToExplore: 'Back to explore',
    gallery: 'Item photos',
    showImage: 'Show photo {index}',
    guaranteeRequired: 'Refundable security deposit: {amount}',
    noGuarantee: 'No security deposit',
    noGuaranteeShort: 'Not required',
    ownNotice: 'This item belongs to you. Manage it from My items.',
    request: 'Request loan',
    notRequestable: "This listing isn't accepting new requests right now.",
    availability: 'Availability',
    availableWindows: 'Available periods',
    noAvailability: "The lender hasn't added available periods yet.",
    blockedWindows: 'Already reserved periods',
    exchangePoint: 'Exchange point',
    phonePrivacy:
      "The counterpart's phone is only shared during a confirmed reservation or an active loan.",
    conditions: 'Current terms',
    conditionsTitle: 'Clear agreements before you request',
    viewProfile: 'View profile and reviews',
  },
  explore: {
    eyebrow: 'LendUp community',
    title: 'Find what you need',
    description:
      'Items published by verified students from your university community.',
    searchLabel: 'Search items by name or description',
    searchPlaceholder: 'Search calculators, cameras, books…',
    filters: 'Filters',
    allCategories: 'All categories',
    allUniversities: 'All universities',
    allCampuses: 'All campuses',
    districtPlaceholder: 'e.g. Santiago de Surco',
    clear: 'Clear filters',
    nearMe: 'Sort by distance',
    sortedByDistance: 'Sorted by distance',
    locationDenied:
      "We couldn't access your location. Check your browser permissions.",
    locationPrivacy:
      "Your location is only used right now to sort results; it isn't stored.",
    results: '{count} results',
    emptyTitle: "We couldn't find matches",
    emptyDescription: 'Try another keyword, campus or availability period.',
  },
  request: {
    dialogTitle: 'Review before requesting',
    dialogDescription: 'Loan request for {title}',
    periodValidation:
      'The backend will validate the period when the request is submitted because existing availability is not exposed by the API.',
    reviewTitle: 'Terms set by the lender',
    paymentLater:
      'Nothing will be charged now. The amount shown is preliminary; the backend does not yet provide an authoritative total quote or real provider confirmation.',
    messageLabel: 'Message for the lender (optional)',
    messageHint: 'Tell them what you need it for. Up to 280 characters.',
    acceptConditions:
      'I have read and accept the rate, deposit, usage, handover, return and cancellation terms, and the exchange point.',
    submit: 'Send request',
  },
  myItems: {
    eyebrow: 'As a lender',
    title: 'My items',
    description:
      'Manage your listings, their availability and the requests you receive.',
    activeOnly:
      'The backend only allows active listings to be queried. Paused or removed listings cannot be recovered in this view.',
    noActiveTitle: 'No active listings are visible',
    publish: 'Publish item',
    publishFirst: 'Publish my first item',
    edit: 'Edit',
    availability: 'Availability',
    pause: 'Pause',
    reactivate: 'Reactivate',
    archive: 'Remove',
    reviewRequests: 'Review requests',
    pendingRequests: 'Requests',
    upcomingReservations: 'Reservations',
    archiveTitle: 'Remove listing',
    archiveDescription:
      '“{title}” will stop receiving requests and cannot be reactivated. Confirmed reservations and history are kept.',
    archiveConfirm: 'Remove',
  },
  listingForm: {
    newEyebrow: 'New listing',
    editEyebrow: 'Edit listing',
    newTitle: 'Publish an item',
    editTitle: 'Edit “{title}”',
    description:
      'Fill in the information, photos, terms and pricing. Fields marked with * are required.',
    snapshotNotice:
      'Changes only apply to new requests. Confirmed reservations keep the terms, rate and deposit they were accepted with.',
    sections: {
      info: 'Item information',
      location: 'Location and exchange',
      photos: 'Photos',
      conditions: 'Loan terms',
      economy: 'Rate and deposit',
    },
    descriptionHint:
      'Include accessories, working condition and any relevant details.',
    exchangeHint: 'A public, easy-to-find spot on or near campus.',
    photosTitle: 'Photo uploads are unavailable',
    conditionsHint:
      'These terms will be shown before a student sends a request.',
    rateHint: 'Charged for every started 24-hour block.',
    guaranteeHint:
      'Leave it at 0 if you do not require a deposit. It is returned at the end if there are no incidents.',
    publish: 'Publish item',
    save: 'Save changes',
  },
  availability: {
    eyebrow: 'Availability',
    back: 'Back to my items',
    description:
      'Availability must come from the backend and preserve existing and reserved periods.',
    backendGap:
      'The backend can add one interval but cannot list, edit or delete existing availability. Management is disabled to avoid overwriting or duplicating periods without authoritative data.',
  },
  requests: {
    eyebrow: 'Requests',
    title: 'Loan requests',
    description:
      'A request only becomes a reservation once the lender accepts it.',
    received: 'Received',
    sent: 'Sent',
    createdAgo: 'Sent {time}',
    totalRental: 'Total rate {amount}',
    guarantee: 'Deposit {amount}',
    snapshotNotice:
      'Terms current as of {date}. If accepted, they will be recorded in the reservation.',
    accept: 'Accept',
    reject: 'Reject',
    cancel: 'Cancel request',
    viewReservation: 'View reservation',
    emptySentTitle: "You haven't sent requests",
    emptySentDescription:
      'Explore available items and send your first request.',
    emptyReceivedTitle: "You haven't received requests",
    emptyReceivedDescription:
      'When someone requests one of your items, it will show up here.',
    confirm: {
      accept: {
        title: 'Accept request',
        description:
          'A reservation of “{title}” will be created for {period} and that period will be blocked.',
        action: 'Accept and reserve',
      },
      reject: {
        title: 'Reject request',
        description:
          "The student will be notified that you can't lend “{title}” for {period}.",
        action: 'Reject',
      },
      cancel: {
        title: 'Cancel request',
        description:
          'Your request for “{title}” for {period} will no longer be pending.',
        action: 'Cancel request',
      },
    },
  },
  reservations: {
    eyebrow: 'Confirmed operations',
    eyebrowDetail: 'Reservation',
    title: 'Reservations',
    description:
      'Accepted requests with their terms, rate and deposit recorded.',
    current: 'Current',
    history: 'History',
    back: 'Back to reservations',
    notFound: 'Reservation not found',
    emptyTitle: 'You have no current reservations',
    emptyHistoryTitle: "You don't have completed or cancelled reservations yet",
    emptyDescription:
      'When a request is accepted, the reservation will show up here.',
    snapshotNotice:
      "These terms reflect the moment the reservation was confirmed and don't change even if the listing is edited.",
    borrowerSteps:
      'Place the deposit and pay the rate before the handover. Then confirm you received the item.',
    lenderSteps:
      'Once payment and deposit are confirmed, record the handover with its initial evidence.',
    pay: 'Pay rate and deposit',
    recordDelivery: 'Record handover',
    waitingPayment: "Waiting for the borrower's payment and deposit.",
    readyForDelivery: 'Payment and deposit confirmed. Arrange the handover.',
    openLoan: 'View loan',
    cancel: 'Cancel reservation',
    cancelTitle: 'Cancel this reservation',
    cancelDescriptionBorrower:
      'The reserved period will be released, the lender will be notified and confirmed amounts will be refunded according to the accepted terms.',
    cancelDescriptionLender:
      'The period will be released, the borrower will be notified and fully refunded the confirmed rate and deposit.',
    cancelConfirm: 'Confirm cancellation',
    refundRental: 'Rate and fee refund',
    refundGuarantee: 'Deposit return',
    reason: 'Cancellation reason',
    reasonHint:
      'It will be shared with your counterpart. At least 5 characters.',
    cancelledBy: 'Cancelled by {name} on {date}. Reason: {reason}',
  },
  operations: {
    asBorrower: 'As borrower',
    asLender: 'As lender',
    nextStep: 'Next step',
    periodAndPlace: 'Period and place',
    contactTitle: 'Contact to coordinate',
    phoneHidden:
      'The phone is only shown while the reservation or loan is active.',
    frozenConditions: 'Recorded terms',
  },
  finance: {
    breakdown: 'Cost summary',
    rentalFee: 'Rate for {days} day(s)',
    lendupCommission: 'LendUp fee',
    providerFee: 'Payment provider fee',
    guaranteeRefundable: 'Security deposit (refundable)',
    total: 'Total',
    payment: 'Payment',
    guarantee: 'Deposit',
    rentalCharge: 'Rate and fee',
    lenderPayout: "You'll receive {amount} when the borrower confirms receipt.",
    lenderReleased: '{amount} was released to you for this loan.',
    lenderPending: "You'll receive {amount} once receipt is confirmed.",
    paymentNotes: {
      PENDING: 'The rate payment has not been recorded yet.',
      PROCESSING: 'The provider is processing the payment.',
      PENDING_RELEASE:
        'Payment approved. It will be released to the lender when receipt is confirmed.',
      RELEASED: 'The rate was released to the lender.',
      REFUNDED: 'The rate was refunded.',
      FAILED: 'The provider declined the payment. You can try again.',
      CANCELLED: 'The payment was cancelled. You can try again.',
    },
    guaranteeNotes: {
      NOT_REQUIRED: "This loan doesn't require a deposit.",
      PENDING: 'Must be placed before the handover.',
      PROCESSING: 'The provider is processing the deposit.',
      HELD: 'Held by the provider until the loan closes.',
      FAILED: 'The provider declined the deposit. Try another method.',
      CANCELLED: 'The deposit operation was cancelled.',
      RELEASED: 'The deposit was returned to the borrower.',
      PARTIALLY_CAPTURED:
        'Part was applied for an incident and the balance was returned.',
      CAPTURED: 'The full amount was applied for a resolved incident.',
    },
  },
  payments: {
    chooseMethod: 'Payment method',
    noMethods:
      'No payment methods are enabled. The provider integration is still pending in the backend.',
    methods: {
      CARD: 'Credit or debit card',
      WALLET: 'Digital wallet',
      ACCOUNT_MONEY: 'Mercado Pago account balance',
      CASH: 'Cash payment',
    },
    methodHints: {
      CARD: 'Visa, Mastercard or American Express',
      WALLET: 'Operation handled by the external provider',
      ACCOUNT_MONEY: 'Available balance in your account',
      CASH: 'Code to pay at agents or online banking',
    },
  },
  checkout: {
    eyebrow: 'Payment with Mercado Pago',
    title: 'Complete your reservation · {title}',
    description:
      "The deposit and the rate are processed separately with the external provider. LendUp doesn't store your full card details.",
    back: 'Back to reservation',
    backToReservation: 'Back to reservation',
    step: 'Step {number}',
    guaranteeStep: 'Security deposit',
    rentalStep: 'Rate and fee',
    rentalLocked: 'Available once the security deposit is placed.',
    guaranteeDone: 'Deposit placed successfully.',
    rentalDone: 'Rate payment approved.',
    payWithProvider: 'Pay {amount} with Mercado Pago',
    processing: 'Processing with the provider…',
    providerPending:
      'The operation was recorded and remains pending provider confirmation.',
    allDone:
      'Done: payment and deposit are confirmed. The lender can now record the handover.',
    security:
      "You'll be served by Mercado Pago's secure flow. LendUp only records the chosen method and the operation status.",
    guaranteeNote:
      'The deposit is returned when the loan ends with no pending incidents.',
    closedTitle: 'This reservation no longer accepts payments',
    closedDescription:
      'The reservation was cancelled or the loan already started.',
  },
  delivery: {
    eyebrow: 'Item handover',
    title: 'Record handover · {title}',
    description:
      "Document the item's condition before handing it over. The borrower will then confirm receipt.",
    checksTitle: 'Prerequisites',
    checks: {
      reservation: 'Confirmed reservation with no handover recorded',
      payment: 'Rate payment approved',
      guarantee: 'Deposit placed or not required',
    },
    notReady: 'Not all requirements to record the handover are met yet.',
    evidenceTitle: 'Initial evidence',
    evidenceHint:
      'We recommend general photos, accessories and a note about how it works.',
    evidenceLabel: 'Photos, videos and notes of the initial condition',
    confirm: 'Confirm handover',
    confirmTitle: 'Confirm the handover',
    confirmDescription:
      'The handover date and time will be recorded with {count} initial evidence item(s) and the borrower will be notified.',
    confirmNoEvidence:
      "You didn't attach initial evidence. Without it, it will be harder to back up the item's condition. Do you want to continue?",
  },
  loans: {
    eyebrow: 'Operations',
    title: 'Loans',
    description: 'Track your loans as a lender or borrower.',
    back: 'Back to loans',
    notFound: 'Loan not found',
    open: 'Open loan',
    returnAt: 'Return: {date}',
    emptyDescription: 'When a loan has this status, it will show up here.',
    tabs: {
      upcoming: 'Starting',
      active: 'In progress',
      overdue: 'Overdue',
      history: 'History',
    },
    empty: {
      upcoming: 'You have no loans about to start',
      active: 'You have no loans in progress',
      overdue: 'You have no overdue loans',
      history: "You don't have completed loans yet",
    },
    next: {
      CONFIRM_RECEIPT: 'Confirm you received the item',
      WAIT_RECEIPT: 'Waiting for the borrower to confirm receipt',
      RECORD_RETURN: 'Record the return of the item',
      WAIT_RETURN: 'Waiting for the item to be returned',
      CONFIRM_RETURN: 'Review and confirm the return',
      WAIT_RETURN_CONFIRMATION: 'Waiting for the lender to confirm the return',
      WAIT_INCIDENT: 'Waiting for the incident to be resolved',
      RATE: 'Rate your experience',
      NONE: 'Loan closed. Thanks for using LendUp!',
    },
  },
  loanDetail: {
    eyebrow: 'Loan',
    with: 'With {name}',
    overdueBorrower:
      'The return was due on {date}. Record the return as soon as possible.',
    overdueLender:
      'The return was due on {date}. You can coordinate with the borrower or report an incident.',
    incidentHold:
      'There is an open incident: the deposit stays held until it is resolved.',
    noCancel: 'An active loan can no longer be cancelled.',
    period: 'Loan dates',
    start: 'Start',
    currentReturn: 'Current return',
    originalReturn: 'Original return',
    deliveredAt: 'Handover recorded',
    receivedAt: 'Receipt confirmed',
    returnedAt: 'Return recorded',
    returnConfirmedAt: 'Return confirmed',
    traceability: 'Traceability',
    returnNotes: 'Return notes',
    earlyReturnNotes: 'Early return notes',
    history: 'History',
    historyTitle: 'Extensions and reschedules',
    extensionBy: 'Extension requested by {name}',
    rescheduleBy: 'Reschedule proposed by {name}',
    requestedAt: 'Requested',
    previousDate: 'Previous date',
    proposedDate: 'Proposed date',
    additionalCost: 'Additional cost',
    respondedAt: 'Answered',
    resultingDate: 'Resulting current date',
    noExtensions: 'This loan has no extensions or reschedules.',
    incidents: 'Loan incidents',
    noIncidents: 'This loan has no incidents recorded.',
    rating: 'Rating',
    yourRating: 'You rated {stars} star(s)',
    ratingPending: "You haven't rated your counterpart yet.",
    actions: {
      confirmReceipt: 'Confirm receipt',
      recordReturn: 'Record return',
      earlyReturn: 'Return early',
      requestExtension: 'Request extension',
      payExtension: 'Pay extension · {amount}',
      reviewReschedule: 'Review new date',
      reviewExtension: 'Review extension',
      proposeReschedule: 'Propose new date',
      confirmReturn: 'Confirm return',
      rate: 'Rate experience',
      reportIncident: 'Report incident',
    },
  },
  loanDialogs: {
    newDate: 'New return date and time',
    accept: 'Accept',
    reject: 'Reject',
    receipt: {
      title: 'Confirm receipt',
      description:
        'Review the initial evidence. Once confirmed, the loan becomes active and the rate is released to the lender.',
      warning:
        'After confirming receipt, this operation can no longer be cancelled.',
      confirm: 'Confirm receipt',
    },
    extension: {
      title: 'Request extension',
      description: 'The current return is {date}. Propose a later date.',
      note: "The additional cost is calculated with the rate recorded in the reservation. The current date doesn't change until the extension is accepted and paid.",
      confirm: 'Send request',
    },
    reschedule: {
      title: 'Propose a new return date',
      description:
        'The current return is {date}. Propose a date when you can actually receive the item.',
      note: 'A reschedule proposed by the lender does not charge the borrower anything extra.',
      confirm: 'Send proposal',
    },
    respondExtension: {
      title: 'Extension request',
      description: 'The borrower asked to keep the item longer.',
      paymentNote:
        'If you accept, the new date will apply once the borrower pays the additional cost.',
    },
    respondReschedule: {
      title: 'New date proposal',
      description:
        'The lender proposes rescheduling the return at no extra cost.',
    },
    payExtension: {
      title: 'Pay extension',
      description:
        'Once the payment is approved, the current return will change to {date}.',
    },
    return: {
      title: 'Record return',
      description:
        "Attach the final evidence and describe the item's condition and how it works.",
      evidenceLabel: 'Final evidence of the item',
      notes: 'Condition, operation and notes',
      confirm: 'Record return',
    },
    early: {
      title: 'Return early',
      warning:
        "Returning the item before the agreed date doesn't generate a proportional refund of the paid rate.",
    },
    confirmReturn: {
      title: 'Confirm return',
      description:
        'Review the final evidence before confirming you received the item.',
      guaranteeNote:
        'If there are no pending incidents, the loan will end and the deposit will be returned to the borrower.',
      incidentHint:
        'If you find a problem, close this dialog and report an incident before confirming.',
      confirm: 'Confirm return',
    },
    rating: {
      title: 'Rate your experience',
      description:
        "Your rating adds to your counterpart's reputation and is linked to this loan.",
      stars: 'Rating',
      starAria: '{count} star(s)',
      comment: 'Comment (optional)',
      commentHint: 'It will be shown on the public profile next to your name.',
      confirm: 'Send rating',
    },
  },
  evidence: {
    title: 'Evidence',
    comparison: 'Before and after comparison',
    initial: 'Initial condition (handover)',
    final: 'Final condition (return)',
    none: 'No evidence recorded.',
    noteLabel: 'Evidence note',
    notePlaceholder: "Describe the item's condition or how it works.",
    addNote: 'Add note',
    attached: 'Attached evidence',
    remove: 'Remove {name}',
    noCaptions: 'No captions',
    types: { PHOTO: 'Photo', VIDEO: 'Video', NOTE: 'Note' },
  },
  photos: {
    select: 'Select photos',
    hint: 'Up to 6 JPG, PNG or WebP photos, 5 MB each. The first is the cover. Changes apply when you save.',
    limit: 'You can add up to 6 photos.',
    format: 'Use JPG, PNG or WebP photos.',
    size: 'Each photo must be non-empty and up to 5 MB.',
    saveFailed:
      'The item was saved, but we could not finish the photo changes. Save again to retry; completed photos will be kept.',
    preview: 'Photo {index}',
    remove: 'Remove photo {index}',
    removeButton: 'Remove',
  },
  uploads: {
    errors: {
      NOT_CONFIGURED:
        'File uploads are not available yet because Cloudinary is not part of the current backend contract.',
    },
  },
  analysis: {
    title: 'AI-assisted analysis',
    run: 'Analyze evidence',
    rerun: 'Analyze again',
    running: 'Analyzing…',
    needsPhotos: 'Initial and final photos are required to run the comparison.',
    disclaimer:
      "Supporting result only: it doesn't determine responsibility, create incidents or affect the deposit.",
    confidence: 'Analysis confidence: {level}',
    confidenceLevels: { LOW: 'low', MODERATE: 'moderate', HIGH: 'high' },
    findings: {
      NO_VISIBLE_CHANGES:
        'No visible changes detected between the initial and final condition.',
      MINOR_SURFACE_MARKS:
        'Possible minor surface marks; human review required.',
      MISSING_ACCESSORY:
        'An accessory visible in the initial photos might be missing.',
      VISIBLE_DAMAGE: 'Possible visible damage observed.',
    },
    messages: {
      IDLE: 'Compare handover and return photos to detect possible changes.',
      ANALYZING: 'The AI service is comparing the evidence…',
      SUCCESS: 'Analysis completed.',
      TIMEOUT:
        "The AI service didn't respond in time. The loan continues normally; you can retry.",
      ERROR:
        "The analysis isn't available right now. This doesn't block the return or the resolution.",
    },
    outcomes: {
      SUCCESS: 'Successful analysis',
      TIMEOUT: 'Timed out',
      ERROR: 'Service error',
    },
  },
  incidentTypes: {
    DAMAGE: 'Damage',
    LOSS: 'Loss',
    LATE_RETURN: 'Late return',
    NON_RETURN: 'Not returned',
    OTHER: 'Other issue',
  },
  incidentDecisions: {
    NO_IMPACT: { title: 'No impact', detail: 'Return the full deposit' },
    PARTIAL: {
      title: 'Partial impact',
      detail: 'Apply an amount and return the balance',
    },
    TOTAL: {
      title: 'Full impact',
      detail: 'Apply the entire available deposit',
    },
  },
  incidents: {
    listGap:
      'The backend does not provide an incident list for students. You can report an incident and open its immediate detail, but no fabricated history will be shown.',
    eyebrow: 'Trust and safety',
    title: 'Incidents',
    description:
      'Report damage, loss, delays or other problems and follow their status until resolution.',
    report: 'Report incident',
    newTitle: 'New incident',
    newHint:
      "You can report problems even if they aren't visible in photos, such as malfunctions.",
    noEligibleLoans: 'You have no loans in progress to report an incident on.',
    loan: 'Related loan',
    type: 'Incident type',
    descriptionLabel: 'Describe what happened',
    descriptionHint:
      'Include dates, prior coordination and any useful details. At least 20 characters.',
    evidenceLabel: 'Incident evidence (optional)',
    guaranteeHoldNotice:
      'Once recorded, the deposit will be held until the LendUp team resolves it.',
    submit: 'Record incident',
    emptyTitle: 'You have no incidents',
    emptyDescription: 'Your loans have no pending situations.',
    reportedBy: 'Reported by {name} · {date}',
    back: 'Back to incidents',
    notFound: 'Incident not found',
    linkedLoan: 'Incident linked to a loan',
    holdBanner: 'The deposit stays held while this incident is under review.',
    reporterStatement: "Reporter's statement",
    counterpartyStatement: "Counterpart's statement",
    noStatement: "The counterpart hasn't submitted a statement yet.",
    progress: 'Follow-up',
    openLoan: 'View loan',
    evidence: 'Incident evidence',
    resolution: 'Administrative resolution',
    capturedAmount: 'Deposit amount applied',
    refundedAmount: 'Balance returned to the borrower',
    resolvedAt: 'Resolution date',
    resolvedBy: 'Resolved by',
    yourStatement: 'Your statement',
    yourStatementTitle: 'Share your side of the story',
    statementLabel: 'Statement',
    saveStatement: 'Save statement',
  },
  admin: {
    loanDataGap:
      'The backend can list this incident but does not expose its loan or security-deposit balance to the administrator. Resolution remains blocked until that authoritative data is available.',
    eyebrow: 'Administration',
    title: 'Incident inbox',
    description:
      'Review evidence, terms and statements to resolve each incident.',
    statusFilter: 'Filter by status',
    all: 'All',
    allTypes: 'All types',
    date: 'Report date',
    search: 'Search',
    searchPlaceholder: 'ID, loan or item',
    order: 'Order',
    newest: 'Newest first',
    oldest: 'Oldest first',
    results: '{count} incidents',
    columns: {
      id: 'ID',
      object: 'Item',
      type: 'Type',
      reporter: 'Reported by',
      date: 'Date',
      guarantee: 'Deposit',
      status: 'Status',
      actions: 'Actions',
    },
    review: 'Review',
    emptyTitle: 'No incidents match these filters',
    emptyDescription: 'Change or clear the filters to see other records.',
    back: 'Back to inbox',
    startReview: 'Start review',
    availableGuarantee: 'Available for a possible deduction: {amount}',
    agreement: 'Confirmed agreement',
    agreedPeriod: 'Agreed period',
    loanStatus: 'Loan status',
    loanTimeline: 'Loan traceability',
    notes: 'Review notes',
    noNotes: 'There are no review notes yet.',
    newNote: 'New note',
    addNote: 'Add note',
    startToNote: 'Start the review to record notes.',
    resolution: 'Resolution',
    resolutionTitle: 'Decision about the deposit',
    amount: 'Amount to apply (maximum {max})',
    justification: 'Decision rationale',
    justificationHint:
      'Explain the decision based on the evidence and terms. At least 20 characters.',
    aiReminder:
      'The AI analysis is only supporting information: the final decision is yours.',
    resolve: 'Resolve incident',
    confirmTitle: 'Confirm resolution',
    confirmDescription:
      '{decision}: {captured} of the deposit will be applied and {refunded} will be returned to the borrower. Both parties will be notified.',
  },
  calendar: {
    eyebrow: 'Your schedule',
    title: 'Calendar',
    description:
      'Handovers, returns and pending payments of your reservations and loans.',
    previous: 'Previous period',
    next: 'Next period',
    today: 'Today',
    view: 'Calendar view',
    views: { month: 'Month', week: 'Week', day: 'Day' },
    legend: { delivery: 'Handover', return: 'Return', reminder: 'Pending' },
    events: { delivery: 'Scheduled handover', return: 'Scheduled return' },
    eventsCount: '{count} operations',
    selectedDay: 'Selected day',
    noEventsDay: 'There are no operations scheduled for this day.',
    emptyTitle: 'You have no scheduled operations',
    emptyDescription:
      "When you have confirmed reservations or loans, you'll see their handover and return dates here.",
  },
  reminders: {
    eyebrow: 'Upcoming obligations',
    title: 'Reminders',
    empty: 'You have no upcoming reminders.',
    emptyTitle: 'No reminders',
    PAYMENT_DUE: {
      title: 'Pay the rate and deposit',
      message: 'Complete the payment for {item} before the handover.',
    },
    DELIVERY: {
      title: 'Scheduled handover',
      message: 'Get {item} ready to hand it over at the agreed spot.',
    },
    RECEIPT: {
      title: 'Confirm receipt',
      message: 'Confirm you received {item} to activate the loan.',
    },
    RETURN: {
      title: 'Upcoming return',
      message: 'Return {item} on the agreed date and place.',
    },
    RETURN_RECEIPT: {
      title: 'Receive the return',
      message: 'Review and confirm the return of {item}.',
    },
  },
  notifications: {
    eyebrow: 'Activity',
    title: 'Notifications and reminders',
    description:
      'Events that already happened and your upcoming obligations are shown separately.',
    happened: 'What happened',
    listTitle: 'Notifications',
    markAll: 'Mark all as read',
    onlyUnread: 'Unread only ({count})',
    unread: 'Unread',
    empty: 'You have no notifications.',
    emptyTitle: "You're all caught up",
    emptyDescription: 'You have no notifications to show.',
    events: {
      REQUEST_CREATED: {
        title: 'New request',
        message: 'You received a request for {item}.',
      },
      REQUEST_CANCELLED: {
        title: 'Request cancelled',
        message: 'The borrower cancelled their request for {item}.',
      },
      REQUEST_ACCEPTED: {
        title: 'Request accepted',
        message:
          'Your reservation of {item} was confirmed. Complete the payment and deposit.',
      },
      REQUEST_REJECTED: {
        title: 'Request rejected',
        message: "The lender couldn't accept your request for {item}.",
      },
      RESERVATION_CANCELLED: {
        title: 'Reservation cancelled',
        message: 'The reservation of {item} was cancelled. Reason: {reason}',
      },
      PAYMENT_CONFIRMED: {
        title: 'Payment confirmed',
        message: 'The rate payment for {item} was approved.',
      },
      PAYMENT_FAILED: {
        title: 'Payment not confirmed',
        message: "The payment for {item} wasn't completed. Try again.",
      },
      GUARANTEE_HELD: {
        title: 'Deposit placed',
        message: 'The deposit for {item} was placed.',
      },
      GUARANTEE_FAILED: {
        title: 'Deposit not confirmed',
        message: "The deposit for {item} wasn't completed. Try again.",
      },
      DELIVERY_REGISTERED: {
        title: 'Handover recorded',
        message:
          'The handover of {item} was recorded. Confirm you received it.',
      },
      RECEIPT_CONFIRMED: {
        title: 'Receipt confirmed',
        message: 'The loan of {item} is now active.',
      },
      RENTAL_RELEASED: {
        title: 'Rate released',
        message: 'The rate for {item} was released to you.',
      },
      EXTENSION_REQUESTED: {
        title: 'Extension request',
        message: 'The borrower asked to extend the loan of {item}.',
      },
      EXTENSION_ACCEPTED_PAYMENT_PENDING: {
        title: 'Extension accepted',
        message: 'Pay the additional cost of {item} to apply the new date.',
      },
      EXTENSION_ACCEPTED: {
        title: 'Extension accepted',
        message: 'The new return date for {item} is now current.',
      },
      EXTENSION_REJECTED: {
        title: 'Extension rejected',
        message: 'The return date for {item} stays the same.',
      },
      EXTENSION_PAYMENT_CONFIRMED: {
        title: 'Extension paid',
        message: 'The new return date for {item} is now current.',
      },
      RESCHEDULE_PROPOSED: {
        title: 'New date proposed',
        message:
          'The lender proposes rescheduling the return of {item} at no cost.',
      },
      RESCHEDULE_ACCEPTED: {
        title: 'Reschedule accepted',
        message: 'The new return date for {item} is now current.',
      },
      RESCHEDULE_REJECTED: {
        title: 'Reschedule rejected',
        message: 'The return date for {item} stays the same.',
      },
      RETURN_REGISTERED: {
        title: 'Return recorded',
        message: 'Review the evidence and confirm the return of {item}.',
      },
      EARLY_RETURN_REGISTERED: {
        title: 'Early return',
        message:
          '{item} was returned before the agreed date. Review and confirm.',
      },
      RETURN_CONFIRMED_PENDING_INCIDENT: {
        title: 'Return confirmed',
        message: 'The deposit for {item} awaits the incident resolution.',
      },
      LOAN_COMPLETED: {
        title: 'Loan completed',
        message: 'The loan of {item} ended. Rate your experience!',
      },
      LOAN_OVERDUE: {
        title: 'Loan overdue',
        message: 'The return of {item} is overdue.',
      },
      INCIDENT_CREATED: {
        title: 'Incident reported',
        message: 'Incident {incidentId} was reported about {item}.',
      },
      INCIDENT_ADMIN_NEW: {
        title: 'New incident',
        message: 'Incident {incidentId} is awaiting review.',
      },
      INCIDENT_UNDER_REVIEW: {
        title: 'Incident under review',
        message: 'The LendUp team started reviewing incident {incidentId}.',
      },
      INCIDENT_RESOLVED: {
        title: 'Incident resolved',
        message: 'The resolution of incident {incidentId} is now available.',
      },
      RATING_RECEIVED: {
        title: 'New rating',
        message: 'You received a rating for the loan of {item}.',
      },
    },
  },
  timeline: {
    DELIVERY_RECORDED: 'Handover recorded by the lender',
    RECEIPT_PENDING: 'Receipt confirmation',
    RECEIPT_CONFIRMED: 'Receipt confirmed · loan active',
    RETURN_RECORDED: 'Return recorded',
    EARLY_RETURN_RECORDED: 'Early return recorded',
    RETURN_CONFIRMATION_PENDING: 'Return confirmation',
    RETURN_CONFIRMED_PENDING_INCIDENT: 'Return confirmed · incident pending',
    LOAN_COMPLETED: 'Loan completed',
    LOAN_OVERDUE: 'Return date overdue',
    INCIDENT_REPORTED: 'Incident recorded',
    INCIDENT_REVIEW: 'Administrative review',
    INCIDENT_RESOLVED: 'Resolution recorded',
  },
  transactionTypes: {
    RENTAL_PAYMENT: 'Rate payment',
    RENTAL_RELEASE: 'Rate transferred to lender',
    GUARANTEE_HOLD: 'Deposit placed',
    GUARANTEE_RELEASE: 'Deposit return',
    GUARANTEE_PARTIAL_CAPTURE: 'Partial deduction for incident',
    GUARANTEE_CAPTURE: 'Full deduction for incident',
    REFUND: 'Cancellation refund',
    EXTENSION_PAYMENT: 'Extension payment',
  },
  transactions: {
    eyebrow: 'Financial activity',
    title: 'Transactions',
    description:
      'Payments, deposits, releases, returns and refunds linked to your operations.',
    export: 'Download CSV',
    filterType: 'Operation type',
    allTypes: 'All types',
    totals: {
      paid: 'Paid in rates',
      received: 'Received as lender',
      held: 'Deposits held',
    },
    columns: {
      date: 'Date',
      type: 'Operation',
      item: 'Item',
      amount: 'Amount',
      status: 'Status',
      method: 'Method',
      reference: 'Provider reference',
      actions: 'Actions',
    },
    related: {
      reservation: 'View reservation',
      loan: 'View loan',
      incident: 'View incident {id}',
    },
    openOperation: 'Open related operation',
    emptyTitle: 'You have no transactions',
    emptyDescription:
      'Your payments, deposits and refunds will show up here when you make operations.',
    csv: {
      date: 'Date',
      type: 'Operation',
      item: 'Item',
      amount: 'Amount (PEN)',
      method: 'Method',
      status: 'Status',
      reference: 'Reference',
      reservation: 'Reservation',
      loan: 'Loan',
      incident: 'Incident',
    },
  },
  dashboard: {
    eyebrow: 'Personal dashboard',
    adminEyebrow: 'Admin dashboard',
    greeting: 'Hi, {name}',
    description: "Here's what matters most in your operations today.",
    adminDescription: 'Supervise the incidents that need review.',
    explore: 'Explore items',
    openInbox: 'Open inbox',
    nextAction: 'Your next action',
    nextPay: 'Complete your reservation payment',
    nextRequests: 'You have {count} request(s) to answer',
    reviewNow: 'Review now',
    allClear: "You're all caught up. No pending actions.",
    summary: 'Activity summary',
    metrics: {
      activeLoans: 'Loans in progress',
      pendingRequests: 'Requests to answer',
      reservations: 'Confirmed reservations',
      listings: 'Published items',
      incidents: 'Open incidents',
    },
    agenda: 'Schedule',
    upcomingReminders: 'Upcoming reminders',
    viewCalendar: 'View calendar',
    activity: 'Activity',
    recentNotifications: 'Recent notifications',
    viewAll: 'View all',
  },
  profile: {
    eyebrow: 'Account',
    title: 'My profile',
    description:
      'Your university identity and your reputation in the LendUp community.',
    edit: 'Edit profile',
    editTitle: 'Edit profile',
    editDescription: 'Update your photo, academic details and contact phone.',
    avatar: 'Profile photo',
    avatarPreview: 'Profile photo preview',
    phoneHint:
      'Only shared with your counterpart during an active reservation or loan.',
    readonlyNote:
      "Your name, university and university email can't be changed in this form because they identify your backend profile.",
    cycle: 'term {cycle}',
    verified: 'Verified student',
    notVerified: 'Verification pending',
    verification: 'Verification status',
    privacyNote: "Your email and phone don't appear on your public profile.",
    reputation: 'Reputation',
    ratingsSummary: '{count} rating(s) · {loans} completed loan(s)',
    distribution: 'Rating distribution',
    ratingsOrigin: 'Ratings come only from loans completed on LendUp.',
    completedLoans: 'Completed loans',
    comments: 'Reviews',
    commentsTitle: 'Community experiences',
    noComment: 'Rating without a comment.',
    noReviews: 'No reviews yet. They will appear after completed loans.',
    viewPublic: 'View my public profile',
    terms: 'Terms and conditions',
    publicEyebrow: 'Public profile',
    publicDescription:
      'Verification and reputation within the LendUp community.',
    notFound: 'Profile not found',
  },
  terms: {
    loadFailed: 'We could not load the terms. Retry to read and accept them.',
    versionLabel: 'Current version: {version}',
    verifyFirst: 'Verify your email before accepting the terms.',
    eyebrow: 'Terms and conditions',
    title: 'LendUp terms and conditions',
    description:
      'Rules for lending and requesting items within the university community.',
    disclaimer: {
      body: "LendUp facilitates agreements between students, but doesn't guarantee the condition or operation of the items. Check the item when you receive it and document its condition with evidence.",
    },
    acceptLabel:
      "I have read and accept LendUp's terms and conditions and disclaimer.",
    accept: 'Accept and continue',
    alreadyAccepted: 'You already accepted the current version of the terms.',
    loginToAccept:
      'You can read the terms without signing in. To accept them you need to sign in to your account.',
    adminNotice:
      "Administrative accounts don't need to accept the student terms.",
    gate: {
      title: 'Before your first operation',
      description: 'Review and accept the terms and conditions to continue.',
    },
  },
  maps: {
    open: 'Open in Google Maps',
    embedTitle: 'Map of {place}',
  },
  httpErrors: {
    BAD_REQUEST: 'The request is invalid.',
    UNAUTHENTICATED: 'Your session expired. Sign in again.',
    FORBIDDEN: 'You are not authorized to perform this operation.',
    NOT_FOUND: 'The requested resource does not exist.',
    CONFLICT: 'The operation conflicts with the current state.',
    VALIDATION_ERROR: 'Review the submitted data.',
    SERVER_ERROR: 'The backend could not complete the operation.',
    NETWORK_ERROR: 'The backend could not be reached.',
    UNKNOWN: 'An unexpected request error occurred.',
  },
  errors: {
    notFound: {
      title: 'Page not found',
      description:
        "The link you opened doesn't exist or you don't have access to this content.",
    },
  },
  results: {
    auth: {
      signedIn: 'Signed in.',
      registered: 'Account created successfully.',
    },
    verification: {
      sent: 'The verification request was submitted and is pending.',
      notAllowed: "This account can't be verified.",
    },
    profile: { saved: 'Profile updated successfully.' },
    terms: {
      accepted: 'You accepted the terms and conditions.',
      loginRequired: 'Sign in to accept the terms.',
    },
    gate: {
      verificationRequired:
        'Complete student verification before doing this operation.',
      termsRequired:
        'Accept the terms and conditions before doing this operation.',
      forbidden: "You don't have permission to do this action.",
    },
    listing: {
      published: 'Item published.',
      updated: 'Listing updated. Changes apply to new requests.',
    },
    request: {
      created: "Request sent. We'll let you know when the lender responds.",
      cancelled: 'Request cancelled.',
      accepted:
        'Request accepted: the reservation was created and the period was blocked.',
      rejected: 'Request rejected.',
      listingUnavailable: 'The listing is not available for new requests.',
      ownListing: "You can't request your own item.",
      invalidRange: 'The end date must be after the start date.',
      pastStart: 'The period must start in the future.',
      periodTaken: 'That period was already reserved by another request.',
    },
    reservation: {
      cancelled:
        'Reservation cancelled. The period was released and applicable refunds were processed.',
      cancelNotAllowed:
        'The reservation can no longer be cancelled because the item was handed over.',
      reasonRequired: 'Provide the cancellation reason.',
    },
    payment: {
      guaranteePending:
        'The deposit request was recorded and remains pending confirmation.',
    },
    delivery: {
      recorded:
        'Handover recorded. We notified the borrower to confirm receipt.',
      notAllowed: "This reservation doesn't allow a new handover record.",
      paymentRequired: 'The rate payment must be approved before the handover.',
      guaranteeRequired: 'The deposit must be placed before the handover.',
    },
    loan: { receiptConfirmed: 'Receipt confirmed: the loan is active.' },
    extension: {
      requested:
        "Extension requested. The current date doesn't change until it is accepted.",
      accepted: 'Extension accepted and date updated.',
      acceptedPaymentPending:
        'Extension accepted. It will apply once the borrower pays the additional cost.',
      rejected: 'Extension rejected.',
      paid: 'Extension paid. The new return date is current.',
      notActive: 'You can only extend an active loan that is not overdue.',
      alreadyPending: 'There is already a pending extension for this loan.',
      mustBeLater: 'The new date must be after the current return.',
      overlaps:
        'The new date overlaps another confirmed reservation of the item.',
      nothingToPay: 'There is no extension pending payment.',
    },
    reschedule: {
      proposed: 'Proposal sent to the borrower.',
      accepted: 'Reschedule accepted. The new date is current.',
      rejected: 'Reschedule rejected. The current date stays the same.',
      notActive: 'You can only reschedule an active loan that is not overdue.',
      alreadyPending: 'There is already a pending proposal.',
      mustBeFuture: 'Select a future date.',
      sameDate: 'The proposed date is the same as the current one.',
      overlaps: 'The proposed date overlaps another confirmed reservation.',
    },
    return: {
      recorded: 'Return recorded. We notified the lender to confirm it.',
      confirmedCompleted:
        'Return confirmed. The loan ended and the deposit was returned.',
      confirmedPendingIncident:
        'Return confirmed. The deposit awaits the incident resolution.',
      notAllowed:
        "The loan doesn't allow recording the return in its current status.",
      notesRequired:
        "Describe the item's condition with at least 10 characters.",
      evidenceRequired: 'Attach at least one piece of final evidence.',
    },
    incident: {
      reported: 'Incident recorded. The deposit was held until it is resolved.',
      statementSaved: 'Statement saved.',
      reviewStarted: 'Review started. Both parties were notified.',
      noteSaved: 'Note saved.',
      resolved: 'Incident resolved. Both parties were notified.',
      loanClosed: "Incidents can't be reported on a completed loan.",
      descriptionRequired: 'Describe the incident with at least 20 characters.',
      statementRequired: 'The statement must have at least 20 characters.',
      noteRequired: 'The note must have at least 5 characters.',
      reviewRequired: 'The incident must be under review to resolve it.',
      justificationRequired: 'The rationale must have at least 20 characters.',
      invalidAmount:
        'The amount must be greater than zero and not exceed the available deposit.',
      invalidAmountDetail: 'Enter an amount greater than zero and up to {max}.',
    },
    rating: {
      saved: 'Thanks! Your rating was recorded.',
      alreadyRated: 'You already rated this loan.',
      notAllowed: 'Only participants of a completed loan can rate.',
      invalidStars: 'Select between 1 and 5 stars.',
    },
  },
};
