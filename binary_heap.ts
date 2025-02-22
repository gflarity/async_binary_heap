// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { descend } from "jsr:@std/data-structures";

/** Swaps the values at two indexes in an array. */
function swap<T>(array: T[], a: number, b: number) {
  const temp = array[a];
  array[a] = array[b]!;
  array[b] = temp!;
}

/** Returns the parent index for a child index. */
function getParentIndex(index: number) {
  return Math.floor((index + 1) / 2) - 1;
}

/**
 * A priority queue implemented with a binary heap. The heap is in descending
 * order by default, using JavaScript's built-in comparison operators to sort
 * the values. Supports asynchronous comparisons.
 *
 * | Method       | Average Case | Worst Case |
 * | ------------ | ------------ | ---------- |
 * | peek()       | O(1)         | O(1)       |
 * | pop()        | O(log n)     | O(log n)   |
 * | push(value)  | O(1)         | O(log n)   |
 *
 * @example Usage
 * ```ts
 * import { BinaryHeap, descend } from "@std/data-structures";
 * import { assertEquals } from "@std/assert";
 *
 * const maxHeap = new BinaryHeap<number>();
 * await maxHeap.push(4, 1, 3, 5, 2);
 * assertEquals(maxHeap.peek(), 5);
 * assertEquals(await maxHeap.pop(), 5);
 * for await (const value of maxHeap) {
 *   console.log(value); // Logs 4, 3, 2, 1
 * }
 *
 * const customHeap = new BinaryHeap<number>(
 *   async (a, b) => descend(a, b)
 * );
 * await customHeap.push(4, 1, 3, 5, 2);
 * assertEquals(await customHeap.pop(), 5);
 * ```
 *
 * @typeparam T The type of the values stored in the binary heap.
 */
export class BinaryHeap<T> implements AsyncIterable<T> {
  #data: T[] = [];
  #compare: (a: T, b: T) => Promise<number>;

  /**
   * Constructs an empty binary heap with an optional async comparison function.
   * By default, values are sorted in descending order using an async wrapper around `descend`.
   *
   * @param compare An async function to compare two values, returning a Promise<number>.
   */
  constructor(compare: (a: T, b: T) => Promise<number> = async (a: T, b: T) => descend(a, b)) {
    if (typeof compare !== "function") {
      throw new TypeError(
        "Cannot construct a BinaryHeap: the 'compare' parameter is not a function, did you mean to call BinaryHeap.from?",
      );
    }
    this.#compare = compare;
  }

  /**
   * Returns a clone of the internal array in arbitrary order without sorting.
   *
   * @returns An array containing the values in the heap.
   */
  toArray(): T[] {
    return Array.from(this.#data);
  }

  /**
   * Creates a new binary heap from a collection with an optional async comparison function.
   *
   * @example
   * ```ts
   * const heap = await BinaryHeap.from([4, 1, 3, 5, 2]);
   * ```
   */
  static async from<T>(
    collection: ArrayLike<T> | Iterable<T> | BinaryHeap<T>,
    options?: { compare?: (a: T, b: T) => Promise<number> },
  ): Promise<BinaryHeap<T>>;

  /**
   * Creates a new binary heap with mapping and an optional async comparison function.
   *
   * @example
   * ```ts
   * const heap = await BinaryHeap.from([4, 1, 3], { map: (v) => v * 2 });
   * ```
   */
  static async from<T, U, V = undefined>(
    collection: ArrayLike<T> | Iterable<T> | BinaryHeap<T>,
    options: {
      compare?: (a: U, b: U) => Promise<number>;
      map: (value: T, index: number) => U;
      thisArg?: V;
    },
  ): Promise<BinaryHeap<U>>;

  static async from<T, U, V>(
    collection: ArrayLike<T> | Iterable<T> | BinaryHeap<T>,
    options?: {
      compare?: (a: U, b: U) => Promise<number>;
      map?: (value: T, index: number) => U;
      thisArg?: V;
    },
  ): Promise<BinaryHeap<U>> {
    let result: BinaryHeap<U>;
    let unmappedValues: ArrayLike<T> | Iterable<T> = [];
    if (collection instanceof BinaryHeap) {
      result = new BinaryHeap(
        options?.compare ?? (collection as unknown as BinaryHeap<U>).#compare,
      );
      if (options?.compare || options?.map) {
        unmappedValues = collection.#data;
      } else {
        result.#data = Array.from(collection.#data as unknown as U[]);
      }
    } else {
      result = options?.compare ? new BinaryHeap(options.compare) : new BinaryHeap();
      unmappedValues = collection;
    }
    const values: Iterable<U> = options?.map
      ? Array.from(unmappedValues, options.map, options.thisArg)
      : unmappedValues as U[];
    await result.push(...values);
    return result;
  }

  /** Returns the number of values in the heap. */
  get length(): number {
    return this.#data.length;
  }

  /** Returns the greatest value without removing it, or undefined if empty. */
  peek(): T | undefined {
    return this.#data[0];
  }

  /**
   * Removes and returns the greatest value, or undefined if empty.
   * Maintains heap property by bubbling down asynchronously.
   */
  async pop(): Promise<T | undefined> {
    if (this.#data.length === 0) return undefined;
    const size: number = this.#data.length - 1;
    swap(this.#data, 0, size);
    let parent = 0;
    let right: number = 2 * (parent + 1);
    let left: number = right - 1;
    while (left < size) {
      const greatestChild =
        right >= size ||
        (await this.#compare(this.#data[left]!, this.#data[right]!)) <= 0
          ? left
          : right;
      if ((await this.#compare(this.#data[greatestChild]!, this.#data[parent]!)) < 0) {
        swap(this.#data, parent, greatestChild);
        parent = greatestChild;
        right = 2 * (parent + 1);
        left = right - 1;
      } else {
        break;
      }
    }
    return this.#data.pop();
  }

  /**
   * Adds one or more values to the heap, returning the new length.
   * Maintains heap property by bubbling up asynchronously.
   */
  async push(...values: T[]): Promise<number> {
    for (const value of values) {
      let index: number = this.#data.length;
      let parent: number = getParentIndex(index);
      this.#data.push(value);
      while (index !== 0) {
        const comparison = await this.#compare(this.#data[index]!, this.#data[parent]!);
        if (comparison < 0) {
          swap(this.#data, parent, index);
          index = parent;
          parent = getParentIndex(index);
        } else {
          break;
        }
      }
    }
    return this.#data.length;
  }

  /** Removes all values from the heap. */
  clear() {
    this.#data = [];
  }

  /** Checks if the heap is empty. */
  isEmpty(): boolean {
    return this.#data.length === 0;
  }

  /**
   * Yields values from the heap in order from greatest to least asynchronously.
   * Drains the heap in the process.
   */
  async *drain(): AsyncIterableIterator<T> {
    while (!this.isEmpty()) {
      yield await this.pop() as T;
    }
  }

  /** Implements async iteration over the heap. */
  async *[Symbol.asyncIterator](): AsyncIterableIterator<T> {
    yield* this.drain();
  }
}