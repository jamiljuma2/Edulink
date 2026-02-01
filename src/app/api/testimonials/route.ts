import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabaseServer';

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('testimonials')
    .select('id, name, role, message, rating, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ testimonials: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServer();
  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? '').trim();
  const role = String(body?.role ?? '').trim();
  const message = String(body?.message ?? '').trim();
  const rating = Number(body?.rating ?? 0);

  if (!name || !role || message.length < 10) {
    return NextResponse.json({ error: 'Invalid testimonial data' }, { status: 400 });
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('testimonials')
    .insert({ name, role, message, rating, status: 'pending' })
    .select('id, name, role, message, rating, created_at')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, testimonial: data });
}
