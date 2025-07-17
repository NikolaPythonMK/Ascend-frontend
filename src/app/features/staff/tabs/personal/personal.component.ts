import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { TableComponent } from "../../../../core/ui/table/table.component";
import { StaffService } from "../../../../core/services/api/staff.service";
import { HttpErrorResponse } from "@angular/common/http";
import { SnackbarService } from "../../../../core/services/utility/snackbar.service";
import type { Page } from "../../../../core/models/api/page.model";
import { StaffUserRow } from "../../models/staff-user-row.model";
import { MatDialog } from "@angular/material/dialog";
import { StaffUserDialog } from "../../dialogs/staff-user-dialog/staff-user.component";
import { filter, Observer, switchMap } from "rxjs";
import { Sort } from "../../../../core/ui/table/models/sort.model";
import { TableStateService } from "../../../../core/services/utility/table-state.service";
import type { StaffUser } from "../../../../core/models/api/responses/staff-user.model";
import { DataRow } from "../../../../core/ui/table/models/data-row";


@Component({
    selector: 'personal-component',
    imports: [TableComponent],
    providers: [TableStateService],
    templateUrl: 'personal.component.html',
    styleUrls: ['personal.component.scss']
})
export class PersonalComponent implements OnInit{
    private readonly staffService = inject(StaffService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly tableState = inject(TableStateService);
    readonly dialog = inject(MatDialog);
    staffUsers = signal<StaffUser[]>([]);
    staffUsersRows = signal<DataRow[]>([]);
    map = new Map<string, string>([
        ['Name', 'name'],
        ['Last Name', 'lastName'],
        ['Phone Number', 'phoneNumber'],
        ['Roles', 'roles']
    ]);
    colDisplayNames = computed(() => [...this.map.keys()]);
    nonSortableColumns = signal<string[]>(['Roles'])

    searchTerm = this.tableState.searchTerm; // Use shared search state
    sort = this.tableState.sort; // Use shared sort state

    // searchTerm = signal<SearchTerm[]>([]);
    // sort = signal<Sort | undefined>(undefined);

    ngOnInit(): void {
        this.getStaff();
    }

    onAddStaff(): void {
        const dialogRef = this.dialog.open(StaffUserDialog);
        dialogRef.afterClosed().subscribe((result: StaffUser) => {
            if (result){
                this.getStaff();
            }
        })
    }

    onUpdateStaff(id: number): void {
        const dialogRef = this.dialog.open(StaffUserDialog, {
            data: id
        })
        dialogRef.afterClosed().pipe(
            filter((value: StaffUser | number | undefined) => value != null),
            switchMap((result: StaffUser | number) => this.staffService.getAll())
        ).subscribe(this.getStaffHandler());
    }

    private getStaff(): void {
        this.staffService.getAll(this.searchTerm(), this.sort()).subscribe(this.getStaffHandler());
    }

    private getStaffHandler(): Partial<Observer<Page<StaffUser>>> {
        return {
            next: (result: Page<StaffUser>) => {
                this.staffUsers.set(result.data);
                this.staffUsersRows.set(this.mapToStaffUserRows(result.data));
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
            }
        }
    }

    private mapToStaffUserRows(staffUsers: StaffUser[]): DataRow[] {
        const staffUserRows: DataRow[] = staffUsers.map(i => {
            const joinedRoles = i.staffUserRoles!.map(s => s.name).join(", ");
            return {
                id: i.id,
                properties: {
                name: i.name!,
                lastName: i.lastName!,
                phoneNumber: i.phoneNumber!,
                roles: joinedRoles
                }
            } as DataRow
        })
        return staffUserRows;
    }

    onSort(sort: Sort | null) {
        this.tableState.setSort(sort, this.map);
        this.getStaff();
      }
      

    onSearch(term: string) {
        this.tableState.setSearch(term, this.colDisplayNames(), this.nonSortableColumns(), this.map);
        this.getStaff();
    }
}
