/**
 * Адреса приложения в магазинах. Единственное место, где они записаны.
 *
 * Пока приложение в магазине не опубликовано, адреса нет: кнопки показывают
 * «Скоро в App Store» и никуда не ведут. Ссылка на непубликованную карточку
 * отдаёт 404, а заглушка «#» — это кнопка, которая обманывает. Когда адрес
 * появится, его вписывают сюда, и кнопки (подвал и плавающие) сами становятся
 * ссылками.
 *
 * App Store: числовой id приложения известен только после публикации.
 * Google Play: опубликовано (25.10.2026), пакет `uz.tamga.navigator`.
 */
export const APP_LINKS: Record<Store, string | null> = {
  appStore: null,
  googlePlay: "https://play.google.com/store/apps/details?id=uz.tamga.navigator",
};

export type Store = "appStore" | "googlePlay";

const ANDROID_PACKAGE = "uz.tamga.navigator";

/** Настоящая ли это карточка нашего приложения, а не похожий адрес. */
export function isStoreUrl(store: Store, url: string): boolean {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") {
    return false;
  }

  if (store === "appStore") {
    return parsed.host === "apps.apple.com" && /\/id\d+\/?$/.test(parsed.pathname);
  }

  return (
    parsed.host === "play.google.com" &&
    parsed.pathname === "/store/apps/details" &&
    parsed.searchParams.get("id") === ANDROID_PACKAGE
  );
}
