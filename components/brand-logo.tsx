import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Логотип MyTamga. Два файла: на тёмной теме — с золотым свечением, на светлой —
 * без него (свечение на светлом фоне читается как грязная кайма). Какой виден,
 * решает CSS по [data-theme], который выставляется до первой отрисовки, — так
 * логотип не мигает при загрузке.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <>
      <Image
        src="/brand/mytamga-logo.png"
        alt="MyTamga"
        width={479}
        height={480}
        loading="eager"
        className={cn("brand-logo brand-logo--dark w-auto", className)}
      />
      <Image
        src="/brand/mytamga-logo-light.png"
        alt="MyTamga"
        width={479}
        height={480}
        loading="eager"
        className={cn("brand-logo brand-logo--light w-auto", className)}
      />
    </>
  );
}
