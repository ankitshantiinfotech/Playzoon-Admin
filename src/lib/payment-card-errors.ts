/**
 * Same validation rules as Playzoon-Web-Front `PaymentMethodsPage` `computePaymentCardErrors`
 * (settingsCards.validation.* English strings).
 */
import {
  type InferredCardBrand,
  inferBrandFromPan,
  getCvvMaxLength,
  isExpiryInPast,
  luhnCheck,
} from "./payment-card";

export type CardFormState = {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
};

export type PaymentMethodForValidation = {
  id: string;
  last4: string;
  provider: InferredCardBrand | string;
  paymentType: string;
};

const MSG = {
  cardNumberRequired: "Card number is required.",
  cardNumberInvalid: "Please enter a valid card number.",
  cardNumberLength: "Card number length is invalid for this card type.",
  cardholderRequired: "Cardholder name is required.",
  cardholderShort: "Please enter the full name as shown on the card.",
  expiryRequired: "Please select expiry month and year.",
  expiryPast: "Expiry date cannot be in the past.",
  cvvRequired: "CVV is required.",
  cvvInvalid: "CVV must contain only digits.",
  cvvLength: "Enter 3 digits (4 for American Express).",
  duplicateCard: "This card is already saved.",
} as const;

/** Map saved-card display brand to InferredCardBrand for duplicate checks. */
export function brandLabelToProvider(brand: string): InferredCardBrand {
  const b = (brand || "").toLowerCase();
  if (b.includes("visa")) return "visa";
  if (b.includes("master")) return "mastercard";
  if (b.includes("amex") || b.includes("american")) return "amex";
  if (b.includes("mada")) return "mada";
  return "unknown";
}

export function computePaymentCardErrors(
  form: CardFormState,
  methods: PaymentMethodForValidation[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  const digits = form.cardNumber.replace(/\D/g, "");
  const brand = inferBrandFromPan(digits);
  const isAmex = digits.startsWith("34") || digits.startsWith("37");

  if (!digits) {
    errors.cardNumber = MSG.cardNumberRequired;
  } else if (digits.length < 13 || digits.length > 19) {
    errors.cardNumber = MSG.cardNumberLength;
  } else if (isAmex && digits.length !== 15) {
    errors.cardNumber = MSG.cardNumberLength;
  } else if (!luhnCheck(digits)) {
    errors.cardNumber = MSG.cardNumberInvalid;
  }

  const name = form.cardholderName.trim();
  if (!name) {
    errors.cardholderName = MSG.cardholderRequired;
  } else if (name.length < 2) {
    errors.cardholderName = MSG.cardholderShort;
  }

  if (!form.expiryMonth || !form.expiryYear) {
    errors.expiry = MSG.expiryRequired;
  } else {
    const em = parseInt(form.expiryMonth, 10);
    const ey = parseInt(form.expiryYear, 10);
    if (!Number.isFinite(em) || !Number.isFinite(ey) || isExpiryInPast(em, ey)) {
      errors.expiry = MSG.expiryPast;
    }
  }

  const cvvLen = getCvvMaxLength(brand);
  const cvvDigits = form.cvv.replace(/\D/g, "");
  if (!cvvDigits) {
    errors.cvv = MSG.cvvRequired;
  } else if (!/^\d+$/.test(form.cvv)) {
    errors.cvv = MSG.cvvInvalid;
  } else if (cvvDigits.length !== cvvLen) {
    errors.cvv = MSG.cvvLength;
  }

  if (!errors.cardNumber && !errors.expiry && digits.length >= 13) {
    const lastFour = digits.slice(-4);
    const dup = methods.some(
      (m) =>
        m.paymentType === "card" &&
        m.last4 === lastFour &&
        String(m.provider).toLowerCase() === brand,
    );
    if (dup) {
      errors.cardNumber = MSG.duplicateCard;
    }
  }

  return errors;
}
