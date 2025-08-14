import { TableView } from "../../enums/table-view.enum";
import { Language } from "../../enums/language.enum";
import { Theme } from "../../enums/theme.enum";

export interface StaffPreferencesRequest {
  staffId: number;
  organizationId: number;
  language: Language;
  theme: Theme;
  defaultTableView: TableView;
  code: string;
}