import { Injectable, signal } from "@angular/core";
import { Observable, Subject } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class KeyEventEmitter {
    private keySubject = new Subject<string>();
    private emittingStatus = signal<boolean>(true);

    get keys$(): Observable<string> {
        return this.keySubject.asObservable();
    }

    emitKey(key: string): void {
        if(this.emittingStatus()){
            this.keySubject.next(key);
        }
    }

    stop(): void {
        this.emittingStatus.set(false);
    }

    start(): void {
        this.emittingStatus.set(true);
    }

    isPaused(): boolean {
        return !this.emittingStatus();
    }
}