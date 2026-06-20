import { BusinessProfile } from "./business-profile.model";
import { OrganizationPreferences } from "./organization-preferences.model";

export interface OrganizationSettings {
    businessProfile: BusinessProfile,
    organizationPreferences: OrganizationPreferences
}
