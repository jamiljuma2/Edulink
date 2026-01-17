import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SerializeOptions } from 'cookie';
import type { CookieOptions } from '@supabase/ssr';

type CookieStoreLike = {
  get?: (name: string) => { value?: string } | undefined;
  getAll?: () => Array<{ name: string; value: string }>;
  set?: (cookie: { name: string; value: string } & CookieOptions) => void;
};

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  const getCookie = (name: string) => {
    const store = cookieStore as CookieStoreLike;
    if (typeof store.get === 'function') return store.get(name)?.value;
    const all = typeof store.getAll === 'function' ? store.getAll() : [];
    const found = all.find((c: { name: string; value: string }) => c.name === name);
    return found?.value;
  };
  const setCookie = (name: string, value: string, options: CookieOptions) => {
    const store = cookieStore as CookieStoreLike;
    if (typeof store.set === 'function') store.set({ name, value, ...options });
  };
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const store = cookieStore as CookieStoreLike;
          if (typeof store.getAll === 'function') return store.getAll();
          return [];
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: Partial<SerializeOptions> }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const normalized: CookieOptions = {
              ...options,
              sameSite: options.sameSite === false ? undefined : options.sameSite,
            };
            setCookie(name, value, normalized);
          });
        },
      },
    }
  );
}
