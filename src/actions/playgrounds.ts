'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createPlayground(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const address = formData.get('address') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const pitchType = formData.get('pitchType') as string;
  const groundType = formData.get('groundType') as string;
  const boundarySize = Number(formData.get('boundarySize')) || null;
  const capacity = Number(formData.get('capacity')) || null;
  const contactInfo = formData.get('contactInfo') as string;
  const imageUrl = formData.get('imageUrl') as string || null;

  if (!name || !address || !city || !state) {
    return { error: 'Please complete all required ground details.' };
  }

  const { data, error } = await supabase.from('playgrounds').insert({
    owner_id: user.id,
    name,
    description,
    address,
    city,
    state,
    pitch_type: pitchType || 'TURF',
    ground_type: groundType || 'STADIUM',
    boundary_size: boundarySize,
    capacity,
    contact_info: contactInfo,
    image_url: imageUrl
  }).select().single();

  if (error) return { error: error.message };

  revalidatePath('/master/playgrounds');
  revalidatePath('/playgrounds');
  return { success: true, playground: data };
}
