import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabaseServer';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('role, approval_status')
    .eq('id', user.id)
    .single();
  if (pErr || !profile) return NextResponse.json({ error: 'Profile missing' }, { status: 403 });
  if (profile.approval_status !== 'approved') return NextResponse.json({ error: 'Approval required' }, { status: 403 });
  if (profile.role !== 'student') return NextResponse.json({ error: 'Student role required' }, { status: 403 });

  const admin = createSupabaseAdmin();
  const { data: wallet, error: wErr } = await admin
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (wErr) return NextResponse.json({ error: wErr.message }, { status: 400 });

  if (!wallet) {
    const { data: created, error: cErr } = await admin
      .from('wallets')
      .upsert({ user_id: user.id, balance: 0, currency: 'KES' })
      .select('*')
      .single();
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 });
    return NextResponse.json({ wallet: created });
  }

  return NextResponse.json({ wallet });
}
