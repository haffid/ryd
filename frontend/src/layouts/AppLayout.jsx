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
  Grow,
  MenuList,
  Drawer,
  Collapse,
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
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
  Menu as MenuIcon,
  ExpandLess,
  ExpandMore,
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

function NavMenuItem({ page, level = 0, isActive }) {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef(null)
  const closeTimeout = useRef(null)
  const navigate = useNavigate()

  const children = (page.children || []).filter((c) => c.visibility === 'published')
  const hasChildren = children.length > 0
  const path = `/p/${page.slug}`
  const active = isActive(path)

  const handleMouseEnter = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current)
    setOpen(true)
  }

  const handleMouseLeave = () => {
    closeTimeout.current = setTimeout(() => {
      setOpen(false)
    }, 150)
  }

  const handleClick = (e) => {
    e.stopPropagation()
    navigate(path)
    setOpen(false)
  }

  if (level === 0) {
    return (
      <Box
        ref={anchorRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{ display: 'flex', alignItems: 'center', height: '100%' }}
      >
        <Box
          component={Link}
          to={path}
          sx={{
            px: 1.75,
            py: 2.5,
            fontSize: 14,
            fontWeight: active ? 700 : 500,
            color: active ? 'primary.main' : 'text.secondary',
            borderBottom: '2px solid',
            borderColor: active ? 'primary.main' : 'transparent',
            textDecoration: 'none',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            height: '100%',
            boxSizing: 'border-box',
            '&:hover': { color: 'primary.main' },
          }}
        >
          {page.name}
          {hasChildren && <KeyboardArrowDownIcon sx={{ fontSize: 16 }} />}
        </Box>
        {hasChildren && (
          <Popper
            open={open}
            anchorEl={anchorRef.current}
            placement="bottom-start"
            transition
            style={{ zIndex: 1300 }}
          >
            {({ TransitionProps }) => (
              <Grow {...TransitionProps} timeout={200} style={{ transformOrigin: 'top left' }}>
                <Paper elevation={4} sx={{ mt: 0, borderRadius: 1.5, overflow: 'hidden', minWidth: 200, py: 1 }}>
                  <MenuList disablePadding>
                    {children.map((child) => (
                      <NavMenuItem key={child.id} page={child} level={level + 1} isActive={isActive} />
                    ))}
                  </MenuList>
                </Paper>
              </Grow>
            )}
          </Popper>
        )}
      </Box>
    )
  }

  return (
    <Box
      ref={anchorRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{ position: 'relative' }}
    >
      <MenuItem
        onClick={handleClick}
        sx={{
          py: 1,
          px: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: active ? 'primary.main' : 'text.primary',
          bgcolor: active ? 'primary.50' : 'transparent',
          fontWeight: active ? 600 : 400,
          whiteSpace: 'normal',
          minHeight: 'auto',
          lineHeight: 1.3,
          '&:hover': { bgcolor: 'action.hover', color: 'primary.main' },
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 'inherit', flex: 1 }}>
          {page.name}
        </Typography>
        {hasChildren && <KeyboardArrowRightIcon sx={{ fontSize: 18, ml: 1, color: 'text.secondary' }} />}
      </MenuItem>
      {hasChildren && (
        <Popper
          open={open}
          anchorEl={anchorRef.current}
          placement="right-start"
          transition
          style={{ zIndex: 1300 }}
          modifiers={[
            {
              name: 'offset',
              options: {
                offset: [0, -8],
              },
            },
          ]}
        >
          {({ TransitionProps }) => (
            <Grow {...TransitionProps} timeout={200} style={{ transformOrigin: 'left top' }}>
              <Paper elevation={4} sx={{ borderRadius: 1.5, overflow: 'hidden', minWidth: 200, py: 1 }}>
                <MenuList disablePadding>
                  {children.map((child) => (
                    <NavMenuItem key={child.id} page={child} level={level + 1} isActive={isActive} />
                  ))}
                </MenuList>
              </Paper>
            </Grow>
          )}
        </Popper>
      )}
    </Box>
  )
}

function MobileNavMenuItem({ page, level = 0, onClickOut, isActive }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const children = (page.children || []).filter((c) => c.visibility === 'published')
  const hasChildren = children.length > 0
  const path = `/p/${page.slug}`
  const active = isActive(path)

  const handleToggle = (e) => {
    e.stopPropagation()
    setOpen((prev) => !prev)
  }

  const handleClick = (e) => {
    e.stopPropagation()
    navigate(path)
    onClickOut() // Close the drawer
  }

  return (
    <>
      <ListItemButton onClick={hasChildren ? handleToggle : handleClick} sx={{ pl: 2 + level * 2 }}>
        <ListItemText
          primary={page.name}
          primaryTypographyProps={{
            variant: 'body2',
            fontWeight: active ? 700 : 500,
            color: active ? 'primary.main' : 'text.primary'
          }}
        />
        {hasChildren ? (open ? <ExpandLess /> : <ExpandMore />) : null}
      </ListItemButton>
      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton onClick={handleClick} sx={{ pl: 2 + (level + 1) * 2, bgcolor: 'action.hover' }}>
              <ListItemText
                primary="Ir a la página principal"
                primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
              />
            </ListItemButton>
            {children.map((child) => (
              <MobileNavMenuItem
                key={child.id}
                page={child}
                level={level + 1}
                isActive={isActive}
                onClickOut={onClickOut}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  )
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { can } = usePermissions()
  const { mode, toggle } = useThemeMode()
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [anchorEl, setAnchorEl] = useState(null)

  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  // ── Dynamic page nav (loaded from API) ─────────────────────────────────
  const [navPages, setNavPages] = useState([])
  const [navLoading, setNavLoading] = useState(true)

  const fetchPages = useCallback(() => {
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

  useEffect(() => {
    fetchPages()
    window.addEventListener('pages-updated', fetchPages)
    return () => window.removeEventListener('pages-updated', fetchPages)
  }, [fetchPages])

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
          {/* Mobile hamburger */}
          <Box sx={{ display: { xs: 'flex', lg: 'none' }, mr: 1 }}>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setMobileDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          </Box>

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
              Research & Development
            </Typography>
          </Box>

          {/* ── Navigation ── */}
          <Box sx={{ display: { xs: 'none', lg: 'flex' }, flex: 1, alignItems: 'center', overflow: 'hidden' }}>

            {/* Dynamic content pages */}
            {navLoading ? (
              [1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rounded" width={90} height={22} sx={{ mx: 1 }} />
              ))
            ) : (
              navPages.map((page) => (
                <NavMenuItem key={page.id} page={page} isActive={isActive} />
              ))
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

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ sx: { width: 280, bgcolor: 'background.paper' } }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ width: 32, height: 32, bgcolor: 'primary.main', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DashboardIcon sx={{ color: '#fff', fontSize: 18 }} />
          </Box>
          <Typography variant="subtitle2" fontWeight={700}>
            R&D
          </Typography>
        </Box>

        <List sx={{ pt: 1, pb: 2, flex: 1, overflowY: 'auto' }}>
          {navPages.map((page) => (
            <MobileNavMenuItem
              key={page.id}
              page={page}
              isActive={isActive}
              onClickOut={() => setMobileDrawerOpen(false)}
            />
          ))}

          {/* Admin tools in mobile drawer */}
          {!navLoading && navPages.length > 0 && visibleAdminNav.length > 0 && (
            <Divider sx={{ my: 1 }} />
          )}
          {visibleAdminNav.map((item) => {
            const active = isActive(item.path)
            return (
              <ListItemButton
                key={item.path}
                onClick={() => { navigate(item.path); setMobileDrawerOpen(false); }}
                sx={{ pl: 2 }}
              >
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: active ? 700 : 500,
                    color: active ? 'primary.main' : 'text.primary'
                  }}
                />
              </ListItemButton>
            )
          })}
        </List>
      </Drawer>

      {/* Page content */}
      <Box component="main" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Box>
    </Box>
  )
}
