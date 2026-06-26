import { Currency } from "../../enums/currency.enum";

export interface BusinessProfileRequest {
  organizationId: number;
  code: string;
  taxId: string | null;
  phoneNumber: string;
  currency: Currency;
  // receiptLanguage: Language;
}
