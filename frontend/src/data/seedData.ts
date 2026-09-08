import { User, BankAccount, CreditCard, Category, Transaction } from '../types';

export const INITIAL_USER: User = {
  id: 'user_jyothi_01',
  name: 'Jyothi',
  email: 'jyothiswarup.n@gmail.com',
  passwordHash: 'arsonist2026',
  createdAt: '2026-08-01T00:00:00.000Z',
  lastLogin: '2026-09-05T23:00:00.000Z'
};

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank_indusind',
    name: 'IndusInd Bank',
    initialOpeningBalance: 85420,
    accountNumberMask: '•••• 4912',
    color: '#3872ff'
  },
  {
    id: 'bank_idfc',
    name: 'IDFC First Bank',
    initialOpeningBalance: 145200,
    accountNumberMask: '•••• 7731',
    color: '#c3f400'
  },
  {
    id: 'bank_kotak',
    name: 'Kotak Mahindra',
    initialOpeningBalance: 42150,
    accountNumberMask: '•••• 8102',
    color: '#ff4d6d'
  }
];

export const INITIAL_CREDIT_CARDS: CreditCard[] = [
  {
    id: 'card_sbm',
    name: 'SBM Credit Card',
    creditLimit: 150000,
    initialOpeningBalance: 18420,
    cardNumberMask: '•••• 8812',
    dueDateDay: 18,
    autoPay: true,
    color: '#ffb703'
  },
  {
    id: 'card_airtel_axis',
    name: 'Airtel Axis Bank Card',
    creditLimit: 100000,
    initialOpeningBalance: 9800,
    cardNumberMask: '•••• 3421',
    dueDateDay: 22,
    autoPay: false,
    color: '#2b59ff'
  },
  {
    id: 'card_axis_myzone',
    name: 'Axis MyZone Card',
    creditLimit: 250000,
    initialOpeningBalance: 24350,
    cardNumberMask: '•••• 6019',
    dueDateDay: 5,
    autoPay: true,
    color: '#9d4edd'
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat_software',
    name: 'Software & Subscriptions',
    type: 'Work',
    icon: 'code',
    subcategories: [
      { id: 'sub_aws', name: 'AWS Cloud Infrastructure', categoryId: 'cat_software', individualBudget: 28000, recurringDueDate: 3 },
      { id: 'sub_github', name: 'GitHub Enterprise', categoryId: 'cat_software', individualBudget: 4200, recurringDueDate: 12 },
      { id: 'sub_google_ws', name: 'Google Workspace', categoryId: 'cat_software', individualBudget: 6500, recurringDueDate: 15 },
      { id: 'sub_openai', name: 'OpenAI API & Anthropic', categoryId: 'cat_software', individualBudget: 18000, recurringDueDate: 1 },
      { id: 'sub_figma', name: 'Figma & Design Tools', categoryId: 'cat_software', individualBudget: 3500, recurringDueDate: 18 },
      { id: 'sub_vercel', name: 'Vercel / Supabase', categoryId: 'cat_software', individualBudget: 5000, recurringDueDate: 24 }
    ]
  },
  {
    id: 'cat_office',
    name: 'Office Supplies & Equipment',
    type: 'Work',
    icon: 'desktop_windows',
    subcategories: [
      { id: 'sub_hardware', name: 'Hardware & Monitors', categoryId: 'cat_office', individualBudget: 15000 },
      { id: 'sub_ergonomics', name: 'Office Maintenance & Supplies', categoryId: 'cat_office', individualBudget: 8000 }
    ]
  },
  {
    id: 'cat_prof_services',
    name: 'Professional Services (Legal/CA)',
    type: 'Work',
    icon: 'gavel',
    subcategories: [
      { id: 'sub_ca_retainer', name: 'CA Monthly Retainer & Audit', categoryId: 'cat_prof_services', individualBudget: 25000, recurringDueDate: 7 },
      { id: 'sub_legal', name: 'Legal Filing & ROC Compliance', categoryId: 'cat_prof_services', individualBudget: 10000 }
    ]
  },
  {
    id: 'cat_salaries',
    name: 'Salaries & Contractors',
    type: 'Work',
    icon: 'badge',
    subcategories: [
      { id: 'sub_contractor_eng', name: 'Frontend / Mobile Contractor', categoryId: 'cat_salaries', individualBudget: 85000, recurringDueDate: 1 },
      { id: 'sub_contractor_design', name: 'Brand & UX Contractor', categoryId: 'cat_salaries', individualBudget: 45000, recurringDueDate: 5 }
    ]
  },
  {
    id: 'cat_travel',
    name: 'Travel',
    type: 'Both',
    icon: 'flight',
    subcategories: [
      { id: 'sub_flights', name: 'Flights & Rail', categoryId: 'cat_travel', individualBudget: 22000 },
      { id: 'sub_hotels', name: 'Hotels & Stay', categoryId: 'cat_travel', individualBudget: 16000 },
      { id: 'sub_cabs', name: 'Uber, Ola & Fuel', categoryId: 'cat_travel', individualBudget: 9000 }
    ]
  },
  {
    id: 'cat_education',
    name: 'Education',
    type: 'Both',
    icon: 'menu_book',
    subcategories: [
      { id: 'sub_books', name: 'Books & Research', categoryId: 'cat_education', individualBudget: 3500 },
      { id: 'sub_courses', name: 'Certifications & Courses', categoryId: 'cat_education', individualBudget: 8000 }
    ]
  },
  {
    id: 'cat_savings',
    name: 'Savings & Investments',
    type: 'Both',
    icon: 'account_balance',
    subcategories: [
      { id: 'sub_mutual_funds', name: 'Index Funds & SIP', categoryId: 'cat_savings', individualBudget: 50000, recurringDueDate: 10 },
      { id: 'sub_vault', name: 'Emergency Liquid Vault', categoryId: 'cat_savings', individualBudget: 30000, recurringDueDate: 10 }
    ]
  },
  {
    id: 'cat_income',
    name: 'Income',
    type: 'Both',
    icon: 'payments',
    subcategories: [
      { id: 'sub_client_retainer', name: 'Client Retainer (Arsonist Group)', categoryId: 'cat_income', individualBudget: 380000 },
      { id: 'sub_consulting', name: 'Consulting Advisory', categoryId: 'cat_income', individualBudget: 120000 },
      { id: 'sub_interest', name: 'Vault & Deposit Interest', categoryId: 'cat_income', individualBudget: 12000 }
    ]
  },
  {
    id: 'cat_internet_phone',
    name: 'Internet & Phone',
    type: 'Both',
    icon: 'wifi',
    subcategories: [
      { id: 'sub_broadband', name: 'High-speed Fiber', categoryId: 'cat_internet_phone', individualBudget: 3200, recurringDueDate: 14 },
      { id: 'sub_mobile', name: 'Airtel Postpaid Plans', categoryId: 'cat_internet_phone', individualBudget: 2400, recurringDueDate: 16 }
    ]
  },
  {
    id: 'cat_subscriptions',
    name: 'Subscriptions',
    type: 'Personal',
    icon: 'subscriptions',
    subcategories: [
      { id: 'sub_spotify', name: 'Spotify Duo', categoryId: 'cat_subscriptions', individualBudget: 199, recurringDueDate: 24 },
      { id: 'sub_netflix', name: 'Netflix Premium 4K', categoryId: 'cat_subscriptions', individualBudget: 649, recurringDueDate: 11 },
      { id: 'sub_gym', name: 'Cult.fit Fitness Pass', categoryId: 'cat_subscriptions', individualBudget: 2800, recurringDueDate: 1 }
    ]
  },
  {
    id: 'cat_entertainment',
    name: 'Entertainment & Leisure',
    type: 'Personal',
    icon: 'movie',
    subcategories: [
      { id: 'sub_movies', name: 'Cinema & Concerts', categoryId: 'cat_entertainment', individualBudget: 4500 },
      { id: 'sub_gaming', name: 'Gaming & Books', categoryId: 'cat_entertainment', individualBudget: 3000 }
    ]
  },
  {
    id: 'cat_shopping',
    name: 'Shopping',
    type: 'Personal',
    icon: 'shopping_bag',
    subcategories: [
      { id: 'sub_apparel', name: 'Apparel & Footwear', categoryId: 'cat_shopping', individualBudget: 12000 },
      { id: 'sub_electronics', name: 'Gadgets & Home', categoryId: 'cat_shopping', individualBudget: 15000 }
    ]
  },
  {
    id: 'cat_groceries',
    name: 'Groceries',
    type: 'Personal',
    icon: 'shopping_cart',
    subcategories: [
      { id: 'sub_nature_basket', name: 'Supermarket & Nature Basket', categoryId: 'cat_groceries', individualBudget: 22000 },
      { id: 'sub_organic', name: 'Organic Fruits & Veggies', categoryId: 'cat_groceries', individualBudget: 9000 },
      { id: 'sub_dairy', name: 'Daily Dairy & Essentials', categoryId: 'cat_groceries', individualBudget: 4500 }
    ]
  },
  {
    id: 'cat_dining',
    name: 'Dining Out',
    type: 'Personal',
    icon: 'restaurant',
    subcategories: [
      { id: 'sub_restaurants', name: 'Weekend Dining & Socials', categoryId: 'cat_dining', individualBudget: 18000 },
      { id: 'sub_cafes', name: 'Third Wave Coffee & Cafes', categoryId: 'cat_dining', individualBudget: 6000 },
      { id: 'sub_delivery', name: 'Swiggy / Zomato Orders', categoryId: 'cat_dining', individualBudget: 8500 }
    ]
  },
  {
    id: 'cat_cc_payment',
    name: 'Credit Card Payment',
    type: 'Both',
    icon: 'credit_card',
    isTransfer: true // Excluded from Income and Expense totals to avoid double counting per Section 12.12
  }
];

export const STARTER_CATEGORIES: Category[] = [
  {
    id: 'cat_income',
    name: 'Income',
    type: 'Both',
    icon: 'payments',
    subcategories: [
      { id: 'sub_salary', name: 'Primary Salary / Revenue', categoryId: 'cat_income', individualBudget: 0 },
      { id: 'sub_freelance', name: 'Consulting / Freelance', categoryId: 'cat_income', individualBudget: 0 },
      { id: 'sub_investments', name: 'Investments & Interest', categoryId: 'cat_income', individualBudget: 0 }
    ]
  },
  {
    id: 'cat_housing',
    name: 'Housing & Utilities',
    type: 'Both',
    icon: 'home',
    subcategories: [
      { id: 'sub_rent', name: 'Rent / Mortgage', categoryId: 'cat_housing', individualBudget: 0 },
      { id: 'sub_electricity', name: 'Electricity & Water', categoryId: 'cat_housing', individualBudget: 0 },
      { id: 'sub_internet', name: 'WiFi & Mobile Postpaid', categoryId: 'cat_housing', individualBudget: 0 }
    ]
  },
  {
    id: 'cat_groceries',
    name: 'Groceries & Essentials',
    type: 'Personal',
    icon: 'shopping_cart',
    subcategories: [
      { id: 'sub_supermarket', name: 'Supermarket & Produce', categoryId: 'cat_groceries', individualBudget: 0 },
      { id: 'sub_dairy', name: 'Dairy & Daily Needs', categoryId: 'cat_groceries', individualBudget: 0 }
    ]
  },
  {
    id: 'cat_dining',
    name: 'Dining & Cafes',
    type: 'Personal',
    icon: 'restaurant',
    subcategories: [
      { id: 'sub_restaurants', name: 'Restaurants & Socials', categoryId: 'cat_dining', individualBudget: 0 },
      { id: 'sub_delivery', name: 'Food Delivery', categoryId: 'cat_dining', individualBudget: 0 }
    ]
  },
  {
    id: 'cat_transport',
    name: 'Travel & Commute',
    type: 'Both',
    icon: 'flight',
    subcategories: [
      { id: 'sub_fuel_cabs', name: 'Fuel, Cabs & Transit', categoryId: 'cat_transport', individualBudget: 0 },
      { id: 'sub_flights', name: 'Flights & Rail', categoryId: 'cat_transport', individualBudget: 0 }
    ]
  },
  {
    id: 'cat_software',
    name: 'Software & Cloud Tools',
    type: 'Work',
    icon: 'code',
    subcategories: [
      { id: 'sub_cloud', name: 'Hosting & Cloud Servers', categoryId: 'cat_software', individualBudget: 0 },
      { id: 'sub_saas', name: 'SaaS Subscriptions', categoryId: 'cat_software', individualBudget: 0 }
    ]
  },
  {
    id: 'cat_business_ops',
    name: 'Salaries & Operations',
    type: 'Work',
    icon: 'briefcase',
    subcategories: [
      { id: 'sub_contractors', name: 'Contractors & Freelancers', categoryId: 'cat_business_ops', individualBudget: 0 },
      { id: 'sub_equipment', name: 'Office & Hardware', categoryId: 'cat_business_ops', individualBudget: 0 }
    ]
  },
  {
    id: 'cat_savings',
    name: 'Savings & Investments',
    type: 'Both',
    icon: 'account_balance',
    subcategories: [
      { id: 'sub_mutual_funds', name: 'Mutual Funds & Stocks', categoryId: 'cat_savings', individualBudget: 0 },
      { id: 'sub_emergency', name: 'Emergency Vault', categoryId: 'cat_savings', individualBudget: 0 }
    ]
  },
  {
    id: 'cat_shopping',
    name: 'Shopping & Apparel',
    type: 'Personal',
    icon: 'shopping_bag',
    subcategories: [
      { id: 'sub_lifestyle', name: 'Lifestyle & Electronics', categoryId: 'cat_shopping', individualBudget: 0 }
    ]
  },
  {
    id: 'cat_entertainment',
    name: 'Entertainment & Media',
    type: 'Personal',
    icon: 'movie',
    subcategories: [
      { id: 'sub_streaming', name: 'Streaming & Subscriptions', categoryId: 'cat_entertainment', individualBudget: 0 }
    ]
  },
  {
    id: 'cat_cc_payment',
    name: 'Credit Card Payment',
    type: 'Both',
    icon: 'credit_card',
    isTransfer: true
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // August 2026 Transactions (Demonstrates historical carryover)
  {
    id: 'tx_aug_01',
    userId: 'user_jyothi_01',
    date: '2026-08-01',
    description: 'Arsonist Holdings Client Payout',
    type: 'Work',
    categoryId: 'cat_income',
    subcategoryId: 'sub_client_retainer',
    accountOrCardId: 'bank_idfc',
    direction: 'Credit',
    amount: 380000,
    createdAt: '2026-08-01T10:00:00Z'
  },
  {
    id: 'tx_aug_02',
    userId: 'user_jyothi_01',
    date: '2026-08-02',
    description: 'Contractor Engineering Retainer',
    type: 'Work',
    categoryId: 'cat_salaries',
    subcategoryId: 'sub_contractor_eng',
    accountOrCardId: 'bank_idfc',
    direction: 'Debit',
    amount: 85000,
    createdAt: '2026-08-02T11:00:00Z'
  },
  {
    id: 'tx_aug_03',
    userId: 'user_jyothi_01',
    date: '2026-08-03',
    description: 'AWS Cloud Monthly Bill',
    type: 'Work',
    categoryId: 'cat_software',
    subcategoryId: 'sub_aws',
    accountOrCardId: 'card_sbm',
    direction: 'Debit',
    amount: 27450,
    createdAt: '2026-08-03T09:30:00Z'
  },
  {
    id: 'tx_aug_04',
    userId: 'user_jyothi_01',
    date: '2026-08-18',
    description: 'SBM Card Settlement from IndusInd',
    type: 'Work',
    categoryId: 'cat_cc_payment',
    accountOrCardId: 'bank_indusind',
    direction: 'Debit',
    amount: 25000,
    notes: 'Transfer 1/2',
    createdAt: '2026-08-18T14:00:00Z'
  },
  {
    id: 'tx_aug_05',
    userId: 'user_jyothi_01',
    date: '2026-08-18',
    description: 'SBM Card Payment Received',
    type: 'Work',
    categoryId: 'cat_cc_payment',
    accountOrCardId: 'card_sbm',
    direction: 'Credit',
    amount: 25000,
    notes: 'Transfer 2/2',
    createdAt: '2026-08-18T14:05:00Z'
  },
  {
    id: 'tx_aug_06',
    userId: 'user_jyothi_01',
    date: '2026-08-25',
    description: 'Nature Basket Organic Groceries',
    type: 'Personal',
    categoryId: 'cat_groceries',
    subcategoryId: 'sub_nature_basket',
    accountOrCardId: 'card_airtel_axis',
    direction: 'Debit',
    amount: 6840,
    createdAt: '2026-08-25T16:15:00Z'
  },

  // September 2026 Transactions (Current Month - Sep 5, 2026)
  {
    id: 'tx_sep_01',
    userId: 'user_jyothi_01',
    date: '2026-09-01',
    description: 'Arsonist Group Q3 Strategic Retainer',
    type: 'Work',
    categoryId: 'cat_income',
    subcategoryId: 'sub_client_retainer',
    accountOrCardId: 'bank_idfc',
    direction: 'Credit',
    amount: 420000,
    createdAt: '2026-09-01T09:30:00Z'
  },
  {
    id: 'tx_sep_02',
    userId: 'user_jyothi_01',
    date: '2026-09-01',
    description: 'Contractor Engineering Lead Payout',
    type: 'Work',
    categoryId: 'cat_salaries',
    subcategoryId: 'sub_contractor_eng',
    accountOrCardId: 'bank_idfc',
    direction: 'Debit',
    amount: 85000,
    createdAt: '2026-09-01T10:15:00Z'
  },
  {
    id: 'tx_sep_03',
    userId: 'user_jyothi_01',
    date: '2026-09-02',
    description: 'AWS Production Cluster & S3 Storage',
    type: 'Work',
    categoryId: 'cat_software',
    subcategoryId: 'sub_aws',
    accountOrCardId: 'card_sbm',
    direction: 'Debit',
    amount: 26840,
    createdAt: '2026-09-02T11:45:00Z'
  },
  {
    id: 'tx_sep_04',
    userId: 'user_jyothi_01',
    date: '2026-09-03',
    description: 'Figma Organization + OpenAI API Credits',
    type: 'Work',
    categoryId: 'cat_software',
    subcategoryId: 'sub_openai',
    accountOrCardId: 'card_axis_myzone',
    direction: 'Debit',
    amount: 14250,
    createdAt: '2026-09-03T14:20:00Z'
  },
  {
    id: 'tx_sep_05',
    userId: 'user_jyothi_01',
    date: '2026-09-03',
    description: 'Whole Foods & Nature Basket Supplies',
    type: 'Personal',
    categoryId: 'cat_groceries',
    subcategoryId: 'sub_nature_basket',
    accountOrCardId: 'bank_indusind',
    direction: 'Debit',
    amount: 8420,
    createdAt: '2026-09-03T15:30:00Z'
  },
  {
    id: 'tx_sep_06',
    userId: 'user_jyothi_01',
    date: '2026-09-04',
    description: 'Consulting Advisory Retainer (Fintech)',
    type: 'Personal',
    categoryId: 'cat_income',
    subcategoryId: 'sub_consulting',
    accountOrCardId: 'bank_kotak',
    direction: 'Credit',
    amount: 95000,
    createdAt: '2026-09-04T12:00:00Z'
  },
  {
    id: 'tx_sep_07',
    userId: 'user_jyothi_01',
    date: '2026-09-04',
    description: 'Third Wave Coffee Roasters Meetup',
    type: 'Personal',
    categoryId: 'cat_dining',
    subcategoryId: 'sub_cafes',
    accountOrCardId: 'card_airtel_axis',
    direction: 'Debit',
    amount: 1450,
    createdAt: '2026-09-04T16:45:00Z'
  },
  {
    id: 'tx_sep_08',
    userId: 'user_jyothi_01',
    date: '2026-09-05',
    description: 'Airtel Fiber Gigabit Broadband',
    type: 'Work',
    categoryId: 'cat_internet_phone',
    subcategoryId: 'sub_broadband',
    accountOrCardId: 'bank_kotak',
    direction: 'Debit',
    amount: 3200,
    createdAt: '2026-09-05T09:10:00Z'
  },
  {
    id: 'tx_sep_09',
    userId: 'user_jyothi_01',
    date: '2026-09-05',
    description: 'CA Retainer Fee — GST & ROC Audit',
    type: 'Work',
    categoryId: 'cat_prof_services',
    subcategoryId: 'sub_ca_retainer',
    accountOrCardId: 'bank_indusind',
    direction: 'Debit',
    amount: 25000,
    createdAt: '2026-09-05T15:00:00Z'
  }
];
