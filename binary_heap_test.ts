// Copyright 2018-2025 the Deno authors. MIT license.
import { assert, assertEquals, assertThrows } from "jsr:@std/assert";
import { BinaryHeap } from "./binary_heap.ts";
import { ascend, descend } from "jsr:@std/data-structures";

Deno.test("BinaryHeap throws if compare is not a function", () => {
  assertThrows(
    () => new BinaryHeap({} as (a: number, b: number) => Promise<number>),
    TypeError,
    "Cannot construct a BinaryHeap: the 'compare' parameter is not a function, did you mean to call BinaryHeap.from?",
  );
});

// Copyright 2018-2025 the Deno authors. MIT license.
export class MyMath {
  multiply(a: number, b: number): number {
    return a * b;
  }
}

export interface Container {
  id: number;
  values: number[];
}

Deno.test("BinaryHeap works with default descend comparator", async () => {
  const maxHeap = new BinaryHeap<number>();
  const values: number[] = [-10, 9, -1, 100, 9, 1, 0, 9, -100, 10, -9];
  const expected: number[] = [100, 10, 9, 9, 9, 1, 0, -1, -9, -10, -100];

  assertEquals(maxHeap.length, 0);
  assertEquals(maxHeap.isEmpty(), true);
  assertEquals(maxHeap.peek(), undefined);
  for (const [i, value] of values.entries()) {
    assertEquals(await maxHeap.push(value), i + 1);
  }
  assertEquals(maxHeap.length, values.length);
  assertEquals(maxHeap.isEmpty(), false);

  const actual: number[] = [];
  while (!maxHeap.isEmpty()) {
    assertEquals(maxHeap.peek(), expected[actual.length]);
    actual.push(await maxHeap.pop() as number);
    assertEquals(maxHeap.length, expected.length - actual.length);
    assertEquals(maxHeap.isEmpty(), actual.length === expected.length);
  }
  assertEquals(maxHeap.peek(), undefined);
  assertEquals(actual, expected);

  await maxHeap.push(...values);
  assertEquals(maxHeap.length, values.length);
  assertEquals(maxHeap.isEmpty(), false);
  assertEquals(maxHeap.peek(), expected[0]);

  const actual2: number[] = [];
  for await (const value of maxHeap) {
    actual2.push(value);
    assertEquals(maxHeap.length, expected.length - actual2.length);
    assertEquals(maxHeap.isEmpty(), actual2.length === expected.length);
    assertEquals(maxHeap.peek(), expected[actual2.length]);
  }
  assertEquals(actual2, expected);
});

Deno.test("BinaryHeap works with ascend comparator", async () => {
  const minHeap = new BinaryHeap<number>(async (a, b) => ascend(a, b));
  const values: number[] = [-10, 9, -1, 100, 9, 1, 0, 9, -100, 10, -9];
  const expected: number[] = [-100, -10, -9, -1, 0, 1, 9, 9, 9, 10, 100];

  assertEquals(minHeap.length, 0);
  assertEquals(minHeap.isEmpty(), true);
  assertEquals(minHeap.peek(), undefined);
  for (const [i, value] of values.entries()) {
    assertEquals(await minHeap.push(value), i + 1);
  }
  assertEquals(minHeap.length, values.length);
  assertEquals(minHeap.isEmpty(), false);

  const actual: number[] = [];
  while (!minHeap.isEmpty()) {
    assertEquals(minHeap.peek(), expected[actual.length]);
    actual.push(await minHeap.pop() as number);
    assertEquals(minHeap.length, expected.length - actual.length);
    assertEquals(minHeap.isEmpty(), actual.length === expected.length);
  }
  assertEquals(minHeap.peek(), undefined);
  assertEquals(actual, expected);

  await minHeap.push(...values);
  assertEquals(minHeap.length, values.length);
  assertEquals(minHeap.isEmpty(), false);
  assertEquals(minHeap.peek(), expected[0]);

  const actual2: number[] = [];
  for await (const value of minHeap) {
    actual2.push(value);
    assertEquals(minHeap.length, expected.length - actual2.length);
    assertEquals(minHeap.isEmpty(), actual2.length === expected.length);
    assertEquals(minHeap.peek(), expected[actual2.length]);
  }
  assertEquals(actual2, expected);
});

Deno.test("BinaryHeap contains objects", async () => {
  const heap = new BinaryHeap<Container>(async (a, b) => ascend(a.id, b.id));
  const ids: number[] = [-10, 9, -1, 100, 1, 0, -100, 10, -9];

  for (const [i, id] of ids.entries()) {
    const newContainer: Container = { id, values: [] };
    assertEquals(await heap.push(newContainer), i + 1);
    newContainer.values.push(i - 1, i, i + 1);
    assertEquals(heap.length, i + 1);
    assertEquals(heap.isEmpty(), false);
  }

  const expected: number[] = [-100, -10, -9, -1, 0, 1, 9, 10, 100];
  const expectedValue: number[] = [6, 0, 8, 2, 5, 4, 1, 7, 3];
  for (const [i, value] of expectedValue.entries()) {
    assertEquals(heap.length, ids.length - i);
    assertEquals(heap.isEmpty(), false);

    const expectedContainer = {
      id: expected[i],
      values: [value - 1, value, value + 1],
    };
    assertEquals(heap.peek(), expectedContainer);
    assertEquals(await heap.pop(), expectedContainer);
  }
  assertEquals(heap.length, 0);
  assertEquals(heap.isEmpty(), true);
});

Deno.test("BinaryHeap.from() handles iterable", async () => {
  const values: number[] = [-10, 9, -1, 100, 9, 1, 0, 9, -100, 10, -9];
  const originalValues: number[] = Array.from(values);
  const expected: number[] = [100, 10, 9, 9, 9, 1, 0, -1, -9, -10, -100];

  let heap = await BinaryHeap.from(values);
  const heapValues1: number[] = [];
  for await (const value of heap) {
    heapValues1.push(value);
  }
  assertEquals(values, originalValues);
  assertEquals(heapValues1, expected);

  heap = await BinaryHeap.from(values, { compare: async (a, b) => ascend(a, b) });
  const heapValues2: number[] = [];
  for await (const value of heap) {
    heapValues2.push(value);
  }
  assertEquals(values, originalValues);
  assertEquals(heapValues2.reverse(), expected);

  heap = await BinaryHeap.from(values, { map: (v: number) => 2 * v });
  const heapValues3: number[] = [];
  for await (const value of heap) {
    heapValues3.push(value);
  }
  assertEquals(heapValues3, expected.map((v: number) => 2 * v));

  const math = new MyMath();
  heap = await BinaryHeap.from(values, {
    map: function (this: MyMath, v: number) {
      return this.multiply(3, v);
    },
    thisArg: math,
  });
  const heapValues4: number[] = [];
  for await (const value of heap) {
    heapValues4.push(value);
  }
  assertEquals(values, originalValues);
  assertEquals(heapValues4, expected.map((v: number) => 3 * v));

  heap = await BinaryHeap.from(values, {
    compare: async (a, b) => ascend(a, b),
    map: (v: number) => 2 * v,
  });
  const heapValues5: number[] = [];
  for await (const value of heap) {
    heapValues5.push(value);
  }
  assertEquals(values, originalValues);
  assertEquals(heapValues5.reverse(), expected.map((v: number) => 2 * v));

  heap = await BinaryHeap.from(values, {
    compare: async (a, b) => ascend(a, b),
    map: function (this: MyMath, v: number) {
      return this.multiply(3, v);
    },
    thisArg: math,
  });
  const heapValues6: number[] = [];
  for await (const value of heap) {
    heapValues6.push(value);
  }
  assertEquals(values, originalValues);
  assertEquals(heapValues6.reverse(), expected.map((v: number) => 3 * v));
});

Deno.test("BinaryHeap.from() handles default descend comparator", async () => {
  const values: number[] = [-10, 9, -1, 100, 9, 1, 0, 9, -100, 10, -9];
  const expected: number[] = [100, 10, 9, 9, 9, 1, 0, -1, -9, -10, -100];
  const maxHeap = new BinaryHeap<number>();
  await maxHeap.push(...values);

  let heap = await BinaryHeap.from(maxHeap);
  const maxHeapValues: number[] = [];
  for await (const value of maxHeap) {
    maxHeapValues.push(value);
  }
  const heapValues1: number[] = [];
  for await (const value of heap) {
    heapValues1.push(value);
  }
  assertEquals(maxHeapValues, expected);
  assertEquals(heapValues1, expected);

  await maxHeap.push(...values);
  heap = await BinaryHeap.from(maxHeap, { compare: async (a, b) => ascend(a, b) });
  const maxHeapValues2: number[] = [];
  for await (const value of maxHeap) {
    maxHeapValues2.push(value);
  }
  const heapValues2: number[] = [];
  for await (const value of heap) {
    heapValues2.push(value);
  }
  assertEquals(maxHeapValues2, expected);
  assertEquals(heapValues2.reverse(), expected);

  await maxHeap.push(...values);
  heap = await BinaryHeap.from(maxHeap, { map: (v: number) => 2 * v });
  const maxHeapValues3: number[] = [];
  for await (const value of maxHeap) {
    maxHeapValues3.push(value);
  }
  const heapValues3: number[] = [];
  for await (const value of heap) {
    heapValues3.push(value);
  }
  assertEquals(maxHeapValues3, expected);
  assertEquals(heapValues3, expected.map((v: number) => 2 * v));

  const math = new MyMath();
  await maxHeap.push(...values);
  heap = await BinaryHeap.from(maxHeap, {
    map: function (this: MyMath, v: number) {
      return this.multiply(3, v);
    },
    thisArg: math,
  });
  const maxHeapValues4: number[] = [];
  for await (const value of maxHeap) {
    maxHeapValues4.push(value);
  }
  const heapValues4: number[] = [];
  for await (const value of heap) {
    heapValues4.push(value);
  }
  assertEquals(maxHeapValues4, expected);
  assertEquals(heapValues4, expected.map((v: number) => 3 * v));

  await maxHeap.push(...values);
  heap = await BinaryHeap.from(maxHeap, {
    compare: async (a, b) => ascend(a, b),
    map: (v: number) => 2 * v,
  });
  const maxHeapValues5: number[] = [];
  for await (const value of maxHeap) {
    maxHeapValues5.push(value);
  }
  const heapValues5: number[] = [];
  for await (const value of heap) {
    heapValues5.push(value);
  }
  assertEquals(maxHeapValues5, expected);
  assertEquals(heapValues5.reverse(), expected.map((v: number) => 2 * v));

  await maxHeap.push(...values);
  heap = await BinaryHeap.from(maxHeap, {
    compare: async (a, b) => ascend(a, b),
    map: function (this: MyMath, v: number) {
      return this.multiply(3, v);
    },
    thisArg: math,
  });
  const maxHeapValues6: number[] = [];
  for await (const value of maxHeap) {
    maxHeapValues6.push(value);
  }
  const heapValues6: number[] = [];
  for await (const value of heap) {
    heapValues6.push(value);
  }
  assertEquals(maxHeapValues6, expected);
  assertEquals(heapValues6.reverse(), expected.map((v: number) => 3 * v));
});

Deno.test("BinaryHeap.from() handles ascend comparator", async () => {
  const values: number[] = [-10, 9, -1, 100, 9, 1, 0, 9, -100, 10, -9];
  const expected: number[] = [-100, -10, -9, -1, 0, 1, 9, 9, 9, 10, 100];

  // Test 1: Copy without options
  const minHeap1 = new BinaryHeap<number>(async (a, b) => ascend(a, b));
  await minHeap1.push(...values);
  let heap1 = await BinaryHeap.from(minHeap1);
  const minHeapValues1: number[] = [];
  for await (const value of minHeap1) {
    minHeapValues1.push(value);
  }
  const heapValues1: number[] = [];
  for await (const value of heap1) {
    heapValues1.push(value);
  }
  assertEquals(minHeapValues1, expected);
  assertEquals(heapValues1, expected);

  // Test 2: Copy with descending comparator
  const minHeap2 = new BinaryHeap<number>(async (a, b) => ascend(a, b));
  await minHeap2.push(...values);
  let heap2 = await BinaryHeap.from(minHeap2, { compare: async (a, b) => descend(a, b) });
  const minHeapValues2: number[] = [];
  for await (const value of minHeap2) {
    minHeapValues2.push(value);
  }
  const heapValues2: number[] = [];
  for await (const value of heap2) {
    heapValues2.push(value);
  }
  assertEquals(minHeapValues2, expected);
  assertEquals(heapValues2.reverse(), expected);

  // Test 3: Copy with map
  const minHeap3 = new BinaryHeap<number>(async (a, b) => ascend(a, b));
  await minHeap3.push(...values);
  let heap3 = await BinaryHeap.from(minHeap3, { map: (v: number) => 2 * v });
  const minHeapValues3: number[] = [];
  for await (const value of minHeap3) {
    minHeapValues3.push(value);
  }
  const heapValues3: number[] = [];
  for await (const value of heap3) {
    heapValues3.push(value);
  }
  assertEquals(minHeapValues3, expected);
  assertEquals(heapValues3, expected.map((v: number) => 2 * v));

  // Test 4: Copy with map and thisArg
  const math = new MyMath();
  const minHeap4 = new BinaryHeap<number>(async (a, b) => ascend(a, b));
  await minHeap4.push(...values);
  let heap4 = await BinaryHeap.from(minHeap4, {
    map: function (this: MyMath, v: number) {
      return this.multiply(3, v);
    },
    thisArg: math,
  });
  const minHeapValues4: number[] = [];
  for await (const value of minHeap4) {
    minHeapValues4.push(value);
  }
  const heapValues4: number[] = [];
  for await (const value of heap4) {
    heapValues4.push(value);
  }
  assertEquals(minHeapValues4, expected);
  assertEquals(heapValues4, expected.map((v: number) => 3 * v));

  // Test 5: Copy with descend and map
  const minHeap5 = new BinaryHeap<number>(async (a, b) => ascend(a, b));
  await minHeap5.push(...values);
  let heap5 = await BinaryHeap.from(minHeap5, {
    compare: async (a, b) => descend(a, b),
    map: (v: number) => 2 * v,
  });
  const minHeapValues5: number[] = [];
  for await (const value of minHeap5) {
    minHeapValues5.push(value);
  }
  const heapValues5: number[] = [];
  for await (const value of heap5) {
    heapValues5.push(value);
  }
  assertEquals(minHeapValues5, expected);
  assertEquals(heapValues5.reverse(), expected.map((v: number) => 2 * v));

  // Test 6: Copy with descend, map, and thisArg
  const minHeap6 = new BinaryHeap<number>(async (a, b) => ascend(a, b));
  await minHeap6.push(...values);
  let heap6 = await BinaryHeap.from(minHeap6, {
    compare: async (a, b) => descend(a, b),
    map: function (this: MyMath, v: number) {
      return this.multiply(3, v);
    },
    thisArg: math,
  });
  const minHeapValues6: number[] = [];
  for await (const value of minHeap6) {
    minHeapValues6.push(value);
  }
  const heapValues6: number[] = [];
  for await (const value of heap6) {
    heapValues6.push(value);
  }
  assertEquals(minHeapValues6, expected);
  assertEquals(heapValues6.reverse(), expected.map((v: number) => 3 * v));
});

Deno.test("BinaryHeap handles edge case 1", async () => {
  const minHeap = new BinaryHeap<number>(async (a, b) => ascend(a, b));
  await minHeap.push(4, 2, 8, 1, 10, 7, 3, 6, 5);
  assertEquals(await minHeap.pop(), 1);
  await minHeap.push(9);

  const expected = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  const values: number[] = [];
  for await (const value of minHeap) {
    values.push(value);
  }
  assertEquals(values, expected);
});

Deno.test("BinaryHeap handles edge case 2", async () => {
  interface Point {
    x: number;
    y: number;
  }
  const minHeap = new BinaryHeap<Point>(async (a, b) => ascend(a.x, b.x));
  await minHeap.push({ x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 });

  const expected = [{ x: 0, y: 1 }, { x: 0, y: 3 }, { x: 0, y: 2 }];
  const values: Point[] = [];
  for await (const value of minHeap) {
    values.push(value);
  }
  assertEquals(values, expected);
});

Deno.test("BinaryHeap handles edge case 3", async () => {
  interface Point {
    x: number;
    y: number;
  }
  const minHeap = new BinaryHeap<Point>(async (a, b) => ascend(a.x, b.x));
  await minHeap.push(
    { x: 0, y: 1 },
    { x: 1, y: 2 },
    { x: 1, y: 3 },
    { x: 2, y: 4 },
    { x: 2, y: 5 },
    { x: 2, y: 6 },
    { x: 2, y: 7 },
  );

  const expected = [
    { x: 0, y: 1 },
    { x: 1, y: 2 },
    { x: 1, y: 3 },
    { x: 2, y: 5 },
    { x: 2, y: 4 },
    { x: 2, y: 6 },
    { x: 2, y: 7 },
  ];
  const values: Point[] = [];
  for await (const value of minHeap) {
    values.push(value);
  }
  assertEquals(values, expected);
});

Deno.test("BinaryHeap handles README example", async () => {
  const maxHeap = new BinaryHeap<number>();
  await maxHeap.push(4, 1, 3, 5, 2);
  assertEquals(maxHeap.peek(), 5);
  assertEquals(await maxHeap.pop(), 5);
  const maxHeapValues: number[] = [];
  for await (const value of maxHeap) {
    maxHeapValues.push(value);
  }
  assertEquals(maxHeapValues, [4, 3, 2, 1]);
  assertEquals(maxHeap.length, 0);

  const minHeap = new BinaryHeap<number>(async (a, b) => ascend(a, b));
  await minHeap.push(4, 1, 3, 5, 2);
  assertEquals(minHeap.peek(), 1);
  assertEquals(await minHeap.pop(), 1);
  const minHeapValues: number[] = [];
  for await (const value of minHeap) {
    minHeapValues.push(value);
  }
  assertEquals(minHeapValues, [2, 3, 4, 5]);
  assertEquals(minHeap.length, 0);

  const words = new BinaryHeap<string>(async (a, b) => descend(a.length, b.length));
  await words.push("truck", "car", "helicopter", "tank");
  assertEquals(words.peek(), "helicopter");
  assertEquals(await words.pop(), "helicopter");
  const wordsValues: string[] = [];
  for await (const value of words) {
    wordsValues.push(value);
  }
  assertEquals(wordsValues, ["truck", "tank", "car"]);
  assertEquals(words.length, 0);
});

Deno.test("BinaryHeap.toArray()", async () => {
  const values = [-10, 9, -1, 100, 9, 1, 0, 9, -100, 10, -9];
  const maxHeap = new BinaryHeap<number>();
  await maxHeap.push(...values);
  assert(maxHeap.toArray().every((value) => values.includes(value)));
});

Deno.test("BinaryHeap.drain()", async () => {
  const values = [2, 4, 3, 5, 1];
  const expected = [5, 4, 3, 2, 1];
  const heap = new BinaryHeap<number>();
  await heap.push(...values);
  const drainedValues: number[] = [];
  for await (const value of heap.drain()) {
    drainedValues.push(value);
  }
  assertEquals(drainedValues, expected);
  assertEquals(heap.length, 0);
});

Deno.test("BinaryHeap drain copy", async () => {
  const values = [2, 4, 3, 5, 1];
  const expected = [5, 4, 3, 2, 1];
  const heap = new BinaryHeap<number>();
  await heap.push(...values);
  const copy = await BinaryHeap.from(heap);
  const drainedValues: number[] = [];
  for await (const value of copy.drain()) {
    drainedValues.push(value);
  }
  assertEquals(drainedValues, expected);
  assertEquals(heap.length, 5);
});

Deno.test("BinaryHeap.clear()", async () => {
  const values = [-10, 9, -1, 100, 9, 1, 0, 9, -100, 10, -9];
  const maxHeap = new BinaryHeap<number>();
  await maxHeap.push(...values);
  maxHeap.clear();
  assertEquals(maxHeap.toArray(), []);
});