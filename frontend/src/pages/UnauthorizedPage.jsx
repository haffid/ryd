import { Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import LockIcon from '@mui/icons-material/Lock'

export default function UnauthorizedPage() {
  const navigate = useNavigate()
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2,
        p: 4,
      }}
    >
      <LockIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
      <Typography variant="h5" fontWeight={700}>
        Acceso no autorizado
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={360}>
        No tiene los permisos necesarios para acceder a esta sección. Contacte al administrador si cree que es un error.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/dashboard')}>
        Volver al inicio
      </Button>
    </Box>
  )
}
