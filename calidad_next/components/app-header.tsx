"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/"); router.refresh();
  }
  return <header className="border-b border-border/60 bg-background/80 backdrop-blur">
    <div className="mx-auto flex min-h-14 w-full max-w-[1600px] items-center justify-between gap-2 px-3 py-2 sm:px-4 md:px-6">
      <Link href="/control" className="flex min-w-0 items-center gap-2 font-semibold">
        <ShieldCheck className="size-5 shrink-0"/>
        <span className="truncate text-sm sm:text-base">Control de Calidad</span>
      </Link>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Button asChild variant="ghost" size="sm" className="px-2 sm:px-3">
          <Link href="/control/reportes">Reportes</Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={logout} className="px-2 sm:px-3">
          <LogOut className="size-4"/>
          <span className="hidden sm:inline">Salir</span>
        </Button>
      </div>
    </div>
  </header>;
}
