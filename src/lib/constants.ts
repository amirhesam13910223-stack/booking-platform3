export const APP_NAME = "AIHub";

export const PLANS = {
  FREE: {
    id: "free",
    name: "رایگان",
    priceToman: 0,
    priceYearlyToman: 0,
    dailyMessageLimit: 15,
    monthlyDocumentLimit: 3,
    monthlyContentLimit: 5,
    codeAssistantAccess: false,
    priorityQueue: false,
  },
  PRO: {
    id: "pro",
    name: "حرفه‌ای",
    priceToman: 149_000,
    priceYearlyToman: 1_490_000,
    dailyMessageLimit: 200,
    monthlyDocumentLimit: 50,
    monthlyContentLimit: -1,
    codeAssistantAccess: true,
    priorityQueue: true,
  },
  ULTRA: {
    id: "ultra",
    name: "اولترا",
    priceToman: 349_000,
    priceYearlyToman: 3_490_000,
    dailyMessageLimit: 1500,
    monthlyDocumentLimit: -1,
    monthlyContentLimit: -1,
    codeAssistantAccess: true,
    priorityQueue: true,
  },
} as const;

export const REFERRAL = {
  REFERRER_CREDITS: 50,
  REFERRED_CREDITS: 20,
  FREE_PRO_THRESHOLD: 5,
} as const;

export const OTP = {
  CODE_LENGTH: 5,
  EXPIRY_MINUTES: 2,
  MAX_ATTEMPTS: 3,
  LOCKOUT_MINUTES: 5,
  RESEND_COOLDOWN_SECONDS: 120,
  MAX_PER_PHONE_PER_10MIN: 3,
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  ALLOWED_EXTENSIONS: [".pdf", ".txt", ".doc", ".docx", ".csv", ".xls", ".xlsx"],
} as const;

export const QUOTA_WARNING_THRESHOLD = 0.8;
