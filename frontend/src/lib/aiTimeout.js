// src/lib/aiTimeout.js
/**
 * Wrap any promise (e.g. an axios request) with a hard timeout.
 * If the original promise doesn’t resolve within timeoutMs, we return fallback.
 *
 * @param {Promise} promise    The original Promise (e.g. axios.post(...))
 * @param {number}  timeoutMs  Milliseconds to wait before falling back
 * @param {any}     fallback   What to return on timeout/failure
 */
export async function withTimeout(promise, timeoutMs, fallback) {
  let timer;
  const timeout = new Promise(resolve => {
    timer = setTimeout(() => resolve({ data: fallback }), timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeout]);
    return result;
  } catch (e) {
    alert("Error: File too big. Please upload a smaller PDF. :"+e)
    return { data: fallback };
  } finally {
    clearTimeout(timer);
  }
}
