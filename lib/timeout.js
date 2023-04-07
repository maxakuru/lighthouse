/**
 * @template T
 * @param {() => Promise<T>} fn 
 * @param {number} timeout ms
 * @returns {Promise<T>}
 */
export default function timeout(fn, timeout) {
  return Promise.race([
    fn(), 
    new Promise((_, reject) => {
      setTimeout(() => reject(Error('timeout')), timeout);
    })
  ]);
}