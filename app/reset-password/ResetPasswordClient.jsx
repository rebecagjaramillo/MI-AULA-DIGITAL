"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

export function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        toast.success("Contraseña actualizada exitosamente");
      } else {
        toast.error(data.error || "Error al restablecer contraseña");
      }
    } catch (err) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 relative overflow-hidden p-4">
        <div className="z-10 w-full max-w-md p-8 bg-white border border-slate-200 rounded-2xl shadow-xl text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-4">Enlace Inválido</h1>
          <p className="text-slate-500 mb-6 text-sm">Falta el token de seguridad o el correo. Solicita un nuevo enlace.</p>
          <Button onClick={() => router.push("/forgot-password")} className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-medium transition-all shadow-md">
            Solicitar nuevo enlace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 relative overflow-hidden p-4">
      <div className="z-10 w-full max-w-md p-8 bg-white border border-slate-200 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white mb-5 shadow-sm">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Nueva Contraseña</h1>
          <p className="text-slate-500 text-sm">Ingresa tu nueva contraseña para la cuenta <span className="font-medium text-slate-700">{email}</span></p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium">
              ¡Tu contraseña se ha restablecido correctamente!
            </div>
            <Button
              onClick={() => router.push("/login")}
              className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-medium transition-all shadow-md mt-2"
            >
              Ir al inicio de sesión
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-slate-700 mb-1.5 ml-0.5">Nueva Contraseña</Label>
              <PasswordInput
                id="password"
                required
                aria-label="Nueva Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                placeholder="••••••••"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-slate-700 mb-1.5 ml-0.5">Confirmar Contraseña</Label>
              <PasswordInput
                id="confirmPassword"
                required
                aria-label="Confirmar Contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11"
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-medium transition-all shadow-md mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {loading ? "Actualizando..." : "Restablecer Contraseña"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
