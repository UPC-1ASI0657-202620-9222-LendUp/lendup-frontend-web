const MAX_DEMO_FILE_BYTES = 2_000_000;

export async function fileToDataUrl(
  file: File,
  maxBytes = MAX_DEMO_FILE_BYTES,
): Promise<string> {
  if (file.size > maxBytes)
    throw new Error(
      `El archivo ${file.name} supera el límite demo de ${Math.round(maxBytes / 1_000_000)} MB.`,
    );
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error(`No se pudo convertir ${file.name}.`));
    };
    reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

export async function filesToDataUrls(files: FileList | File[]) {
  return Promise.all(
    Array.from(files).map(async (file) => ({
      file,
      dataUrl: await fileToDataUrl(file),
    })),
  );
}
