import { Component, input, linkedSignal, output, signal } from "@angular/core";
import { Image } from "./models/image.model";

@Component({
    selector: 'ascend-upload-image',
    imports: [],
    templateUrl: 'upload-img.component.html',
    styleUrls: ['upload-img.component.scss']
})
export class UploadImageComponent {
  imageUrlInput = input<string | ArrayBuffer | null>(null, { alias: 'imageUrl' });

  imageUrl = linkedSignal(() => {
    return this.imageUrlInput()
  });
  fileName = signal<string>('');

  uploadEvent = output<File>();

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
        this.uploadEvent.emit(file);
      };
      arrayBufferReader.readAsArrayBuffer(file);
    }
  }

  onChooseImage(imgInput: HTMLInputElement): void {
    imgInput.click();
  }
}