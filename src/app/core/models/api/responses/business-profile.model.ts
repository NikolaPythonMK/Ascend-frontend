import { Currency } from "../../enums/currency.enum";
export interface BusinessProfile {
  organizationId: number;
  taxId: string | null;
  phoneNumber: string;
  currency: Currency;
  // receiptLanguage: Language;
}
