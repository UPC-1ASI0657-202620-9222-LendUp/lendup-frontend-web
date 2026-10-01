import { appConfig } from '@/config/app-config';

export type UploadErrorCode =
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_TYPE'
  | 'READ_ERROR';

export class UploadError extends Error {
  readonly code: UploadErrorCode;
  readonly fileName: string;
  constructor(code: UploadErrorCode, fileName: string) {
    super(code);
    this.code = code;
    this.fileName = fileName;
  }
}

export interface UploadedMedia {
  publicId: string;
  url: string;
  kind: 'PHOTO' | 'VIDEO';
  name: string;
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new UploadError('READ_ERROR', file.name));
    reader.onerror = () => reject(new UploadError('READ_ERROR', file.name));
    reader.readAsDataURL(file);
  });
}

export const cloudinaryAdapter = {
  maxBytes: appConfig.maxUploadBytes,
  async upload(
    file: File,
    accept: ('image' | 'video')[] = ['image', 'video'],
  ): Promise<UploadedMedia> {
    const family = file.type.split('/')[0] as 'image' | 'video';
    if (!accept.includes(family))
      throw new UploadError('UNSUPPORTED_TYPE', file.name);
    if (file.size > appConfig.maxUploadBytes)
      throw new UploadError('FILE_TOO_LARGE', file.name);
    const url = await readAsDataUrl(file);
    return {
      publicId: `lendup/${Date.now().toString(36)}-${file.name}`,
      url,
      kind: family === 'video' ? 'VIDEO' : 'PHOTO',
      name: file.name,
    };
  },
  async uploadMany(files: FileList | File[], accept?: ('image' | 'video')[]) {
    return Promise.all(
      Array.from(files).map((file) => this.upload(file, accept)),
    );
  },
};
