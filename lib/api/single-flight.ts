/**
 * Один запрос на ключ в один момент. Нужен для обновления токена: сервер
 * приложения меняет refresh-токен при каждом обновлении, поэтому два
 * параллельных обновления одним и тем же токеном означают, что проигравший
 * получит 401 по совершенно живой сессии — и, что хуже, снесёт куки, которые
 * победитель только что выдал.
 *
 * Состояние живёт в памяти процесса. Сайт стоит на одной машине рядом с API,
 * так что этого достаточно; переживать перезапуск такой защите незачем.
 */
export function createSingleFlight<T>() {
  const inFlight = new Map<string, Promise<T>>();

  return function run(key: string, task: () => Promise<T>): Promise<T> {
    const existing = inFlight.get(key);

    if (existing) {
      return existing;
    }

    // finally, а не then: отказ обязан достаться обоим и не залипнуть в карте,
    // иначе одна мёртвая попытка запретила бы обновление навсегда.
    const promise = task().finally(() => {
      inFlight.delete(key);
    });

    inFlight.set(key, promise);

    return promise;
  };
}
