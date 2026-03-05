import { useState, useRef, useEffect, useCallback } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import {
  AppBar,
  Box,
  ClickAwayListener,
  CircularProgress,
  IconButton,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
  InputBase,
  Badge,
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popper,
  Skeleton,
  useTheme,
} from '@mui/material'
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Article as ArticleIcon,
  AccountTree as AccountTreeIcon,
} from '@mui/icons-material'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import { useThemeMode } from '../context/ThemeContext'
import { insightsService } from '../services/insightsService'
import { pagesService } from '../services/pagesService'

// Fixed admin-only nav items — labels never change
const ADMIN_NAV = [
  { label: 'Insights', path: '/insights', permission: 'insights:write' },
  { label: 'Estructura', path: '/pages', permission: 'pages:write' },
  { label: 'Documentos', path: '/documents', permission: 'pages:write' },
  { label: 'Usuarios', path: '/users', permission: 'users:read' },
  { label: 'Roles', path: '/roles', permission: 'users:write' },
]

function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function flattenPages(tree, arr = []) {
  for (const p of tree) {
    arr.push(p)
    if (p.children?.length) flattenPages(p.children, arr)
  }
  return arr
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { can } = usePermissions()
  const { mode, toggle } = useThemeMode()
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [anchorEl, setAnchorEl] = useState(null)

  // ── Dynamic page nav (loaded from API) ─────────────────────────────────
  const [navPages, setNavPages] = useState([])
  const [navLoading, setNavLoading] = useState(true)

  useEffect(() => {
    setNavLoading(true)
    pagesService
      .list()
      .then((res) => {
        // Only top-level published pages appear in the nav
        const published = (res.data || []).filter((p) => p.visibility === 'published')
        setNavPages(published)
      })
      .catch(() => setNavPages([]))
      .finally(() => setNavLoading(false))
  }, [])

  // ── Search ──────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState({ insights: [], pages: [] })
  const searchBoxRef = useRef(null)
  const cachedInsights = useRef(null)
  const cachedPages = useRef(null)

  const loadSearchCache = useCallback(async () => {
    if (cachedInsights.current && cachedPages.current) return
    try {
      const [insRes, pgRes] = await Promise.all([
        insightsService.list({ limit: 200 }),
        pagesService.list(),
      ])
      cachedInsights.current = insRes.data || []
      cachedPages.current = flattenPages(pgRes.data || [])
    } catch {
      cachedInsights.current = []
      cachedPages.current = []
    }
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ insights: [], pages: [] })
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      await loadSearchCache()
      const q = searchQuery.toLowerCase()
      const insights = (cachedInsights.current || [])
        .filter(
          (i) =>
            i.title?.toLowerCase().includes(q) ||
            (i.content || '').toLowerCase().includes(q)
        )
        .slice(0, 5)
      const pages = (cachedPages.current || [])
        .filter((p) => p.name?.toLowerCase().includes(q))
        .slice(0, 4)
      setSearchResults({ insights, pages })
      setSearching(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery, loadSearchCache])

  const handleSearchFocus = () => {
    setSearchOpen(true)
    loadSearchCache()
  }
  const handleSearchClose = () => {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults({ insights: [], pages: [] })
  }
  const handleResultClick = (type, item) => {
    handleSearchClose()
    navigate(type === 'insight' ? '/insights' : `/p/${item.slug}`)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const visibleAdminNav = ADMIN_NAV.filter(
    (item) => !item.permission || can(...item.permission.split(':'))
  )

  const isActive = (path) => location.pathname === path

  const hasResults = searchResults.insights.length > 0 || searchResults.pages.length > 0

  // Shared nav link style
  const navLinkSx = (active) => ({
    px: 1.75,
    py: 2.5,
    fontSize: 14,
    fontWeight: active ? 700 : 500,
    color: active ? 'primary.main' : 'text.secondary',
    borderBottom: active ? '2px solid' : '2px solid transparent',
    borderColor: active ? 'primary.main' : 'transparent',
    textDecoration: 'none',
    transition: 'color 0.15s',
    whiteSpace: 'nowrap',
    '&:hover': { color: 'primary.main' },
  })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary,
          zIndex: theme.zIndex.appBar,
        }}
      >
        <Toolbar sx={{ gap: 2, px: { xs: 2, md: 4 } }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2, flexShrink: 0 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                bgcolor: 'primary.main',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DashboardIcon sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              Portal Inmobiliario
            </Typography>
          </Box>

          {/* ── Navigation ── */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, flex: 1, alignItems: 'center', overflow: 'hidden' }}>

            {/* Dynamic content pages */}
            {navLoading ? (
              [1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rounded" width={90} height={22} sx={{ mx: 1 }} />
              ))
            ) : (
              navPages.map((page) => {
                const path = `/p/${page.slug}`
                return (
                  <Box
                    key={page.id}
                    component={Link}
                    to={path}
                    sx={navLinkSx(isActive(path))}
                  >
                    {page.name}
                  </Box>
                )
              })
            )}

            {/* Divider between content pages and admin tools */}
            {!navLoading && navPages.length > 0 && visibleAdminNav.length > 0 && (
              <Divider orientation="vertical" flexItem sx={{ my: 1.5, mx: 0.5 }} />
            )}

            {/* Admin tool pages */}
            {visibleAdminNav.map((item) => (
              <Box
                key={item.path}
                component={Link}
                to={item.path}
                sx={navLinkSx(isActive(item.path))}
              >
                {item.label}
              </Box>
            ))}
          </Box>

          {/* Search */}
          <ClickAwayListener onClickAway={handleSearchClose}>
            <Box ref={searchBoxRef} sx={{ position: 'relative', display: { xs: 'none', sm: 'flex' }, flexShrink: 0 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: searchOpen ? 'action.selected' : 'action.hover',
                  border: '1px solid',
                  borderColor: searchOpen ? 'primary.main' : 'transparent',
                  borderRadius: 2,
                  px: 1.5,
                  py: 0.5,
                  gap: 1,
                  transition: 'all 0.15s',
                }}
              >
                {searching ? (
                  <CircularProgress size={16} sx={{ color: 'text.disabled' }} />
                ) : (
                  <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                )}
                <InputBase
                  placeholder="Buscar insights, páginas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleSearchFocus}
                  sx={{ fontSize: 14, width: 200 }}
                  inputProps={{ 'aria-label': 'buscar' }}
                />
              </Box>

              <Popper
                open={searchOpen && (hasResults || (searchQuery.length > 0 && !searching))}
                anchorEl={searchBoxRef.current}
                placement="bottom-start"
                style={{ zIndex: theme.zIndex.appBar + 1, width: searchBoxRef.current?.offsetWidth || 300 }}
              >
                <Paper elevation={4} sx={{ mt: 0.5, borderRadius: 2, overflow: 'hidden', minWidth: 300 }}>
                  {!hasResults && searchQuery.trim() && !searching && (
                    <Box sx={{ px: 2, py: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Sin resultados para "{searchQuery}"
                      </Typography>
                    </Box>
                  )}

                  {searchResults.insights.length > 0 && (
                    <>
                      <Box sx={{ px: 2, pt: 1 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          INSIGHTS
                        </Typography>
                      </Box>
                      <List dense disablePadding>
                        {searchResults.insights.map((ins) => (
                          <ListItemButton
                            key={ins.id}
                            onClick={() => handleResultClick('insight', ins)}
                            sx={{ px: 2, py: 0.75 }}
                          >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <ArticleIcon fontSize="small" color="primary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={ins.title}
                              secondary={ins.status === 'published' ? 'Publicado' : 'Borrador'}
                              primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </>
                  )}

                  {searchResults.pages.length > 0 && (
                    <>
                      <Box sx={{ px: 2, pt: searchResults.insights.length > 0 ? 0.5 : 1 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          PÁGINAS
                        </Typography>
                      </Box>
                      <List dense disablePadding>
                        {searchResults.pages.map((pg) => (
                          <ListItemButton
                            key={pg.id}
                            onClick={() => handleResultClick('page', pg)}
                            sx={{ px: 2, py: 0.75 }}
                          >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <AccountTreeIcon fontSize="small" color="action" />
                            </ListItemIcon>
                            <ListItemText
                              primary={pg.name}
                              secondary={pg.slug}
                              primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </>
                  )}
                  <Box sx={{ pb: 0.5 }} />
                </Paper>
              </Popper>
            </Box>
          </ClickAwayListener>

          {/* Right actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1, flexShrink: 0 }}>
            <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
              <IconButton size="small" onClick={toggle}>
                {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Notificaciones">
              <IconButton size="small">
                <Badge color="error" variant="dot">
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              <Avatar
                sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 12, fontWeight: 700 }}
              >
                {getInitials(user?.full_name)}
              </Avatar>
              <Box sx={{ display: { xs: 'none', xl: 'block' } }}>
                <Typography variant="caption" fontWeight={700} display="block" lineHeight={1.2}>
                  {user?.full_name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                  {user?.role}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* User menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem disabled>
          <Typography variant="body2" fontWeight={600}>{user?.full_name}</Typography>
        </MenuItem>
        <MenuItem disabled>
          <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
          Cerrar sesión
        </MenuItem>
      </Menu>

      {/* Page content */}
      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Box>
    </Box>
  )
}
