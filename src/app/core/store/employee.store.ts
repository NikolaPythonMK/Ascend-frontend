import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { StaffUser } from '../models/api/responses/staff-user.model';


// Define the initial state
// Will check its internal state and its going to turn every single property into a signal itself automatically,
// ngrx will recursively create signals for all nested properties
const initialState: StaffUser = {
    id: null,
    code: null,
    name: null,
    tables: null,
    transactions: null,
    staffUserRoles: null
}

// Define the store
export const EmployeeStore = signalStore(
    {providedIn: 'root'}, // makes sure that the store is globally accessable service
    withState(initialState),
    withMethods(
        (store) => ({
            setEmployee(employee: StaffUser) {
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
                    tables: store.tables(),
                    transactions: store.transactions(),
                    staffUserRoles: store.staffUserRoles()
                };
            },
            clearStore() {

            },
            hasPermission() {
                // sends the code to the backend?
            },
        })
    )
)