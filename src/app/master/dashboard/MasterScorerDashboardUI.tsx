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

  React.useEffect(() => {
    setCurrentMatches(matches);
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

  const sortedMatches = React.useMemo(() => {
    if (!Array.isArray(currentMatches)) return [];
    return [...currentMatches].sort((a, b) => {
      const timeA = new Date(a.created_at || a.scheduled_start || a.scheduled_at || 0).getTime();
      const timeB = new Date(b.created_at || b.scheduled_start || b.scheduled_at || 0).getTime();
      return timeB - timeA;
    });
  }, [currentMatches]);

  const latestMatch = sortedMatches[0] || null;

  const handleConfirmDelete = async () => {
    if (!deletingMatch) return;
    setIsDeleting(true);
    try {
      const res = await deleteMatch(deletingMatch.id);
      if (res.error) {
        showToast(`Error: ${res.error}`);
      } else {
        showToast('✓ Match deleted successfully.');
        setCurrentMatches(prev => prev.filter((m: any) => m.id !== deletingMatch.id));
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
    <div className="space-y-6 font-sans">

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
        <div className="space-y-6 animate-in fade-in duration-200">
          
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
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#173541] pb-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#19D89A]" />
                Create New Match
              </h2>
              <p className="text-xs text-[#AAB5CC]">Configure match teams, overs, format, playground, and officials.</p>
            </div>
          </div>

          <CreateMatchForm />
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
                Match History Log ({sortedMatches.length})
              </h2>
              <p className="text-xs text-[#AAB5CC]">Complete record of all matches created and saved by you (newest first).</p>
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
        <div className="fixed inset-0 z-50 bg-[#050A1A]/90 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 overflow-y-auto">
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
      {/* 🧭 FIXED BOTTOM NAVIGATION BAR FOR MASTER SCORE DASHBOARD   */}
      {/* ============================================================ */}
      <nav 
        aria-label="Master Dashboard Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D1528]/95 backdrop-blur-xl border-t border-[#173541] shadow-[0_-8px_30px_rgba(0,0,0,0.6)] py-2.5 px-2 sm:px-4 transform-gpu touch-manipulation"
      >
        <div className="max-w-2xl mx-auto flex items-center justify-around gap-1 sm:gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabChange(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 sm:px-3 rounded-2xl transition-all duration-300 ease-out relative group active:scale-95 ${
                  isActive
                    ? 'bg-[#19D89A]/15 text-[#19D89A] font-extrabold shadow-sm border border-[#19D89A]/30 scale-102'
                    : 'text-[#AAB5CC] hover:text-white hover:bg-[#111A2D] font-medium border border-transparent opacity-80 hover:opacity-100'
                }`}
              >
                {/* Active Indicator Top Line with smooth pulse glow */}
                {isActive && (
                  <span className="absolute -top-2.5 w-8 h-1 bg-[#19D89A] rounded-full shadow-[0_0_10px_#19D89A] animate-in fade-in zoom-in duration-200" />
                )}
                
                <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? 'text-[#19D89A] scale-110' : 'text-[#AAB5CC] group-hover:text-white'
                }`} />

                <span className={`text-[10px] sm:text-xs tracking-tight mt-1 text-center whitespace-nowrap transition-colors duration-200 ${
                  isActive ? 'text-[#19D89A] font-extrabold' : 'text-[#AAB5CC]'
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
