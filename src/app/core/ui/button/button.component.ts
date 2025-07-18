import { Component, inject, input, OnInit, output, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";
import { ButtonType } from "./button.type";
import { MatIconModule } from "@angular/material/icon";

@Component({
    selector: 'ascend-button',
    imports: [CommonModule, TranslateModule, MatIconModule],
    templateUrl: 'button.component.html',
    styleUrls: ['button.component.scss']
})
export class ButtonComponent implements OnInit{
    type = input.required<ButtonType>();
    label = input<string>();
    icon = input<string>();
    disabled = input<boolean>(false);
    submitBtn = input<boolean>(false);

    clickEvent = output<void>();

    computedLabel = signal<string>('');

    ngOnInit(): void {
        if (this.label()) {
            this.computedLabel.set(this.label()!);
            return;
        }

        if (this.type() === 'primary'){
            this.computedLabel.set('shared.submit')
        } else {
            this.computedLabel.set('shared.cancel')
        }
    }

    onClick(): void {
        this.clickEvent.emit();
    }
}