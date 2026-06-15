import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { LocationService } from "../../../../core/services/api/locations.service";
import { SnackbarService } from "../../../../core/services/utility/snackbar.service";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule, MatLabel } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { ButtonComponent } from "../../../../core/ui/button/button.component";
import type { Location } from "../../../../core/models/api/responses/location.model";
import { MatIconModule } from "@angular/material/icon";
import { ConfirmationDialog } from "../../../../core/ui/confirmation-dialog/confirmation-dialog.component";
import type { LocationRequest } from "../../../../core/models/api/requests/location.request";
import { HttpErrorResponse } from "@angular/common/http";
import { finalize, Observable, switchMap } from "rxjs";
import { LoaderComponent } from "../../../../core/ui/loader/loader.component";
import { TranslateModule } from "@ngx-translate/core";
import TranslationService from "../../../../core/services/utility/translation.service";
import { PermissionService } from "../../../../core/services/auth/permission.service";
import { TablesService } from "../../../../core/services/api/tables.service";
import type { Table } from "../../../../core/models/api/responses/table.model";
import type { TableRequest } from "../../../../core/models/api/requests/table.request";
import type { TablePosition } from "../../../../core/models/api/value-objects/table-position.model";

@Component({
    imports: [MatFormFieldModule, 
        MatSelectModule, 
        FormsModule, 
        ReactiveFormsModule, 
        MatInputModule, 
        ButtonComponent, 
        MatLabel, 
        CommonModule, 
        MatButtonModule, 
        MatIconModule, 
        LoaderComponent,
        TranslateModule],
    templateUrl: 'update-location.component.html',
    styleUrls: ['update-location.component.scss']
})
export class UpdateLocationDialog implements OnInit{
    readonly dialogRef = inject(MatDialogRef<UpdateLocationDialog>);
    readonly data = inject<number>(MAT_DIALOG_DATA);
    private readonly dialog = inject(MatDialog);
    private readonly fb = inject(FormBuilder);
    private readonly locationsService = inject(LocationService)
    private readonly tablesService = inject(TablesService);
    private readonly snackbarService = inject(SnackbarService);
    private readonly translationService = inject(TranslationService);
    private authz = inject(PermissionService);
    
    canUpdate = computed(() =>
            this.authz.has({ name: '/api/location/update', method: 'PUT' })
    );
    
    canDelete = computed(() =>
            this.authz.has({ name: '/api/location/delete', method: 'POST' })
    );    

    private readonly loggedInLocationId = signal<number | null>(this.getLoggedInLocationId());
    canManageTablesForLocation = computed(() => this.loggedInLocationId() === this.data);

    hasCreateTablePermission = computed(() =>
            this.authz.has({ name: '/api/table/create', method: 'POST' })
    );

    hasUpdateTablePermission = computed(() =>
            this.authz.has({ name: '/api/table/update', method: 'PUT' })
    );

    hasDeleteTablePermission = computed(() =>
            this.authz.has({ name: '/api/table/delete', method: 'POST' })
    );

    canCreateTable = computed(() => this.hasCreateTablePermission() && this.canManageTablesForLocation());
    canUpdateTable = computed(() => this.hasUpdateTablePermission() && this.canManageTablesForLocation());
    canDeleteTable = computed(() => this.hasDeleteTablePermission() && this.canManageTablesForLocation());

    locationForm = this.fb.group({
        name: ['', Validators.required],
    })
    newTableForm = this.fb.group({
        code: ['', Validators.required],
    })
    location = signal<Location | null>(null);
    tables = computed(() => this.location()?.tables ?? []);
    tableCodeDrafts = signal<Record<number, string>>({});
    loading = signal<boolean>(false);

    ngOnInit(): void {
        this.loggedInLocationId.set(this.getLoggedInLocationId());
        this.loadLocation();
    }

    getNameControl(): AbstractControl {
        return this.locationForm.get('name')!;
    }

    getNewTableCodeControl(): AbstractControl {
        return this.newTableForm.get('code')!;
    }

    tableCode(table: Table): string {
        return this.tableCodeDrafts()[table.id] ?? table.code;
    }

    isTableCodeChanged(table: Table): boolean {
        return this.tableCode(table).trim() !== table.code;
    }

    onTableCodeChange(tableId: number, code: string): void {
        this.tableCodeDrafts.update((drafts) => ({
            ...drafts,
            [tableId]: code
        }));
    }

    onCreateTable(): void {
        if (!this.canMutateTablesForCurrentLocation()) {
            return;
        }

        if (this.newTableForm.invalid) {
            return;
        }

        const request: TableRequest = {
            locationID: this.data,
            code: this.getNewTableCodeControl().value,
            name: this.getNewTableCodeControl().value,
            position: this.getDefaultTablePosition()
        };

        this.handleTableRequest(
            this.tablesService.add(request),
            this.translationService.getTranslationForKey("shared.succesfully")
        );
    }

    onUpdateTable(table: Table): void {
        if (!this.canMutateTablesForCurrentLocation()) {
            return;
        }

        const code = this.tableCode(table).trim();
        const name = code;

        if (!code || !this.isTableCodeChanged(table)) {
            return;
        }

        const request: TableRequest = {
            id: table.id,
            locationID: table.locationID ?? this.data,
            code,
            name,
            position: table.position ?? this.getDefaultTablePosition()
        };

        this.handleTableRequest(
            this.tablesService.update(request),
            this.translationService.getTranslationForKey("shared.succesfully")
        );
    }

    onDeleteTable(table: Table): void {
        if (!this.canMutateTablesForCurrentLocation()) {
            return;
        }

        this.dialog.open(ConfirmationDialog).afterClosed().subscribe((isConfirmed: boolean) => {
            if (!isConfirmed) {
                return;
            }

            this.handleTableRequest(
                this.tablesService.delete(table.id),
                this.translationService.getTranslationForKey("shared.succesfully")
            );
        });
    }

    private getLoggedInLocationId(): number | null {
        const locationId = Number(localStorage.getItem('location'));

        return Number.isFinite(locationId) && locationId > 0
            ? locationId
            : null;
    }

    private canMutateTablesForCurrentLocation(): boolean {
        if (this.canManageTablesForLocation()) {
            return true;
        }

        this.snackbarService.error(
            this.translationService.getTranslationForKey("table.current-location-only")
        );
        return false;
    }

    private loadLocation(): void {
        this.loading.set(true);
        this.locationsService.getById(this.data)
          .pipe(
            finalize(() => this.loading.set(false))
          )
          .subscribe({
            next: (location) => {
              this.setLocation(location)
            },
            error: (error: HttpErrorResponse) => {
              this.snackbarService.error(error.message)
            },
          });
    }

    onSubmit(): void {
        if (this.locationForm.invalid) {
            return;
        }
    
        const request: LocationRequest = {
            id: this.data,
            name: this.getNameControl().value,
            tabbleLocationMapping: this.location()?.tableLocationMapping ?? ''
        };
        this.loading.set(true);
        this.handleRequest(
            this.locationsService.update(request),
            this.translationService.getTranslationForKey("shared.succesfully")
        );
    }
    
    onDelete(): void {
        this.dialog.open(ConfirmationDialog).afterClosed().subscribe((isConfirmed: boolean) => {
            if (!isConfirmed) {
                return;
            }
            this.loading.set(true);
            this.handleRequest(
                this.locationsService.delete(this.data),
                this.translationService.getTranslationForKey("shared.succesfully")
            );
        });
    }

    private setLocation(location: Location): void {
        this.location.set(location);
        this.getNameControl().setValue(location.name);
        this.newTableForm.reset();
        this.tableCodeDrafts.set(
            Object.fromEntries((location.tables ?? []).map((table) => [table.id, table.code]))
        );
    }

    private getDefaultTablePosition(): TablePosition {
        return {
            x: 0,
            y: 0
        };
    }

    private handleTableRequest<T>(request$: Observable<T>, successMessage: string): void {
        this.loading.set(true);
        request$.pipe(
            switchMap(() => this.locationsService.getById(this.data)),
            finalize(() => this.loading.set(false))
        )
        .subscribe({
            next: (location: Location) => {
                this.setLocation(location);
                this.snackbarService.success(successMessage);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(this.getApiErrorMessage(error));
            }
        });
    }

    private handleRequest<T>(request$: Observable<T>, successMessage: string): void {
        request$.pipe(finalize(() => this.loading.set(false)))
        .subscribe({
            next: (result: T) => {
                this.snackbarService.success(successMessage);
                this.dialogRef.close(result);
            },
            error: (error: HttpErrorResponse) => {
                this.snackbarService.error(this.getApiErrorMessage(error));
                this.dialogRef.close();
            }
        });
    }

    private getApiErrorMessage(error: HttpErrorResponse): string {
        const errorBody = error.error as { detail?: string; message?: string; title?: string } | string | null | undefined;
        const messageKey = typeof errorBody === 'string'
            ? errorBody
            : errorBody?.detail ?? errorBody?.message ?? errorBody?.title;

        if (messageKey) {
            return messageKey
                .split(',')
                .map((key) => key.trim())
                .filter(Boolean)
                .map((key) => this.translationService.getTranslationForKey(key))
                .join(', ');
        }

        return error.message;
    }
}
