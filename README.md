# BinaryHeap (Async-Compatible Priority Queue)


A asynchronous-compatible priority queue implementation using a binary heap. Based entirely on the [Deno synchronous implementation](https://jsr.io/@std/data-structures/doc/~/BinaryHeap).  Supports custom async comparison functions and iterator-based draining. Ideal for scenarios requiring custom ordering logic or asynchronous value processing.

## Features

- Async comparison function support
- Standard heap operations with O(log n) complexity
- Iterable interface for easy draining
- Browser compatible
- TypeScript-first implementation

## Installation

```bash
jsr add @YOUR_PACKAGE_NAME
```
# Usage

## Basic Usage

```typescript
import { BinaryHeap } from "jsr:@YOUR_PACKAGE_NAME";
import { descend } from "jsr:@std/data-structures";

const heap = new BinaryHeap<number>();
await heap.push(3, 1, 4, 2);
console.log(await heap.pop()); // 4
console.log(heap.peek()); // 3
```

## Async Comparison

```typescript
const asyncHeap = new BinaryHeap<number>(async (a, b) => {
  // Custom async comparison logic
  return descend(a, b);
});

await asyncHeap.push(5, 2, 8);
console.log(await asyncHeap.pop()); // 8
```

## Collection Initialization

```typescript
const fromArray = await BinaryHeap.from([4, 2, 7], {
  map: (n) => n * 2
});
console.log(fromArray.length); // 3
```

## Iteration

```typescript
await heap.push(5, 3, 9);
for await (const value of heap) {
  console.log(value); // 9, 5, 3
}
```

# API Reference

## BinaryHeap

```typescript
class BinaryHeap<T> implements AsyncIterable<T> {
  constructor(compare?: (a: T, b: T) => Promise<number>);
  
  // Core operations
  push(...values: T[]): Promise<number>;
  pop(): Promise<T | undefined>;
  peek(): T | undefined;
  
  // Utility methods
  toArray(): T[];
  clear(): void;
  isEmpty(): boolean;
  
  // Iteration
  drain(): AsyncIterableIterator<T>;
  [Symbol.asyncIterator](): AsyncIterableIterator<T>;
  
  // Static constructor
  static from<T>(collection: ArrayLike<T> | Iterable<T> | BinaryHeap<T>, 
                 options?: FromOptions<T>): Promise<BinaryHeap<T>>;
}
```
## Methods

`push(...values: T[])`

Adds values to the heap while maintaining heap property. Average O(1), Worst O(log n).

`pop()`

Removes and returns the maximum value (with optional async comparison). O(log n).

`peek()`

Returns the maximum value without removal. O(1).

`drain()`

Async generator that yields values while emptying the heap.

# Performance Characteristics

Given this is async, the performance characteristics are slightly different from a synchronous heap. The heap operations are still O(log n) on average, but the actual time taken will depend on the async comparison function. So chances are you don't care about the performance of the heap itself, but rather the async comparison function.

# Browser Compatibility

This implementation works in all modern browsers and Deno. For legacy environments, ensure Promise support is available.

