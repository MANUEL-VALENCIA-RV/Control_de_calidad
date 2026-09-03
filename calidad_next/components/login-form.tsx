"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error || "No se pudo iniciar sesión",
        );
      }

      router.replace("/control");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error de inicio de sesión",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <Card className="shadow-lg">
        <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
          <CardTitle>Iniciar sesión</CardTitle>

          <CardDescription>
            Ingresa tus datos para acceder al sistema
          </CardDescription>
        </CardHeader>

        <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
          <form onSubmit={submit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">
                  Correo electrónico
                </FieldLabel>

                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">
                  Contraseña
                </FieldLabel>

                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </Field>

              {error && (
                <p className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Iniciar sesión"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
