/**
 * Promise-based filter implementation
 * Original: promise.filter(array, filterFunction, options)
 * Replace with:
 */
export declare const promiseFilter: <T>(array: T[], filterFunction: (item: T) => Promise<boolean>) => Promise<T[]>;
/**
 * Promise-based mapping implementation
 * Original: promise.map(array, mapperFunction, options)
 * Replace with:
 */
export declare const promiseMap: <T, R>(array: T[], mapperFunction: (item: T) => Promise<R>) => Promise<R[]>;
/**
 * Promise-based sequential mapping implementation
 * Original: promise.mapSeries(array, mapperFunction)
 * Replace with:
 */
export declare const promiseMapSeries: <T, R>(array: T[], mapperFunction: (item: T) => Promise<R>) => Promise<R[]>;
/**
 * Promise-based reduction implementation
 * Original: promise.reduce(array, reducerFunction, initialValue)
 * Replace with:
 */
export declare const promiseReduce: <T, R>(array: T[], reducerFunction: (accumulator: R, current: T) => Promise<R>, initialValue: R) => Promise<R>;
/**
 * Promise-based sequential iteration implementation
 * Original: promise.each(array, iteratorFunction)
 * Replace with:
 */
export declare const promiseEach: <T>(array: T[], iteratorFunction: (item: T) => Promise<void>) => Promise<T[]>;
/**
 * Promise-based delay implementation
 * Original: promise.delay(ms) or promise.delay(ms, value)
 * Replace with:
 */
export declare const promiseDelay: <T>(ms: number, value?: T) => Promise<T>;
/**
 * Promise-based join implementation
 * Original: promise.join(promise1, promise2, ..., combinerFunction)
 * Replace with:
 */
export declare const promiseJoin: <T extends any[], R>(...args: [...T, (...results: T) => R]) => Promise<R>;
