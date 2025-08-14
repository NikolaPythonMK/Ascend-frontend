import { BusinessProfile } from "./business-profile.model";
import { OrganizationPreferences } from "./organization-preferences.model";
import { StaffPreferences } from "./staff-preferences.model";
import { TaxCompliance } from "./tax-compliance.model";

export interface LoginResponse {
    organizationID: number,
    locationID: number,
    businessProfile: BusinessProfile,
    taxCompliance: TaxCompliance
    organizationPreferences: OrganizationPreferences,
    staffPreferences: StaffPreferences
}