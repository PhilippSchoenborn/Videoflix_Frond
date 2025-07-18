import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFormValidation, LOGIN_VALIDATION_CONFIG } from '../hooks/useFormValidation';
import { useToastContext } from '../context/ToastContext';
import mailSvg from '../assets/mail.svg';
import passwordSvg from '../assets/password.svg';
import styles from './LoginPage.module.css';
import Button from '../components/Button';
import ValidatedInput from '../components/ValidatedInput';
import Header from '../components/Header';
import BackgroundImage from '../components/BackgroundImage';
import Footer from '../components/Footer';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const processedVerificationUrlRef = useRef<string>('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToastContext();
  const { validationState, validateField, validateForm, clearAllErrors } = useFormValidation(LOGIN_VALIDATION_CONFIG);

  // Handle email verification status from URL parameters
  useEffect(() => {
    const currentUrl = location.search;
    
    // Prevent showing verification message multiple times by checking if this exact URL was already processed
    if (processedVerificationUrlRef.current === currentUrl && currentUrl) {
      return;
    }

    const urlParams = new URLSearchParams(location.search);
    const verificationStatus = urlParams.get('verification');
    const email = urlParams.get('email');

    if (verificationStatus) {
      switch (verificationStatus) {
        case 'success':
          showToast(`Email verification successful! You can now log in.`, 'success');
          // Pre-fill email field if provided
          if (email) {
            setFormData(prev => ({ ...prev, email: email }));
          }
          break;
        case 'expired':
          showToast('Email verification link has expired. Please request a new verification email.', 'error');
          break;
        case 'invalid':
          showToast('Invalid verification link. Please check your email or request a new verification email.', 'error');
          break;
        default:
          break;
      }
      
      // Mark that this URL has been processed - using ref for immediate update
      processedVerificationUrlRef.current = currentUrl;
      
      // Clean up URL parameters after showing message
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [location.search, showToast]);

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
    validateField(name, value, formData);
  };

  const extractErrorMessages = (errorData: any): string[] => {
    const messages: string[] = [];
    
    if (typeof errorData === 'string') {
      return [errorData];
    }
    
    if (Array.isArray(errorData)) {
      return errorData.flat();
    }
    
    if (typeof errorData === 'object' && errorData !== null) {
      Object.values(errorData).forEach(value => {
        if (Array.isArray(value)) {
          messages.push(...value);
        } else if (typeof value === 'string') {
          messages.push(value);
        } else if (typeof value === 'object' && value !== null) {
          messages.push(...extractErrorMessages(value));
        }
      });
    }
    
    return messages;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    clearAllErrors();

    // Validate form
    if (!validateForm(formData)) {
      showToast('Please correct the errors in the form', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email: formData.email, password: formData.password });
      showToast('Login successful!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle different types of errors
      if (err.response?.data) {
        const errorMessages = extractErrorMessages(err.response.data);
        if (errorMessages.length > 0) {
          setServerError(errorMessages.join('. '));
          showToast(errorMessages.join('. '), 'error');
        } else {
          setServerError('Invalid email or password');
          showToast('Invalid email or password', 'error');
        }
      } else if (err.message) {
        setServerError(err.message);
        showToast(err.message, 'error');
      } else {
        setServerError('Login failed. Please try again.');
        showToast('Login failed. Please try again.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BackgroundImage>
      <div className={styles.container}>
        {/* Header */}
        <Header />

        {/* Error Message */}
        {serverError && (
          <div className={styles.error}>
            {serverError}
          </div>
        )}

        {/* Content Body */}
        <div className={styles.body}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formBox}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center', justifyContent: 'center' }}>
                {/* Login Title */}
                <h1 className={styles.title}>Log in</h1>
                {/* Input Fields Container */}
                <div className={styles.inputGroup}>
                  {/* Email Input */}
                  <ValidatedInput
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Email Address"
                    icon={mailSvg}
                    iconAlt="Mail"
                    required
                    hasError={validationState.email?.hasError}
                    errorMessage={validationState.email?.errorMessage}
                    autoComplete="username"
                  />
                  {/* Password Input */}
                  <ValidatedInput
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Password"
                    icon={passwordSvg}
                    iconAlt="Password"
                    required
                    hasError={validationState.password?.hasError}
                    errorMessage={validationState.password?.errorMessage}
                    autoComplete="current-password"
                    showPasswordToggle
                  />
                </div>
                {/* Bottom Container */}
                <div className={styles.bottomGroup}>
                  {/* Login Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Log in'}
                  </Button>
                  {/* Forgot Password */}
                  <div className={styles.forgotPassword}>
                    <Link
                      to="/forgot-password"
                      className={styles.forgotPasswordLink}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  {/* Sign Up */}
                  <div className={styles.signUpRow}>
                    <span className={styles.signUpText}>
                      New to Videoflix?
                    </span>
                    <Link
                      to="/register"
                      className={styles.signUpLink}
                    >
                      Sign Up now
                    </Link>
                  </div>
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
