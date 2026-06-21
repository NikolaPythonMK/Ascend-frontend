import { TableView } from "../../enums/table-view.enum";
import { Language } from "../../enums/language.enum";

export interface StaffPreferencesRequest {
  staffId: number;
  organizationId: number;
  language: Language;
  defaultTableView: TableView;
  code: string;
}
