export const SIGNUP_STEPS = [
  { n: 1, path: '/signup/id-card', title: 'Tu documento', desc: 'Cédula o carnet, frente y reverso' },
  { n: 2, path: '/signup/contact', title: 'Contacto', desc: 'Celular y correo' },
  { n: 3, path: '/signup/experience', title: 'Experiencia', desc: 'Opcional' },
  { n: 4, path: '/signup/privacy', title: 'Privacidad', desc: 'Tú decides qué se comparte' },
] as const

export const TOTAL_STEPS = SIGNUP_STEPS.length
