import { Component, input, OnInit, output, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";
import { ButtonType } from "./button.type";

@Component({
    selector: 'ascend-button',
    imports: [CommonModule, TranslateModule],
    templateUrl: 'button.component.html',
    styleUrls: ['button.component.scss']
})
export class ButtonComponent implements OnInit{
    type = input.required<ButtonType>();
    label = input<string>();
    clickEvent = output<void>();
    computedLabel = signal<string>('');

    ngOnInit(): void {
        if (this.label()) {
            this.computedLabel.set(this.label()!);
            return;
        }

        if (this.type() === 'primary'){
            this.computedLabel.set('ui.button.primary')
        } else {
            this.computedLabel.set('ui.button.secondary')
        }
    }

    onClick(): void {
        this.clickEvent.emit();
    }
}