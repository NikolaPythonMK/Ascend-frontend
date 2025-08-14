import { Language } from "../../enums/language.enum";
import { Theme } from "../../enums/theme.enum";
import { TableView } from "../../enums/table-view.enum";


export interface OrganizationPreferences {
  organizationId: number;
  language: Language;
  theme: Theme;
  canEditOtherTables: boolean;
  canRemoveTableItems: boolean;
  displayTaxAmount: boolean;
  logoutAfterTransaction: boolean;
  defaultTableView: TableView;
  displayStaffNameOnTables: boolean;
}