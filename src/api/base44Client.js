// Safe base44 client fallback wrapper
const mockEntities = new Proxy({}, {
  get: () => ({
    list: async () => [],
    filter: async () => [],
    get: async () => null,
    create: async () => ({}),
    update: async () => ({}),
    delete: async () => ({}),
  }),
});

const mockAuth = {
  isAuthenticated: async () => !!localStorage.getItem('mock_user'),
  me: async () => JSON.parse(localStorage.getItem('mock_user')) || null,
  updateMe: async (data) => data,
  loginWithProvider: (provider, redirect) => {
    localStorage.setItem('mock_user', JSON.stringify({ id: 'user_123', email: 'developer@example.com', provider }));
    window.location.href = redirect || '/';
  },
  loginViaEmailPassword: async () => {
    localStorage.setItem('mock_user', JSON.stringify({ id: 'user_123', email: 'developer@example.com', provider: 'email' }));
    return { success: true };
  },
};

export const base44 = globalThis.__B44_DB__ || {
  auth: mockAuth,
  entities: mockEntities,
  integrations: { Core: { UploadFile: async () => ({ file_url: '' }) } },
};

export default base44;