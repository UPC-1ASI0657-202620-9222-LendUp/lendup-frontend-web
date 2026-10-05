import assert from 'node:assert/strict';
import test from 'node:test';
import { photoSelectionError, MAX_PHOTO_BYTES } from '../lib/listing-photos.ts';
import { mapListing } from '../services/api/mappers/domain.ts';
test('photo selection enforces type, size and total count', () => {
  assert.equal(
    photoSelectionError([{ type: 'image/png', size: 100 }], 5),
    undefined,
  );
  assert.equal(
    photoSelectionError([{ type: 'image/png', size: 100 }], 6),
    'limit',
  );
  assert.equal(
    photoSelectionError([{ type: 'image/svg+xml', size: 100 }], 0),
    'format',
  );
  assert.equal(
    photoSelectionError([{ type: 'image/jpeg', size: MAX_PHOTO_BYTES + 1 }], 0),
    'size',
  );
  assert.equal(
    photoSelectionError([{ type: 'image/webp', size: 0 }], 0),
    'size',
  );
});
test('catalog maps saved photos in order and uses first as cover', () => {
  const listing = mapListing({
    titulo: 'Cámara',
    imagenes: [
      {
        id: 'second',
        url: 'https://res.cloudinary.com/test/two.jpg',
        orden: 2,
      },
      { id: 'first', url: 'https://res.cloudinary.com/test/one.jpg', orden: 0 },
    ],
  });
  assert.equal(listing.media.length, 2);
  assert.equal(listing.media[0].id, 'first');
  assert.equal(listing.image, 'https://res.cloudinary.com/test/one.jpg');
});
test('old publications without photos keep their placeholder', () => {
  assert.equal(mapListing({}).image, '/brand/logo-mark-on-light.webp');
  assert.deepEqual(mapListing({}).media, []);
});
test('catalog preserves available and reserved periods returned by the backend', () => {
  const listing = mapListing({
    disponibilidades: [
      {
        id: 'available-1',
        desde: '2026-10-10T14:00:00',
        hasta: '2026-10-11T14:00:00',
        estado: 'DISPONIBLE',
      },
      {
        desde: '2026-10-12T14:00:00',
        hasta: '2026-10-13T14:00:00',
        estado: 'RESERVADA',
      },
    ],
  });
  assert.equal(listing.availabilitySlots.length, 2);
  assert.equal(listing.availabilitySlots[0].id, 'available-1');
  assert.equal(listing.availabilitySlots[0].status, 'AVAILABLE');
  assert.equal(listing.availabilitySlots[1].status, 'RESERVED');
});
