import { useState, useMemo, type FC } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box, AppBar, Toolbar, Typography, IconButton, Container } from '@mui/material';
import { Brightness4, Brightness7, Send, History } from '@mui/icons-material';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import ComposeEmail from './pages/ComposeEmail';
import EmailHistory from './pages/EmailHistory';
import { getTheme } from './theme/theme';

const App: FC = () => {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');

  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
                  BulkMailer
                </Typography>
                <IconButton component={Link} to="/" color="inherit">
                  <Send />
                </IconButton>
                <IconButton component={Link} to="/history" color="inherit">
                  <History />
                </IconButton>
                <IconButton onClick={toggleColorMode} color="inherit">
                  {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Toolbar>
            </AppBar>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
              <Routes>
                <Route path="/" element={<ComposeEmail />} />
                <Route path="/history" element={<EmailHistory />} />
              </Routes>
            </Container>
          </Box>
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
