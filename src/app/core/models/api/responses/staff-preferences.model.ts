import { TableView } from "../../enums/table-view.enum";
import { Language } from "../../enums/language.enum";

export interface StaffPreferences {
    staffId: number;
    organizationId: number;
    language: Language;
    defaultTableView: TableView;
}
