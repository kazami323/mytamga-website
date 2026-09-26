const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function normalize(entry: string): string | null {
  let value = entry.trim();

  if (!value) {
    return null;
  }

  // «[2001:db8::1]:443» — форма, в которой адрес с портом пишут для IPv6.
  const bracketed = value.match(/^\[([^\]]+)\](?::\d+)?$/);

  if (bracketed) {
    value = bracketed[1];
  } else if (value.includes(".") && value.includes(":")) {
    // «203.0.113.7:54321» — IPv4 с портом. У IPv6 без скобок двоеточий много,
    // и отрезать по последнему нельзя.
    value = value.slice(0, value.lastIndexOf(":"));
  }

  const ipv4 = value.match(IPV4);

  if (ipv4) {
    return ipv4.slice(1).every((part) => Number(part) <= 255) ? value : null;
  }

  // IPv6: шестнадцатеричные группы и двоеточия, ничего больше.
  return /^[0-9a-fA-F:]+$/.test(value) && value.includes(":") ? value : null;
}

/**
 * Адрес клиента для серверного лимита входа — три запроса в минуту на адрес.
 *
 * Берём **правое** звено `X-Forwarded-For`, потому что его дописал наш обратный
 * прокси. Левую часть цепочки присылает сам клиент: раньше мы читали её, и
 * подделкой одного заголовка лимит сбрасывался — проверено, обход
 * воспроизводился. Если справа не адрес, значит прокси ничего не дописал и вся
 * цепочка пришла от клиента: тогда адреса у нас нет.
 *
 * Отсюда требование к развёртыванию: сайт обязан стоять за прокси, который
 * дописывает `X-Forwarded-For` (Caddy это делает) либо перезаписывает
 * `X-Real-IP`. Без него лимит будет считать всех посетителей как одного.
 */
export function clientIpFrom(
  forwardedFor: string | null,
  realIp?: string | null,
): string | null {
  const chain = String(forwardedFor ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (chain.length > 0) {
    return normalize(chain[chain.length - 1]);
  }

  return normalize(String(realIp ?? ""));
}
