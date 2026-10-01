import { test } from "node:test";
import assert from "node:assert/strict";

import { APP_LINKS, isStoreUrl } from "../lib/app-links.ts";

test("адрес App Store — карточка приложения на apps.apple.com", () => {
  assert.equal(isStoreUrl("appStore", "https://apps.apple.com/uz/app/mytamga/id6740000000"), true);
  assert.equal(isStoreUrl("appStore", "https://apps.apple.com/app/id6740000000"), true);
});

test("адрес Google Play — карточка нашего пакета", () => {
  assert.equal(
    isStoreUrl("googlePlay", "https://play.google.com/store/apps/details?id=uz.tamga.navigator"),
    true,
  );
});

test("чужой хост, чужой пакет и обычный http отвергаются", () => {
  // Хост с суффиксом — тот самый приём, который ловит и тест приложения.
  assert.equal(isStoreUrl("appStore", "https://apps.apple.com.attacker.test/app/id6740000000"), false);
  assert.equal(isStoreUrl("appStore", "http://apps.apple.com/app/id6740000000"), false);
  assert.equal(isStoreUrl("appStore", "https://apps.apple.com/account/subscriptions"), false);
  assert.equal(isStoreUrl("googlePlay", "https://play.google.com/store/apps/details?id=com.other.app"), false);
  assert.equal(isStoreUrl("googlePlay", "https://play.google.com/store/apps/details"), false);
});

test("вписанные адреса, если они есть, — настоящие карточки магазинов", () => {
  // Пока приложение не опубликовано, адресов нет, и кнопки говорят «скоро».
  for (const store of ["appStore", "googlePlay"] as const) {
    const url = APP_LINKS[store];
    if (url !== null) {
      assert.equal(isStoreUrl(store, url), true, `${store}: ${url}`);
    }
  }
});
