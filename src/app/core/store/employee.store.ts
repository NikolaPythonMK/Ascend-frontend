import { computed, inject } from '@angular/core';
import { withComputed } from '@ngrx/signals';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { StaffUser } from '../models/api/responses/staff-user.model';


// Define the initial state
// Will check its internal state and its going to turn every single property into a signal itself automatically,
// ngrx will recursively create signals for all nested properties
const initialState: StaffUser = {
    id: null,
    code: null,
    name: null,
    lastName: null,
    tables: null,
    transactions: null,
    staffUserRoles: null,
    staffPreferences: null
}

const permKey = (name?: string | null, method?: string | null) =>
  (name?.toLowerCase() ?? '') + '|' + (method?.toUpperCase() ?? '');

// Define the store
export const EmployeeStore = signalStore(
    {providedIn: 'root'}, // makes sure that the store is globally accessable service
    withState(initialState),
    withComputed((store) => ({
        permissionSet: computed(() => {
            const roles = store.staffUserRoles?.() ?? [];
            const set = new Set<string>();
            for (const r of roles) {
                for (const p of r.permissions ?? []) {
                set.add(permKey(p.name, p.method));
                }
            }
            return set;
        }),
        isLoaded: computed(() => !!store.id()), // handy for guards/templates
        fullName: computed(() => [store.name?.() ?? '', store.lastName?.() ?? ''].join(' ').trim()),
        isAdmin: computed(() => {
            const roles = store.staffUserRoles?.() ?? [];
            return roles.some(r => (r?.name ?? '').trim().toLowerCase() === 'admin');
  }),
    })),
    withMethods(
        (store) => ({
            setEmployee(employee: StaffUser) {
                console.log(employee);
                patchState(store, employee);
            },
            hasEmployee(): StaffUser | null {
                if (!store.id()){
                    return null;
                }
                return {
                    id: store.id(),
                    code: store.code(),
                    name: store.name(),
                    lastName: store.lastName(),
                    tables: store.tables(),
                    transactions: store.transactions(),
                    staffUserRoles: store.staffUserRoles(),
                    staffPreferences: null
                };
            },
            clearStore() {
                patchState(store, initialState);
            },
            getFullname() {
                return store.name() + ' ' + (store.lastName() ?? '');
            }
        })
    )
)

export type PermissionKey = string; // "/api/product/create|POST"
export { permKey };