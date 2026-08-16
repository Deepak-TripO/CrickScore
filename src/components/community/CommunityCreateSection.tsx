'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Users, 
  Camera, 
  Image as ImageIcon, 
  X, 
  CheckCircle2, 
  Pencil, 
  Trash2, 
  AlertTriangle, 
  ArrowRight,
  Eye,
  ArrowLeft,
  Loader2,
  UserCheck,
  Shield
} from 'lucide-react';
import { 
  createCommunityAction, 
  updateCommunityAction, 
  deleteCommunityAction, 
  getCommunityMembersAction,
  getPublicCommunities,
  CommunityMemberItem
} from '@/actions/community';

export interface CommunityItem {
  id: string;
  ownerId?: string;
  name: string;
  bio: string;
  profileImage: string;
  coverImage: string;
  createdAt: string;
  membersCount?: number;
}

export default function CommunityCreateSection() {
  const [communities, setCommunities] = useState<CommunityItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommunityId, setEditingCommunityId] = useState<string | null>(null);

  // View Community Panel State
  const [viewingCommunity, setViewingCommunity] = useState<CommunityItem | null>(null);
  const [communityMembers, setCommunityMembers] = useState<CommunityMemberItem[]>([]);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false);

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCommunity, setDeletingCommunity] = useState<CommunityItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');

  // UI Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Load communities from Supabase database on mount (Only user-created communities, no defaults)
  useEffect(() => {
    const loadData = async () => {
      try {
        const dbList = await getPublicCommunities();
        if (Array.isArray(dbList)) {
          setCommunities(dbList);
        } else {
          setCommunities([]);
        }
      } catch {
        setCommunities([]);
      }
    };

    loadData();
  }, []);

  const saveCommunitiesToState = (updated: CommunityItem[]) => {
    setCommunities(updated);
  };

  // View Community Handler
  const handleOpenViewPanel = async (comm: CommunityItem) => {
    setViewingCommunity(comm);
    setLoadingMembers(true);
    setCommunityMembers([]);
    setMemberCount(0);

    try {
      const result = await getCommunityMembersAction(comm.id);
      setCommunityMembers(result.members || []);
      setMemberCount(result.count || 0);
    } catch {
      setCommunityMembers([]);
      setMemberCount(0);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCloseViewPanel = () => {
    setViewingCommunity(null);
    setCommunityMembers([]);
    setMemberCount(0);
    setLoadingMembers(false);
  };

  // Image Selection Handlers
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const url = URL.createObjectURL(file);
      setProfileImagePreview(url);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      const url = URL.createObjectURL(file);
      setCoverImagePreview(url);
    }
  };

  const resetForm = () => {
    setEditingCommunityId(null);
    setName('');
    setBio('');
    setProfileImageFile(null);
    setProfileImagePreview('');
    setCoverImageFile(null);
    setCoverImagePreview('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (comm: CommunityItem) => {
    setEditingCommunityId(comm.id);
    setName(comm.name);
    setBio(comm.bio);
    setProfileImagePreview(comm.profileImage || '');
    setCoverImagePreview(comm.coverImage || '');
    setErrorMsg('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Delete Modal Handlers
  const handleOpenDeleteModal = (comm: CommunityItem) => {
    setDeletingCommunity(comm);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingCommunity(null);
    setIsDeleting(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCommunity) return;
    setIsDeleting(true);

    try {
      await deleteCommunityAction(deletingCommunity.id);

      const updated = communities.filter(c => c.id !== deletingCommunity.id);
      saveCommunitiesToState(updated);

      handleCloseDeleteModal();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete community.');
      setIsDeleting(false);
    }
  };

  // Form Submit Handler (Create or Edit)
  const handleSubmitCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Community Name is required.');
      return;
    }
    if (!bio.trim()) {
      setErrorMsg('Bio is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingCommunityId) {
        // UPDATE EXISTING COMMUNITY
        const res = await updateCommunityAction({
          id: editingCommunityId,
          name: name.trim(),
          bio: bio.trim(),
          profileImage: profileImagePreview,
          coverImage: coverImagePreview
        });

        if (res.error) {
          setErrorMsg(res.error);
          setIsSubmitting(false);
          return;
        }

        const updatedList = communities.map(c => {
          if (c.id === editingCommunityId) {
            return {
              ...c,
              name: name.trim(),
              bio: bio.trim(),
              profileImage: profileImagePreview || c.profileImage,
              coverImage: coverImagePreview || c.coverImage
            };
          }
          return c;
        });

        saveCommunitiesToState(updatedList);
        setSuccessMsg('✓ Community Updated Successfully!');
      } else {
        // CREATE NEW COMMUNITY
        const res = await createCommunityAction({
          name: name.trim(),
          bio: bio.trim(),
          profileImage: profileImagePreview,
          coverImage: coverImagePreview
        });

        if (res.error) {
          setErrorMsg(res.error);
          setIsSubmitting(false);
          return;
        }

        const newComm: CommunityItem = res.community || {
          id: `comm_${Date.now()}`,
          name: name.trim(),
          bio: bio.trim(),
          profileImage: profileImagePreview || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=300&q=80',
          coverImage: coverImagePreview || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
          createdAt: new Date().toISOString(),
          membersCount: 1
        };

        const updatedList = [newComm, ...communities];
        saveCommunitiesToState(updatedList);
        setSuccessMsg('✓ Community Created Successfully!');
      }

      setTimeout(() => {
        setIsSubmitting(false);
        handleCloseModal();
      }, 700);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to save community.');
    }
  };

  // IF VIEWING A DEDICATED COMMUNITY PANEL
  if (viewingCommunity) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        
        {/* BACK ACTION & HEADER */}
        <div className="flex items-center justify-between border-b border-[#173541] pb-4">
          <button
            type="button"
            onClick={handleCloseViewPanel}
            className="px-4 py-2 bg-[#111A2D] hover:bg-[#173541] text-[#AAB5CC] hover:text-white font-extrabold text-xs rounded-xl border border-[#173541] flex items-center gap-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-[#19D89A]" />
            <span>Back to Active Communities</span>
          </button>

          <span className="px-3 py-1 rounded-full text-xs font-black bg-[#19D89A]/15 text-[#19D89A] border border-[#19D89A]/30">
            Community ID: {viewingCommunity.id.slice(0, 8)}...
          </span>
        </div>

        {/* COMMUNITY BANNER & INFO HEADER CARD */}
        <div className="bg-[#0D1528] border border-[#173541] rounded-3xl overflow-hidden shadow-2xl space-y-0">
          <div className="relative h-44 w-full bg-[#050A1A] overflow-hidden">
            <img 
              src={viewingCommunity.coverImage} 
              alt={viewingCommunity.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D1528] via-transparent to-black/30" />
          </div>

          <div className="px-6 pb-6 relative space-y-4">
            <div className="-mt-12 flex items-end justify-between">
              <div className="w-20 h-20 rounded-2xl bg-[#050A1A] border-4 border-[#0D1528] overflow-hidden shadow-xl shrink-0">
                <img 
                  src={viewingCommunity.profileImage} 
                  alt={viewingCommunity.name} 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#19D89A] text-[#050A1A] shadow-md">
                  Active Community
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">{viewingCommunity.name}</h2>
              <p className="text-xs text-[#AAB5CC] leading-relaxed max-w-3xl">{viewingCommunity.bio}</p>
            </div>
          </div>
        </div>

        {/* COMMUNITY MEMBERS SECTION */}
        <div className="bg-[#0D1528] border border-[#173541] rounded-3xl p-6 space-y-5 shadow-xl">
          
          <div className="flex items-center justify-between border-b border-[#173541] pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#19D89A]" />
              <h3 className="text-base font-black text-white">Community Members</h3>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#050A1A] text-[#19D89A] border border-[#173541]">
              {loadingMembers ? 'Loading...' : `${memberCount} Members`}
            </span>
          </div>

          {/* LOADING STATE */}
          {loadingMembers ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#19D89A]" />
              <p className="text-xs text-[#AAB5CC] font-bold">Loading community members...</p>
            </div>
          ) : communityMembers.length === 0 ? (
            /* CLEAN EMPTY STATE */
            <div className="bg-[#050A1A] border border-[#173541] rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#111A2D] border border-[#173541] flex items-center justify-center text-[#AAB5CC]">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">No members have joined this community yet.</h4>
                <p className="text-xs text-[#AAB5CC]">When players or scorers join this community, they will appear here automatically.</p>
              </div>
            </div>
          ) : (
            /* REAL MEMBER DIRECTORY GRID */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {communityMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="bg-[#050A1A] border border-[#173541] rounded-2xl p-4 flex items-center gap-3.5 shadow-md hover:border-[#19D89A]/40 transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#111A2D] border border-[#173541] overflow-hidden shrink-0 flex items-center justify-center font-bold text-white text-sm">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.fullName} className="w-full h-full object-cover" />
                    ) : (
                      member.fullName.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  <div className="space-y-0.5 min-w-0 flex-1">
                    <h4 className="text-xs font-black text-white truncate">{member.fullName}</h4>
                    {member.username && (
                      <span className="text-[10px] text-[#AAB5CC] block truncate">@{member.username}</span>
                    )}
                    <span className="text-[9px] font-extrabold text-[#19D89A] uppercase tracking-wider block">
                      {member.role || 'Member'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER SECTION WITH CLEAR "+" PLUS BUTTON */}
      <div className="flex items-center justify-between border-b border-[#173541] pb-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#19D89A]" />
            Community Create
          </h2>
          <p className="text-xs text-[#AAB5CC] mt-0.5">Build and manage local cricket communities, connect teams, and organize matches.</p>
        </div>

        {/* PROMINENT PLUS BUTTON FOR MASTER USERS */}
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#19D89A] hover:bg-emerald-400 text-[#050A1A] font-black rounded-xl text-xs shadow-lg shadow-[#19D89A]/20 transition-all uppercase tracking-wider group"
          title="Create New Community"
        >
          <div className="w-5 h-5 rounded-lg bg-[#050A1A]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-4 h-4 text-[#050A1A]" />
          </div>
          <span className="hidden sm:inline">Create Community</span>
        </button>
      </div>

      {/* CREATED COMMUNITIES LIST GRID WITH VIEW, EDIT & DELETE CONTROLS */}
      {communities.length === 0 ? (
        <div className="bg-[#0D1528]/60 border border-[#173541] rounded-3xl p-10 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#111A2D] border border-[#173541] flex items-center justify-center text-[#19D89A]">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Active Communities Created Yet</h3>
            <p className="text-xs text-[#AAB5CC]">Click the + Plus button above to create your first community.</p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#19D89A] text-[#050A1A] font-black rounded-xl text-xs hover:bg-emerald-400 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Community</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((comm) => (
            <div 
              key={comm.id} 
              className="bg-[#0D1528] border border-[#173541] rounded-3xl overflow-hidden shadow-xl hover:border-[#19D89A]/40 transition-all group flex flex-col justify-between"
            >
              <div>
                {/* COVER IMAGE */}
                <div className="relative h-32 w-full bg-[#050A1A] overflow-hidden">
                  <img 
                    src={comm.coverImage} 
                    alt={`${comm.name} Cover`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D1528] via-transparent to-black/20" />
                </div>

                {/* PROFILE IMAGE & DETAILS */}
                <div className="px-5 pb-5 relative space-y-3">
                  <div className="-mt-10 flex items-end justify-between">
                    <div className="w-16 h-16 rounded-2xl bg-[#050A1A] border-4 border-[#0D1528] overflow-hidden shadow-lg shrink-0">
                      <img 
                        src={comm.profileImage} 
                        alt={comm.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#19D89A]/15 text-[#19D89A] border border-[#19D89A]/30">
                      Active Community
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white group-hover:text-[#19D89A] transition-colors">
                      {comm.name}
                    </h3>
                    <p className="text-xs text-[#AAB5CC] line-clamp-3 leading-relaxed">
                      {comm.bio}
                    </p>
                  </div>
                </div>
              </div>

              {/* FOOTER ACTIONS: VIEW, EDIT & DELETE */}
              <div className="px-5 py-3.5 bg-[#050A1A]/70 border-t border-[#173541] flex items-center justify-between flex-wrap gap-2">
                
                {/* VIEW BUTTON */}
                <button
                  type="button"
                  onClick={() => handleOpenViewPanel(comm)}
                  className="px-3.5 py-1.5 bg-[#19D89A] hover:bg-emerald-400 text-[#050A1A] rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md"
                  title="View Community & Members"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View</span>
                </button>

                <div className="flex items-center gap-2">
                  {/* EDIT BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(comm)}
                    className="px-3 py-1.5 bg-[#111A2D] hover:bg-[#173541] text-white border border-[#173541] hover:border-[#19D89A] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    title="Edit Community"
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#19D89A]" />
                    <span>Edit</span>
                  </button>

                  {/* DELETE BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleOpenDeleteModal(comm)}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    title="Delete Community"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* CREATE / EDIT COMMUNITY FORM MODAL                            */}
      {/* ============================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#0D1528] border border-[#173541] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0 relative">
            
            {/* MODAL HEADER */}
            <div className="px-6 py-5 border-b border-[#173541] flex items-center justify-between bg-[#050A1A]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#19D89A]/20 border border-[#19D89A]/40 flex items-center justify-center text-[#19D89A]">
                  {editingCommunityId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingCommunityId ? 'Edit Community' : 'Create Community'}
                  </h3>
                  <p className="text-[11px] text-[#AAB5CC]">
                    {editingCommunityId ? 'Update your community details.' : 'Fill in the community details below.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 text-[#AAB5CC] hover:text-white bg-[#111A2D] hover:bg-[#173541] rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* FORM BODY */}
            <form onSubmit={handleSubmitCommunity} className="p-6 space-y-5">
              
              {/* FEEDBACK MESSAGES */}
              {errorMsg && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-bold">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3.5 bg-[#19D89A]/10 border border-[#19D89A]/30 rounded-xl text-[#19D89A] text-xs font-extrabold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* COVER IMAGE UPLOAD WITH PREVIEW */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-[#19D89A] uppercase tracking-wider block">
                  Cover Image
                </label>
                <div 
                  onClick={() => coverInputRef.current?.click()}
                  className="relative h-32 w-full rounded-2xl border-2 border-dashed border-[#173541] hover:border-[#19D89A] bg-[#050A1A] flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group"
                >
                  {coverImagePreview ? (
                    <img src={coverImagePreview} alt="Cover Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center space-y-1 p-3">
                      <ImageIcon className="w-6 h-6 mx-auto text-[#AAB5CC] group-hover:text-[#19D89A] transition-colors" />
                      <span className="text-xs font-bold text-[#AAB5CC] block">Click to upload Cover Image</span>
                    </div>
                  )}
                  <input 
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCoverImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* PROFILE IMAGE UPLOAD WITH PREVIEW */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-[#19D89A] uppercase tracking-wider block">
                  Profile Image
                </label>
                <div className="flex items-center gap-4">
                  <div 
                    onClick={() => profileInputRef.current?.click()}
                    className="w-16 h-16 rounded-2xl border-2 border-dashed border-[#173541] hover:border-[#19D89A] bg-[#050A1A] flex items-center justify-center cursor-pointer overflow-hidden shrink-0 group transition-all"
                  >
                    {profileImagePreview ? (
                      <img src={profileImagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-5 h-5 text-[#AAB5CC] group-hover:text-[#19D89A] transition-colors" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => profileInputRef.current?.click()}
                    className="px-4 py-2 bg-[#111A2D] hover:bg-[#173541] border border-[#173541] text-[#AAB5CC] hover:text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Select Profile Image
                  </button>
                  <input 
                    ref={profileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* COMMUNITY NAME FIELD (REQUIRED) */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#19D89A] uppercase tracking-wider block">
                  Community Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter community name (e.g. Royal Cricket Club)"
                  className="w-full px-4 py-3 bg-[#050A1A] border border-[#173541] focus:border-[#19D89A] rounded-xl text-xs font-bold text-white outline-none transition-all placeholder:text-[#AAB5CC]/50"
                  required
                />
              </div>

              {/* BIO FIELD (REQUIRED) */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-[#19D89A] uppercase tracking-wider block">
                  Bio *
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your community, guidelines, activities, and goals..."
                  className="w-full px-4 py-3 bg-[#050A1A] border border-[#173541] focus:border-[#19D89A] rounded-xl text-xs font-bold text-white outline-none transition-all placeholder:text-[#AAB5CC]/50 resize-none"
                  required
                />
              </div>

              {/* FORM ACTION BUTTONS */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#173541]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 bg-[#111A2D] hover:bg-[#173541] text-[#AAB5CC] hover:text-white font-bold rounded-xl text-xs transition-all"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#19D89A] hover:bg-emerald-400 text-[#050A1A] font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-[#19D89A]/20 transition-all uppercase tracking-wider"
                >
                  <span>{isSubmitting ? 'Saving...' : (editingCommunityId ? 'Save Changes' : 'Create Community')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DELETE CONFIRMATION MODAL                                    */}
      {/* ============================================================ */}
      {isDeleteModalOpen && deletingCommunity && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0D1528] border border-[#173541] rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Delete Community?</h3>
                <p className="text-xs text-[#AAB5CC] mt-0.5">
                  Are you sure you want to delete <span className="text-white font-bold">"{deletingCommunity.name}"</span>?
                </p>
              </div>
            </div>

            <p className="text-xs text-[#AAB5CC] leading-relaxed bg-[#050A1A] p-3 rounded-xl border border-[#173541]">
              This action will remove the community from your Active Community list and the public directory.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#173541]">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                className="px-5 py-2.5 bg-[#111A2D] hover:bg-[#173541] text-[#AAB5CC] hover:text-white font-bold rounded-xl text-xs transition-all"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl text-xs transition-all shadow-lg shadow-red-500/20"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
