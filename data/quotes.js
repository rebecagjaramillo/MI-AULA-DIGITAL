export const QUOTES = [
  { text: "La educación no es la preparación para la vida; la educación es la vida misma.", author: "John Dewey" },
  { text: "El arte supremo del maestro consiste en despertar el goce de la expresión creativa y del conocimiento.", author: "Albert Einstein" },
  { text: "Un niño, un profesor, un libro y un lápiz pueden cambiar el mundo.", author: "Malala Yousafzai" },
  { text: "La educación es el arma más poderosa que puedes usar para cambiar el mundo.", author: "Nelson Mandela" },
  { text: "Enseñar es aprender dos veces.", author: "Joseph Joubert" },
  { text: "El objetivo de la educación es la virtud y el deseo de convertirse en un buen ciudadano.", author: "Platón" },
  { text: "No podemos enseñar nada a nadie. Sólo podemos ayudarles a que lo descubran por sí mismos.", author: "Galileo Galilei" },
  { text: "El educador es el hombre que hace que las cosas difíciles parezcan fáciles.", author: "Ralph Waldo Emerson" },
  { text: "La educación es encender una llama, no llenar un recipiente.", author: "Sócrates" },
  { text: "Dime y lo olvido, enséñame y lo recuerdo, involúcrame y lo aprendo.", author: "Benjamin Franklin" },
  { text: "Los buenos maestros son costosos, pero los malos maestros cuestan más.", author: "Bob Talbert" },
  { text: "La principal meta de la educación es crear hombres que sean capaces de hacer cosas nuevas.", author: "Jean Piaget" },
  { text: "La enseñanza que deja huella no es la que se hace de cabeza a cabeza, sino de corazón a corazón.", author: "Howard G. Hendricks" },
  { text: "Un buen maestro puede inspirar esperanza, encender la imaginación e inculcar el amor por el aprendizaje.", author: "Brad Henry" },
  { text: "La educación es la llave para abrir la puerta de oro de la libertad.", author: "George Washington Carver" },
  { text: "El maestro deja una huella para la eternidad; nunca se sabe cuándo se detiene su influencia.", author: "Henry Adams" },
  { text: "El cerebro no es un vaso por llenar, sino una lámpara por encender.", author: "Plutarco" },
  { text: "Aprender sin reflexionar es malgastar la energía.", author: "Confucio" },
  { text: "Es el supremo arte del maestro despertar la alegría en el conocimiento y la expresión creativa.", author: "Albert Einstein" },
  { text: "Educar la mente sin educar el corazón no es educar en absoluto.", author: "Aristóteles" },
  { text: "La curiosidad es la mecha de la vela del aprendizaje.", author: "William Arthur Ward" },
  { text: "Lo que se les dé a los niños, los niños darán a la sociedad.", author: "Karl Menninger" },
  { text: "La educación no cambia el mundo, cambia a las personas que van a cambiar el mundo.", author: "Paulo Freire" },
  { text: "Mejor que mil días de estudio diligente es un día con un gran maestro.", author: "Proverbio Japonés" },
  { text: "Cualquier persona que deja de aprender es vieja, ya sea a los veinte o a los ochenta.", author: "Henry Ford" },
  { text: "Los niños deben ser enseñados sobre cómo pensar, no qué pensar.", author: "Margaret Mead" },
  { text: "La educación es lo que sobrevive cuando lo que se ha aprendido se ha olvidado.", author: "B.F. Skinner" },
  { text: "El secreto en la educación radica en respetar al estudiante.", author: "Ralph Waldo Emerson" },
  { text: "Enseñar a los niños a contar es bueno, pero enseñarles qué es lo que cuenta es mejor.", author: "Bob Talbert" },
  { text: "A los niños antes de enseñarles a leer, hay que ayudarles a aprender lo que es el amor y la verdad.", author: "Mahatma Gandhi" },
  { text: "La mejor educación del mundo es la que se obtiene luchando por ganarse la vida.", author: "Wendell Phillips" }
]

export function getDailyQuote() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now - start
  const oneDay = 1000 * 60 * 60 * 24
  const dayOfYear = Math.floor(diff / oneDay)
  
  const index = dayOfYear % QUOTES.length
  return QUOTES[index]
}
