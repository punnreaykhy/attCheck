import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const data = await req.json();

  const { name, group, latitude, longitude } = data;

  const { error } = await supabase.from('submissions').insert([
    {
      name,
      group: parseInt(group),
      latitude,
      longitude,
    },
  ]);

  if (error) {
    console.error('Supabase insert error:', error);
    return NextResponse.json({ message: 'ការដាក់ស្នើមិនបានជោគជ័យ' }, { status: 500 });
  }

  return NextResponse.json({ message: 'ការដាក់ស្នើបានរក្សាទុកជោគជ័យ' });
}
