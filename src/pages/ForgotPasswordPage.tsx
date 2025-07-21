import { useState } from 'react';
import { useToastContext } from '../context/ToastContext';
import mailSvg from '../assets/mail.svg';
import styles from './ForgotPasswordPage.module.css';
import Button from '../components/Button';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackgroundImage from '../components/BackgroundImage';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToastContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }

      const response = await fetch(`${apiUrl}/api/password_reset/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (response.ok) {
        showToast('If an account with this email exists, you will receive a password reset link.', 'success');
        setEmail(''); // Clear the email field after successful submission
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to send reset email');
        showToast(data.message || 'Failed to send reset email', 'error');
      }
    } catch (err) {
      console.error('Password reset request failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BackgroundImage>
      <div className={styles.container}>
        <Header />

        {/* Error Message */}
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {/* Content Body */}
        <div className={styles.body}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formBox}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center', justifyContent: 'center' }}>
                {/* Reset Password Title */}
                <h1 className={styles.title}>Forgot your password?</h1>
                
                {/* Description */}
                <p className={styles.description}>
                  We will send you an email with instructions to reset your password.
                </p>
                
                {/* Input Fields Container */}
                <div className={styles.inputGroup}>
                  {/* Email Input */}
                  <div className={styles.inputRow}>
                    <img src={mailSvg} alt="Mail" className={styles.inputIcon} />
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      required
                      className={styles.inputField}
                    />
                  </div>
                </div>

                {/* Bottom Container */}
                <div className={styles.bottomGroup}>
                  {/* Reset Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Send Email'}
                  </Button>

                  {/* Back to Login
                  <div className={styles.backToLogin}>
                    <span className={styles.backText}>
                      Remember your password?
                    </span>
                    <Link
                      to="/"
                      className={styles.backLink}
                    >
                      Sign In
                    </Link>
                  </div> */}
                </div>
              </div>
            </div>
          </form>
        </div>

        <Footer />
      </div>
    </BackgroundImage>
  );
}
