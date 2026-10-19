// Local development uses the separate FastAPI server; Vercel serves the API
// and frontend from the same origin.
const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
window.CLOSETSHARE_API = isLocal ? 'http://localhost:8000' : location.origin;
window.CLOSETSHARE_PRODUCTION = !isLocal;

window.CLOSETSHARE_AUTH0 = {
  domain: 'wearshare.us.auth0.com',
  clientId: 'vczrLjxM44aHw0HQ8PjEsW3jPtpP0Umo',
  audience: 'https://api.wearshare.app'
};