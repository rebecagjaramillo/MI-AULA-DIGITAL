import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { getForgotPasswordTemplate } from "@/lib/emailTemplate";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Faltan datos requeridos." }, { status: 400 });
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({ where: { email } });
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

    // Guardar token usando VerificationToken (nativo de NextAuth/Prisma)
    await prisma.verificationToken.create({
      data: {
         identifier: email,
         token: hashedToken,
         expires: expiresAt,
      }
    });

    const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || req.headers.get("origin") || "http://localhost:3000";
    const resetLink = `${origin}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
    
    // Configurar nodemailer transport
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_SERVER_PORT) || 465,
      secure: true, // true para puerto 465
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Mi Aula Digital" <noreply@miauladigital.com>',
      to: email,
      subject: "Recuperación de Contraseña - Mi Aula Digital",
      html: getForgotPasswordTemplate(resetLink),
    };

    // Enviar correo
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    // Solo imprimimos el mensaje de error por seguridad, para no filtrar contraseñas o datos del transporte
    console.error("Error en forgot-password SMTP:", error.message);
    return NextResponse.json(
      { error: "No se pudo enviar el correo de recuperación. Inténtalo más tarde." }, 
      { status: 500 }
    );
  }
}
