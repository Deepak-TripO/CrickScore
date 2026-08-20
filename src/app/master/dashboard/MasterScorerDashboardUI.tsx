'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CreateMatchForm from '../matches/create/CreateMatchForm';
import CommunityCreateSection from '@/components/community/CommunityCreateSection';
import MatchCard from '@/components/match/MatchCard';
import { getMatchDetailsForEdit, deleteMatch } from '@/actions/matches';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Users, 
  History, 
  Trophy, 
  Play, 
  Pencil, 
  Trash2,
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Shield 
} from 'lucide-react';

interface MasterScorerDashboardUIProps {
  user: any;
  userRole: string;
  matches: any[];
  teams: any[];
  playgrounds: any[];
  initialTab?: string;
}

export default function MasterScorerDashboardUI({
  user,
  userRole,
  matches,
  teams,
  playgrounds,
  initialTab = 'overview'
}: MasterScorerDashboardUIProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'community' | 'history'>(
    (initialTab as any) || 'overview'
  );

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<any>(null);
  const [fullEditingMatch, setFullEditingMatch] = useState<any>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMatch, setDeletingMatch] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toastMsg, setToastMsg] = useState('');

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Open Edit Modal with Loaded Match Details
  const handleOpenEditModal = async (matchItem: any) => {
    setEditingMatch(matchItem);
    setFullEditingMatch(null);
    setLoadingEdit(true);
    setIsEditModalOpen(true);

    try {
      const fullDetails = await getMatchDetailsForEdit(matchItem.id);
      const t1 = Array.isArray(matchItem.team1) ? matchItem.team1[0] : matchItem.team1;
      const t2 = Array.isArray(matchItem.team2) ? matchItem.team2[0] : matchItem.team2;

      const mergedMatch = {
        ...matchItem,
        ...(fullDetails || {}),
        your_team_name: fullDetails?.your_team_name || matchItem.your_team_name || t1?.name || (matchItem.title ? matchItem.title.split(' vs ')[0] : ''),
        your_team_logo_url: fullDetails?.your_team_logo_url || matchItem.your_team_logo_url || t1?.logo_url || '',
        opposite_team_name: fullDetails?.opposite_team_name || matchItem.opposite_team_name || t2?.name || (matchItem.title ? matchItem.title.split(' vs ')[1] : ''),
        opposite_team_logo_url: fullDetails?.opposite_team_logo_url || matchItem.opposite_team_logo_url || t2?.logo_url || '',
        team1Players: fullDetails?.team1Players || [],
        team2Players: fullDetails?.team2Players || []
      };

      setFullEditingMatch(mergedMatch);
    } catch {
      setFullEditingMatch(matchItem);
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingMatch(null);
    setFullEditingMatch(null);
    setLoadingEdit(false);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setEditingMatch(null);
    setFullEditingMatch(null);
    setLoadingEdit(false);
    showToast('✓ Match updated successfully.');
    router.refresh();
  };

  // Delete Match Handlers
  const handleOpenDeleteModal = (matchItem: any) => {
    setDeletingMatch(matchItem);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingMatch(null);
    setIsDeleting(false);
  };  const [currentMatches, setCurrentMatches] = useState(matches);
  const [latestCreatedMatchId, setLatestCreatedMatchId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('batscore_latest_created_match_id');
    }
    return null;
  });

  const [isLatestMatchDeleted, setIsLatestMatchDeleted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('batscore_latest_match_deleted') === 'true';
    }
    return false;
  });

  React.useEffect(() => {
    setCurrentMatches(matches);
    if (typeof window !== 'undefined' && Array.isArray(matches) && matches.length > 0) {
      const storedId = localStorage.getItem('batscore_latest_created_match_id');
      const deletedFlag = localStorage.getItem('batscore_latest_match_deleted');
      if (!storedId && deletedFlag !== 'true') {
        const sorted = [...matches].sort((a, b) => {
          const timeA = new Date(a.created_at || a.scheduled_start || a.scheduled_at || 0).getTime();
          const timeB = new Date(b.created_at || b.scheduled_start || b.scheduled_at || 0).getTime();
          return timeB - timeA;
        });
        const activeMatch = sorted.find((m: any) => m.status !== 'DELETED');
        if (activeMatch?.id) {
          setLatestCreatedMatchId(activeMatch.id);
          localStorage.setItem('batscore_latest_created_match_id', activeMatch.id);
        }
      }
    }
  }, [matches]);

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'create',
      label: 'Create',
      icon: PlusCircle,
    },
    {
      id: 'community',
      label: 'Community Create',
      icon: Users,
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
    },
  ] as const;

  const handleTabChange = (tabId: 'overview' | 'create' | 'community' | 'history') => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.pushState({}, '', url.toString());
    }
  };

  const handleMatchCreatedSuccess = (newMatchId?: string) => {
    if (newMatchId) {
      setLatestCreatedMatchId(newMatchId);
      setIsLatestMatchDeleted(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('batscore_latest_created_match_id', newMatchId);
        localStorage.removeItem('batscore_latest_match_deleted');
      }
    }
    handleTabChange('overview');
    router.refresh();
  };

  const latestMatch = React.useMemo(() => {
    if (!Array.isArray(currentMatches) || currentMatches.length === 0) return null;
    if (isLatestMatchDeleted && !latestCreatedMatchId) return null;

    if (latestCreatedMatchId) {
      const found = currentMatches.find((m: any) => m.id === latestCreatedMatchId && m.status !== 'DELETED');
      return found || null;
    }

    const sorted = [...currentMatches].sort((a, b) => {
      const timeA = new Date(a.created_at || a.scheduled_start || a.scheduled_at || 0).getTime();
      const timeB = new Date(b.created_at || b.scheduled_start || b.scheduled_at || 0).getTime();
      return timeB - timeA;
    });
    return sorted.find((m: any) => m.status !== 'DELETED') || null;
  }, [currentMatches, latestCreatedMatchId, isLatestMatchDeleted]);

  const sortedMatches = React.useMemo(() => {
    if (!Array.isArray(currentMatches)) return [];
    return [...currentMatches]
      .filter((m: any) => m.status !== 'DELETED')
      .sort((a, b) => {
        const timeA = new Date(a.created_at || a.scheduled_start || a.scheduled_at || 0).getTime();
        const timeB = new Date(b.created_at || b.scheduled_start || b.scheduled_at || 0).getTime();
        return timeB - timeA;
      });
  }, [currentMatches]);

  const handleConfirmDelete = async () => {
    if (!deletingMatch) return;
    setIsDeleting(true);
    try {
      const targetId = deletingMatch.id;
      const res = await deleteMatch(targetId);
      if (res.error) {
        showToast(`Error: ${res.error}`);
      } else {
        showToast('✓ Match deleted successfully.');
        setCurrentMatches(prev => prev.filter((m: any) => m.id !== targetId));

        if (latestCreatedMatchId === targetId || !latestCreatedMatchId) {
          setLatestCreatedMatchId(null);
          setIsLatestMatchDeleted(true);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('batscore_latest_created_match_id');
            localStorage.setItem('batscore_latest_match_deleted', 'true');
          }
        }

        setIsDeleteModalOpen(false);
        setDeletingMatch(null);
        router.refresh();
      }
    } catch {
      showToast('Error deleting match');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-28 sm:pb-32">

      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#19D89A] text-[#050A1A] font-extrabold text-xs px-4 py-2.5 rounded-full shadow-lg border border-[#19D89A] flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 1: OVERVIEW TAB (SHOWS ONLY LATEST CREATED MATCH)    */}
      {/* ============================================================ */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* REAL STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#0D1528] border border-[#173541] rounded-2xl p-4 space-y-1 shadow-lg">
              <div className="flex items-center justify-between text-[#AAB5CC]">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Matches</span>
                <Trophy className="w-4 h-4 text-[#19D89A]" />
              </div>
              <div className="text-3xl font-black text-white font-mono">{sortedMatches?.length || 0}</div>
            </div>
          </div>

          {/* CREATED MATCHES - SHOWS ONLY 1 LATEST CREATED MATCH */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#173541] pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#19D89A]" />
                Latest Created Match
              </h2>
            </div>

            {!latestMatch ? (
              <div className="bg-[#0D1528]/60 border border-[#173541] rounded-3xl p-10 text-center space-y-3">
                <p className="text-[#AAB5CC] text-sm">No matches created yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MatchCard 
                  key={latestMatch.id} 
                  match={latestMatch} 
                  isLatestOverviewCard={true}
                  onEdit={() => handleOpenEditModal(latestMatch)} 
                  onDelete={() => handleOpenDeleteModal(latestMatch)} 
                />
              </div>
            )}
          </div>

        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 2: CREATE MATCHES TAB                                */}
      {/* ============================================================ */}
      {activeTab === 'create' && (
        <div className="animate-in fade-in duration-200">
          <CreateMatchForm onSuccess={handleMatchCreatedSuccess} />
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 3: COMMUNITY CREATE TAB                               */}
      {/* ============================================================ */}
      {activeTab === 'community' && (
        <div className="animate-in fade-in duration-200">
          <CommunityCreateSection />
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 4: HISTORY TAB (ALL CREATED MATCHES, NEWEST FIRST)   */}
      {/* ============================================================ */}
      {activeTab === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#173541] pb-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-[#19D89A]" />
                Match History ({sortedMatches.length})
              </h2>
            </div>
          </div>

          {sortedMatches.length === 0 ? (
            <div className="bg-[#0D1528]/60 border border-[#173541] rounded-3xl p-10 text-center space-y-3">
              <p className="text-[#AAB5CC] text-sm">No matches found in history.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedMatches.map((m: any) => (
                <MatchCard 
                  key={m.id} 
                  match={m} 
                  isHistoryView={true}
                  onDelete={() => handleOpenDeleteModal(m)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* ✏️ EDIT MATCH FORM MODAL (REUSES CREATEMATCHFORM INTERFACE)  */}
      {/* ============================================================ */}
      {isEditModalOpen && editingMatch && (
        <div className="fixed inset-0 z-[60] bg-[#050A1A]/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 pb-20 sm:pb-6 overflow-y-auto">
          <div className="w-full max-w-4xl my-auto animate-in zoom-in-95 duration-200">
            {loadingEdit || !fullEditingMatch ? (
              <div className="bg-[#0D1528] border border-[#173541] rounded-3xl p-12 flex flex-col items-center justify-center space-y-4 shadow-2xl">
                <div className="w-8 h-8 border-3 border-[#19D89A] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-[#AAB5CC] font-bold">Loading match details...</p>
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="text-xs text-[#AAB5CC] hover:text-white font-bold mt-2"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <CreateMatchForm 
                initialMatch={fullEditingMatch} 
                onCancel={handleCloseEditModal} 
                onSuccess={handleEditSuccess} 
              />
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 🗑️ DELETE MATCH CONFIRMATION DIALOG MODAL                     */}
      {/* ============================================================ */}
      {isDeleteModalOpen && deletingMatch && (
        <div className="fixed inset-0 z-50 bg-[#050A1A]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D1528] border border-[#173541] rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 text-white">
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E5232F]/15 border border-[#E5232F]/40 flex items-center justify-center text-[#E5232F] shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Delete Match?</h3>
                <p className="text-xs text-[#AAB5CC] font-medium mt-0.5">
                  {deletingMatch.title || 'Selected Match'}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#AAB5CC] leading-relaxed bg-[#050A1A] p-4 rounded-2xl border border-[#173541]">
              Are you sure you want to permanently delete this match and its associated data?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-[#111A2D] hover:bg-[#173541] text-[#AAB5CC] hover:text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-6 py-2.5 bg-[#E5232F] hover:bg-red-600 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-[#E5232F]/30 transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 🧭 MASTER DASHBOARD BOTTOM NAVIGATION (HOMEPAGE DESIGN UI)     */}
      {/* ============================================================ */}
      <nav 
        aria-label="Master Dashboard Bottom Navigation"
        className="fixed bottom-0 inset-x-0 z-50 bg-[#070D1D]/95 backdrop-blur-md border-t border-[#1E2D4A] py-2 px-3 w-full pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
      >
        <div className="grid grid-cols-4 w-full max-w-md mx-auto items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabChange(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors text-center w-full ${
                  isActive
                    ? 'text-[#19D89A]'
                    : 'text-[#8F9BB3] hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2px]" />
                <span className={`text-[11px] tracking-tight block mt-1 ${
                  isActive ? 'font-bold' : 'font-medium'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
