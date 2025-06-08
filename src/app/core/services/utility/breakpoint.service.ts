import { computed, Injectable, signal } from "@angular/core";
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

// TODO: consider debouncing or throttling the observe stream to reduce the frequency of changes.
// TODO: refactor - use one subscription

@Injectable({
    providedIn: 'root'
})
export class BreakpointService {
    public isMobile = signal(false);
    public isTablet = signal(false);
    public isDesktop = signal(false);
    public isHandsetLandscape = signal(false);

    public isMobileOrTablet = computed(() => this.isMobile || this.isTablet);

    constructor(private observer: BreakpointObserver) {
        this.handleMobileBreakpoint();
        this.handleTabletBreakpoint();
        this.handleDesktopBreakpoint();
        this.handleHandsetLandscapeBreakpoint();
    }

    private handleMobileBreakpoint(): void {
        this.observer.observe(Breakpoints.HandsetPortrait).subscribe((screenSize) => {
            this.isMobile.set(screenSize.matches);
            console.log('mobile: ', screenSize);
        })
    }

    private handleTabletBreakpoint(): void {
        this.observer.observe(Breakpoints.Tablet).subscribe((screenSize) => {
            this.isTablet.set(screenSize.matches);
            console.log('tablet: ', screenSize);
        })
    }

    private handleHandsetLandscapeBreakpoint(): void {
        this.observer.observe(Breakpoints.HandsetLandscape).subscribe((screenSize) => {
            this.isHandsetLandscape.set(screenSize.matches);
            console.log('Handset landscape: ', screenSize);
        })
    }

    private handleDesktopBreakpoint() {
        this.observer.observe(Breakpoints.Web).subscribe((screenSize) => {
            this.isDesktop.set(screenSize.matches);
            console.log('desktop: ', screenSize);
        })
    }
}