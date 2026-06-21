"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, KeyRound } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        toast.success("Enlace enviado a tu correo electrónico");
      } else {
        toast.error(data.error || "Error al solicitar recuperación");
      }
    } catch (err) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 relative overflow-hidden p-4">
      <div className="z-10 w-full max-w-md p-8 bg-white border border-slate-200 rounded-2xl shadow-xl">
        <Link href="/login" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6 font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al login
        </Link>
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white mb-5 shadow-sm">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Recuperar Acceso</h1>
          <p className="text-slate-500 text-sm">Ingresa tu correo electrónico y te enviaremos un enlace para recuperar el acceso a tu cuenta.</p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium">
              Hemos enviado un enlace de recuperación a <strong className="font-bold">{email}</strong>. Revisa tu bandeja de entrada o carpeta de spam.
            </div>
            <Button
              onClick={() => router.push("/login")}
              variant="outline"
              className="w-full h-11 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-all shadow-sm mt-2"
            >
              Regresar al inicio de sesión
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-slate-700 mb-1.5 ml-0.5">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                required
                aria-label="Correo Electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                placeholder="maestro@escuela.com"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-medium transition-all shadow-md mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {loading ? "Enviando enlace..." : "Enviar enlace de recuperación"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
