"use client";

import Link from "next/link";
import { HelpCircle, Search } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ComposeProvider } from "@/components/compose/compose-context";
import { FloatingComposer } from "@/components/compose/floating-composer";
import { MailboxProvider } from "@/components/mailbox-provider";
import { MailboxSelector } from "@/components/mailbox-selector";
import { LicenseIndicator } from "@/components/license-indicator";
import { AdminNav } from "@/components/admin-nav";
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
    <AuthGuard requireMailbox requireRole="admin">
      <SidebarProvider expandedWidth={256}>
        <MailboxProvider>
          <ComposeProvider>
            <ShortcutsProvider>
              <div className="flex h-dvh flex-col overflow-hidden bg-[#f6f8fc] md:grid md:grid-cols-[var(--sidebar-width)_minmax(0,1fr)] md:transition-[grid-template-columns] md:duration-200">
                <aside className="hidden min-h-0 overflow-y-auto overscroll-contain px-3 py-4 scrollbar-gutter-stable md:block">
                  <AdminNav />
                </aside>

                <MobileNavDrawer>
                  <AdminNav />
                </MobileNavDrawer>

                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                  <MobileHeader showSearch={false} />

                  <span className="hidden fixed top-2 right-4 md:flex items-center gap-4 z-20">
                    <LicenseIndicator />
                    <MailboxSelector />
                  </span>

                  <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain rounded-none md:rounded-tl-3xl px-4 py-6 pb-24 md:px-6 md:py-10 scrollbar-gutter-stable lg:px-12 mobile-scroll">
                    <div className="w-full max-w-3xl">{children}</div>
                  </main>
                </div>
                <MobileBottomBar />
                <FloatingComposer />
              </div>
            </ShortcutsProvider>
          </ComposeProvider>
        </MailboxProvider>
      </SidebarProvider>
    </AuthGuard>
  );
}
