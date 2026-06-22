import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (nombre, correo o contraseña)' },
        { status: 400 }
      )
    }

    // Verificar si ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'El correo electrónico ya está registrado' },
        { status: 409 }
      )
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Guardar usuario
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        image: null,
      }
    })

    return NextResponse.json({ success: true, message: 'Usuario registrado exitosamente' }, { status: 201 })
  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
