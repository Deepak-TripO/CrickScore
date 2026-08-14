'use client';

import React, { useState } from 'react';
import { createPlayground } from '@/actions/playgrounds';
import { useRouter } from 'next/navigation';
import { MapPin, Plus, Building2 } from 'lucide-react';

export default function PlaygroundManagerUI({ playgrounds }: { playgrounds: any[] }) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await createPlayground(formData);
    setLoading(false);

    if (res?.success) {
      setShowModal(false);
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <h2 className="text-sm font-bold text-white">Your Managed Playgrounds ({playgrounds.length})</h2>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" /> Add New Ground
        </button>
      </div>

      {playgrounds.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-sm">
          No grounds created yet. Add a playground to select during match scheduling.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {playgrounds.map(g => (
            <div key={g.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-white">{g.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    {g.address}, {g.city}, {g.state}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  {g.pitch_type}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span>Ground: <strong>{g.ground_type}</strong></span>
                <span>Boundary: <strong>{g.boundary_size ? `${g.boundary_size}m` : 'Standard'}</strong></span>
                <span>Capacity: <strong>{g.capacity || 'N/A'}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE GROUND MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create Playground</h3>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Playground Name *</label>
              <input type="text" name="name" required placeholder="Koramangala Cricket Turf A" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Pitch Type</label>
                <select name="pitchType" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white">
                  <option value="TURF">Turf</option>
                  <option value="MATTING">Matting</option>
                  <option value="CEMENT">Cement</option>
                  <option value="NATURAL">Natural</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Ground Type</label>
                <select name="groundType" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white">
                  <option value="STADIUM">Stadium</option>
                  <option value="CLUB">Club Ground</option>
                  <option value="SCHOOL">School Ground</option>
                  <option value="COLLEGE">College Ground</option>
                  <option value="LOCAL">Local Ground</option>
                  <option value="PRIVATE">Private Ground</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Address *</label>
              <input type="text" name="address" required placeholder="100 Feet Road, Koramangala" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">City *</label>
                <input type="text" name="city" required placeholder="Bangalore" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">State *</label>
                <input type="text" name="state" required placeholder="Karnataka" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-emerald-500 text-slate-950 font-extrabold rounded-xl text-xs">Save Ground</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
