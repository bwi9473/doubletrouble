"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRoleStore } from "@/store/use-role-store";
import { MainNav } from "@/components/main-nav";
import { AuthButton } from "@/components/auth-button";
import { LoginModal } from "@/components/login-modal";

function useRoleStoreHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Already hydrated before this effect ran (common on network/mobile)
    if (useRoleStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useRoleStore.persist.onFinishHydration(() => setHydrated(true));
    // Double-check: hydration may have completed between the check above and subscribing
    if (useRoleStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return unsub;
  }, []);

  return hydrated;
}

export function ClientAppShell({ children }: { children: React.ReactNode }) {
  const user = useRoleStore((state) => state.user);
  const hydrated = useRoleStoreHydrated();

  if (!hydrated) {
    return <div className="min-h-screen app-bg" />;
  }

  if (!user) {
    return <LoginModal />;
  }

  return (
    <div className="min-h-screen app-bg text-app-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-20 rounded-b-3xl border border-app header-surface backdrop-blur">
          {/* Banner: afbeelding met titel + login */}
          <div className="relative overflow-hidden rounded-t-3xl border-b border-app/40">
            <Image
              src="/images/header.jpg"
              alt="Padelrackets tegen een padelnet"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 1120px"
            />
            <div className="absolute inset-0 header-banner-overlay" />

            <div className="relative flex min-h-[88px] items-start justify-between gap-3 px-3 py-3 sm:min-h-[110px] sm:px-5 sm:py-4">
              <div
                className="header-title-chip max-w-[66%] rounded-r-2xl px-3 py-2 sm:px-4 sm:py-3"
                style={{ clipPath: "polygon(0 0, 86% 0, 100% 100%, 0 100%)" }}
              >
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-white/85">Padel competitie</p>
                <h1 className="mt-0.5 text-base font-semibold text-white sm:text-2xl">Masters of Padel</h1>
              </div>

              <div className="header-auth-shell rounded-xl px-2 py-1.5 backdrop-blur-sm">
                <AuthButton />
              </div>
            </div>
          </div>

          {/* Nav: compacte balk onder de afbeelding, volledig zichtbaar op mobiel */}
          <div className="header-nav-shell px-2 py-1.5">
            <MainNav />
          </div>
        </header>
        <main className="flex-1 py-6">{children}</main>
      </div>
    </div>
  );
}
