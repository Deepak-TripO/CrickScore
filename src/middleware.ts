import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const DEFAULT_SUPABASE_URL = 'https://tpnjvhiweqletwwvokcy.supabase.co';
    const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwbmp2aGl3ZXFsZXR3d3Zva2N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMDEwMDUsImV4cCI6MjEwMTY3NzAwNX0.KwXJb-tR3F140_ezMPI_UQB2fL7aEsdgMsWIzt1kl8o';
    const formatUrl = (raw?: string) => (raw || DEFAULT_SUPABASE_URL).trim().replace(/\/+$/, '');
    const formatKey = (raw?: string, fallback?: string) => (raw || fallback || '').trim();

    const supabaseUrl = formatUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const anonKey = formatKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, DEFAULT_SUPABASE_ANON_KEY);

    const supabase = createServerClient(
      supabaseUrl,
      anonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set({ name, value, ...options })
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    const path = request.nextUrl.pathname;

    const isPublicPath = path === '/login' || path === '/signup' || path === '/forgot-password' || path.startsWith('/auth/callback');

    // 1. UNAUTHENTICATED USERS: ALWAYS redirect to /login first
    if (!user) {
      if (!isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return response;
    }

    // 2. AUTHENTICATED USERS: Prevent visiting auth pages (login/signup)
    if (user && isPublicPath) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // 3. ROLE CHECKS FOR PROTECTED MASTER AND ADMIN ROUTES
    const needsRoleCheck = path.startsWith('/master') || path.startsWith('/admin');
    
    if (needsRoleCheck) {
      const [userRolesResult, appResult] = await Promise.all([
        supabase
          .from('user_roles')
          .select('roles(name)')
          .eq('user_id', user.id),
        supabase
          .from('master_applications')
          .select('status')
          .eq('user_id', user.id)
          .eq('status', 'APPROVED')
          .limit(1)
          .maybeSingle()
      ]);

      const roles = userRolesResult.data ? userRolesResult.data.map((ur: any) => ur.roles?.name) : [];
      const isApprovedMaster = !!appResult.data || roles.includes('MASTER') || roles.includes('ADMIN');

      // Protected Master routes
      if (path.startsWith('/master')) {
        if (!isApprovedMaster) {
          return NextResponse.redirect(new URL('/apply-master', request.url));
        }
      }

      // Protected Admin routes — STRICT ADMIN ONLY
      if (path === '/admin' || path.startsWith('/admin/')) {
        const configuredAdminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@batscore.com').toLowerCase();
        const userEmail = (user.email || '').toLowerCase();
        
        const isAdminEmail = (
          userEmail === configuredAdminEmail ||
          userEmail === 'superadmin@batscore.com' ||
          userEmail === 'admin@batscore.com'
        );

        const isAuthorizedAdmin = isAdminEmail || roles.includes('ADMIN');

        if (!isAuthorizedAdmin) {
          if (isApprovedMaster) {
            return NextResponse.redirect(new URL('/master/dashboard', request.url));
          }
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    }
  } catch (err) {
    console.error('Middleware execution error:', err);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
