import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Link,
  Divider,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
} from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'
import LogoLogin from '../../image/logo login.png'

// Microsoft logo SVG
function MicrosoftLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0h23v23H0z" fill="#f3f3f3" />
      <path d="M1 1h10v10H1z" fill="#f35325" />
      <path d="M12 1h10v10H12z" fill="#81bc06" />
      <path d="M1 12h10v10H1z" fill="#05a6f0" />
      <path d="M12 12h10v10H12z" fill="#ffba08" />
    </svg>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/inicio'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password, rememberMe)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      {/* Architectural background overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          opacity: 0.06,
          backgroundImage:
            'linear-gradient(135deg, #0079d6 0%, #003870 100%)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 70% 50%, rgba(0,121,214,0.15) 0%, transparent 60%)',
        }}
      />

      <Box sx={{ position: 'relative', width: '100%', maxWidth: 440 }}>
        {/* Branding */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
            <img 
              src={LogoLogin} 
              alt="Research & Development Logo" 
              style={{ width: '85%', maxWidth: 360, height: 'auto', objectFit: 'contain' }} 
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Ingresa con tu Usuario y Contraseña.
          </Typography>
        </Box>

        {/* Login card */}
        <Card
          elevation={0}
          sx={{
            p: 4,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            backdropFilter: 'blur(8px)',
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Usuario o Correo Electrónico"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              fullWidth
              autoComplete="username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    color="primary"
                  />
                }
                label={<Typography variant="body2">Recordarme</Typography>}
              />
              <Link href="#" variant="body2" fontWeight={600} underline="hover">
                ¿Olvidó su contraseña?
              </Link>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              endIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LoginIcon />}
              sx={{ py: 1.5, fontWeight: 700, boxShadow: '0 4px 14px rgba(0,121,214,0.3)' }}
            >
              {loading ? 'Ingresando...' : 'Entrar'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
              O continuar con
            </Typography>
          </Divider>

          {/* Microsoft SSO — UI only */}
          <Button
            variant="outlined"
            fullWidth
            size="large"
            startIcon={<MicrosoftLogo />}
            sx={{
              borderColor: 'divider',
              color: 'text.primary',
              fontWeight: 600,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            Iniciar sesión con Microsoft
          </Button>
        </Card>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="caption" color="text.disabled">
            © {new Date().getFullYear()} Portal RyD. Todos los derechos reservados.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
