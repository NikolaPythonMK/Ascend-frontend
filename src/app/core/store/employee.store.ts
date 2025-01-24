import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { EmployeeState } from './employee-state.type'


// Define the initial state
// Will check its internal state and its going to turn every single property into a signal itself automatically,
// ngrx will recursively create signals for all nested properties
const initialState: EmployeeState = {
    id: null,
    code: null,
    permissions: [],
    language: null
}

// Define the store
export const EmployeeStore = signalStore(
    {providedIn: 'root'}, // makes sure that the store is globally accessable service
    withState(initialState),
    withMethods(
        (store) => ({
            setEmployee(employee: EmployeeState) {
                patchState(store, employee);
            },
            hasEmployee(): EmployeeState | null {
                //return null;
                if (!store.id()){
                    return null;
                }
                return {
                    id: store.id(),
                    code: store.code(),
                    permissions: store.permissions(),
                    language: store.language()
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