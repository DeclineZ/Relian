
export function calculateNext(card, quality) {
  let { repetition = 0, interval = 0, efactor = 2.5 } = card;

  if (quality < 3) {
    repetition = 0;
    interval   = 0;
  } else {
    repetition += 1;
    if (repetition === 1)      interval = 0.5;
    else                        interval = Math.ceil(interval * efactor);
  }

  efactor = Math.max(
    1.3,
    efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;
  return { repetition, interval, efactor, nextReview };
}
