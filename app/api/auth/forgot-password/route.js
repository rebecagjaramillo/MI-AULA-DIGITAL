import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { clientPromise } from "@/lib/mongodb";
import crypto from "crypto";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Faltan datos requeridos." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("mi_aula_digital");

    // Verificar que el usuario existe
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      // Devolver success aunque no exista para evitar user enumeration attacks
      return NextResponse.json({ success: true });
    }

    // Generar un token aleatorio
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Crear un hash del token para guardarlo en la DB
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Fecha de expiración: 1 hora
    const expiresAt = new Date(Date.now() + 3600000);

    // Guardar token en MongoDB
    await db.collection("reset_tokens").insertOne({
      email,
      token: hashedToken,
      expiresAt,
      createdAt: new Date(),
    });

    // Enviar el rawToken al usuario en el enlace
    // En producción esto debería enviar un correo. Por ahora lo mostramos en consola.
    const origin = req.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetLink = `${origin}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
    
    console.log("=========================================");
    console.log("ENLACE DE RECUPERACIÓN DE CONTRASEÑA:");
    console.log(resetLink);
    console.log("=========================================");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en forgot-password:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
