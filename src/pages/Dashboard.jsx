import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    Grid,
    Card,
    CardContent,
    Divider,
    CircularProgress,
    AppBar,
    Toolbar,
} from '@mui/material';

const Dashboard = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;
                setUserData(data);
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchUserData();
        }
    }, [user]);

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '100vh',
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
            <Grid container spacing={3}>
                {/* Welcome Section */}
                <Grid item xs={12}>
                    <Paper
                        sx={{
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Typography component="h1" variant="h4" gutterBottom>
                            Welcome to Add Wise Tech
                        </Typography>
                        <Typography variant="h6" color="text.secondary">
                            {user.email}
                        </Typography>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={handleLogout}
                            sx={{ mt: 2 }}
                        >
                            Logout
                        </Button>
                    </Paper>
                </Grid>

                {/* Quick Stats */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Last Login
                            </Typography>
                            <Typography variant="body1">
                                {userData?.last_login
                                    ? new Date(userData.last_login).toLocaleString()
                                    : 'N/A'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Account Created
                            </Typography>
                            <Typography variant="body1">
                                {userData?.created_at
                                    ? new Date(userData.created_at).toLocaleDateString()
                                    : 'N/A'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Account Status
                            </Typography>
                            <Typography variant="body1" color="success.main">
                                Active
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Recent Activity */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Activity
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                            No recent activity to display.
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Dashboard;