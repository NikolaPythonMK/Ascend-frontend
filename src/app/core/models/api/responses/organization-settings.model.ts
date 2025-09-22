import { BusinessProfile } from "./business-profile.model";
import { OrganizationPreferences } from "./organization-preferences.model";
import { TaxCompliance } from "./tax-compliance.model";

export interface OrganizationSettings {
    businessProfile: BusinessProfile,
    taxCompliance: TaxCompliance,
    organizationPreferences: OrganizationPreferences
}