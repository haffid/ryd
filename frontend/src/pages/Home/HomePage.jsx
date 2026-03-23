import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  useTheme,
  Divider,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  AttachMoney as DollarIcon,
  Euro as EuroIcon,
  Language as WorldIcon,
  ShowChart as ChartIcon,
  Money as MoneyIcon,
  AccountBalance as BankIcon,
  Opacity as DropIcon,
  Hardware as HardwareIcon,
} from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'
import api from '../../services/api'

// Simple widget to display a stat
function StatCard({ title, value, subtitle, icon, loading, change }) {
  const theme = useTheme()
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 10px 20px rgba(0,121,214,0.1)',
          borderColor: 'primary.main',
        }
      }}
    >
      <Box sx={{ position: 'absolute', top: -15, right: -15, opacity: 0.05, transform: 'scale(2)' }}>
        {icon}
      </Box>
      <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        <Typography variant="body2" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={1} gutterBottom>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mt: 2, mb: 1 }}>
          {loading ? (
            <CircularProgress size={28} thickness={5} />
          ) : (
            <Typography variant="h3" fontWeight={800} color="text.primary" lineHeight={1}>
              {value}
            </Typography>
          )}
          {change && !loading && (
            <Typography variant="caption" color={change.startsWith('+') ? 'success.main' : 'error.main'} fontWeight={700} sx={{ mb: 0.5 }}>
              {change}
            </Typography>
          )}
        </Box>
        <Typography variant="caption" color="text.disabled">
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  const theme = useTheme()
  const [exchangeRates, setExchangeRates] = useState(null)
  const [banguatData, setBanguatData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('https://api.exchangerate-api.com/v4/latest/USD').then(res => res.json()).catch(() => null),
      api.get('/banguat').then(res => res.data).catch(() => null)
    ]).then(([ratesData, banData]) => {
      setExchangeRates(ratesData?.rates || null)
      setBanguatData(banData)
      setLoading(false)
    })
  }, [])

  const gtqRate = exchangeRates?.GTQ ? `Q ${exchangeRates.GTQ.toFixed(2)}` : 'N/A'

  // Calculate EUR to GTQ: (1 USD / EUR rate) * GTQ rate
  const eurToGtq = (exchangeRates?.EUR && exchangeRates?.GTQ)
    ? `Q ${((1 / exchangeRates.EUR) * exchangeRates.GTQ).toFixed(2)}`
    : 'N/A'

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, flex: 1, overflowY: 'auto', bgcolor: 'background.default' }}>

      {/* Hero Header */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Hola, {user?.full_name?.split(' ')[0] || 'Usuario'}
        </Typography>
        <Typography variant="body1" color="text.secondary" maxWidth={600}>
          Bienvenido al Portal Research & Development. Este es el resumen macroeconómico del mercado en tiempo real.
        </Typography>
      </Box>

      {/* Main Stats Grid - Guatemala */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Typography variant="h6" fontWeight={700}>
          Indicadores Macro (Guatemala)
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Dólar (USD/GTQ)"
            value={gtqRate}
            subtitle="Referencia Cambiaria"
            icon={<DollarIcon sx={{ fontSize: 100 }} />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Euro (EUR/GTQ)"
            value={eurToGtq}
            subtitle="Referencia Europa"
            icon={<EuroIcon sx={{ fontSize: 100 }} />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Inflación (Ritmo)"
            value={banguatData?.inflacion_ritmo || 'N/A'}
            subtitle={`Intermensual: ${banguatData?.inflacion_intermensual || 'N/A'}`}
            icon={<TrendingUpIcon sx={{ fontSize: 100 }} />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Tasa Líder (GT)"
            value={banguatData?.tasa_lider || 'N/A'}
            subtitle="Política Monetaria Banguat"
            icon={<ChartIcon sx={{ fontSize: 100 }} />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="IMAE"
            value={banguatData?.imae || 'N/A'}
            subtitle="Índ. Actividad Económica (Ene. 2026)"
            icon={<TrendingUpIcon sx={{ fontSize: 100 }} />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Ingreso de Divisas"
            value={banguatData?.remesas_mensual || 'N/A'}
            subtitle="Remesas Familiares (Feb. 2026)"
            icon={<MoneyIcon sx={{ fontSize: 100 }} />}
            loading={loading}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Global Information Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <WorldIcon color="primary" fontSize="large" />
        <Typography variant="h5" fontWeight={700}>
          Mercados Internacionales
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tasa FED"
            value={banguatData?.fed || 'N/A'}
            subtitle="Reserva Federal de EE. UU."
            icon={<BankIcon sx={{ fontSize: 100 }} />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tasa SOFR"
            value={banguatData?.sofr || 'N/A'}
            subtitle="Secured Overnight Financing Rate"
            icon={<TrendingUpIcon sx={{ fontSize: 100 }} />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Petróleo (WTI)"
            value={banguatData?.petroleo || 'N/A'}
            subtitle="Barril Crude Oil"
            icon={<DropIcon sx={{ fontSize: 100 }} />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Acero (HRC)"
            value={banguatData?.acero || 'N/A'}
            subtitle="Precio promedio por Tonelada"
            icon={<HardwareIcon sx={{ fontSize: 100 }} />}
            loading={loading}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Secondary Information Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <WorldIcon color="primary" fontSize="large" />
          <Typography variant="h5" fontWeight={700}>
            Panorama Global
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3, height: '100%' }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Reserva Federal de EE. UU. (FED)</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Las tasas de interés de referencia se mantienen en el rango objetivo debido a los últimos reportes de empleo e inflación, impactando los flujos de inversión global hacia mercados emergentes como Centroamérica.
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="caption" color="text.primary" fontWeight={700} display="block">TASA ACTUAL FED</Typography>
                <Typography variant="h5" fontWeight={800} color="primary.main">5.25% - 5.50%</Typography>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 3, height: '100%' }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Mercado Inmobiliario Tendencias</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                La estabilización de las tasas hipotecarias a nivel regional proyecta un mayor dinamismo en la colocación de créditos para uso residencial y de desarrollo vertical en áreas urbanas de alta densidad.
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="caption" color="text.primary" fontWeight={700} display="block">EXPECTATIVA DE CRECIMIENTO</Typography>
                <Typography variant="h5" fontWeight={800} color="success.main">+4.5% Anual</Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>

    </Box>
  )
}
