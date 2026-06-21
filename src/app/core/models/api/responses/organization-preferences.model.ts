import { Language } from "../../enums/language.enum";
import { TableView } from "../../enums/table-view.enum";
import { TaxCalculationMode } from "../../enums/tax-calculation-mode.enum";


export interface OrganizationPreferences {
  organizationId: number;
  language: Language;
  canEditOtherTables: boolean;
  canRemoveTableItems: boolean;
  displayTaxAmount: boolean;
  logoutAfterTransaction: boolean;
  defaultTableView: TableView;
  displayStaffNameOnTables: boolean;
  taxCalculationMode: TaxCalculationMode;
}
