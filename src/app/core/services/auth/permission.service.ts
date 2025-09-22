import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { EmployeeStore, permKey } from '../../store/employee.store';

export interface PermissionReq {
  name: string;
  method: string;
}

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private store = inject(EmployeeStore);

  has = (req: PermissionReq) =>
    this.store.isAdmin?.() ||
    this.store.permissionSet().has(permKey(req.name, req.method));

  hasAny = (reqs: PermissionReq[]) =>
    reqs.some((r) => this.has(r));

  hasAll = (reqs: PermissionReq[]) =>
    reqs.every((r) => this.has(r));

  isLoaded = this.store.isLoaded;

  // optional observable API (for guards/legacy)
  has$ = (req: PermissionReq) =>
    toObservable(this.store.permissionSet).pipe(
      map((set) => set.has(permKey(req.name, req.method)))
    );
}
