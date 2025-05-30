import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import {
    TextField,
    Button,
    Alert,
} from '@mui/material';

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isValidLink, setIsValidLink] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if we have a session
        const checkSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                setError('Invalid or expired reset link. Please try requesting a new password reset.');
                return;
            }
            if (session) {
                setIsValidLink(true);
            } else {
                setError('Invalid reset link. Please try requesting a new password reset.');
            }
        };

        checkSession();

        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsValidLink(true);
            } else if (event === 'SIGNED_OUT') {
                setIsValidLink(false);
                setError('Session expired. Please try requesting a new password reset.');
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const handleReset = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                navigate('/login', { 
                    replace: true,
                    state: { message: 'Password updated successfully. Please login with your new password.' }
                });
            }, 2000);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
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
                    <div className="auth-title">Reset Password</div>
                    {error && (
                        <Alert severity="error" className="error-message">
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" className="success-message">
                            Password updated successfully! Redirecting to login...
                        </Alert>
                    )}
                    {isValidLink && !error && !success && (
                        <form className="auth-form" onSubmit={handleReset}>
                            <TextField
                                required
                                fullWidth
                                name="newPassword"
                                label="New Password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="auth-input"
                            />
                            <TextField
                                required
                                fullWidth
                                name="confirmPassword"
                                label="Confirm New Password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="auth-input"
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                className="auth-button"
                            >
                                {loading ? 'Updating Password...' : 'Reset Password'}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
            <div className="footer-bar">
                © 2024 Add Wise Tech. All rights reserved.
            </div>
        </>
    );
};

export default ResetPassword; 