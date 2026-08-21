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
import { createClient } from '@/lib/supabase/client';
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

const uploadImageFile = async (file: File, folderPrefix: string): Promise<string> => {
  const supabase = createClient();
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${folderPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
  const filePath = `${folderPrefix}/${fileName}`;

  try {
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      if (publicUrl) {
        let validUrl = publicUrl;
        if (validUrl.includes('/storage/v1/object/') && !validUrl.includes('/storage/v1/object/public/')) {
          validUrl = validUrl.replace('/storage/v1/object/', '/storage/v1/object/public/');
        }
        return validUrl;
      }
    }
  } catch (err) {
    console.warn('[STORAGE UPLOAD WARNING]', err);
  }

  // Persistent Fallback: Convert to Base64 Data URL so image is permanently saved in Supabase DB
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
};

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
  const [limitErrorMsg, setLimitErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

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
    setLimitErrorMsg('');
    if (communities.length >= 2) {
      setLimitErrorMsg('You can create a maximum of 2 communities.');
      return;
    }
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
      let finalProfileUrl = profileImagePreview;
      let finalCoverUrl = coverImagePreview;

      // 1. Upload Profile Image file if newly selected
      if (profileImageFile) {
        try {
          finalProfileUrl = await uploadImageFile(profileImageFile, 'comm_profile');
        } catch (uploadErr: any) {
          setErrorMsg('Failed to upload profile image. Please try again.');
          setIsSubmitting(false);
          return;
        }
      } else if (finalProfileUrl && finalProfileUrl.startsWith('blob:')) {
        finalProfileUrl = '';
      }

      // 2. Upload Cover Image file if newly selected
      if (coverImageFile) {
        try {
          finalCoverUrl = await uploadImageFile(coverImageFile, 'comm_cover');
        } catch (uploadErr: any) {
          setErrorMsg('Failed to upload cover image. Please try again.');
          setIsSubmitting(false);
          return;
        }
      } else if (finalCoverUrl && finalCoverUrl.startsWith('blob:')) {
        finalCoverUrl = '';
      }

      if (editingCommunityId) {
        // UPDATE EXISTING COMMUNITY
        const res = await updateCommunityAction({
          id: editingCommunityId,
          name: name.trim(),
          bio: bio.trim(),
          profileImage: finalProfileUrl,
          coverImage: finalCoverUrl
        });

        if (res.error) {
          setErrorMsg(res.error);
          setIsSubmitting(false);
          return;
        }

        const updatedComm = res.community;
        const updatedList = communities.map(c => {
          if (c.id === editingCommunityId) {
            return {
              ...c,
              name: name.trim(),
              bio: bio.trim(),
              profileImage: updatedComm?.profileImage || finalProfileUrl || c.profileImage,
              coverImage: updatedComm?.coverImage || finalCoverUrl || c.coverImage
            };
          }
          return c;
        });

        saveCommunitiesToState(updatedList);
        setSuccessMsg('✓ Community Updated Successfully!');
      } else {
        // CREATE NEW COMMUNITY
        if (communities.length >= 2) {
          setErrorMsg('You can create a maximum of 2 communities.');
          setIsSubmitting(false);
          return;
        }

        const res = await createCommunityAction({
          name: name.trim(),
          bio: bio.trim(),
          profileImage: finalProfileUrl,
          coverImage: finalCoverUrl
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
          profileImage: finalProfileUrl || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=300&q=80',
          coverImage: finalCoverUrl || 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
          createdAt: new Date().toISOString(),
          membersCount: 1
        };

        const updatedList = [newComm, ...communities];
        saveCommunitiesToState(updatedList);
        setIsSubmitting(false);
        handleCloseModal();

        // Show Created Successfully Animation Overlay ONLY after successful database save
        setShowSuccessAnimation(true);
        setTimeout(() => {
          setShowSuccessAnimation(false);
        }, 2200);
        return;
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
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <button
            type="button"
            onClick={handleCloseViewPanel}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-orange-500" />
            <span>Back</span>
          </button>
        </div>

        {/* COMMUNITY BANNER & INFO HEADER CARD */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm space-y-0 text-slate-900">
          <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
            <img 
              src={viewingCommunity.coverImage} 
              alt={viewingCommunity.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />
          </div>

          <div className="px-6 pb-6 relative space-y-4">
            <div className="-mt-12 flex items-end justify-between">
              <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white overflow-hidden shadow-md shrink-0">
                <img 
                  src={viewingCommunity.profileImage} 
                  alt={viewingCommunity.name} 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-black bg-orange-500 text-white shadow-sm">
                  Active Community
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900">{viewingCommunity.name}</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">{viewingCommunity.bio}</p>
            </div>
          </div>
        </div>

        {/* COMMUNITY MEMBERS SECTION */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-sm text-slate-900">
          
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-orange-500" />
              <h3 className="text-base font-black text-slate-900">Community Members</h3>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-50 text-orange-600 border border-slate-200">
              {loadingMembers ? 'Loading...' : `${memberCount} Members`}
            </span>
          </div>

          {/* LOADING STATE */}
          {loadingMembers ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" />
              <p className="text-xs text-slate-500 font-bold">Loading community members...</p>
            </div>
          ) : communityMembers.length === 0 ? (
            /* CLEAN EMPTY STATE */
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">No members have joined this community yet.</h4>
                <p className="text-xs text-slate-500">When players or scorers join this community, they will appear here automatically.</p>
              </div>
            </div>
          ) : (
            /* REAL MEMBER DIRECTORY GRID */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {communityMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm hover:border-orange-400 transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-700 text-sm">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.fullName} className="w-full h-full object-cover" />
                    ) : (
                      member.fullName.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  <div className="space-y-0.5 min-w-0 flex-1">
                    <h4 className="text-xs font-black text-slate-900 truncate">{member.fullName}</h4>
                    {member.username && (
                      <span className="text-[10px] text-slate-500 block truncate">@{member.username}</span>
                    )}
                    <span className="text-[9px] font-extrabold text-orange-600 uppercase tracking-wider block">
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
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            Community Create
          </h2>
        </div>

        {/* PROMINENT PLUS BUTTON FOR MASTER USERS */}
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl text-xs shadow-sm transition-all uppercase tracking-wider group"
          title="Create New Community"
        >
          <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <span className="hidden sm:inline">Create Community</span>
        </button>
      </div>

      {limitErrorMsg && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{limitErrorMsg}</span>
        </div>
      )}

      {/* CREATED COMMUNITIES LIST GRID WITH VIEW, EDIT & DELETE CONTROLS */}
      {communities.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Active Communities Created Yet</h3>
            <p className="text-xs text-slate-500">Click the + Plus button above to create your first community.</p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-black rounded-xl text-xs hover:bg-orange-600 transition-all shadow-sm"
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
              className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:border-orange-400 transition-all group flex flex-col justify-between"
            >
              <div>
                {/* COVER IMAGE */}
                <div className="relative h-28 sm:h-32 w-full bg-slate-100 overflow-hidden">
                  <img 
                    src={comm.coverImage} 
                    alt={`${comm.name} Cover`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20" />
                </div>

                {/* PROFILE IMAGE & DETAILS */}
                <div className="px-3.5 pb-3.5 sm:px-5 sm:pb-5 relative space-y-2 sm:space-y-3">
                  <div className="-mt-7 sm:-mt-10 flex items-end justify-between">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white border-3 sm:border-4 border-white overflow-hidden shadow-md shrink-0">
                      <img 
                        src={comm.profileImage} 
                        alt={comm.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 pt-0.5 sm:pt-1">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-orange-600 transition-colors truncate sm:whitespace-normal">
                      {comm.name}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                      {comm.bio}
                    </p>
                  </div>
                </div>
              </div>

              {/* FOOTER ACTIONS: VIEW, EDIT & DELETE */}
              <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                
                {/* VIEW BUTTON */}
                <button
                  type="button"
                  onClick={() => handleOpenViewPanel(comm)}
                  className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
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
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-orange-500 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    title="Edit Community"
                  >
                    <Pencil className="w-3.5 h-3.5 text-orange-500" />
                    <span>Edit</span>
                  </button>

                  {/* DELETE BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleOpenDeleteModal(comm)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0 relative max-h-[92vh] sm:max-h-[90vh] flex flex-col my-auto text-slate-900">
            
            {/* MODAL HEADER */}
            <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                  {editingCommunityId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingCommunityId ? 'Edit Community' : 'Create Community'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingCommunityId ? 'Update your community details.' : 'Fill in the community details below.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* FORM BODY (COMPACT ON MOBILE - IMAGE 1 REFERENCE) */}
            <form onSubmit={handleSubmitCommunity} className="p-3.5 sm:p-5 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
              
              {/* FEEDBACK MESSAGES */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 text-xs font-extrabold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* COVER IMAGE UPLOAD WITH PREVIEW */}
              <div className="space-y-1.5">
                <label className="text-[11px] sm:text-xs font-extrabold text-orange-600 uppercase tracking-wider block">
                  Cover Image
                </label>
                <div 
                  onClick={() => coverInputRef.current?.click()}
                  className="relative h-20 sm:h-28 w-full rounded-xl sm:rounded-2xl border-2 border-dashed border-slate-200 hover:border-orange-500 bg-slate-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group"
                >
                  {coverImagePreview ? (
                    <img src={coverImagePreview} alt="Cover Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center space-y-0.5 p-2">
                      <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-slate-400 group-hover:text-orange-500 transition-colors" />
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500 block">Click to upload Cover Image</span>
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
              <div className="space-y-1.5">
                <label className="text-[11px] sm:text-xs font-extrabold text-orange-600 uppercase tracking-wider block">
                  Profile Image
                </label>
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => profileInputRef.current?.click()}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 border-dashed border-slate-200 hover:border-orange-500 bg-slate-50 flex items-center justify-center cursor-pointer overflow-hidden shrink-0 group transition-all"
                  >
                    {profileImagePreview ? (
                      <img src={profileImagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-orange-500 transition-colors" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => profileInputRef.current?.click()}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
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
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-extrabold text-orange-600 uppercase tracking-wider block">
                  Community Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter community name (e.g. Royal Cricket Club)"
                  className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl text-xs font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              {/* BIO FIELD (REQUIRED) */}
              <div className="space-y-1">
                <label className="text-[11px] sm:text-xs font-extrabold text-orange-600 uppercase tracking-wider block">
                  Bio *
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your community, guidelines, activities, and goals..."
                  className="w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-50 border border-slate-200 focus:border-orange-500 rounded-xl text-xs font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400 resize-none"
                  required
                />
              </div>

              {/* FORM ACTION BUTTONS */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all uppercase tracking-wider"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative text-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Delete Community?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to delete <span className="text-slate-900 font-bold">"{deletingCommunity.name}"</span>?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              This action will remove the community from your Active Community list and the public directory.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs transition-all shadow-sm"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATED SUCCESSFULLY ANIMATION OVERLAY */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white border border-orange-200 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl text-slate-900">
            <div className="w-16 h-16 mx-auto rounded-full bg-orange-50 border-2 border-orange-500 flex items-center justify-center text-orange-600">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">Created Successfully</h3>
              <p className="text-xs text-slate-500">Your community has been saved successfully.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
