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
    AppBar,
    Toolbar,
} from '@mui/material';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { signIn } = useAuth();

    useEffect(() => {
        // Clear sensitive data when the component is mounted
        setEmail('');
        setPassword('');

        // Replace history state to disable back button behavior
        navigate('/login', { replace: true });
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data, error } = await signIn(email, password);
            if (error) throw error;

            const { data: userData, error: dbError } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (dbError || !userData) {
                await supabase.auth.signOut();
                throw new Error('Account not found. Please sign up first.');
            }

            await supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', data.user.id);

            // Navigate to dashboard and replace history state
            navigate('/dashboard', { replace: true });
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
                            Sign in to Add Wise Tech
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
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                sx={{ mb: 2 }}
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
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Button>
                            <Box sx={{ textAlign: 'center' }}>
                                <Link to="/forgot-password" style={{ textDecoration: 'none', color: '#42a5f5' }}>
                                    Forgot password?
                                </Link>
                            </Box>
                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                <Typography variant="body2">
                                    Don't have an account?{' '}
                                    <Link to="/signup" style={{ textDecoration: 'none', color: '#42a5f5' }}>
                                        Sign up
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

export default Login;