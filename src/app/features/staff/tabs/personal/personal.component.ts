import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { TableComponent } from "../../../../core/ui/table/table.component";
import { StaffService } from "../../../../core/services/api/staff.service";
import { HttpErrorResponse } from "@angular/common/http";
import { SnackbarService } from "../../../../core/services/utility/snackbar.service";
import { Page } from "../../../../core/models/api/page.model";
import { StaffUser } from "../../../../core/models/api/staff-user.model";
import { StaffUserRow } from "../../models/staff-user-row.model";
import { MatDialog } from "@angular/material/dialog";
import { StaffUserDialog } from "../../dialogs/staff-user-dialog/staff-user.component";


@Component({
    selector: 'personal-component',
    imports: [TableComponent],
    templateUrl: 'personal.component.html',
    styleUrls: ['personal.component.scss']
})
export class PersonalComponent implements OnInit{
    private readonly staffService = inject(StaffService);
    private readonly snackbarService = inject(SnackbarService);
    readonly dialog = inject(MatDialog);
    staffUsers = signal<StaffUser[]>([]);
    staffUsersRows = signal<StaffUserRow[]>([]);
    map = new Map<string, string>([
        ['Name', 'name'],
        ['Last Name', 'name'],
        ['Phone Number', 'phoneNumber'],
        ['Roles', 'roles']
    ]);
    colDisplayNames = computed(() => [...this.map.keys()]);

    searchTerm = signal<string>('');
    sort = signal<string>('');

    ngOnInit(): void {
        this.getStaff();
    }

    onAddStaff(): void {
        const dialogRef = this.dialog.open(StaffUserDialog);
        dialogRef.afterClosed().subscribe((result: StaffUser) => {
            if (result){
                // this.staffUsers.set([result, ...this.staffUsers()]);
                // this.staffUsersRows.set(this.mapToStaffUserRows(this.staffUsers()));
                this.getStaff();
            }
        })
    }

    onUpdateStaff(id: number): void {
        const dialogRef = this.dialog.open(StaffUserDialog, {
            data: this.staffUsers()[id]
        })
        dialogRef.afterClosed().subscribe((result: StaffUser | number) => {
            if (result) {
                this.getStaff();
            }
        })
    }

    private getStaff(searchTerm?: string): void {
        this.staffService.getAll(searchTerm).subscribe({
            next: (result: Page<StaffUser>) => {
                this.staffUsers.set(result.data);
                this.staffUsersRows.set(this.mapToStaffUserRows(result.data));
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(error.message);
            }
        })
    }

    private mapToStaffUserRows(staffUsers: StaffUser[]): StaffUserRow[] {
        const staffUserRows: StaffUserRow[] = staffUsers.map(i => {
            const splittedName = i.name!.split(' ');
            const joinedRoles = i.staffUserRoles!.map(s => s.name).join(", ");
            return {
                name: splittedName[0],
                lastName: splittedName[1],
                phoneNumber: '',
                roles: joinedRoles
            }
        })
        return staffUserRows;
    }

    onSort(key: string) {
        this.sort.set(this.map.get(key)!);
        this.getStaff();
    }

    onSearch(term: string) {
        this.searchTerm.set(term);
        this.getStaff();
    }
}
