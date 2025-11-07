import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Don't add auth headers for public endpoints
  const publicEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/applications/submit',
    '/api/applications/test'
  ];

  const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));

  // Add token to all non-public endpoints if token exists
  if (token && !isPublicEndpoint) {
    console.log('✅ Adding auth header to request:', req.url);
    console.log('✅ Token (first 30 chars):', token.substring(0, 30) + '...');
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  } else if (!isPublicEndpoint) {
    console.error('❌ NO TOKEN AVAILABLE for protected endpoint:', req.url);
    console.error('❌ localStorage token:', localStorage.getItem('token'));
    console.error('❌ Current user:', localStorage.getItem('currentUser'));
  }

  return next(req);
};