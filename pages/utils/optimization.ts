/* eslint-disable @typescript-eslint/no-explicit-any */
import equal from 'fast-deep-equal';

/**
 * Optimized shallow equality check for objects and functions
 * @param objA - First object to compare
 * @param objB - Second object to compare
 * @returns True if objects are shallow equal
 */
export function shallowEqual(objA: any, objB: any): boolean {
  if (objA === objB) return true;
  
  if (!objA || !objB) return false;
  
  if (typeof objA !== 'object' || typeof objB !== 'object') {
    return objA === objB;
  }
  
  if (typeof objA === 'function' && typeof objB === 'function') {
    return objA.name === objB.name && objA.toString() === objB.toString();
  }
  
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    
    const valA = objA[key];
    const valB = objB[key];
    
    if (typeof valA === 'function' && typeof valB === 'function') {
      if (valA.name !== valB.name || valA.toString() !== valB.toString()) {
        return false;
      }
      continue;
    }
    
    if (valA !== valB) return false;
  }
  
  return true;
}

/**
 * Checks if a value is stable for React dependency arrays
 * @param value - Value to check for stability
 * @returns True if value is considered stable
 */
export function isStableValue(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'object' && typeof value !== 'function') return true;
  if (typeof value === 'function') return value.toString().length < 1000;
  return false;
}

/**
 * Creates an optimized dependency array by filtering unstable values
 * @param deps - Array of dependencies to optimize
 * @returns Filtered array of stable dependencies
 */
export function optimizeDeps(deps: Array<any>): Array<any> {
  return deps.filter(dep => isStableValue(dep) || typeof dep === 'object');
}

/**
 * Custom prop comparator for React.memo() to prevent unnecessary re-renders
 * Compares props shallowly and ignores function references if they have the same name
 * @param prevProps - Previous component props
 * @param nextProps - Next component props
 * @returns True if props are equal (component should NOT re-render)
 */
export function memoPropsComparator<P extends Record<string, any>>(
  prevProps: Readonly<P>,
  nextProps: Readonly<P>
): boolean {
  return shallowEqual(prevProps, nextProps);
}

/**
 * Deep equality check for complex objects
 * Use sparingly - prefer shallow equality for performance
 * Uses fast-deep-equal library for optimized deep comparison with circular reference protection
 * @param objA - First object
 * @param objB - Second object
 * @returns True if objects are deeply equal
 */
export function deepEqual(objA: any, objB: any): boolean {
  return equal(objA, objB);
}

/**
 * Memoization cache for expensive computations
 * Simple LRU cache with configurable size
 */
export class MemoizationCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Delete oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Creates a memoized function with custom cache key generator
 * @param fn - Function to memoize
 * @param cacheKeyFn - Optional function to generate cache key from arguments
 * @returns Memoized function
 */
export function memoize<Args extends Array<any>, Result>(
  fn: (...args: Args) => Result,
  cacheKeyFn?: (...args: Args) => string
): (...args: Args) => Result {
  const cache = new MemoizationCache<string, Result>();

  return (...args: Args): Result => {
    const cacheKey = cacheKeyFn
      ? cacheKeyFn(...args)
      : JSON.stringify(args);

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)!;
    }

    const result = fn(...args);
    cache.set(cacheKey, result);
    return result;
  };
}