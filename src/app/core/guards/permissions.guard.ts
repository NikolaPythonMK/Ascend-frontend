// permissions.guard.ts
import { inject } from '@angular/core';
import { CanMatchFn, Route, UrlSegment } from '@angular/router';
import { PermissionService, PermissionReq } from '../services/auth/permission.service';

export const permissionsGuard: CanMatchFn = (route: Route, _segments: UrlSegment[]) => {
  const authz = inject(PermissionService);
  const required = (route.data?.['requiredPermissions'] ?? []) as PermissionReq[];
  if (!authz.isLoaded()) {
    // treat “unknown” as “deny”; or redirect to login/loading
    return false;
  }
  return required.length ? authz.hasAll(required) : true;
};