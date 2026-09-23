"use client";

import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ComposeProvider } from "@/components/compose/compose-context";
import { FloatingComposer } from "@/components/compose/floating-composer";
import { MailSearchInput } from "@/components/mail-search/mail-search-input";
import { MailSearchProvider } from "@/components/mail-search/mail-search-context";
import { MailboxProvider } from "@/components/mailbox-provider";
import { MailboxSelector } from "@/components/mailbox-selector";
import { LicenseIndicator } from "@/components/license-indicator";
import { DashboardNav } from "@/components/dashboard-nav";
import { SidebarProvider } from "@/components/sidebar-state";
import { ShortcutsProvider } from "@/components/shortcuts";

import { MobileHeader } from "@/components/mobile-header";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { MobileBottomBar } from "@/components/mobile-bottom-bar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <MailboxProvider>
          <ComposeProvider>
            <MailSearchProvider>
              <ShortcutsProvider>
                <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#f6f8fc] md:grid md:grid-cols-[var(--sidebar-width)_minmax(0,1fr)] md:transition-[grid-template-columns] md:duration-200">
                  <aside className="hidden min-h-0 overflow-y-auto overscroll-contain px-3 py-4 [scrollbar-gutter:stable] md:block">
                    <DashboardNav />
                  </aside>

                  <MobileNavDrawer>
                    <DashboardNav />
                  </MobileNavDrawer>

                  <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    <MobileHeader />

                    <header className="hidden h-16 w-full shrink-0 items-center gap-4 pr-4 text-sm md:flex">
                      <MailSearchInput />
                      <Link
                        href="/settings/account"
                        className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-200"
                      >
                        <HelpCircle className="h-5 w-5" />
                      </Link>
                      <LicenseIndicator />
                      <MailboxSelector />
                    </header>
                    <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 pb-24 md:p-8 scrollbar-gutter-stable mobile-scroll">
                      {children}
                    </main>
                  </div>
                  <MobileBottomBar />
                  <FloatingComposer />
                </div>
              </ShortcutsProvider>
            </MailSearchProvider>
          </ComposeProvider>
        </MailboxProvider>
      </SidebarProvider>
    </AuthGuard>
  );
}
