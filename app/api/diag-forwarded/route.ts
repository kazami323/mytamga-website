import { NextResponse, type NextRequest } from "next/server";

import { clientIpFrom } from "@/lib/api/forwarded";
import { requestOrigin } from "@/lib/https";

// ВРЕМЕННО (16.10.2026): проверка, какие заголовки прокси хостинга доходят до
// сайта — для принудительного HTTPS и ключа сайта (адрес посетителя). Отдаёт
// запросившему только его же данные, секретов нет. Удалить после проверки.

export const dynamic = "force-dynamic";

const NAMES = ["host", "x-forwarded-host", "x-forwarded-proto", "x-forwarded-port", "x-forwarded-for", "x-real-ip", "forwarded"];

export function GET(request: NextRequest) {
  const present = Object.fromEntries(NAMES.map((n) => [n, request.headers.has(n)]));
  const xff = (request.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return NextResponse.json(
    {
      present,
      origin: requestOrigin(request.headers),
      xForwardedFor: xff,
      clientIpUsedBySite: clientIpFrom(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip")),
      nextUrlHost: request.nextUrl.host,
      nextUrlProtocol: request.nextUrl.protocol,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
