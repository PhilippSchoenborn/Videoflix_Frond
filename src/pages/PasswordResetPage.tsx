import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormValidation, PASSWORD_RESET_VALIDATION_CONFIG } from '../hooks/useFormValidation';
import { useToastContext } from '../context/ToastContext';
import passwordSvg from '../assets/password.svg';
import styles from './PasswordResetPage.module.css';
import Button from '../components/Button';
import ValidatedInput from '../components/ValidatedInput';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BackgroundImageSignUp from '../components/BackgroundImageSignUp';
import BackArrow from '../components/BackArrow';

export default function PasswordResetPage() {
  const { token } = useParams<{ token: string }>();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const { validationState, validateField, validateForm } = useFormValidation(PASSWORD_RESET_VALIDATION_CONFIG);

  // Check if token exists
  useEffect(() => {
    if (!token) {
      showToast('Invalid reset link', 'error');
      navigate('/forgot-password');
    }
  }, [token, navigate, showToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear server error when user starts typing
    if (serverError) {
      setServerError('');
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'confirmPassword') {
      // Check if passwords match
      if (value !== formData.password) {
        validateField('confirmPassword', value, formData);
      } else {
        validateField('confirmPassword', value, formData);
      }
    } else {
      validateField(name, value, formData);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(formData)) {
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setServerError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setServerError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/password_reset_confirm/${token}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          password: formData.password,
          password_confirm: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Password reset successfully! You can now log in with your new password.', 'success');
        navigate('/login');
      } else {
        setServerError(data.error || data.detail || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setServerError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className={styles.container}>
      <BackgroundImageSignUp />
      <Header />
      
      <main className={styles.main}>
        <div className={styles.formContainer}>
          <BackArrow />
          
          <div className={styles.formContent}>
            <h1 className={styles.title}>Reset Your Password</h1>
            <p className={styles.subtitle}>
              Enter your new password below
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <ValidatedInput
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="New Password"
                icon={passwordSvg}
                iconAlt="Password"
                required
                hasError={validationState.password?.hasError}
                errorMessage={validationState.password?.errorMessage}
                autoComplete="new-password"
                showPasswordToggle
              />

              <ValidatedInput
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Confirm New Password"
                icon={passwordSvg}
                iconAlt="Password"
                required
                hasError={validationState.confirmPassword?.hasError}
                errorMessage={validationState.confirmPassword?.errorMessage}
                autoComplete="new-password"
                showPasswordToggle
              />

              {serverError && (
                <div className={styles.errorMessage}>
                  {serverError}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !formData.password || !formData.confirmPassword}
                className={styles.submitButton}
              >
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </form>

            <div className={styles.loginLink}>
              <span>Remember your password? </span>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className={styles.linkButton}
                disabled={isLoading}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
