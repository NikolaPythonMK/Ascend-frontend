import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { PermissionService } from '../../core/services/auth/permission.service';
import { SettingsPage } from './settings.component';

describe('SettingsPage', () => {
  const isAdmin = signal(false);

  beforeEach(() => {
    isAdmin.set(false);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: PermissionService,
          useValue: {
            has: jasmine.createSpy().and.returnValue(true),
            isAdmin,
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: jasmine.createSpy().and.returnValue(null),
              },
            },
          },
        },
      ],
    });
  });

  it('hides organization settings from non-admin users', () => {
    const component = TestBed.runInInjectionContext(() => new SettingsPage());
    const visibleIds = component.visibleMenuItems().map((item) => item.id);

    expect(visibleIds).not.toContain('businessProfile');
    expect(visibleIds).not.toContain('organizationDisplay');
    expect(component.selectedItem()).toBe('taxes');
  });

  it('shows organization settings to admin users', () => {
    isAdmin.set(true);
    const component = TestBed.runInInjectionContext(() => new SettingsPage());
    const visibleIds = component.visibleMenuItems().map((item) => item.id);

    expect(visibleIds).toContain('businessProfile');
    expect(visibleIds).toContain('organizationDisplay');
  });
});
