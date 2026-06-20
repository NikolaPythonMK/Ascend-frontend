import { Injectable, signal } from "@angular/core";
import { BusinessProfile } from "../../models/api/responses/business-profile.model";
import { OrganizationPreferences } from "../../models/api/responses/organization-preferences.model";
import { StaffPreferences } from "../../models/api/responses/staff-preferences.model";
import { Theme } from "../../models/enums/theme.enum";
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

    getTheme(): number {
        return this.staffPreferences()!.theme != Theme.Default ? this.staffPreferences()!.theme : this.organizationPreferences()!.theme
    }

    getLanguage(): number {
        return this.staffPreferences()!.language != Language.Default ? this.staffPreferences()!.language : this.organizationPreferences()!.language
    }

    getDefaultTableView(): number {
        return this.staffPreferences()!.defaultTableView != TableView.Default ? this.staffPreferences()!.defaultTableView : this.organizationPreferences()!.defaultTableView
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
