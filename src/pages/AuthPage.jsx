import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import {
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    Checkbox,
    FormControlLabel,
} from '@mui/material';

const passwordChecks = [
    {
        label: 'At least 6 characters',
        test: (pw) => pw.length >= 6,
    },
    {
        label: 'At least one uppercase letter',
        test: (pw) => /[A-Z]/.test(pw),
    },
    {
        label: 'At least one lowercase letter',
        test: (pw) => /[a-z]/.test(pw),
    },
    {
        label: 'At least one number',
        test: (pw) => /\d/.test(pw),
    },
];

const AuthPage = () => {
    const [tab, setTab] = useState('login');
    // Login state
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    // Signup state
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
    const [signupError, setSignupError] = useState('');
    const [signupLoading, setSignupLoading] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [signupSuccess, setSignupSuccess] = useState(''); // Add state for success message
    const navigate = useNavigate();
    const { signIn, signUp } = useAuth();

    // Login handler
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoginLoading(true);
        try {
            const { data, error } = await signIn(loginEmail, loginPassword);
            if (error) {
                if (error.message.includes('Email not confirmed')) {
                    throw new Error('Please verify your email before logging in.');
                }
                throw error;
            }
            // Check if user exists in database
            const { data: userData, error: dbError } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();
            if (dbError || !userData) {
                await supabase.auth.signOut();
                throw new Error('Account not found. Please sign up first.');
            }
            // Update last login time
            await supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', data.user.id);
            navigate('/dashboard', { replace: true });
        } catch (error) {
            setLoginError(error.message);
        } finally {
            setLoginLoading(false);
        }
    };

    // Add forgot password handler
    const handleForgotPassword = async () => {
        if (!loginEmail) {
            setLoginError('Please enter your email address');
            return;
        }
        try {
            setLoginLoading(true);
            const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            setLoginError('');
            alert('Password reset instructions have been sent to your email. Please check your inbox.');
        } catch (error) {
            console.error('Password reset error:', error);
            setLoginError(error.message || 'Failed to send password reset email. Please try again.');
        } finally {
            setLoginLoading(false);
        }
    };

    // Signup handler
    const validatePassword = (password) => {
        for (const rule of passwordChecks) {
            if (!rule.test(password)) {
                return rule.label;
            }
        }
        return null;
    };
    const handleSignup = async (e) => {
        e.preventDefault();
        setSignupError('');
        setSignupSuccess(''); // Clear success message
        setSignupLoading(true);

        if (signupPassword !== signupConfirmPassword) {
            setSignupError('Passwords do not match');
            setSignupLoading(false);
            return;
        }

        const passwordError = validatePassword(signupPassword);
        if (passwordError) {
            setSignupError('Password must meet all requirements');
            setSignupLoading(false);
            return;
        }

        if (!acceptedTerms) {
            setSignupError('Please accept the terms and conditions');
            setSignupLoading(false);
            return;
        }

        try {
            const { data: authData, error: authError } = await signUp(signupEmail, signupPassword);

            if (authError) {
                if (authError.message.includes('already registered')) {
                    setSignupError('User already exists. Please try logging in instead.');
                } else {
                    throw authError;
                }
                return;
            }

            // Wait a moment to ensure the user is created in auth
            await new Promise(resolve => setTimeout(resolve, 1000));

            const { error: dbError } = await supabase
                .from('users')
                .insert([
                    {
                        id: authData.user.id,
                        email: authData.user.email,
                        created_at: new Date().toISOString(),
                        last_login: new Date().toISOString(),
                    },
                ]);

            if (dbError) {
                await supabase.auth.signOut();
                if (dbError.message.includes('violates foreign key constraint')) {
                    setSignupError('User already exists. Please try logging in instead.');
                } else {
                    throw new Error('Unable to create account. Please try again.');
                }
                return;
            }

            // Clear form data
            setSignupEmail('');
            setSignupPassword('');
            setSignupConfirmPassword('');
            setAcceptedTerms(false);

            // Show success message
            setSignupError('');
            setSignupSuccess('Registration successful! A verification email has been sent to your email address. Please verify your email before logging in.');

            // Redirect to login tab after 3 seconds
            setTimeout(() => {
                setTab('login');
            }, 3000);
        } catch (error) {
            if (error.message.includes('already registered')) {
                setSignupError('User already exists. Please try logging in instead.');
            } else if (error.message.includes('invalid email')) {
                setSignupError('Please enter a valid email address.');
            } else {
                setSignupError('Unable to create account. Please try again later.');
            }
        } finally {
            setSignupLoading(false);
        }
    };

    // Add useEffect to clear form data when component unmounts
    useEffect(() => {
        return () => {
            setLoginEmail('');
            setLoginPassword('');
            setLoginError('');
            setSignupEmail('');
            setSignupPassword('');
            setSignupConfirmPassword('');
            setSignupError('');
            setAcceptedTerms(false);
        };
    }, []);

    // Add useEffect to prevent back navigation
    useEffect(() => {
        window.history.pushState(null, '', window.location.href);
        window.onpopstate = function () {
            window.history.pushState(null, '', window.location.href);
        };

        return () => {
            window.onpopstate = null;
        };
    }, []);

    // Add useEffect to clear form data when switching tabs
    const handleTabChange = (newTab) => {
        setTab(newTab);
        if (newTab === 'login') {
            setSignupEmail('');
            setSignupPassword('');
            setSignupConfirmPassword('');
            setSignupError('');
            setAcceptedTerms(false);
        } else {
            setLoginEmail('');
            setLoginPassword('');
            setLoginError('');
        }
    };

    return (
        <>
            <div className="bg-animated" />
            <div className="sticky-header">
                <div className="addwise-logo">
                    Add<span className="highlight">Wise</span>Tech
                </div>
            </div>
            <div className="centered-form-wrapper">
                <div className="glass-card">
                    <div className="tabs">
                        <button
                            className={`tab-btn${tab === 'login' ? ' active' : ''}`}
                            onClick={() => handleTabChange('login')}
                        >
                            Login
                        </button>
                        <button
                            className={`tab-btn${tab === 'signup' ? ' active' : ''}`}
                            onClick={() => handleTabChange('signup')}
                        >
                            Sign Up
                        </button>
                    </div>
                    {tab === 'login' && (
                        <>
                            <div className="auth-title">Welcome Back</div>
                            {loginError && (
                                <Alert severity="error" className="error-message">
                                    {loginError}
                                </Alert>
                            )}
                            <form className="auth-form" onSubmit={handleLogin}>
                                <TextField
                                    required
                                    fullWidth
                                    id="loginEmail"
                                    label="Email"
                                    name="email"
                                    autoComplete="email"
                                    autoFocus
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    className="auth-input"
                                />
                                <TextField
                                    required
                                    fullWidth
                                    name="password"
                                    label="Password"
                                    type="password"
                                    id="loginPassword"
                                    autoComplete="current-password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    className="auth-input"
                                />
                                <div className="auth-links-row">
                                    <span></span>
                                    <span
                                        className="auth-link"
                                        style={{ cursor: 'pointer' }}
                                        onClick={handleForgotPassword}
                                    >
                                        Forgot Password?
                                    </span>
                                </div>
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={loginLoading}
                                    className="auth-button"
                                >
                                    {loginLoading ? 'Logging in...' : 'Login'}
                                </Button>
                            </form>
                            <div className="auth-footer">
                                New to Add Wise Tech?{' '}
                                <span
                                    className="auth-link"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleTabChange('signup')}
                                >
                                    Create an account
                                </span>
                            </div>
                        </>
                    )}
                    {tab === 'signup' && (
                        <>
                            <div className="auth-title">Create your account</div>
                            {signupError && (
                                <Alert severity="error" className="error-message">
                                    {signupError}
                                </Alert>
                            )}
                            {signupSuccess && (
                                <Alert severity="success" className="success-message">
                                    {signupSuccess}
                                </Alert>
                            )}
                            <form className="auth-form" onSubmit={handleSignup}>
                                <TextField
                                    required
                                    fullWidth
                                    id="signupEmail"
                                    label="Email"
                                    name="email"
                                    autoComplete="email"
                                    autoFocus
                                    value={signupEmail}
                                    onChange={(e) => setSignupEmail(e.target.value)}
                                    className="auth-input"
                                />
                                <TextField
                                    required
                                    fullWidth
                                    name="password"
                                    label="Password"
                                    type="password"
                                    id="signupPassword"
                                    autoComplete="new-password"
                                    value={signupPassword}
                                    onChange={(e) => setSignupPassword(e.target.value)}
                                    className="auth-input"
                                />
                                <ul className="password-rules">
                                    {passwordChecks.map((rule, idx) => {
                                        const passed = rule.test(signupPassword);
                                        return (
                                            <li className="password-rule" key={idx}>
                                                <span className={passed ? 'tick' : 'cross'}>
                                                    {passed ? '✔️' : '❌'}
                                                </span>
                                                {rule.label}
                                            </li>
                                        );
                                    })}
                                </ul>
                                <TextField
                                    required
                                    fullWidth
                                    name="confirmPassword"
                                    label="Confirm Password"
                                    type="password"
                                    id="signupConfirmPassword"
                                    autoComplete="new-password"
                                    value={signupConfirmPassword}
                                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                                    className="auth-input"
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            value="terms"
                                            color="primary"
                                            checked={acceptedTerms}
                                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                                        />
                                    }
                                    label="I accept the terms and conditions"
                                />
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={signupLoading}
                                    className="auth-button"
                                >
                                    {signupLoading ? 'Creating account...' : 'Sign Up'}
                                </Button>
                            </form>
                            <div className="auth-footer">
                                Already have an account?{' '}
                                <span
                                    className="auth-link"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleTabChange('login')}
                                >
                                    Login here
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="footer-bar">
                © 2024 Add Wise Tech. All rights reserved.
            </div>
        </>
    );
};

export default AuthPage;