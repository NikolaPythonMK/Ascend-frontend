import { ChangeDetectorRef, Component, computed, inject, OnInit, signal } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { ButtonComponent } from "../../../../core/ui/button/button.component";
import { MatDialog } from "@angular/material/dialog";
import { RolesService } from "../../../../core/services/api/roles.service";
import { HttpErrorResponse } from "@angular/common/http";
import { SnackbarService } from "../../../../core/services/utility/snackbar.service";
import { Page } from "../../../../core/models/api/page.model";
import { MatTableModule } from "@angular/material/table";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { CommonModule } from "@angular/common";
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { InputFieldComponent } from "../../../../core/ui/input-field/input-field.component";
import { ConfirmationDialog } from "../../../../core/ui/confirmation-dialog/confirmation-dialog.component";
import { Permission } from "../../../../core/models/api/responses/permission.model";
import { Role } from "../../../../core/models/api/responses/role.model";
import { RoleRequest } from "../../../../core/models/api/requests/role.request";
import { PermissionsService } from "../../../../core/services/api/permissions.service";
import TranslationService from "../../../../core/services/utility/translation.service";
import { PermissionService } from "../../../../core/services/auth/permission.service";
import { MatTooltipModule } from '@angular/material/tooltip';
import { RolesDialog } from "../../dialogs/roles-dialog/roles-dialog.component";

type ActionKey = 'view' | 'create' | 'update' | 'delete' | 'positioning';

interface RowModel {
  key: string;                  // e.g., "product"
  groupName: string;            // e.g., "Products"
  actionIds: Record<ActionKey, number[]>; // view may have 0-2 ids, others 0-1
}

interface UpdatedPermission {
  permissionId: number;
  isChecked: boolean;
}

@Component({
  selector: 'roles-component',
  standalone: true,
  imports: [
    TranslateModule,
    ButtonComponent,
    MatTableModule,
    CommonModule,
    MatCheckboxModule,
    FormsModule,
    MatIconModule,
    InputFieldComponent,
    ReactiveFormsModule,
    TranslateModule,
    MatTooltipModule
  ],
  templateUrl: 'roles.component.html',
  styleUrls: ['roles.component.scss']
})
export class RolesComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  readonly rolesService = inject(RolesService);
  readonly permissionsService = inject(PermissionsService);
  readonly snackbarService = inject(SnackbarService);
  readonly fb = inject(FormBuilder);
  readonly cdr = inject(ChangeDetectorRef);
  readonly translationService = inject(TranslationService);
  private authz = inject(PermissionService);

  canUpdateRole = this.authz.isAdmin;
  canCreateRole = this.authz.isAdmin;
  canDeleteRole = this.authz.isAdmin;

  toggleAddRole = signal<boolean>(false);
  roles = signal<Role[]>([]);
  selectedRole = signal<Role | null>(null);
  selectedRoleProtected = computed(() => this.isProtectedRole(this.selectedRole()));

  // Raw permissions and grouped UI rows
  permissions = signal<Permission[]>([]);
  rows = signal<RowModel[]>([]);

  // Track pending toggles as diffs vs current role.
  updatedPermissions = signal<UpdatedPermission[]>([]);

  roleForm = this.fb.group({
    name: ['', Validators.required],
  });

  ngOnInit(): void {
    this.getAllPermissions();
    this.getRoles();
  }

  getNameControl(): AbstractControl { return this.roleForm.get('name')!; }

  isProtectedRole(role: Role | null | undefined): boolean {
    return (role?.name ?? '').trim().toLowerCase() === 'admin';
  }

  onAddRole(): void {
    if (!this.canCreateRole()) return;
    this.toggleAddRole.set(!this.toggleAddRole());
  }

  onSubmitRole(): void {
    if (!this.canCreateRole() || this.getNameControl().invalid) return;
    const addRoleRequest: RoleRequest = { name: this.getNameControl().value, rolePermissions: [] };
    this.rolesService.add(addRoleRequest).subscribe({
      next: () => {
        this.snackbarService.success(`${this.translationService.getTranslationForKey("shared.succesfully")} ${this.translationService.getTranslationForKey("shared.added")}`);
        this.getRoles();
        this.toggleAddRole.set(false);
      },
      error: (error: HttpErrorResponse) => this.snackbarService.error(error.message)
    });
  }

  onEditRole(role: Role): void {
    if (!this.canUpdateRole() || this.isProtectedRole(role)) return;

    const currentRole = this.selectedRole()?.id === role.id ? this.selectedRole()! : role;
    const dialogRef = this.dialog.open(RolesDialog, {
      data: { name: role.name }
    });

    dialogRef.afterClosed().subscribe((name?: string) => {
      const trimmedName = name?.trim();
      if (!trimmedName || trimmedName === role.name) return;

      const request: RoleRequest = {
        id: role.id,
        name: trimmedName,
        rolePermissions: this.getSavedPermissionIds(currentRole)
      };

      this.rolesService.update(request).subscribe({
        next: (updatedRole: Role) => {
          const updatedName = updatedRole?.name ?? trimmedName;
          this.roles.update(roles => roles.map(r => r.id === role.id ? { ...r, name: updatedName } : r));

          const selectedRole = this.selectedRole();
          if (selectedRole?.id === role.id) {
            this.selectedRole.set({ ...selectedRole, name: updatedName });
          }

          this.snackbarService.success(this.translationService.getTranslationForKey("shared.succesfully"));
        },
        error: (error: HttpErrorResponse) => this.snackbarService.error(error.message)
      });
    });
  }

  onDelete(id: number): void {
    if (!this.canDeleteRole()) return;
    const role = this.roles().find(r => r.id === id);
    if (this.isProtectedRole(role)) return;

    const dialogRef = this.dialog.open(ConfirmationDialog);
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (!result) return;
      this.rolesService.delete(id).subscribe({
        next: () => {
          this.snackbarService.success(`${this.translationService.getTranslationForKey("shared.succesfully")} ${this.translationService.getTranslationForKey("shared.deleted")}`);
          this.getRoles();
        },
        error: (error: HttpErrorResponse) => this.snackbarService.error(error.message)
      });
    });
  }

  private getSavedPermissionIds(role: Role): number[] {
    return (role.permissions ?? role.rolePermissions ?? []).map(permission => permission.id);
  }

  onSelectRole(role: Role): void {
    this.rolesService.getById(role.id).subscribe({
      next: (roleSelected: Role) => {
        this.selectedRole.set(roleSelected);
        this.updatedPermissions.set([]);
        this.cdr.markForCheck();
      },
      error: (error: HttpErrorResponse) => this.snackbarService.error(error.message)
    });
  }

  isViewEnabled(rowKey: string): boolean {
   return this.isActionChecked(rowKey, 'view');
  }

    onBlockedClick(rowKey: string, actionLabelKey: string): void {
    if (!this.isViewEnabled(rowKey)) {
        const groupKey = this.rows().find(r => r.key === rowKey)?.groupName ?? 'staff.roles.this-section';
        this.snackbarService.error(
          this.translationService.getTranslationForKey('staff.roles.enable-view-message', {
            action: this.translationService.getTranslationForKey(actionLabelKey).toLowerCase(),
            group: this.translationService.getTranslationForKey(groupKey),
          })
        );
    }
    }


hasModify(rowKey: string): boolean {
  return this.getActionIds(rowKey, 'create').length > 0 || this.getActionIds(rowKey, 'update').length > 0;
}

isModifyChecked(rowKey: string): boolean {
  if (!this.hasModify(rowKey)) return false;
  const set = this.effectivePermissionSet();
  const c = this.getActionIds(rowKey, 'create');
  const u = this.getActionIds(rowKey, 'update');
  const cOK = c.length ? c.every(id => set.has(id)) : true; // treat missing as satisfied
  const uOK = u.length ? u.every(id => set.has(id)) : true;
  return cOK && uOK;
}

isModifyIndeterminate(rowKey: string): boolean {
  if (!this.hasModify(rowKey)) return false;
  const set = this.effectivePermissionSet();
  const c = this.getActionIds(rowKey, 'create');
  const u = this.getActionIds(rowKey, 'update');
  const cAny = c.some(id => set.has(id));
  const uAny = u.some(id => set.has(id));
  const cAll = c.length ? c.every(id => set.has(id)) : true;
  const uAll = u.length ? u.every(id => set.has(id)) : true;
  // indeterminate when some but not all of (create, update) are fully on
  return (cAny || uAny) && !(cAll && uAll);
}

onModifyToggle(checked: boolean, rowKey: string): void {
  if (!this.canUpdateRole() || this.selectedRoleProtected()) return;

  const c = this.getActionIds(rowKey, 'create');
  const u = this.getActionIds(rowKey, 'update');
  const ids = [...c, ...u];

  this.applyDiffs(ids, checked);

  if (checked) {
    const viewIds = this.getActionIds(rowKey, 'view');
    this.applyDiffs(viewIds, true);
  }
}


  private applyDiffs(ids: number[], checked: boolean) {
  const base = this.savedPermissionSet();
  this.updatedPermissions.update(current => {
    const next = current.filter(d => !ids.includes(d.permissionId));

    for (const id of ids) {
      if (base.has(id) !== checked) {
        next.push({ permissionId: id, isChecked: checked });
      }
    }

    return next;
  });
}

  private getRoles(): void {
    this.rolesService.getAll().subscribe({
      next: (roles: Page<Role>) => {
        this.roles.set(roles.data);
        if (this.roles().length) {
          this.selectedRole.set(this.roles()[0]);
          this.onSelectRole(this.roles()[0]);
        }
      },
      error: (error: HttpErrorResponse) => this.snackbarService.error(error.message)
    });
  }

  private getAllPermissions(): void {
    this.permissionsService.getAll().subscribe({
      next: (permissions: Page<Permission>) => {
        this.permissions.set(permissions.data);
        this.rows.set(this.buildRows(this.permissions()));
      },
      error: (error: HttpErrorResponse) => this.snackbarService.error(error.message)
    });
  }

  // ---- UI model builder ------------------------------------------------------

  /** Map: /api/{entity}/{action} → group by entity, collect ids for actions */
// ---- UI model builder ------------------------------------------------------
/** Map: /api/{entity}/{action} → group by entity, collect ids for actions
 *  Special cases:
 *   - Tables:
 *       view   = table.(all|id) + tableitem.(all|id)
 *       create = tableitem.create + transaction.create
 *       update = tableitem.update
 *       delete = tableitem.delete
 *   - Transactions row is intentionally omitted.
 *   - New rows added: Staff, Roles, Taxes, Discounts, Category Group, Reporting
 */



private buildRows(perms: Permission[]): RowModel[] {
    // Any non-standard actions that should count as "View" for a given group key
    const EXTRA_VIEW_ACTIONS: Record<string, string[]> = {
    reporting: [
        'chart-data',
        'execute',
        'export-excel',
        'export-pdf',
        'export-csv',
        'export-json',
    ],
    };

  const groups = [
    { key: "table",         groupName: "staff.roles.groups.tables" },
    { key: "product",       groupName: "staff.roles.groups.products" },
    { key: "category",      groupName: "staff.roles.groups.categories" },
    { key: "categorygroup", groupName: "staff.roles.groups.category-group" },
    { key: "location",      groupName: "staff.roles.groups.locations" },
    { key: "staffuser",     groupName: "staff.roles.groups.staff" },
    { key: "role",          groupName: "staff.roles.groups.roles" },
    { key: "reporting",     groupName: "staff.roles.groups.reporting" },
    { key: "analyticsrevenue", groupName: "staff.roles.groups.analytics-revenue" },
    { key: "tax",           groupName: "staff.roles.groups.taxes" },
    { key: "discount",      groupName: "staff.roles.groups.discounts" },
  ];

  // index /api/<entity>/<action>
  const index = new Map<string, Record<string, Permission[]>>();
  for (const p of perms) {
    const m = p.name.match(/^\/api\/([^/]+)\/([^/]+)$/);
    if (!m) continue;
    const entity = m[1];
    const action = m[2];
    if (!index.has(entity)) index.set(entity, {});
    const bucket = index.get(entity)!;
    (bucket[action] ??= []).push(p);
  }

  const toIds = (arr?: Permission[]) => (arr ?? []).map(p => p.id);
  const uniq = (arr: number[]) => Array.from(new Set(arr));

  const rows: RowModel[] = [];

  for (const { key, groupName } of groups) {
    if (key === 'table') {
      const table       = index.get('table')       || {};
      const tableitem   = index.get('tableitem')   || {};
      const transaction = index.get('transaction') || {};
      const location    = index.get('location')    || {};

      // View = table.(all|id) + tableitem.(all|id)
      const viewIds = uniq([
        ...toIds(table['all']), ...toIds(table['id']),
        ...toIds(tableitem['all']), ...toIds(tableitem['id']),
      ]);

      // Create = tableitem.create + transaction.create + table.create-temporary + table.apply-discount + table.remove-discount
      const createIds = uniq([
        ...toIds(tableitem['create']),
        ...toIds(transaction['create']),
        ...toIds(table['create-temporary']),
        ...toIds(table['apply-discount']),
        ...toIds(table['remove-discount']),
      ]);

      // Edit/Delete from tableitem
      const updateIds = toIds(tableitem['update']);
      const deleteIds = toIds(tableitem['delete']);

      // New: Positioning = location.update-table-mapping
      const positioningIds = toIds(location['update-table-mapping']);

      const hasAny = viewIds.length || createIds.length || updateIds.length || deleteIds.length || positioningIds.length;
      if (!hasAny) continue;

      rows.push({
        key,
        groupName,
        actionIds: {
          view:         viewIds,
          create:       createIds,
          update:       updateIds,
          delete:       deleteIds,
          positioning:  positioningIds,
        }
      });
      continue;
    }

    if (key === 'analyticsrevenue') {
      const viewIds = uniq(
        perms
          .filter(permission =>
            permission.name.startsWith('/api/analytics/revenue/')
            && permission.method.toUpperCase() === 'GET')
          .map(permission => permission.id)
      );

      if (!viewIds.length) continue;

      rows.push({
        key,
        groupName,
        actionIds: {
          view: viewIds,
          create: [],
          update: [],
          delete: [],
          positioning: [],
        }
      });
      continue;
    }

    // Default mapping for others
    const bucket = index.get(key) || {};
    const extraViewIds = (EXTRA_VIEW_ACTIONS[key] ?? []).flatMap(action => toIds(bucket[action]));
    const viewIds   = uniq([ ...toIds(bucket['all']), ...toIds(bucket['id']), ...extraViewIds ]);
    const createIds = toIds(bucket['create']);
    const updateIds = toIds(bucket['update']);
    const deleteIds = toIds(bucket['delete']);
    const positioningIds: number[] = []; // only used by Tables

    const hasAny = viewIds.length || createIds.length || updateIds.length || deleteIds.length || positioningIds.length;
    if (!hasAny) continue;

    rows.push({
      key,
      groupName,
      actionIds: {
        view:         viewIds,
        create:       createIds,
        update:       updateIds,
        delete:       deleteIds,
        positioning:  positioningIds,
      }
    });
  }

  return rows;
}



  // ---- Effective selection & helpers ----------------------------------------

  /** Base set from selected role + pending diffs → final effective permission IDs */
  private effectivePermissionSet(): Set<number> {
    const base = this.savedPermissionSet();
    for (const diff of this.updatedPermissions()) {
      if (diff.isChecked) base.add(diff.permissionId);
      else base.delete(diff.permissionId);
    }
    return base;
  }

  private savedPermissionSet(): Set<number> {
    return new Set<number>(this.selectedRole()?.permissions?.map(p => p.id) ?? []);
  }

  private getActionIds(rowKey: string, action: ActionKey): number[] {
    const row = this.rows().find(r => r.key === rowKey);
    return row ? row.actionIds[action] : [];
  }

  hasAction(rowKey: string, action: ActionKey): boolean {
    return this.getActionIds(rowKey, action).length > 0;
  }

  isActionChecked(rowKey: string, action: ActionKey): boolean {
    const ids = this.getActionIds(rowKey, action);
    if (!ids.length) return false;
    const set = this.effectivePermissionSet();
    return ids.every(id => set.has(id)); // View is true only if BOTH /all and /id are present
  }

isRowAllChecked(rowKey: string): boolean {
  const needs: boolean[] = [];
  if (this.hasAction(rowKey, 'view')) needs.push(this.isActionChecked(rowKey, 'view'));
  if (this.hasModify(rowKey))        needs.push(this.isModifyChecked(rowKey));
  if (this.hasAction(rowKey, 'delete')) needs.push(this.isActionChecked(rowKey, 'delete'));
  if (this.hasAction(rowKey, 'positioning')) needs.push(this.isActionChecked(rowKey, 'positioning'));
  return needs.length > 0 && needs.every(Boolean);
}

  // ---- UI events -------------------------------------------------------------

onActionToggle(checked: boolean, rowKey: string, action: ActionKey): void {
  if (!this.canUpdateRole() || this.selectedRoleProtected()) return;

  const ids = this.getActionIds(rowKey, action);
  if (!ids.length) return;

  this.applyDiffs(ids, checked);

  // Turning ON any non-view action should ensure View ON
  if (checked && (action === 'create' || action === 'update' || action === 'delete' || action === 'positioning')) {
    const viewIds = this.getActionIds(rowKey, 'view');
    this.applyDiffs(viewIds, true);
  }

  // Turning OFF View should clear all dependents
  if (!checked && action === 'view') {
    (['create','update','delete','positioning'] as ActionKey[]).forEach(a => {
      const aIds = this.getActionIds(rowKey, a);
      if (aIds.length) this.applyDiffs(aIds, false);
    });
  }
}


onToggleRowAll(checked: boolean, row: RowModel): void {
  if (!this.canUpdateRole() || this.selectedRoleProtected()) return;

  if (this.hasAction(row.key, 'view')) this.onActionToggle(checked, row.key, 'view');
  if (this.hasModify(row.key)) this.onModifyToggle(checked, row.key);
  if (this.hasAction(row.key, 'delete')) this.onActionToggle(checked, row.key, 'delete');
  if (this.hasAction(row.key, 'positioning')) this.onActionToggle(checked, row.key, 'positioning');
}

  onReset(): void {
    if (!this.canUpdateRole()) return;
    this.updatedPermissions.set([]);
  }

  onUpdatePermissions(): void {
    if (!this.canUpdateRole() || this.selectedRoleProtected()) {
      this.updatedPermissions.set([]);
      return;
    }

    // Build final list straight from effective set
    const effective = Array.from(this.effectivePermissionSet());
    const request: RoleRequest = {
      id: this.selectedRole()!.id,
      name: this.selectedRole()!.name,
      rolePermissions: effective
    };
    this.rolesService.update(request).subscribe({
      next: () => {
        this.snackbarService.success(this.translationService.getTranslationForKey("shared.succesfully"));
        // refresh selected role to reflect server truth; also clear diffs
        this.rolesService.getById(this.selectedRole()!.id).subscribe({
          next: (roleSelected: Role) => {
            this.selectedRole.set(roleSelected);
            this.updatedPermissions.set([]);
          },
          error: (error: HttpErrorResponse) => this.snackbarService.error(error.message)
        });
      },
      error: (error: HttpErrorResponse) => this.snackbarService.error(error.message)
    });
  }
}
