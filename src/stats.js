function computeStats(records) {
  let totalCents = 0;
  let ratingTotal = 0;
  let ratingCount = 0;
  const genreCounts = new Map();

  for (const record of records) {
    const price = record.price_paid === null || record.price_paid === undefined
      || record.price_paid === ""
      ? 0
      : Number(record.price_paid);
    if (Number.isFinite(price)) totalCents += Math.round(price * 100);

    if (record.rating !== null && record.rating !== undefined && record.rating !== "") {
      const rating = Number(record.rating);
      if (Number.isFinite(rating)) {
        ratingTotal += rating;
        ratingCount += 1;
      }
    }

    const providedGenre = typeof record.genre === "string" ? record.genre.trim() : "";
    const genre = providedGenre || "Unspecified";
    genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
  }

  return {
    totalRecords: records.length,
    totalSpent: totalCents / 100,
    averageRating: ratingCount ? ratingTotal / ratingCount : null,
    genreCounts: [...genreCounts.entries()]
      .map(([genre, count]) => ({ genre, count }))
      .sort((left, right) => right.count - left.count || left.genre.localeCompare(right.genre)),
  };
}

module.exports = { computeStats };
