import { Language } from "../../enums/language.enum";
import { Currency } from "../../enums/currency.enum";

export interface BusinessProfileRequest {
  organizationId: number;
  code: string;
  legalName: string;
  taxId: string;
  phoneNumber: string;
  email: string;
  currency: Currency;
  receiptLanguage: Language;
  country: string;
  postalCode: string;
  city: string;
}