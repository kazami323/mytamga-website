/**
 * Наш лимит поверх серверного: он мягче и нужен от случайных двойных нажатий,
 * чтобы человек не потратил серверную квоту (три запроса в минуту на адрес,
 * пять в час на номер) на собственный дребезг кнопки.
 *
 * Часы передаются снаружи: иначе поведение во времени нечем проверить.
 */
export function createThrottle(windowMs: number) {
  const lastSeen = new Map<string, number>();

  return {
    check(key: string, now: number) {
      const previous = lastSeen.get(key);
      const elapsed = previous === undefined ? Infinity : now - previous;

      if (elapsed < windowMs) {
        return { allowed: false, retryAfterMs: windowMs - elapsed };
      }

      lastSeen.set(key, now);

      // Не даём карте расти бесконечно: всё, что старше окна, уже не нужно.
      for (const [entry, seen] of lastSeen) {
        if (now - seen >= windowMs) {
          lastSeen.delete(entry);
        }
      }

      return { allowed: true, retryAfterMs: 0 };
    },
  };
}
