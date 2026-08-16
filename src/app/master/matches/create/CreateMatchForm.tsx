'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createFullTwoStepMatch, updateFullMatch } from '@/actions/matches';
import { createClient } from '@/lib/supabase/client';
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Trophy, 
  Users, 
  Camera, 
  Plus, 
  Trash2, 
  AlertCircle,
  Loader2,
  Shield,
  X
} from 'lucide-react';

export type PlayerRoleType = 'WK' | 'Batsman' | 'Allrounder' | 'Bowler';

export interface PlayerInput {
  id: string;
  name: string;
  type: PlayerRoleType;
  imageFile: File | null;
  previewUrl: string;
}

interface CreateMatchFormProps {
  initialMatch?: any;
  onCancel?: () => void;
  onSuccess?: () => void;
}

// Generate default 11-player squad with balanced roles (1 WK, 5 BAT, 2 AR, 3 BOWL)
const createDefaultSquad = (prefix: string): PlayerInput[] => [
  { id: `${prefix}_wk1`, name: '', type: 'WK', imageFile: null, previewUrl: '' },
  { id: `${prefix}_bat1`, name: '', type: 'Batsman', imageFile: null, previewUrl: '' },
  { id: `${prefix}_bat2`, name: '', type: 'Batsman', imageFile: null, previewUrl: '' },
  { id: `${prefix}_bat3`, name: '', type: 'Batsman', imageFile: null, previewUrl: '' },
  { id: `${prefix}_bat4`, name: '', type: 'Batsman', imageFile: null, previewUrl: '' },
  { id: `${prefix}_bat5`, name: '', type: 'Batsman', imageFile: null, previewUrl: '' },
  { id: `${prefix}_all1`, name: '', type: 'Allrounder', imageFile: null, previewUrl: '' },
  { id: `${prefix}_all2`, name: '', type: 'Allrounder', imageFile: null, previewUrl: '' },
  { id: `${prefix}_bowl1`, name: '', type: 'Bowler', imageFile: null, previewUrl: '' },
  { id: `${prefix}_bowl2`, name: '', type: 'Bowler', imageFile: null, previewUrl: '' },
  { id: `${prefix}_bowl3`, name: '', type: 'Bowler', imageFile: null, previewUrl: '' },
];

const mapPlayersToInput = (rawPlayers: any[], prefix: string): PlayerInput[] => {
  const defaults = createDefaultSquad(prefix);
  if (!rawPlayers || rawPlayers.length === 0) return defaults;

  const mapped: PlayerInput[] = rawPlayers.map((p: any, idx: number) => {
    let type: PlayerRoleType = 'Batsman';
    const role = (p.role || p.type || p.player_type || p.roleMapping || '').toUpperCase();
    if (role.includes('WICKET') || role === 'WK' || role.includes('KEEPER')) type = 'WK';
    else if (role.includes('BOWLER') || role === 'BOWL') type = 'Bowler';
    else if (role.includes('ALL') || role === 'AR' || role.includes('ROUND')) type = 'Allrounder';

    const pName = p.name || 
      p.full_name || 
      p.display_name || 
      p.player_name || 
      p.playerName || 
      p.fullName || 
      p.displayName || 
      p.player?.name || 
      p.player?.full_name || 
      p.player?.display_name || 
      p.players?.name || 
      p.players?.full_name || 
      (typeof p === 'string' ? p : '');

    return {
      id: p.id || `${prefix}_p_${idx}_${Date.now()}`,
      name: pName,
      type,
      imageFile: null,
      previewUrl: p.avatar_url || p.image_url || p.profile_image || p.avatarUrl || ''
    };
  });

  while (mapped.length < 11) {
    const defaultItem = defaults[mapped.length] || {
      id: `${prefix}_pad_${mapped.length}_${Date.now()}`,
      name: '',
      type: 'Batsman',
      imageFile: null,
      previewUrl: ''
    };
    mapped.push(defaultItem);
  }

  return mapped.slice(0, 11);
};

// Helper for counting team roles and validating mandatory minimums
const countTeamRoles = (players: PlayerInput[]) => {
  let wk = 0, bat = 0, ar = 0, bowl = 0;
  const namedPlayers = players.filter(p => p.name.trim() !== '');

  players.forEach(p => {
    if (!p.name.trim()) return;
    const t = p.type;
    if (t === 'WK') wk++;
    else if (t === 'Batsman') bat++;
    else if (t === 'Allrounder') ar++;
    else if (t === 'Bowler') bowl++;
  });

  const hasWK = wk >= 1;
  const hasBAT = bat >= 1;
  const hasAR = ar >= 1;
  const hasBOWL = bowl >= 1;
  const isValidCount = namedPlayers.length === 11 && players.length === 11;
  const isValidRoles = hasWK && hasBAT && hasAR && hasBOWL;

  return {
    totalNamed: namedPlayers.length,
    totalCards: players.length,
    wk,
    bat,
    ar,
    bowl,
    hasWK,
    hasBAT,
    hasAR,
    hasBOWL,
    isValidCount,
    isValidRoles,
    isComplete: isValidCount && isValidRoles
  };
};

export default function CreateMatchForm({ initialMatch, onCancel, onSuccess }: CreateMatchFormProps) {
  const router = useRouter();
  const isEditMode = !!initialMatch;

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Step 1 State: Team 1 (Your Team)
  const [yourTeamName, setYourTeamName] = useState<string>('');
  const [yourTeamFile, setYourTeamFile] = useState<File | null>(null);
  const [yourTeamPreview, setYourTeamPreview] = useState<string>('');
  const yourTeamInputRef = useRef<HTMLInputElement>(null);

  // Step 1 State: Team 2 (Opposite Team)
  const [oppositeTeamName, setOppositeTeamName] = useState<string>('');
  const [oppositeTeamFile, setOppositeTeamFile] = useState<File | null>(null);
  const [oppositeTeamPreview, setOppositeTeamPreview] = useState<string>('');
  const oppositeTeamInputRef = useRef<HTMLInputElement>(null);

  // Step 1 State: Category, Status, Overs
  const [category, setCategory] = useState<string>('League');
  const [format, setFormat] = useState<string>('T20');
  const [status, setStatus] = useState<'UPCOMING' | 'LIVE' | 'COMPLETED'>('UPCOMING');
  const [overs, setOvers] = useState<number>(20);

  // Step 2 State: Players (Exactly 11 per team)
  const [yourTeamPlayers, setYourTeamPlayers] = useState<PlayerInput[]>(() => createDefaultSquad('y'));
  const [oppositeTeamPlayers, setOppositeTeamPlayers] = useState<PlayerInput[]>(() => createDefaultSquad('o'));

  // Available Match Categories (Strictly NO T10, T20, ODI, Test, or Friendly)
  const categoryOptions = ['League', 'Tournament', 'Club Match'];

  // Pre-populate fields when editing an existing match
  useEffect(() => {
    if (initialMatch) {
      const t1 = Array.isArray(initialMatch.team1) ? initialMatch.team1[0] : initialMatch.team1;
      const t2 = Array.isArray(initialMatch.team2) ? initialMatch.team2[0] : initialMatch.team2;

      const t1Name = initialMatch.your_team_name || t1?.name || (initialMatch.title ? initialMatch.title.split(' vs ')[0] : '') || '';
      const t1Logo = initialMatch.your_team_logo_url || t1?.logo_url || '';

      const t2Name = initialMatch.opposite_team_name || t2?.name || (initialMatch.title ? initialMatch.title.split(' vs ')[1] : '') || '';
      const t2Logo = initialMatch.opposite_team_logo_url || t2?.logo_url || '';

      setYourTeamName(t1Name);
      setYourTeamPreview(t1Logo);
      setOppositeTeamName(t2Name);
      setOppositeTeamPreview(t2Logo);
      
      const rawCat = initialMatch.category || initialMatch.format || 'League';
      setCategory(categoryOptions.includes(rawCat) ? rawCat : 'League');
      setFormat(initialMatch.format || 'T20');
      setStatus(initialMatch.status || 'UPCOMING');
      setOvers(initialMatch.overs || 20);

      const t1Players = initialMatch.team1Players || initialMatch.yourTeamPlayers || initialMatch.your_team_players || initialMatch.team1_players;
      const t2Players = initialMatch.team2Players || initialMatch.oppositeTeamPlayers || initialMatch.opposite_team_players || initialMatch.team2_players;

      if (t1Players && t1Players.length > 0) {
        setYourTeamPlayers(mapPlayersToInput(t1Players, 'y'));
      }
      if (t2Players && t2Players.length > 0) {
        setOppositeTeamPlayers(mapPlayersToInput(t2Players, 'o'));
      }
    }
  }, [initialMatch]);

  // File Upload Handlers for Team Logos
  const handleYourTeamImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setYourTeamFile(file);
      setYourTeamPreview(URL.createObjectURL(file));
    }
  };

  const handleOppositeTeamImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOppositeTeamFile(file);
      setOppositeTeamPreview(URL.createObjectURL(file));
    }
  };

  // Add Single Player to Team
  const handleAddPlayer = (teamNum: 1 | 2) => {
    const currentList = teamNum === 1 ? yourTeamPlayers : oppositeTeamPlayers;
    const teamLabel = teamNum === 1 ? (yourTeamName || 'Team 1') : (oppositeTeamName || 'Team 2');

    if (currentList.length >= 11) {
      setErrorMsg(`Maximum 11 players allowed for ${teamLabel}.`);
      return;
    }

    setErrorMsg('');
    const newPlayer: PlayerInput = {
      id: `${teamNum === 1 ? 'y' : 'o'}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: '',
      type: 'Batsman',
      imageFile: null,
      previewUrl: ''
    };

    if (teamNum === 1) {
      setYourTeamPlayers(prev => [...prev, newPlayer]);
    } else {
      setOppositeTeamPlayers(prev => [...prev, newPlayer]);
    }
  };

  // Remove Player Card from Team
  const handleRemovePlayer = (teamNum: 1 | 2, id: string) => {
    setErrorMsg('');
    if (teamNum === 1) {
      setYourTeamPlayers(prev => prev.filter(p => p.id !== id));
    } else {
      setOppositeTeamPlayers(prev => prev.filter(p => p.id !== id));
    }
  };

  // Update Player Details
  const handleUpdatePlayer = (
    teamNum: 1 | 2,
    id: string,
    field: keyof PlayerInput,
    value: any
  ) => {
    const updater = (prev: PlayerInput[]) => prev.map(p => {
      if (p.id === id) {
        if (field === 'imageFile' && value) {
          const previewUrl = URL.createObjectURL(value);
          return { ...p, imageFile: value, previewUrl };
        }
        return { ...p, [field]: value };
      }
      return p;
    });

    if (teamNum === 1) {
      setYourTeamPlayers(updater);
    } else {
      setOppositeTeamPlayers(updater);
    }
  };

  // Step 1 Validation: Check required fields before proceeding to Step 2
  const handleProceedToStep2 = () => {
    setErrorMsg('');

    if (!yourTeamName.trim()) {
      setErrorMsg('Please enter Team 1 Name.');
      return;
    }
    if (!yourTeamPreview && !yourTeamFile) {
      setErrorMsg('Please upload a Team Logo for Team 1.');
      return;
    }
    if (!oppositeTeamName.trim()) {
      setErrorMsg('Please enter Team 2 Name.');
      return;
    }
    if (!oppositeTeamPreview && !oppositeTeamFile) {
      setErrorMsg('Please upload a Team Logo for Team 2.');
      return;
    }
    if (!category) {
      setErrorMsg('Please select a Match Category.');
      return;
    }
    if (!overs || overs <= 0) {
      setErrorMsg('Please enter valid Match Overs.');
      return;
    }

    setStep(2);
  };

  // Helper for image compression
  const compressImage = (file: File, maxWidth = 400, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => {
          resolve(event.target?.result as string || '');
        };
      };
    });
  };

  // Helper for uploading player/team avatar to storage
  const uploadFileToSupabase = async (file: File, folder: string): Promise<string> => {
    const compressedUrl = await compressImage(file);
    return compressedUrl;
  };

  // Final Step 2 Submission with 11-Player Validation (Role checks removed as per requirements)
  const handleSubmitFinal = async () => {
    if (loading) return;
    setErrorMsg('');

    // Step 1 Validation Check
    if (!yourTeamName.trim()) {
      setErrorMsg('Step 1 Error: Please enter Team 1 Name.');
      setStep(1);
      return;
    }
    if (!yourTeamPreview && !yourTeamFile) {
      setErrorMsg('Step 1 Error: Please upload Team 1 Logo.');
      setStep(1);
      return;
    }
    if (!oppositeTeamName.trim()) {
      setErrorMsg('Step 1 Error: Please enter Team 2 Name.');
      setStep(1);
      return;
    }
    if (!oppositeTeamPreview && !oppositeTeamFile) {
      setErrorMsg('Step 1 Error: Please upload Team 2 Logo.');
      setStep(1);
      return;
    }
    if (!category) {
      setErrorMsg('Step 1 Error: Please select a Match Category.');
      setStep(1);
      return;
    }
    if (!overs || overs <= 0) {
      setErrorMsg('Step 1 Error: Please enter valid Match Overs.');
      setStep(1);
      return;
    }

    // Team 1 Validation: Require 11 named players and at least 1 assigned for every role
    const t1Stats = countTeamRoles(yourTeamPlayers);
    if (yourTeamPlayers.length !== 11 || t1Stats.totalNamed !== 11) {
      setErrorMsg(`Team 1 (${yourTeamName || 'Team 1'}) must have all 11 player slots filled with names (currently has ${t1Stats.totalNamed}/11).`);
      return;
    }
    if (!t1Stats.hasWK) {
      setErrorMsg(`Team 1 (${yourTeamName || 'Team 1'}) must have at least 1 Wicket Keeper (WK) assigned.`);
      return;
    }
    if (!t1Stats.hasBAT) {
      setErrorMsg(`Team 1 (${yourTeamName || 'Team 1'}) must have at least 1 Batsman (BAT) assigned.`);
      return;
    }
    if (!t1Stats.hasAR) {
      setErrorMsg(`Team 1 (${yourTeamName || 'Team 1'}) must have at least 1 All-Rounder (AR) assigned.`);
      return;
    }
    if (!t1Stats.hasBOWL) {
      setErrorMsg(`Team 1 (${yourTeamName || 'Team 1'}) must have at least 1 Bowler (BOWL) assigned.`);
      return;
    }

    // Team 2 Validation: Require 11 named players and at least 1 assigned for every role
    const t2Stats = countTeamRoles(oppositeTeamPlayers);
    if (oppositeTeamPlayers.length !== 11 || t2Stats.totalNamed !== 11) {
      setErrorMsg(`Team 2 (${oppositeTeamName || 'Team 2'}) must have all 11 player slots filled with names (currently has ${t2Stats.totalNamed}/11).`);
      return;
    }
    if (!t2Stats.hasWK) {
      setErrorMsg(`Team 2 (${oppositeTeamName || 'Team 2'}) must have at least 1 Wicket Keeper (WK) assigned.`);
      return;
    }
    if (!t2Stats.hasBAT) {
      setErrorMsg(`Team 2 (${oppositeTeamName || 'Team 2'}) must have at least 1 Batsman (BAT) assigned.`);
      return;
    }
    if (!t2Stats.hasAR) {
      setErrorMsg(`Team 2 (${oppositeTeamName || 'Team 2'}) must have at least 1 All-Rounder (AR) assigned.`);
      return;
    }
    if (!t2Stats.hasBOWL) {
      setErrorMsg(`Team 2 (${oppositeTeamName || 'Team 2'}) must have at least 1 Bowler (BOWL) assigned.`);
      return;
    }

    setLoading(true);

    try {
      let yourTeamLogoUrl = yourTeamPreview;
      if (yourTeamFile) {
        yourTeamLogoUrl = await uploadFileToSupabase(yourTeamFile, 'team1');
      }

      let oppositeTeamLogoUrl = oppositeTeamPreview;
      if (oppositeTeamFile) {
        oppositeTeamLogoUrl = await uploadFileToSupabase(oppositeTeamFile, 'team2');
      }

      const processedYourTeamPlayers = await Promise.all(
        yourTeamPlayers.map(async p => {
          let avatarUrl = p.previewUrl;
          if (p.imageFile) {
            avatarUrl = await uploadFileToSupabase(p.imageFile, 'player1');
          }
          return { id: p.id, name: p.name.trim(), type: p.type, avatarUrl };
        })
      );

      const processedOppositeTeamPlayers = await Promise.all(
        oppositeTeamPlayers.map(async p => {
          let avatarUrl = p.previewUrl;
          if (p.imageFile) {
            avatarUrl = await uploadFileToSupabase(p.imageFile, 'player2');
          }
          return { id: p.id, name: p.name.trim(), type: p.type, avatarUrl };
        })
      );

      const combinedIsoStart = new Date().toISOString();

      let res: any = null;

      if (isEditMode) {
        res = await updateFullMatch({
          matchId: initialMatch.id,
          yourTeamName: yourTeamName.trim(),
          yourTeamLogoUrl,
          oppositeTeamName: oppositeTeamName.trim(),
          oppositeTeamLogoUrl,
          category: category as any,
          format: format || category,
          scheduledDate: combinedIsoStart,
          status,
          overs: Number(overs),
          yourTeamPlayers: processedYourTeamPlayers,
          oppositeTeamPlayers: processedOppositeTeamPlayers
        });
      } else {
        res = await createFullTwoStepMatch({
          yourTeamName: yourTeamName.trim(),
          yourTeamLogoUrl,
          oppositeTeamName: oppositeTeamName.trim(),
          oppositeTeamLogoUrl,
          category: category as any,
          scheduledDate: combinedIsoStart,
          overs: Number(overs),
          yourTeamPlayers: processedYourTeamPlayers,
          oppositeTeamPlayers: processedOppositeTeamPlayers
        });
      }

      setLoading(false);

      if (res?.error) {
        setErrorMsg(res.error);
        setSuccessMsg('');
      } else {
        setSuccessMsg(isEditMode ? '✓ Match Updated Successfully!' : '✓ Match Created Successfully!');
        setErrorMsg('');
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push('/master/dashboard?tab=overview');
            router.refresh();
          }
        }, 1000);
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'An unexpected error occurred while saving the match.');
    }
  };

  const t1Stats = countTeamRoles(yourTeamPlayers);
  const t2Stats = countTeamRoles(oppositeTeamPlayers);

  return (
    <div className="bg-[#0D1528] border border-[#173541] rounded-3xl p-3.5 sm:p-8 space-y-3 sm:space-y-6 shadow-2xl relative text-white">
      
      {/* CANCEL BUTTON IF RENDERED IN MODAL */}
      {onCancel && (
        <button 
          type="button" 
          onClick={onCancel}
          className="absolute top-3.5 right-3.5 sm:top-6 sm:right-6 p-1.5 sm:p-2 text-[#AAB5CC] hover:text-white bg-[#111A2D] hover:bg-[#173541] rounded-xl transition-all"
          title="Cancel"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}

      {/* 2-STEP PROGRESS INDICATOR */}
      <div className="flex items-center justify-between border-b border-[#173541] pb-2 sm:pb-4 pr-6 sm:pr-8">
        {[
          { num: 1, label: 'Step 1' },
          { num: 2, label: 'Step 2' },
        ].map((s) => {
          const isDone = step > s.num;
          const isActive = step === s.num;
          return (
            <div key={s.num} className="flex items-center gap-2 sm:gap-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-sm transition-all ${
                isActive 
                  ? 'bg-[#19D89A] text-[#050A1A] shadow-lg shadow-[#19D89A]/30 scale-105' 
                  : isDone 
                  ? 'bg-[#19D89A]/20 text-[#19D89A] border border-[#19D89A]/40' 
                  : 'bg-[#111A2D] text-[#AAB5CC] border border-[#173541]'
              }`}>
                {isDone ? <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" /> : s.num}
              </div>
              <div className="flex flex-col">
                <span className={`text-xs sm:text-sm font-black uppercase tracking-wider ${isActive ? 'text-[#19D89A]' : 'text-[#AAB5CC]'}`}>
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* INLINE VALIDATION ERROR MESSAGE */}
      {errorMsg && (
        <div className="p-3 sm:p-4 bg-[#E5232F]/15 border border-[#E5232F]/50 rounded-2xl text-red-200 text-xs flex items-center gap-2.5 font-semibold animate-in fade-in">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#E5232F] shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {successMsg && (
        <div className="p-3 sm:p-4 bg-[#19D89A]/20 border border-[#19D89A]/60 rounded-2xl text-[#19D89A] text-xs sm:text-sm flex items-center gap-2.5 font-extrabold shadow-lg shadow-[#19D89A]/20 animate-in fade-in">
          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#19D89A] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 1 — MATCH DETAILS                                       */}
      {/* ============================================================ */}
      {step === 1 && (
        <div className="space-y-3 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
            
            {/* TEAM 1 NAME & LOGO */}
            <div className="bg-[#050A1A] border border-[#173541] rounded-2xl p-3 sm:p-5 space-y-2 sm:space-y-4 shadow-lg">
              <label className="text-[10px] sm:text-xs font-black text-[#19D89A] uppercase tracking-wider block">
                Team 1 Name *
              </label>
              
              <div className="flex items-center gap-3 sm:gap-4">
                <div 
                  onClick={() => yourTeamInputRef.current?.click()}
                  className="relative group cursor-pointer w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[#0D1528] border-2 border-dashed border-[#173541] flex flex-col items-center justify-center overflow-hidden hover:border-[#19D89A] transition-all shrink-0"
                >
                  {yourTeamPreview ? (
                    <img src={yourTeamPreview} alt="Team 1 Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-0.5 text-[#AAB5CC]">
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-[8px] font-bold">Logo *</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[#050A1A]/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[9px] font-bold">
                    <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#19D89A]" />
                    <span>Upload</span>
                  </div>
                </div>

                <div className="flex-1 space-y-1 sm:space-y-1.5">
                  <input 
                    type="text" 
                    value={yourTeamName}
                    onChange={(e) => setYourTeamName(e.target.value)}
                    placeholder="Enter Team 1 Name (e.g. Royal Strikers)"
                    className="w-full bg-[#0D1528] border border-[#173541] rounded-xl px-3 py-1.5 sm:px-3.5 sm:py-2.5 text-xs text-white placeholder-[#AAB5CC]/50 focus:outline-none focus:border-[#19D89A]"
                  />
                  <input 
                    ref={yourTeamInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleYourTeamImageChange}
                    className="hidden"
                  />
                  <button 
                    type="button" 
                    onClick={() => yourTeamInputRef.current?.click()}
                    className="text-[10px] text-[#19D89A] font-bold hover:underline block"
                  >
                    + Upload Team 1 Logo *
                  </button>
                </div>
              </div>
            </div>

            {/* TEAM 2 NAME & LOGO */}
            <div className="bg-[#050A1A] border border-[#173541] rounded-2xl p-3 sm:p-5 space-y-2 sm:space-y-4 shadow-lg">
              <label className="text-[10px] sm:text-xs font-black text-[#19D89A] uppercase tracking-wider block">
                Team 2 Name *
              </label>
              
              <div className="flex items-center gap-3 sm:gap-4">
                <div 
                  onClick={() => oppositeTeamInputRef.current?.click()}
                  className="relative group cursor-pointer w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[#0D1528] border-2 border-dashed border-[#173541] flex flex-col items-center justify-center overflow-hidden hover:border-[#19D89A] transition-all shrink-0"
                >
                  {oppositeTeamPreview ? (
                    <img src={oppositeTeamPreview} alt="Team 2 Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-0.5 text-[#AAB5CC]">
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-[8px] font-bold">Logo *</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[#050A1A]/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[9px] font-bold">
                    <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#19D89A]" />
                    <span>Upload</span>
                  </div>
                </div>

                <div className="flex-1 space-y-1 sm:space-y-1.5">
                  <input 
                    type="text" 
                    value={oppositeTeamName}
                    onChange={(e) => setOppositeTeamName(e.target.value)}
                    placeholder="Enter Team 2 Name (e.g. Mumbai Kings)"
                    className="w-full bg-[#0D1528] border border-[#173541] rounded-xl px-3 py-1.5 sm:px-3.5 sm:py-2.5 text-xs text-white placeholder-[#AAB5CC]/50 focus:outline-none focus:border-[#19D89A]"
                  />
                  <input 
                    ref={oppositeTeamInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleOppositeTeamImageChange}
                    className="hidden"
                  />
                  <button 
                    type="button" 
                    onClick={() => oppositeTeamInputRef.current?.click()}
                    className="text-[10px] text-[#19D89A] font-bold hover:underline block"
                  >
                    + Upload Team 2 Logo *
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* SELECT MATCH CATEGORY */}
          <div className="bg-[#050A1A] border border-[#173541] rounded-2xl p-3 sm:p-5 space-y-2 sm:space-y-3 shadow-lg">
            <label className="text-[10px] sm:text-xs font-black text-[#19D89A] uppercase tracking-wider block">
              Select Match Category *
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {categoryOptions.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-1.5 px-2 sm:py-2.5 sm:px-3 rounded-xl text-[10px] sm:text-xs font-bold transition-all border text-center ${
                    category === cat
                      ? 'bg-[#19D89A] text-[#050A1A] border-[#19D89A] shadow-md shadow-[#19D89A]/20 scale-102 font-black'
                      : 'bg-[#0D1528] text-[#AAB5CC] border-[#173541] hover:text-white hover:border-[#19D89A]/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 1 NEXT / CONTINUE ACTION */}
          <div className="pt-2 sm:pt-4 flex items-center justify-between border-t border-[#173541]">
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 sm:px-5 sm:py-2.5 bg-[#111A2D] hover:bg-[#173541] text-[#AAB5CC] hover:text-white font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
            ) : <div />}

            <button
              type="button"
              onClick={handleProceedToStep2}
              className="px-6 py-2.5 sm:px-8 sm:py-3 bg-[#19D89A] hover:bg-emerald-400 text-[#050A1A] font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-[#19D89A]/20 transition-all uppercase tracking-wider"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 2 — PLAYER DETAILS (EXACTLY 11 PLAYERS PER TEAM)        */}
      {/* ============================================================ */}
      {step === 2 && (
        <div className="space-y-8">

          {/* TEAM SQUAD LISTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* TEAM 1 SQUAD */}
            <div className="bg-[#050A1A] border border-[#173541] rounded-2xl p-5 space-y-4 shadow-xl">
              
              {/* TEAM 1 HEADER & LIVE VALIDATION STATS */}
              <div className="space-y-3 border-b border-[#173541] pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#0D1528] border border-[#19D89A]/40 flex items-center justify-center shrink-0">
                      {yourTeamPreview ? (
                        <img src={yourTeamPreview} alt={yourTeamName} className="w-full h-full object-cover" />
                      ) : (
                        <Shield className="w-5 h-5 text-[#19D89A]" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#19D89A] uppercase tracking-wider">Team 1</span>
                      <h4 className="text-base font-extrabold text-white">{yourTeamName || 'Team 1'}</h4>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                    t1Stats.isValidCount 
                      ? 'bg-[#19D89A]/20 text-[#19D89A] border-[#19D89A]/40' 
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  }`}>
                    {t1Stats.totalNamed} / 11 Players {t1Stats.isValidCount ? '✓' : ''}
                  </span>
                </div>
              </div>

              {/* TEAM 1 PLAYER CARDS */}
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {yourTeamPlayers.map((p, idx) => (
                  <div 
                    key={p.id} 
                    className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 p-2 bg-[#0D1528] border border-[#173541] rounded-xl hover:border-[#19D89A]/40 transition-all"
                  >
                    <span className="text-[10px] font-bold text-[#AAB5CC] w-5 text-center shrink-0">
                      #{idx + 1}
                    </span>

                    {/* PHOTO UPLOAD */}
                    <label className="relative group cursor-pointer w-9 h-9 rounded-full bg-[#050A1A] border border-[#173541] flex items-center justify-center overflow-hidden shrink-0 hover:border-[#19D89A]">
                      {p.previewUrl ? (
                        <img src={p.previewUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-3.5 h-3.5 text-[#19D89A]" />
                      )}
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handleUpdatePlayer(1, p.id, 'imageFile', e.target.files?.[0])}
                        className="hidden"
                      />
                    </label>

                    {/* PLAYER NAME INPUT */}
                    <input 
                      type="text" 
                      value={p.name}
                      onChange={(e) => handleUpdatePlayer(1, p.id, 'name', e.target.value)}
                      placeholder={`Player ${idx + 1} Name *`}
                      className="flex-1 bg-[#050A1A] border border-[#173541] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#AAB5CC]/40 focus:outline-none focus:border-[#19D89A]"
                    />

                    {/* ROLE DROPDOWN */}
                    <select
                      value={p.type}
                      onChange={(e) => handleUpdatePlayer(1, p.id, 'type', e.target.value as PlayerRoleType)}
                      className="bg-[#050A1A] border border-[#173541] rounded-lg px-2.5 py-1.5 text-[11px] font-black text-[#19D89A] focus:outline-none focus:border-[#19D89A]"
                    >
                      <option value="WK">WK – Wicket Keeper</option>
                      <option value="Batsman">BAT – Batsman</option>
                      <option value="Allrounder">AR – All-Rounder</option>
                      <option value="Bowler">BOWL – Bowler</option>
                    </select>

                    {/* REMOVE BUTTON */}
                    <button 
                      type="button"
                      onClick={() => handleRemovePlayer(1, p.id)}
                      className="p-1.5 text-[#AAB5CC] hover:text-[#E5232F] rounded-lg hover:bg-[#111A2D] transition-colors shrink-0"
                      title="Remove Player"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* ADD PLAYER (+) BUTTON FOR TEAM 1 */}
              <button
                type="button"
                onClick={() => handleAddPlayer(1)}
                disabled={yourTeamPlayers.length >= 11}
                className="w-full py-2.5 bg-[#0D1528] border border-dashed border-[#173541] hover:border-[#19D89A] text-[#19D89A] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Player for Team 1 ({yourTeamPlayers.length}/11)</span>
              </button>

            </div>

            {/* TEAM 2 SQUAD */}
            <div className="bg-[#050A1A] border border-[#173541] rounded-2xl p-5 space-y-4 shadow-xl">
              
              {/* TEAM 2 HEADER & LIVE VALIDATION STATS */}
              <div className="space-y-3 border-b border-[#173541] pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#0D1528] border border-[#19D89A]/40 flex items-center justify-center shrink-0">
                      {oppositeTeamPreview ? (
                        <img src={oppositeTeamPreview} alt={oppositeTeamName} className="w-full h-full object-cover" />
                      ) : (
                        <Shield className="w-5 h-5 text-[#19D89A]" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#19D89A] uppercase tracking-wider">Team 2</span>
                      <h4 className="text-base font-extrabold text-[#ffffff]">{oppositeTeamName || 'Team 2'}</h4>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                    t2Stats.isValidCount 
                      ? 'bg-[#19D89A]/20 text-[#19D89A] border-[#19D89A]/40' 
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  }`}>
                    {t2Stats.totalNamed} / 11 Players {t2Stats.isValidCount ? '✓' : ''}
                  </span>
                </div>
              </div>

              {/* TEAM 2 PLAYER CARDS */}
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {oppositeTeamPlayers.map((p, idx) => (
                  <div 
                    key={p.id} 
                    className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 p-2 bg-[#0D1528] border border-[#173541] rounded-xl hover:border-[#19D89A]/40 transition-all"
                  >
                    <span className="text-[10px] font-bold text-[#AAB5CC] w-5 text-center shrink-0">
                      #{idx + 1}
                    </span>

                    {/* PHOTO UPLOAD */}
                    <label className="relative group cursor-pointer w-9 h-9 rounded-full bg-[#050A1A] border border-[#173541] flex items-center justify-center overflow-hidden shrink-0 hover:border-[#19D89A]">
                      {p.previewUrl ? (
                        <img src={p.previewUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-3.5 h-3.5 text-[#19D89A]" />
                      )}
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handleUpdatePlayer(2, p.id, 'imageFile', e.target.files?.[0])}
                        className="hidden"
                      />
                    </label>

                    {/* PLAYER NAME INPUT */}
                    <input 
                      type="text" 
                      value={p.name}
                      onChange={(e) => handleUpdatePlayer(2, p.id, 'name', e.target.value)}
                      placeholder={`Player ${idx + 1} Name *`}
                      className="flex-1 bg-[#050A1A] border border-[#173541] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#AAB5CC]/40 focus:outline-none focus:border-[#19D89A]"
                    />

                    {/* ROLE DROPDOWN */}
                    <select
                      value={p.type}
                      onChange={(e) => handleUpdatePlayer(2, p.id, 'type', e.target.value as PlayerRoleType)}
                      className="bg-[#050A1A] border border-[#173541] rounded-lg px-2.5 py-1.5 text-[11px] font-black text-[#19D89A] focus:outline-none focus:border-[#19D89A]"
                    >
                      <option value="WK">WK – Wicket Keeper</option>
                      <option value="Batsman">BAT – Batsman</option>
                      <option value="Allrounder">AR – All-Rounder</option>
                      <option value="Bowler">BOWL – Bowler</option>
                    </select>

                    {/* REMOVE BUTTON */}
                    <button 
                      type="button"
                      onClick={() => handleRemovePlayer(2, p.id)}
                      className="p-1.5 text-[#AAB5CC] hover:text-[#E5232F] rounded-lg hover:bg-[#111A2D] transition-colors shrink-0"
                      title="Remove Player"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* ADD PLAYER (+) BUTTON FOR TEAM 2 */}
              <button
                type="button"
                onClick={() => handleAddPlayer(2)}
                disabled={oppositeTeamPlayers.length >= 11}
                className="w-full py-2.5 bg-[#0D1528] border border-dashed border-[#173541] hover:border-[#19D89A] text-[#19D89A] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Player for Team 2 ({oppositeTeamPlayers.length}/11)</span>
              </button>

            </div>

          </div>

          {/* MATCH OVERS DISPLAY IN STEP 2 */}
          <div className="bg-[#050A1A] border border-[#173541] rounded-2xl p-5 space-y-3 shadow-lg max-w-lg">
            <label className="text-xs font-black text-[#19D89A] uppercase tracking-wider block">
              Match Overs *
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[5, 10, 15, 20, 50].map((ov) => (
                <button
                  key={ov}
                  type="button"
                  onClick={() => setOvers(ov)}
                  className={`flex-1 min-w-[65px] py-2 rounded-xl text-xs font-bold border transition-all ${
                    overs === ov
                      ? 'bg-[#19D89A] text-[#050A1A] border-[#19D89A] shadow-md shadow-[#19D89A]/20 font-black'
                      : 'bg-[#0D1528] text-[#AAB5CC] border-[#173541] hover:text-white'
                  }`}
                >
                  {ov} Overs
                </button>
              ))}
              <div className="w-28">
                <input 
                  type="number"
                  min={1}
                  max={100}
                  value={overs}
                  onChange={(e) => setOvers(Number(e.target.value))}
                  className="w-full bg-[#0D1528] border border-[#173541] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#19D89A]"
                />
              </div>
            </div>
          </div>

          {/* STEP 2 ACTION BUTTONS */}
          <div className="pt-4 flex items-center justify-between gap-4 border-t border-[#173541]">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-3 bg-[#111A2D] hover:bg-[#173541] text-[#AAB5CC] hover:text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleSubmitFinal}
              className={`px-8 py-3 rounded-xl font-black text-xs flex items-center gap-2 transition-all uppercase tracking-wider shadow-lg ${
                loading
                  ? 'bg-[#111A2D] text-[#AAB5CC] cursor-not-allowed'
                  : 'bg-[#19D89A] hover:bg-emerald-400 text-[#050A1A] shadow-[#19D89A]/25'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#050A1A]" />
                  <span>Saving Match...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isEditMode ? 'Save Changes' : 'Create Match'}</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
