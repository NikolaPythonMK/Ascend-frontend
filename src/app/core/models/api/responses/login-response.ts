import { BusinessProfile } from "./business-profile.model";
import { OrganizationPreferences } from "./organization-preferences.model";
import { StaffPreferences } from "./staff-preferences.model";

export interface LoginResponse {
    organizationID: number,
    locationID: number,
    businessProfile: BusinessProfile,
    organizationPreferences: OrganizationPreferences,
    staffPreferences: StaffPreferences
}
