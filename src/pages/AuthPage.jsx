import { useState } from 'react'
import Icon from '../components/Icon'
import { api, demoMode } from '../lib/api'
import { image } from '../components/public/PageElements'

export function AuthPage({
  mode,
  onLogin,
  onRegister,
  onVerifyEmail,
  onResendVerification,
  go,
  initialMessage = "",
}) {
  const isRegister = mode === "register";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState(initialMessage);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationMode, setVerificationMode] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [previewCode, setPreviewCode] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [demoResetPreview, setDemoResetPreview] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedbackKind, setFeedbackKind] = useState('error');
  const update = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (isRegister) {
        const result = await onRegister(form.name, form.email, form.password);
        if (result?.requiresVerification) {
          setVerificationEmail(result.email || form.email);
          setPreviewCode(result.previewCode || '');
          setVerificationMode(true);
          setFeedbackKind('success');
          setMessage(`We sent a 6-digit verification code to ${result.email || form.email}.`);
        }
      } else await onLogin(form.email, form.password);
    } catch (error) {
      const errorMessage = error.message || "We could not sign you in. Please try again."
      if (/verify your email/i.test(errorMessage) || /verification email could not be sent/i.test(errorMessage)) {
        setVerificationEmail(form.email)
        setVerificationCode('')
        setVerificationMode(true)
      }
      setFeedbackKind('error')
      setMessage(errorMessage)
    } finally {
      setBusy(false);
    }
  };
  const verify = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      await onVerifyEmail(verificationEmail, verificationCode)
    } catch (error) {
      setFeedbackKind('error')
      setMessage(error.message || 'We could not verify that code. Please try again.')
    } finally {
      setBusy(false)
    }
  }
  const resend = async () => {
    setBusy(true)
    setMessage('')
    try {
      const result = await onResendVerification(verificationEmail)
      setPreviewCode(result.previewCode || '')
      setFeedbackKind('success')
      setMessage(result.message || 'A new verification code has been sent.')
    } catch (error) {
      setFeedbackKind('error')
      setMessage(error.message || 'We could not send another code. Please try again.')
    } finally {
      setBusy(false)
    }
  }
  const requestPasswordReset = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const result = await api.forgotPassword(form.email)
      setForgotMode(false)
      setResetMode(true)
      setDemoResetPreview(Boolean(result.demoPreview))
      setFeedbackKind('success')
      setMessage(result.demoPreview ? '' : result.message || 'If an account with that email exists, a reset code has been sent.')
    } catch (error) {
      setFeedbackKind('error')
      setMessage(error.message || 'We could not send a password reset code. Please try again.')
    } finally {
      setBusy(false)
    }
  }
  const resetPassword = async (event) => {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      setFeedbackKind('error')
      setMessage('Your passwords do not match. Please check them and try again.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      const result = await api.resetPassword({ email: form.email, code: resetCode, password: newPassword })
      setResetMode(false)
      setForgotMode(false)
      setDemoResetPreview(false)
      setResetCode('')
      setNewPassword('')
      setConfirmPassword('')
      setForm((current) => ({ ...current, password: '' }))
      setFeedbackKind('success')
      setMessage(result.message || 'Password updated. Sign in with your new password.')
    } catch (error) {
      setFeedbackKind('error')
      setMessage(error.message || 'We could not reset your password. Please try again.')
    } finally {
      setBusy(false)
    }
  }
  const cancelPasswordReset = () => {
    setForgotMode(false)
    setResetMode(false)
    setDemoResetPreview(false)
    setResetCode('')
    setNewPassword('')
    setConfirmPassword('')
    setMessage('')
    setFeedbackKind('error')
  }
  const handleFormSubmit = verificationMode ? verify : resetMode ? resetPassword : forgotMode ? requestPasswordReset : submit

  return (
    <div className="auth-wrap page-container">
      <div
        className="auth-photo"
        style={{
          backgroundImage:
            "linear-gradient(180deg,transparent 40%,rgba(24,39,30,.78)),url(" +
            image("photo-1414235077428-338989a2e8c0", 1200) +
            ")",
        }}
      >
        <span className="auth-photo-note">A PLACE TO SLOW DOWN.</span>
        <p>
          “There’s always room
          <br />
          for one more.”
        </p>
      </div>
      <div className="auth-panel">
        <span className="eyebrow">
          {verificationMode ? "EMAIL VERIFICATION" : resetMode ? "PASSWORD RESET" : forgotMode ? "ACCOUNT RECOVERY" : isRegister ? "COME ON IN" : "WELCOME BACK"}
        </span>
        <h1>
          {verificationMode ? (
            <>Check your<br /><em>inbox.</em></>
          ) : resetMode ? (
            <>Set a new<br /><em>password.</em></>
          ) : forgotMode ? (
            <>Let’s get you<br /><em>back in.</em></>
          ) : isRegister ? (
            <>
              Your seat
              <br />
              is <em>saved.</em>
            </>
          ) : (
            <>
              Good to see
              <br />
              you <em>again.</em>
            </>
          )}
        </h1>
        <p className="auth-intro">
          {verificationMode
            ? `Enter the 6-digit code sent to ${verificationEmail}.`
            : resetMode
            ? (demoResetPreview ? 'Choose a new password for this demo preview.' : `Enter the reset code sent to ${form.email} and choose a new password.`)
            : forgotMode
            ? 'Enter your account email and we’ll send a password reset code.'
            : isRegister
            ? "Create an account to keep your reservations close."
            : "Sign in to manage your reservations and restaurant."}
        </p>
        <form onSubmit={handleFormSubmit} className="auth-form">
          {verificationMode ? (
            <>
              <label className="field">
                <span>Email address</span>
                <input required type="email" value={verificationEmail} onChange={(event) => setVerificationEmail(event.target.value)} autoComplete="email" />
              </label>
              <label className="field">
                <span>6-digit code</span>
                <input required inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))} autoComplete="one-time-code" />
              </label>
              {previewCode && <div className="verification-preview-code" role="note">Preview code: <strong>{previewCode}</strong></div>}
              {message && <div className={`form-message ${feedbackKind}`} role={feedbackKind === 'error' ? 'alert' : 'status'}>{message}</div>}
              <button className="button button-dark auth-submit" disabled={busy || verificationCode.length !== 6}>
                {busy ? "Please waitâ€¦" : "Verify email"} <Icon name="arrow" size={17} />
              </button>
            </>
          ) : forgotMode ? (
            <>
              <label className="field">
                <span>Email address</span>
                <input required type="email" name="email" value={form.email} onChange={update} autoComplete="email" />
              </label>
              {message && <div className={`form-message ${feedbackKind}`} role={feedbackKind === 'error' ? 'alert' : 'status'}>{message}</div>}
              <button className="button button-dark auth-submit" disabled={busy || !form.email.trim()}>{busy ? 'Please wait…' : demoMode ? 'Continue' : 'Send reset code'} <Icon name="arrow" size={17} /></button>
            </>
          ) : resetMode ? (
            <>
              {demoResetPreview ? (
                null
              ) : (
                <label className="field">
                  <span>Reset code</span>
                  <input required inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={resetCode} onChange={(event) => setResetCode(event.target.value.replace(/\D/g, '').slice(0, 6))} autoComplete="one-time-code" />
                </label>
              )}
              <label className="field">
                <span>New password</span>
                <div className="password-input-wrap">
                  <input required minLength="8" maxLength="72" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" />
                  <button className="password-toggle" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}><Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} /></button>
                </div>
              </label>
              <label className="field">
                <span>Confirm password</span>
                <input required minLength="8" maxLength="72" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" />
              </label>
              {message && (!demoResetPreview || feedbackKind === 'error') && <div className={`form-message ${feedbackKind}`} role={feedbackKind === 'error' ? 'alert' : 'status'}>{message}</div>}
              <button className="button button-dark auth-submit" disabled={busy || (!demoResetPreview && resetCode.length !== 6)}>{busy ? 'Please wait…' : 'Reset password'} <Icon name="arrow" size={17} /></button>
            </>
          ) : (
            <>
          {isRegister && (
            <label className="field">
              <span>Your name</span>
              <input
                required
                minLength="2"
                name="name"
                value={form.name}
                onChange={update}
                autoComplete="name"
              />
            </label>
          )}
          <label className="field">
            <span>Email address</span>
            <input
              required
              type="email"
              name="email"
              value={form.email}
              onChange={update}
              autoComplete="email"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <div className="password-input-wrap">
              <input
                required
                minLength="8"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={update}
                autoComplete={isRegister ? "new-password" : "current-password"}
              />
              <button
                className="password-toggle"
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
              </button>
            </div>
          </label>
          {message && <div className={`form-message ${feedbackKind}`} role={feedbackKind === 'error' ? 'alert' : 'status'}>{message}</div>}
          <button className="button button-dark auth-submit" disabled={busy}>
            {busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}{" "}
            <Icon name="arrow" size={17} />
          </button>
          {!isRegister && (
            <div className="auth-forgot-row">
              <button type="button" onClick={() => { setForgotMode(true); setMessage(''); setFeedbackKind('error') }}>Forgot password?</button>
            </div>
          )}
            </>
          )}
        </form>
        {verificationMode ? (
          <div className="auth-verification-actions">
            <button type="button" disabled={busy} onClick={resend}>Resend code</button>
            <button type="button" onClick={() => { setVerificationMode(false); setMessage(''); setPreviewCode('') }}>Use a different account</button>
          </div>
        ) : forgotMode || resetMode ? (
          <p className="auth-switch auth-recovery-switch"><button type="button" onClick={cancelPasswordReset}>Back to sign in</button></p>
        ) : (
          <>
            <p className="auth-switch">
              {isRegister ? "Already have an account?" : "New around here?"}{" "}
              <button onClick={() => go(isRegister ? "/login" : "/register")}>
                {isRegister ? "Sign in" : "Create an account"}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
