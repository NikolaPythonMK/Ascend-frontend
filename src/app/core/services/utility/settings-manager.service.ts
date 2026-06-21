import { Injectable, signal } from "@angular/core";
import { BusinessProfile } from "../../models/api/responses/business-profile.model";
import { OrganizationPreferences } from "../../models/api/responses/organization-preferences.model";
import { StaffPreferences } from "../../models/api/responses/staff-preferences.model";
import { Language } from "../../models/enums/language.enum";
import { TableView } from "../../models/enums/table-view.enum";

@Injectable({
    providedIn: 'root'
})
export class SettingsManagerService {
    public businessProfile = signal<BusinessProfile | null>(null);
    public organizationPreferences = signal<OrganizationPreferences | null>(null);
    public staffPreferences = signal<StaffPreferences | null>(null);

    setUpOrganizationSettings(businessProfile: BusinessProfile,
                              organizationPreferences: OrganizationPreferences): void {
          this.businessProfile.set(businessProfile);
          this.organizationPreferences.set(organizationPreferences);
    }

    removeOrganizationSettings(): void {
        this.businessProfile.set(null);
        this.organizationPreferences.set(null);
    }

    setUpStaffSettings(staffPreferences: StaffPreferences): void {
        console.log('SETUP: ', staffPreferences);
        this.staffPreferences.set(staffPreferences);
    }

    removeStaffSettings(): void {
        this.staffPreferences.set(null);
    }

    getLanguage(): number {
        const staffLanguage = this.staffPreferences()?.language;
        if (staffLanguage != null && staffLanguage !== Language.Default) {
            return staffLanguage;
        }

        const organizationLanguage = this.organizationPreferences()?.language;
        return organizationLanguage != null && organizationLanguage !== Language.Default
            ? organizationLanguage
            : Language.En;
    }

    getDefaultTableView(): number {
        const staffDefaultTableView = this.staffPreferences()?.defaultTableView;
        if (
            staffDefaultTableView != null &&
            staffDefaultTableView !== TableView.Default
        ) {
            return staffDefaultTableView;
        }

        return this.organizationPreferences()?.defaultTableView ?? TableView.Table;
    }

    canEditOtherTables(): boolean {
        return this.organizationPreferences()!.canEditOtherTables;
    }

    canRemoveTableItems(): boolean {
        return this.organizationPreferences()!.canRemoveTableItems;
    }

    displayTaxAmount(): boolean {
        return this.organizationPreferences()!.displayTaxAmount;
    }

    logoutAfterTransaction(): boolean {
        return this.organizationPreferences()!.logoutAfterTransaction;
    }

    displayStaffNameOnTables(): boolean {
        return this.organizationPreferences()!.displayStaffNameOnTables;
    }
}
