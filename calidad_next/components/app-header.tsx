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
    <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center justify-between px-4 md:px-6">
      <Link href="/control" className="flex items-center gap-2 font-semibold"><ShieldCheck className="size-5"/>Control de Calidad</Link>
      <div className="flex items-center gap-2"><Button asChild variant="ghost" size="sm"><Link href="/control/reportes">Reportes</Link></Button><Button variant="ghost" size="sm" onClick={logout}><LogOut className="size-4"/>Salir</Button></div>
    </div>
  </header>;
}
