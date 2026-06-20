import { Language } from "../../enums/language.enum";
import { Currency } from "../../enums/currency.enum";
export interface BusinessProfile {
  organizationId: number;
  legalName: string;
  taxId: string | null;
  phoneNumber: string;
  email: string;
  currency: Currency;
  receiptLanguage: Language;
}
