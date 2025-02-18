import { Component, output, signal } from "@angular/core";
import { Image } from "./models/image.model";

@Component({
    selector: 'ascend-upload-image',
    imports: [],
    templateUrl: 'upload-img.component.html',
    styleUrls: ['upload-img.component.scss']
})
export class UploadImageComponent {
  imageUrl = signal<string | ArrayBuffer | null>(null);
  fileName = signal<string>('');
  uploadEvent = output<Image>();

  preview(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input && input.files?.length) {
      const file = input.files[0];
      this.fileName.set(file.name);

      const dataUrlReader = new FileReader();
      dataUrlReader.onload = (e) => {
        this.imageUrl.set(dataUrlReader.result);
      };

      dataUrlReader.readAsDataURL(file);

      const arrayBufferReader = new FileReader();
      arrayBufferReader.onload = () => {
        const result = arrayBufferReader.result as ArrayBuffer;
        this.uploadEvent.emit({
          url: result,
          name: this.fileName(),
        });
      };
      arrayBufferReader.readAsArrayBuffer(file);
    }
  }

  onChooseImage(imgInput: HTMLInputElement): void {
    imgInput.click();
  }
}