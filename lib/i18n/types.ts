import type { es } from '@/lib/i18n/es';

type DeepString<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepString<T[K]>;
};

type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type Messages = DeepString<typeof es>;
export type MessageKey = Leaves<typeof es>;
export type MessageParams = Record<string, string | number>;
