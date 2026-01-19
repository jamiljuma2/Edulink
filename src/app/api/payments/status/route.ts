import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabaseServer';

export async function GET(req: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const reference = url.searchParams.get('reference');
  if (!reference) return NextResponse.json({ error: 'reference required' }, { status: 400 });

  const { data: txn, error } = await supabase
    .from('transactions')
    .select('id, status, reference, type, amount, currency, created_at')
    .eq('reference', reference)
    .eq('user_id', user.id)
    .single();

  if (error || !txn) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

  return NextResponse.json({ transaction: txn });
}
