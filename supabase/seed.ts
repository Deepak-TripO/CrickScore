import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read .env.local manually if process.env not set
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE credentials in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedData() {
  console.log('--- SEEDING BATSCORE DEMO DATA ---');

  // 1. Create or Fetch Roles
  const { data: userRole } = await supabase.from('roles').select('id').eq('name', 'USER').single();
  const { data: masterRole } = await supabase.from('roles').select('id').eq('name', 'MASTER').single();
  const { data: adminRole } = await supabase.from('roles').select('id').eq('name', 'ADMIN').single();

  console.log('Roles verified.');

  // 2. Create Master Profile if not exists
  const masterUserId = '11111111-1111-1111-1111-111111111111';
  await supabase.from('profiles').upsert({
    id: masterUserId,
    full_name: 'Rahul Dravid (Master)',
    username: 'rahuldravid_master',
    email: 'master@batscore.com',
    phone: '+91 98765 11111',
    city: 'Bangalore',
    state: 'Karnataka'
  });

  if (masterRole) {
    await supabase.from('user_roles').upsert({ user_id: masterUserId, role_id: masterRole.id });
  }

  // 3. Create Playground
  const { data: ground } = await supabase.from('playgrounds').upsert({
    owner_id: masterUserId,
    name: 'Koramangala Floodlit Turf A',
    description: 'International standard synthetic turf with floodlights and commentary box.',
    address: '100 Feet Road, Koramangala 4th Block',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    pitch_type: 'TURF',
    ground_type: 'STADIUM',
    boundary_size: 65,
    capacity: 2500
  }).select().single();

  console.log('Playground created.');

  // 4. Create Teams
  const { data: team1 } = await supabase.from('teams').upsert({
    owner_id: masterUserId,
    name: 'Bangalore Strikers',
    short_name: 'BST',
    description: 'Premier T20 franchise from Bangalore',
    coach: 'Anil Kumble'
  }).select().single();

  const { data: team2 } = await supabase.from('teams').upsert({
    owner_id: masterUserId,
    name: 'Chennai Super Kings',
    short_name: 'CSK',
    description: 'Champions franchise from Chennai',
    coach: 'Stephen Fleming'
  }).select().single();

  console.log('Teams created.');

  // 5. Create Players for Team 1
  const t1PlayerNames = [
    { name: 'Virat Kohli', role: 'Batsman', jersey: 18, bat: 'Right Hand', bowl: 'Right Arm Medium' },
    { name: 'Faf du Plessis', role: 'Batsman', jersey: 13, bat: 'Right Hand', bowl: 'Right Arm Medium' },
    { name: 'Gleen Maxwell', role: 'All-rounder', jersey: 32, bat: 'Right Hand', bowl: 'Right Arm Spin' },
    { name: 'Rajat Patidar', role: 'Batsman', jersey: 97, bat: 'Right Hand', bowl: 'Right Arm Spin' },
    { name: 'Dinesh Karthik', role: 'Wicketkeeper', jersey: 19, bat: 'Right Hand', bowl: 'Right Arm Medium' },
    { name: 'Mohammed Siraj', role: 'Bowler', jersey: 73, bat: 'Right Hand', bowl: 'Right Arm Fast' }
  ];

  for (const p of t1PlayerNames) {
    const { data: pl } = await supabase.from('players').upsert({
      owner_id: masterUserId,
      full_name: p.name,
      display_name: p.name,
      jersey_number: p.jersey,
      role: p.role,
      batting_style: p.bat,
      bowling_style: p.bowl
    }).select().single();

    if (pl && team1) {
      await supabase.from('team_players').upsert({ team_id: team1.id, player_id: pl.id });
    }
  }

  // 6. Create Players for Team 2
  const t2PlayerNames = [
    { name: 'MS Dhoni', role: 'Wicketkeeper', jersey: 7, bat: 'Right Hand', bowl: 'Right Arm Medium' },
    { name: 'Ruturaj Gaikwad', role: 'Batsman', jersey: 31, bat: 'Right Hand', bowl: 'Right Arm Spin' },
    { name: 'Ravindra Jadeja', role: 'All-rounder', jersey: 8, bat: 'Left Hand', bowl: 'Left Arm Spin' },
    { name: 'Shivam Dube', role: 'All-rounder', jersey: 25, bat: 'Left Hand', bowl: 'Right Arm Medium' },
    { name: 'Deepak Chahar', role: 'Bowler', jersey: 90, bat: 'Right Hand', bowl: 'Right Arm Fast' }
  ];

  for (const p of t2PlayerNames) {
    const { data: pl } = await supabase.from('players').upsert({
      owner_id: masterUserId,
      full_name: p.name,
      display_name: p.name,
      jersey_number: p.jersey,
      role: p.role,
      batting_style: p.bat,
      bowling_style: p.bowl
    }).select().single();

    if (pl && team2) {
      await supabase.from('team_players').upsert({ team_id: team2.id, player_id: pl.id });
    }
  }

  console.log('Players created and assigned to squads.');

  // 7. Create LIVE Match
  if (team1 && team2 && ground) {
    const { data: liveMatch } = await supabase.from('matches').upsert({
      master_id: masterUserId,
      playground_id: ground.id,
      title: 'Bangalore Super T20 Cup - Final',
      format: 'T20',
      overs: 20,
      category: 'Final',
      scheduled_start: new Date().toISOString(),
      status: 'LIVE',
      team1_id: team1.id,
      team2_id: team2.id,
      toss_winner: team1.id,
      toss_decision: 'BAT',
      current_score: '154/4',
      current_wickets: 4,
      current_over: 17.3
    }).select().single();

    if (liveMatch) {
      // Innings 1
      const { data: inn1 } = await supabase.from('innings').upsert({
        match_id: liveMatch.id,
        innings_number: 1,
        batting_team_id: team1.id,
        bowling_team_id: team2.id,
        total_runs: 154,
        total_wickets: 4,
        total_overs: 17.3,
        status: 'IN_PROGRESS'
      }).select().single();

      if (inn1) {
        // Initial Commentary
        await supabase.from('match_commentary').insert({
          match_id: liveMatch.id,
          innings_id: inn1.id,
          over_number: 17,
          text: 'Massive 6 over long-on by Virat Kohli! What a strike!',
          created_by: masterUserId
        });
      }
    }
  }

  console.log('=== SEEDING COMPLETED SUCCESSFULLY! ===');
}

seedData().catch(console.error);
