import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { clientPromise } from "@/lib/mongodb";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { token, email, password } = await req.json();

    if (!token || !email || !password) {
      return NextResponse.json({ error: "Faltan datos requeridos." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("mi_aula_digital");

    // Hashear el token recibido para compararlo con el guardado
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Buscar el token en la base de datos
    const resetTokenDoc = await db.collection("reset_tokens").findOne({
      email,
      token: hashedToken,
      expiresAt: { $gt: new Date() }, // Debe ser válido y no haber expirado
    });

    if (!resetTokenDoc) {
      return NextResponse.json({ error: "Token inválido o expirado." }, { status: 400 });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Actualizar la contraseña del usuario
    await db.collection("users").updateOne(
      { email },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

    // Eliminar el token usado para que no se pueda volver a utilizar
    await db.collection("reset_tokens").deleteOne({ _id: resetTokenDoc._id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en reset-password:", error);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
