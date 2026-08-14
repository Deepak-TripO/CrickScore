'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createTeam(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const name = formData.get('name') as string;
  const shortName = formData.get('shortName') as string;
  const description = formData.get('description') as string;
  const logoUrl = formData.get('logoUrl') as string || null;
  const coach = formData.get('coach') as string || null;

  if (!name || !shortName) {
    return { error: 'Team name and short name are required.' };
  }

  const { data, error } = await supabase.from('teams').insert({
    owner_id: user.id,
    name,
    short_name: shortName.toUpperCase(),
    description,
    logo_url: logoUrl,
    coach
  }).select().single();

  if (error) return { error: error.message };

  revalidatePath('/master/teams');
  revalidatePath('/teams');
  return { success: true, team: data };
}

export async function createPlayer(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const fullName = formData.get('fullName') as string;
  const displayName = formData.get('displayName') as string || fullName;
  const jerseyNumber = Number(formData.get('jerseyNumber')) || null;
  const role = formData.get('role') as string || 'All-rounder';
  const battingStyle = formData.get('battingStyle') as string || 'Right Hand';
  const bowlingStyle = formData.get('bowlingStyle') as string || 'Right Arm Medium';
  const photoUrl = formData.get('photoUrl') as string || null;
  const teamId = formData.get('teamId') as string;

  if (!fullName) {
    return { error: 'Full name is required.' };
  }

  const { data: player, error } = await supabase.from('players').insert({
    owner_id: user.id,
    full_name: fullName,
    display_name: displayName,
    jersey_number: jerseyNumber,
    role,
    batting_style: battingStyle,
    bowling_style: bowlingStyle,
    photo_url: photoUrl
  }).select().single();

  if (error) return { error: error.message };

  if (teamId && player) {
    await supabase.from('team_players').insert({
      team_id: teamId,
      player_id: player.id
    });
  }

  revalidatePath('/master/teams');
  revalidatePath('/players');
  return { success: true, player };
}
