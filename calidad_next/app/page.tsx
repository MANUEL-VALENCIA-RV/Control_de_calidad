import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { getSession } from "@/lib/auth";

export default async function Calidad() {
    const session = await getSession();
    if (session) redirect("/control");

    return (
        <main className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-40 -left-40 size-96 rounded-full bg-primary/25 blur-3xl"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-40 -bottom-40 size-96 rounded-full bg-purple-500/20 blur-3xl"
            />

            <div className="relative w-full max-w-md">
                <div className="mb-8 flex flex-col items-center gap-4 text-center">
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                        <ShieldCheck className="size-8" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-semibold text-foreground">Control de Calidad</h1>
                        <p className="text-sm text-muted-foreground">Inicia sesión para administrar los reportes de reparación</p>
                    </div>
                </div>

                <LoginForm />

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Sistema de control de calidad y conformidad &middot; v0.1.0
                </p>
            </div>
        </main>
    );
}