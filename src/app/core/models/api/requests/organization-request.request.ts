import { Currency } from '../../enums/currency.enum';

export interface CreateOrganizationRequest {
  organizationName: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  businessPhoneNumber: string;
  businessEmail: string;
  legalName: string;
  taxId: string | null;
  currency: Currency;
  locationName: string;
  numberOfTables: number;
}

export interface ActivateOrganizationRequest {
  token: string;
  password: string;
  confirmPassword: string;
  staffCode: string;
}
