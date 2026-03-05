import api from './api'

export const authService = {
  login: async (username, password, rememberMe = false) => {
    const { data } = await api.post('/auth/login', {
      username,
      password,
      remember_me: rememberMe,
    })
    return data
  },

  logout: async () => {
    await api.post('/auth/logout')
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },

  refresh: async (refreshToken) => {
    const { data } = await api.post('/auth/refresh', {
      refresh_token: refreshToken,
    })
    return data
  },
}
