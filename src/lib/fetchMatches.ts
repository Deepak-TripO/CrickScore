import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function fetchMatchesSafely(options?: {
  status?: string;
  masterId?: string;
  onlyMasterCreated?: boolean;
  limit?: number;
}) {
  let db: any = createClient();
  try {
    db = createAdminClient();
  } catch {
    // fallback to user client
  }

  try {
    let rawMatches: any[] = [];

    if (options?.masterId) {
      const [res1, res2, res3] = await Promise.all([
        db.from('matches').select('*').eq('master_id', options.masterId).order('created_at', { ascending: false }),
        db.from('matches').select('*').eq('scorer_id', options.masterId).order('created_at', { ascending: false }),
        db.from('matches').select('*').eq('created_by', options.masterId).order('created_at', { ascending: false })
      ]);

      const map = new Map<string, any>();
      (res1.data || []).forEach((m: any) => map.set(m.id, m));
      (res2.data || []).forEach((m: any) => map.set(m.id, m));
      (res3.data || []).forEach((m: any) => map.set(m.id, m));

      rawMatches = Array.from(map.values()).sort((a: any, b: any) => {
        const timeA = new Date(a.created_at || a.scheduled_start || a.scheduled_at || 0).getTime();
        const timeB = new Date(b.created_at || b.scheduled_start || b.scheduled_at || 0).getTime();
        return timeB - timeA;
      });
    } else if (options?.onlyMasterCreated) {
      const masterUserSet = new Set<string>();

      const [profilesRes, userRolesRes, masterAppsRes] = await Promise.all([
        db.from('profiles').select('id, role').in('role', ['MASTER', 'ADMIN', 'SUPER_ADMIN']),
        db.from('user_roles').select('user_id, roles!inner(name)').in('roles.name', ['MASTER', 'ADMIN', 'SUPER_ADMIN']),
        db.from('master_applications').select('user_id').eq('status', 'APPROVED')
      ]);

      if (profilesRes.data) {
        profilesRes.data.forEach((p: any) => p.id && masterUserSet.add(p.id));
      }
      if (userRolesRes.data) {
        userRolesRes.data.forEach((ur: any) => ur.user_id && masterUserSet.add(ur.user_id));
      }
      if (masterAppsRes.data) {
        masterAppsRes.data.forEach((ma: any) => ma.user_id && masterUserSet.add(ma.user_id));
      }

      const masterUserIdsArray = Array.from(masterUserSet);

      if (masterUserIdsArray.length === 0) {
        return [];
      }

      const [res1, res2, res3] = await Promise.all([
        db.from('matches').select('*').in('scorer_id', masterUserIdsArray).order('created_at', { ascending: false }),
        db.from('matches').select('*').in('master_id', masterUserIdsArray).order('created_at', { ascending: false }),
        db.from('matches').select('*').in('created_by', masterUserIdsArray).order('created_at', { ascending: false })
      ]);

      const map = new Map<string, any>();
      (res1.data || []).forEach((m: any) => map.set(m.id, m));
      (res2.data || []).forEach((m: any) => map.set(m.id, m));
      (res3.data || []).forEach((m: any) => map.set(m.id, m));

      rawMatches = Array.from(map.values()).filter((m: any) => {
        if (!m || m.status === 'DELETED' || m.status === 'INVALID' || m.status === 'INACTIVE') return false;
        const creatorId = m.master_id || m.created_by || m.scorer_id;
        return creatorId && masterUserSet.has(creatorId);
      }).sort((a: any, b: any) => {
        const timeA = new Date(a.created_at || a.scheduled_start || a.scheduled_at || 0).getTime();
        const timeB = new Date(b.created_at || b.scheduled_start || b.scheduled_at || 0).getTime();
        return timeB - timeA;
      });
    } else {
      let query = db.from('matches').select('*').order('created_at', { ascending: false });
      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      const { data } = await query;
      rawMatches = data || [];
    }

    // Always exclude DELETED matches from active application views
    rawMatches = rawMatches.filter((m: any) => m && m.status !== 'DELETED');

    if (options?.status && options?.masterId) {
      rawMatches = rawMatches.filter((m: any) => m.status === options.status);
    }

    if (options?.limit && rawMatches.length > options.limit) {
      rawMatches = rawMatches.slice(0, options.limit);
    }

    if (!rawMatches || rawMatches.length === 0) return [];

    // Resolve Teams dynamically for each match using select('*') to prevent missing column PostgREST errors
    const resolvedMatches = await Promise.all(
      rawMatches.map(async (m: any) => {
        const team1Id = m.team1_id || m.team_a_id;
        const team2Id = m.team2_id || m.team_b_id;
        let team1 = null;
        let team2 = null;

        if (team1Id) {
          const { data: t1 } = await db
            .from('teams')
            .select('*')
            .eq('id', team1Id)
            .maybeSingle();
          team1 = t1;
        }

        if (team2Id) {
          const { data: t2 } = await db
            .from('teams')
            .select('*')
            .eq('id', team2Id)
            .maybeSingle();
          team2 = t2;
        }

        // Fetch innings records for each match
        let matchInnings: any[] = [];
        if (m.id) {
          const { data: innData } = await db
            .from('innings')
            .select('*')
            .eq('match_id', m.id)
            .order('innings_number', { ascending: true });
          matchInnings = innData || [];
        }

        // Precise Team Name Resolution
        const t1Name = team1?.name || m.your_team_name || m.team1_name || m.team_a_name || (m.title ? m.title.split(' vs ')[0] : null);
        const t1Logo = team1?.logo_url || m.your_team_logo_url || m.team1_logo_url || m.team_a_logo_url || null;
        const t1Short = team1?.short_name || (t1Name ? t1Name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() : 'T1');

        const t2Name = team2?.name || m.opposite_team_name || m.team2_name || m.team_b_name || (m.title ? m.title.split(' vs ')[1] : null);
        const t2Logo = team2?.logo_url || m.opposite_team_logo_url || m.team2_logo_url || m.team_b_logo_url || null;
        const t2Short = team2?.short_name || (t2Name ? t2Name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() : 'T2');

        return {
          ...m,
          innings: matchInnings,
          team1: {
            id: team1?.id || team1Id,
            name: t1Name || 'Team 1',
            short_name: t1Short,
            logo_url: t1Logo
          },
          team2: {
            id: team2?.id || team2Id,
            name: t2Name || 'Team 2',
            short_name: t2Short,
            logo_url: t2Logo
          }
        };
      })
    );

    return resolvedMatches;
  } catch {
    return [];
  }
}
