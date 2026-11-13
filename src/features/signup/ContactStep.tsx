import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import { Button, ChipGroup } from '@/shared/ui'
import { ArrowRightIcon } from '@/shared/ui/icons'
import { VoiceField } from '@/shared/voice/VoiceField'
import { CONTACT_PREFERENCES } from './options'
import { StepFrame } from './StepFrame'
import { useSignupStore } from './useSignupStore'

// Validación del documento: celular 09XXXXXXXX y correo. (La cédula se valida en el paso 1.)
const schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, { error: 'Escribe tu nombre completo' })
    .refine((v) => v.split(/\s+/).length >= 2, { error: 'Escribe tu nombre y tu apellido' }),
  phone: z.string().regex(/^09\d{8}$/, { error: 'Escribe 10 dígitos que empiecen con 09' }),
  email: z.email({ error: 'Escribe un correo válido, por ejemplo nombre@correo.com' }),
  city: z.string().trim().min(2, { error: 'Escribe la ciudad donde vives' }),
  preferred: z.enum(['call', 'whatsapp', 'email']),
})
type FormValues = z.infer<typeof schema>

/** Al fallar la validación el foco va al primer campo con error (el lector de pantalla lo lee con su mensaje). */
export const focusFirstInvalid = () =>
  requestAnimationFrame(() => document.querySelector<HTMLElement>('main [aria-invalid="true"]')?.focus())

export function ContactStep() {
  const navigate = useNavigate()
  const contact = useSignupStore((s) => s.contact)
  const saveContact = useSignupStore((s) => s.saveContact)
  const markCompleted = useSignupStore((s) => s.markCompleted)

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: contact,
    mode: 'onTouched',
  })

  const onValid = (v: FormValues) => {
    saveContact({ ...v, fullName: v.fullName.trim(), city: v.city.trim() })
    markCompleted(2)
    navigate('/signup/experience')
  }

  return (
    <StepFrame
      step={2}
      title="¿Cómo te contactamos?"
      lead="La empresa te llamará o escribirá a estos datos. Toca el micrófono de cualquier campo y di tus datos en voz alta."
    >
      <form noValidate onSubmit={handleSubmit(onValid, focusFirstInvalid)} className="step">
        <div className="step__grid step__grid--2">
          <Controller
            name="fullName"
            control={control}
            render={({ field, fieldState }) => (
              <VoiceField kind="name" label="Nombre completo" autoComplete="name" value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
            )}
          />
          <Controller
            name="phone"
            control={control}
            render={({ field, fieldState }) => (
              <VoiceField
                kind="phone"
                label="Celular"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                hint="Dilo número por número: “cero nueve nueve…”"
                value={field.value}
                onChange={(v) => field.onChange(v.replace(/\D/g, '').slice(0, 10))}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="email"
            control={control}
            render={({ field, fieldState }) => (
              <VoiceField
                kind="email"
                label="Correo electrónico"
                type="email"
                inputMode="email"
                autoComplete="email"
                hint="Di “arroba” para @ y “punto” para el punto."
                value={field.value}
                onChange={(v) => field.onChange(v.replace(/\s/g, ''))}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="city"
            control={control}
            render={({ field, fieldState }) => (
              <VoiceField kind="city" label="Ciudad donde vives" autoComplete="address-level2" placeholder="Escribe o dicta" value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={fieldState.error?.message} />
            )}
          />
        </div>

        <Controller
          name="preferred"
          control={control}
          render={({ field }) => (
            <ChipGroup
              label="¿Cómo prefieres que te contacten?"
              selectionMode="single"
              options={[...CONTACT_PREFERENCES]}
              value={field.value}
              // No se puede dejar sin elegir: si toca la misma, se queda
              onChange={(v) => v && field.onChange(v)}
            />
          )}
        />

        <p className="step__note">Después de dictar, leemos en voz alta lo que entendimos para que puedas confirmarlo.</p>

        <div className="step__footer">
          <Button variant="secondary" onPress={() => navigate('/signup/id-card')}>
            Volver al paso 1
          </Button>
          <Button type="submit" className="step__next">
            Continuar al paso 3 <ArrowRightIcon />
          </Button>
        </div>
        <p className="step__note">Tus datos se guardan si sales.</p>
      </form>
    </StepFrame>
  )
}
