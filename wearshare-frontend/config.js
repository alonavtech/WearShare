// Local testing uses your laptop backend; the live site uses its own address.
const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
window.CLOSETSHARE_API = isLocal ? 'http://localhost:8000' : 'http://144.202.47.133:8000';

window.CLOSETSHARE_AUTH0 = {
  domain: 'wearshare.us.auth0.com',
  clientId: 'vczrLjxM44aHw0HQ8PjEsW3jPtpP0Umo',
  audience: 'https://api.wearshare.app'
};