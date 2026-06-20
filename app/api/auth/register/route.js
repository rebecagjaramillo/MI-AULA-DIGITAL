import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
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

    const db = await getDb()
    const usersCol = db.collection('users')

    // Verificar si ya existe
    const existingUser = await usersCol.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'El correo electrónico ya está registrado' },
        { status: 409 }
      )
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Guardar usuario
    const newUser = {
      name,
      email,
      password: hashedPassword,
      image: null,
      created_at: new Date().toISOString(),
    }

    await usersCol.insertOne(newUser)

    return NextResponse.json({ success: true, message: 'Usuario registrado exitosamente' }, { status: 201 })
  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
