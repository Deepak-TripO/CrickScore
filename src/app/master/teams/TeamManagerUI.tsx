'use client';

import React, { useState } from 'react';
import { createTeam, createPlayer } from '@/actions/teams';
import { useRouter } from 'next/navigation';
import { Users, Plus, ShieldCheck, UserPlus } from 'lucide-react';

export default function TeamManagerUI({ teams }: { teams: any[] }) {
  const router = useRouter();
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const squad = selectedTeam?.team_players?.map((tp: any) => tp.players).filter(Boolean) || [];

  const handleCreateTeamSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createTeam(formData);
    setLoading(false);
    if (res?.success) {
      setShowTeamModal(false);
      router.refresh();
    }
  };

  const handleCreatePlayerSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append('teamId', selectedTeamId);
    const res = await createPlayer(formData);
    setLoading(false);
    if (res?.success) {
      setShowPlayerModal(false);
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* TOP CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400">Active Team:</label>
          <select 
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
          >
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.short_name})</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowTeamModal(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> Create New Team
          </button>
          
          {selectedTeamId && (
            <button
              type="button"
              onClick={() => setShowPlayerModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <UserPlus className="w-4 h-4" /> Add Player to Squad
            </button>
          )}
        </div>
      </div>

      {/* SQUAD LIST */}
      {selectedTeam ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-lg font-bold text-white">{selectedTeam.name} Squad</h2>
              <p className="text-xs text-slate-400">Short Name: <strong>{selectedTeam.short_name}</strong> • Coach: {selectedTeam.coach || 'N/A'}</p>
            </div>
            <span className="text-xs px-3 py-1 bg-emerald-950 text-emerald-400 rounded-full font-bold border border-emerald-500/30">
              {squad.length} Registered Players
            </span>
          </div>

          {squad.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 italic">
              No players added to this team yet. Click "Add Player to Squad" above to build your Playing XI.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {squad.map((p: any) => (
                <div key={p.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-emerald-400 text-sm border border-slate-700">
                    #{p.jersey_number || '0'}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    <h4 className="font-bold text-xs text-white truncate">{p.name || p.full_name || p.display_name}</h4>
                    <p className="text-[10px] text-emerald-400 font-semibold">{p.role}</p>
                    <p className="text-[10px] text-slate-500 truncate">{p.batting_style} • {p.bowling_style}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-sm">
          No teams found. Click "Create New Team" to start.
        </div>
      )}

      {/* CREATE TEAM MODAL */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateTeamSubmit} className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create New Team</h3>
            
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Team Name *</label>
              <input type="text" name="name" required placeholder="Bangalore Strikers" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Short Name *</label>
              <input type="text" name="shortName" required placeholder="BST" maxLength={4} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white uppercase font-mono" />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Coach Name</label>
              <input type="text" name="coach" placeholder="Rahul Dravid" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowTeamModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-emerald-500 text-slate-950 font-extrabold rounded-xl text-xs">Save Team</button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE PLAYER MODAL */}
      {showPlayerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreatePlayerSubmit} className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Add Player to Squad</h3>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Full Name *</label>
              <input type="text" name="fullName" required placeholder="Rohit Sharma" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Jersey Number</label>
                <input type="number" name="jerseyNumber" placeholder="45" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Role</label>
                <select name="role" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white">
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-rounder">All-rounder</option>
                  <option value="Wicketkeeper">Wicketkeeper</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Batting Style</label>
                <select name="battingStyle" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white">
                  <option value="Right Hand">Right Hand</option>
                  <option value="Left Hand">Left Hand</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Bowling Style</label>
                <select name="bowlingStyle" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white">
                  <option value="Right Arm Fast">Right Arm Fast</option>
                  <option value="Right Arm Medium">Right Arm Medium</option>
                  <option value="Right Arm Spin">Right Arm Spin</option>
                  <option value="Left Arm Fast">Left Arm Fast</option>
                  <option value="Left Arm Medium">Left Arm Medium</option>
                  <option value="Left Arm Spin">Left Arm Spin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowPlayerModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-emerald-500 text-slate-950 font-extrabold rounded-xl text-xs">Save Player</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
