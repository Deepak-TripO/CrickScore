import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    const needsRoleCheck = path.startsWith('/master') || path.startsWith('/admin');
    
    if (needsRoleCheck) {
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

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
  matcher: ['/master', '/master/:path*', '/admin', '/admin/:path*', '/profile', '/profile/:path*', '/apply-master', '/apply-master/:path*'],
};
