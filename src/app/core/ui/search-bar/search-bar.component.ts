import { AfterViewInit, Component, DestroyRef, ElementRef, HostListener, inject, input, OnInit, output, ViewChild, viewChild } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { debounceTime, distinctUntilChanged } from "rxjs";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from "@angular/material/dialog";

@Component({
    selector: 'ascend-search-bar',
    imports: [MatInputModule, MatIconModule, MatButtonModule, ReactiveFormsModule],
    templateUrl: 'search-bar.component.html',
    styleUrls: ['search-bar.component.scss']
})
export class SearchBarComponent implements OnInit, AfterViewInit {
    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>
    private readonly dialog = inject(MatDialog);
    placeholder = input<string>('Пребарај')
    onSearchTerm = output<string>();
    searchTerm = new FormControl('');

    readonly destroyRef = inject(DestroyRef)

    ngOnInit(): void {
        this.searchTerm.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(value => {
            this.onSearchTerm.emit(value?.toLocaleLowerCase() ?? '');
        })
    }

    ngAfterViewInit(): void {
        this.searchInput.nativeElement.focus();
    }

    @HostListener('window:keydown', ['$event'])
    handleKeydown(event: KeyboardEvent) {
        if (this.dialog.openDialogs.length > 0){
            return;
        }
        this.searchInput.nativeElement.focus();
    }
}