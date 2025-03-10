import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class ImageService {
    signatures: { [key: string]: string } = {
        JVBERi0: 'application/pdf',
        R0lGODdh: 'image/gif',
        R0lGODlh: 'image/gif',
        iVBORw0KGgo: 'image/png',
        '/9j/': 'image/jpg',
    };

    getMimeType(base64: string): string {
        for(const sign in this.signatures)
            if(base64.startsWith(sign))
                return this.signatures[sign];
        return 'image/jpg'; // default
    }

    getImageUrl(base64: string): string | null {
        if (!base64) return null;
        const mimeType = this.getMimeType(base64);
        return `data:${mimeType};base64,${base64}`;
    }

    async base64ToArrayBuffer(base64: string): Promise<ArrayBuffer> {
        const response = await fetch(base64);
        const blob = await response.blob();
        return await blob.arrayBuffer();
    }
}