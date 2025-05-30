import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import {
    Container,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    Checkbox,
    FormControlLabel,
    AppBar,
    Toolbar,
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

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const navigate = useNavigate();
    const { signUp } = useAuth();

    useEffect(() => {
        // Clear sensitive data when the component is mounted
        setEmail('');
        setPassword('');
        setConfirmPassword('');

        // Replace history state to disable back button behavior
        navigate('/signup', { replace: true });
    }, [navigate]);

    const validatePassword = (password) => {
        for (const rule of passwordChecks) {
            if (!rule.test(password)) {
                return rule.label;
            }
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            setError('Password must meet all requirements');
            return;
        }

        if (!acceptedTerms) {
            setError('Please accept the terms and conditions');
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await signUp(email, password);
            if (error) throw error;

            const { error: dbError } = await supabase
                .from('users')
                .insert([
                    {
                        id: data.user.id,
                        email: data.user.email,
                        created_at: new Date().toISOString(),
                        last_login: new Date().toISOString(),
                    },
                ]);

            if (dbError) throw dbError;

            // Navigate to login and replace history state
            navigate('/login', { replace: true, state: { message: 'Registration successful! Please check your email for verification.' } });
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <AppBar position="static" sx={{ backgroundColor: '#003366', boxShadow: 'none' }}>
                <Toolbar>
                    <Typography
                        variant="h4"
                        sx={{
                            flexGrow: 1,
                            fontWeight: 700,
                            textAlign: 'center',
                            color: '#ffffff',
                        }}
                    >
                        Add<span style={{ color: '#42a5f5' }}>Wise</span>Tech
                    </Typography>
                </Toolbar>
            </AppBar>
            <Container component="main" maxWidth="xs">
                <Box
                    sx={{
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Box
                        sx={{
                            background: 'rgba(255,255,255,0.95)',
                            padding: '2.5rem',
                            borderRadius: '15px',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                            width: '100%',
                            maxWidth: '400px',
                        }}
                    >
                        <Typography component="h1" variant="h5" sx={{ textAlign: 'center', mb: 3 }}>
                            Create your account
                        </Typography>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}
                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField
                                required
                                fullWidth
                                id="email"
                                label="Email Address"
                                name="email"
                                autoComplete="email"
                                autoFocus
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                required
                                fullWidth
                                name="confirmPassword"
                                label="Confirm Password"
                                type="password"
                                id="confirmPassword"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                sx={{ mb: 2 }}
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
                                disabled={loading}
                                sx={{
                                    mb: 2,
                                    backgroundColor: '#003366',
                                    '&:hover': { backgroundColor: '#00509e' },
                                }}
                            >
                                {loading ? 'Creating account...' : 'Sign Up'}
                            </Button>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2">
                                    Already have an account?{' '}
                                    <Link to="/login" style={{ textDecoration: 'none', color: '#42a5f5' }}>
                                        Sign in
                                    </Link>
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Container>
        </>
    );
};

export default Signup;