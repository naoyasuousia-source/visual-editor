import React from 'react';
import { Box, CssBaseline, ThemeProvider, AppBar, Toolbar, Typography, Button, Container, Grid, Paper, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import theme from './theme';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>

                {/* Navigation Bar */}
                <AppBar position="static" elevation={0}>
                    <Toolbar>
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <AutoAwesomeIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                            AI-Link Editor <Box component="span" sx={{ color: 'primary.main', fontSize: '0.8em' }}>V2</Box>
                        </Typography>
                        <Button color="inherit">Login</Button>
                    </Toolbar>
                </AppBar>

                {/* Main Content Area */}
                <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
                    <Grid container spacing={3} sx={{ height: '100%' }}>

                        {/* Sidebar / Tools Panel */}
                        <Grid item xs={12} md={3}>
                            <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Project Explorer
                                </Typography>
                                <Button variant="contained" fullWidth startIcon={<AutoAwesomeIcon />}>
                                    New Project
                                </Button>
                                <Button variant="outlined" fullWidth>
                                    Open File
                                </Button>
                                <Box sx={{ flexGrow: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                    v2.0.0 Alpha
                                </Typography>
                            </Paper>
                        </Grid>

                        {/* Editor Canvas */}
                        <Grid item xs={12} md={9}>
                            <Paper
                                sx={{
                                    p: 4,
                                    height: '100%',
                                    minHeight: '600px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px dashed rgba(255,255,255,0.1)',
                                    bgcolor: 'rgba(0,0,0,0.2)'
                                }}
                            >
                                <Typography variant="h4" gutterBottom color="text.secondary">
                                    Welcome to AI-Link Editor V2
                                </Typography>
                                <Typography variant="body1" color="text.secondary" paragraph>
                                    Start by creating a new project or opening an existing one.
                                </Typography>
                                <Button variant="contained" size="large" sx={{ mt: 2 }}>
                                    Get Started
                                </Button>
                            </Paper>
                        </Grid>

                    </Grid>
                </Container>
            </Box>
        </ThemeProvider>
    );
}

export default App;
