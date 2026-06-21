"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Ocurrió un error al registrarse.");
      } else {
        router.push("/login?registered=true");
      }
    } catch (err) {
      setError("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 relative overflow-hidden p-4">
      <div className="z-10 w-full max-w-md p-8 bg-white border border-slate-200 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white mb-5 shadow-sm">
            <UserPlus className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Crea tu cuenta</h1>
          <p className="text-slate-500 text-sm">Únete a la app que está transformando la forma de gestionar tus clases.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-slate-700 mb-1.5 ml-0.5">Nombre Completo</Label>
            <Input
              id="name"
              type="text"
              required
              aria-label="Nombre Completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
              placeholder="Juan Pérez"
            />
          </div>

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

          <div>
            <Label htmlFor="password" className="text-slate-700 mb-1.5 ml-0.5">Contraseña</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              aria-label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-medium transition-all shadow-md mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {loading ? "Creando cuenta..." : "Registrarme"}
          </Button>
        </form>

        <div className="flex items-center gap-4 mt-7 mb-7">
          <hr className="flex-1 border-slate-200" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">O continúa con</span>
          <hr className="flex-1 border-slate-200" />
        </div>

        <Button
          type="button"
          onClick={handleGoogleLogin}
          variant="outline"
          disabled={googleLoading || loading}
          className="w-full h-11 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center gap-3"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          <span>Google</span>
        </Button>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-sky-600 hover:text-sky-700 font-semibold transition-colors">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
