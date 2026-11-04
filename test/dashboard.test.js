const test = require("node:test");
const assert = require("node:assert/strict");
const { computeStats } = require("../src/stats");

test("dashboard totals count records, dollars, and only provided ratings", () => {
  const stats = computeStats([
    { title: "Record rated five", rating: 5, price_paid: "30.00", genre: "Jazz" },
    { title: "Record rated four", rating: 4, price_paid: "25.00", genre: "Rock" },
    { title: "Record rated three", rating: 3, price_paid: "20.00", genre: "Soul" },
  ]);

  assert.equal(stats.totalRecords, 3);
  assert.equal(stats.totalSpent, 75);
  assert.equal(stats.averageRating, 4.0);
});

test("dashboard genre counts merge case-insensitive matches", () => {
  const stats = computeStats([
    { genre: " Jazz " },
    { genre: "jazz" },
    { genre: "Soul" },
  ]);

  assert.deepEqual(stats.genreCounts, [
    { genre: "Jazz", count: 2 },
    { genre: "Soul", count: 1 },
  ]);
});
