import { Currency } from '../../enums/currency.enum';

export interface OrganizationRequestSubmittedResponse {
  message: string;
}

export interface OrganizationActivationDetails {
  id: number;
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
  status: number;
  createdAt: string;
}

export interface OrganizationActivatedResponse {
  organizationId: number;
}
