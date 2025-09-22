import { inject } from '@angular/core';
import { CanMatchFn, Route, Router, UrlSegment } from '@angular/router';
import { PermissionService, PermissionReq } from '../services/auth/permission.service';

export const permissionsGuard: CanMatchFn = (route: Route, segments: UrlSegment[]) => {
  const authz = inject(PermissionService);
  const router = inject(Router);

  if (!authz.isLoaded()) {
    return router.parseUrl('/staff');
  }

  const required = (route.data?.['requiredPermissions'] ?? []) as PermissionReq[];
  const forbiddenPath = (route.data?.['forbiddenPath'] as string) ?? '/forbidden';  // you can display a custom forbidden page
  const url = '/' + segments.map(s => s.path).join('/');

  const check = () => {
    const allowed = required.length ? authz.hasAny(required) : true;
    return allowed ? true : router.createUrlTree([forbiddenPath], { queryParams: { from: url } });
  }; 
  
  return check();
};