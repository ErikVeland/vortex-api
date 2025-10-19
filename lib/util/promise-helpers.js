"use strict";
// Promise helper functions to replace Bluebird methods
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promiseJoin = exports.promiseDelay = exports.promiseEach = exports.promiseReduce = exports.promiseMapSeries = exports.promiseMap = exports.promiseFilter = void 0;
/**
 * Promise-based filter implementation
 * Original: promise.filter(array, filterFunction, options)
 * Replace with:
 */
const promiseFilter = (array, filterFunction) => __awaiter(void 0, void 0, void 0, function* () {
    const results = yield Promise.all(array.map(item => filterFunction(item)));
    return array.filter((_, index) => results[index]);
});
exports.promiseFilter = promiseFilter;
/**
 * Promise-based mapping implementation
 * Original: promise.map(array, mapperFunction, options)
 * Replace with:
 */
const promiseMap = (array, mapperFunction) => __awaiter(void 0, void 0, void 0, function* () {
    return Promise.all(array.map(mapperFunction));
});
exports.promiseMap = promiseMap;
/**
 * Promise-based sequential mapping implementation
 * Original: promise.mapSeries(array, mapperFunction)
 * Replace with:
 */
const promiseMapSeries = (array, mapperFunction) => __awaiter(void 0, void 0, void 0, function* () {
    const results = [];
    for (let i = 0; i < array.length; i++) {
        results.push(yield mapperFunction(array[i]));
    }
    return results;
});
exports.promiseMapSeries = promiseMapSeries;
/**
 * Promise-based reduction implementation
 * Original: promise.reduce(array, reducerFunction, initialValue)
 * Replace with:
 */
const promiseReduce = (array, reducerFunction, initialValue) => __awaiter(void 0, void 0, void 0, function* () {
    let accumulator = initialValue;
    for (let i = 0; i < array.length; i++) {
        accumulator = yield reducerFunction(accumulator, array[i]);
    }
    return accumulator;
});
exports.promiseReduce = promiseReduce;
/**
 * Promise-based sequential iteration implementation
 * Original: promise.each(array, iteratorFunction)
 * Replace with:
 */
const promiseEach = (array, iteratorFunction) => __awaiter(void 0, void 0, void 0, function* () {
    for (let i = 0; i < array.length; i++) {
        yield iteratorFunction(array[i]);
    }
    return array;
});
exports.promiseEach = promiseEach;
/**
 * Promise-based delay implementation
 * Original: promise.delay(ms) or promise.delay(ms, value)
 * Replace with:
 */
const promiseDelay = (ms, value) => {
    return new Promise(resolve => setTimeout(() => resolve(value), ms));
};
exports.promiseDelay = promiseDelay;
/**
 * Promise-based join implementation
 * Original: promise.join(promise1, promise2, ..., combinerFunction)
 * Replace with:
 */
const promiseJoin = (...args) => __awaiter(void 0, void 0, void 0, function* () {
    const combinerFunction = args.pop();
    const promises = args;
    const results = yield Promise.all(promises);
    return combinerFunction(...results);
});
exports.promiseJoin = promiseJoin;
