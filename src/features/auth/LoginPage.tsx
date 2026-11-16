import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ApiError, errorMessage } from '@/shared/api/client'
import { Button, Logo } from '@/shared/ui'
import { isValidCedula, requestLoginCode, verifyLoginCode, type CodeChannel } from './api'
import { useSession } from './useSession'
import './auth.css'

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/** Solo rutas internas en ?next= (evita redirecciones abiertas) */
const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/for-you')

/** Ingreso sin contraseña: cédula → código de 4 dígitos por WhatsApp o SMS. */
export function LoginPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const signIn = useSession((s) => s.signIn)

  const [step, setStep] = useState<'id' | 'code'>('id')
  const [idNumber, setIdNumber] = useState('')
  const [channel, setChannel] = useState<CodeChannel>('whatsapp')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [devCode, setDevCode] = useState<string | undefined>()
  const [wait, setWait] = useState(0)
  const [busy, setBusy] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  // Al pasar al código, el foco va al campo del código
  useEffect(() => {
    if (step === 'code') codeRef.current?.focus()
    else headingRef.current?.focus()
  }, [step])

  async function sendCode() {
    setBusy(true)
    setError('')
    try {
      const r = await requestLoginCode(idNumber, channel)
      setInfo(r.message)
      setDevCode(r.devCode)
      setWait(r.resendAfterSeconds)
      setCode('')
      setStep('code')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  function onSubmitId(e: FormEvent) {
    e.preventDefault()
    if (!isValidCedula(idNumber)) {
      setError('Revisa tu cédula: debe tener 10 números y ser una cédula ecuatoriana válida.')
      return
    }
    void sendCode()
  }

  async function onSubmitCode(e: FormEvent) {
    e.preventDefault()
    if (!/^\d{4}$/.test(code)) {
      setError('El código tiene 4 números.')
      codeRef.current?.focus()
      return
    }
    setBusy(true)
    setError('')
    try {
      const r = await verifyLoginCode(idNumber, code)
      signIn({ token: r.token, expiresAt: r.expiresAt, profile: r.candidate })
      navigate(safeNext(params.get('next')), { replace: true })
    } catch (e) {
      setError(errorMessage(e))
      if (e instanceof ApiError && e.code === 'CODE_LOCKED') setWait(0)
      setCode('')
      codeRef.current?.focus()
    } finally {
      setBusy(false)
    }
  }

  const errId = 'login-error'
  return (
    <div className="login">
      <Logo />
      {step === 'id' ? (
        <>
          <h1 ref={headingRef} tabIndex={-1}>
            Ingresar
          </h1>
          <p className="login__lead">Escribe tu número de cédula. Te enviaremos un código de 4 números.</p>
          <form className="login__form" onSubmit={onSubmitId} noValidate>
            <label className="login__label" htmlFor="login-id">
              Número de cédula
            </label>
            <input
              id="login-id"
              className="login__input"
              inputMode="numeric"
              autoComplete="username"
              maxLength={10}
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              aria-invalid={Boolean(error)}
              aria-describedby={`login-id-hint ${error ? errId : ''}`}
            />
            <p id="login-id-hint" className="login__hint">
              Son 10 números, sin guiones.
            </p>
            <fieldset className="login__channels">
              <legend className="login__label">¿Por dónde quieres recibir el código?</legend>
              {(['whatsapp', 'sms'] as const).map((c) => (
                <label key={c}>
                  <input type="radio" name="channel" checked={channel === c} onChange={() => setChannel(c)} />
                  {c === 'whatsapp' ? 'WhatsApp' : 'Mensaje de texto (SMS)'}
                </label>
              ))}
            </fieldset>
            <p id={errId} className="login__error" role="alert">
              {error && `⚠ ${error}`}
            </p>
            <Button type="submit" fullWidth isDisabled={busy}>
              {busy ? 'Enviando…' : 'Enviarme el código'}
            </Button>
          </form>
          <p>
            ¿No tienes cuenta?{' '}
            <Link className="login__link" to="/signup">
              Regístrate
            </Link>
          </p>
        </>
      ) : (
        <>
          <h1 ref={headingRef} tabIndex={-1}>
            Escribe tu código
          </h1>
          <p className="login__lead" role="status">
            {info}
          </p>
          {devCode && (
            <p className="login__dev">
              Demostración: ingresa este código <strong>{devCode}</strong>
              <br />
              <span>En la versión final llegará por WhatsApp o SMS.</span>
            </p>
          )}
          <form className="login__form" onSubmit={onSubmitCode} noValidate>
            <label className="login__label" htmlFor="login-code">
              Código de 4 números
            </label>
            <input
              ref={codeRef}
              id="login-code"
              className="login__input login__code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errId : undefined}
            />
            <p id={errId} className="login__error" role="alert">
              {error && `⚠ ${error}`}
            </p>
            <Button type="submit" fullWidth isDisabled={busy}>
              {busy ? 'Revisando…' : 'Ingresar'}
            </Button>
          </form>
          <div className="login__row">
            {wait > 0 ? (
              // Se anuncia solo al inicio (no cada segundo) para no saturar el lector de pantalla
              <p className="login__hint" aria-live="off">
                ¿No llegó? Reenviar en {fmt(wait)}
              </p>
            ) : (
              <Button variant="secondary" onPress={() => void sendCode()} isDisabled={busy}>
                Reenviar código
              </Button>
            )}
            <Button
              variant="ghost"
              onPress={() => {
                setStep('id')
                setError('')
              }}
            >
              Cambiar cédula
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
