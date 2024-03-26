import envPaths from 'env-paths';
import path from 'node:path';
import { Resource, downloadFile } from './themeLiquidDocsDownloader';

export const noop = () => {};

const paths = envPaths('theme-liquid-docs');
export const root = paths.cache;

export function download(file: Resource | 'latest', destination: string = root) {
  return downloadFile(file, destination);
}

export function filePath(file: Resource | 'latest', destination: string = root) {
  return path.join(destination, `${file}.json`);
}

/** Returns a cached version of a function. Only caches one result. */
export function memo<F extends (...args: any[]) => any>(
  fn: F,
): (...args: ArgumentTypes<F>) => ReturnType<F> {
  let cachedValue: ReturnType<F>;

  return (...args: ArgumentTypes<F>) => {
    if (!cachedValue) {
      cachedValue = fn(...args);
    }
    return cachedValue;
  };
}

/**
 * ArgumentTypes extracts the type of the arguments of a function.
 *
 * @example
 *
 * function doStuff(a: number, b: string) {
 *   // do stuff
 * }
 *
 * type DoStuffArgs = ArgumentTypes<typeof doStuff> // = [number, string].
 */
type ArgumentTypes<F extends Function> = F extends (...args: infer T) => void ? T : never;

/**
 * Returns an Record representation of the collection indexed by keyFn. Assumes
 * the key function returns unique results.
 */
export function indexBy<T, K extends PropertyKey>(
  keyFn: (x: T) => K,
  collection: T[],
): Record<K, T> {
  const record = {} as Record<K, T>;
  for (const item of collection) {
    record[keyFn(item)] = item;
  }
  return record;
}
