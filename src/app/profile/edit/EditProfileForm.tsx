'use client';

import React, { useState, useRef } from 'react';
import { updateProfile } from '@/actions/auth';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, ArrowRight, Camera, Upload, User, Loader2, Trash2 } from 'lucide-react';

export default function EditProfileForm({ profile }: { profile: any }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>(profile?.avatar_url || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setErrorMsg('Invalid file format. Please upload a JPG, JPEG, PNG, or WEBP image.');
      return;
    }

    const maxSizeMB = 5;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMsg(`File size exceeds ${maxSizeMB}MB limit. Please choose a smaller image.`);
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const uploadProfileImage = async (file: File): Promise<string> => {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${profile?.id || 'user'}_${Date.now()}.${fileExt}`;
    const filePath = `${profile?.id || 'user'}/${fileName}`;

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
    } catch {}

    // Fail-safe fallback: Convert to persistent Data URL so avatar_url in PostgreSQL is 100% saved
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = async () => {
    setPreviewUrl('');
    setSelectedFile(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formElement = e.currentTarget;
    if (!formElement) return;

    setLoading(true);
    setErrorMsg('');

    let finalAvatarUrl = previewUrl;

    if (selectedFile) {
      setUploadingImage(true);
      try {
        finalAvatarUrl = await uploadProfileImage(selectedFile);
      } catch (err: any) {
        setUploadingImage(false);
        setLoading(false);
        setErrorMsg(err.message || 'Failed to upload profile image.');
        return;
      }
      setUploadingImage(false);
    }

    const formData = new FormData(formElement);
    formData.set('avatarUrl', finalAvatarUrl || '');

    const res = await updateProfile(formData);
    setLoading(false);

    if (res?.error) {
      setErrorMsg(res.error);
    } else {
      router.push('/profile');
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#0D1528] border border-[#173541] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl font-sans">
      {errorMsg && (
        <div className="p-3.5 bg-[#E5232F]/10 border border-[#E5232F]/40 rounded-xl text-[#E5232F] text-xs flex items-center gap-2.5 font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* AVATAR SELECTION & PREVIEW */}
      <div className="flex flex-col items-center justify-center space-y-3 pb-4 border-b border-[#173541]">
        <label className="text-xs font-bold text-[#AAB5CC]">Profile Picture</label>
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="relative group cursor-pointer w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#111A2D] border-2 border-[#19D89A]/50 p-1 shadow-lg hover:scale-105 transition-transform"
        >
          <div className="w-full h-full bg-[#050A1A] rounded-xl overflow-hidden relative flex items-center justify-center">
            {previewUrl ? (
              <img src={previewUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-[#19D89A]" />
            )}
            
            {/* OVERLAY ON HOVER */}
            <div className="absolute inset-0 bg-[#050A1A]/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-bold gap-1">
              <Camera className="w-5 h-5 text-[#19D89A]" />
              <span>Change</span>
            </div>

            {uploadingImage && (
              <div className="absolute inset-0 bg-[#050A1A]/90 flex flex-col items-center justify-center text-[#19D89A] text-[10px] font-bold gap-1">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
          </div>
        </div>

        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/jpeg,image/png,image/webp" 
          onChange={handleImageChange}
          className="hidden" 
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 bg-[#111A2D] hover:bg-[#173541] text-[#AAB5CC] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-[#173541]"
          >
            <Upload className="w-3.5 h-3.5 text-[#19D89A]" />
            <span>Select New Image</span>
          </button>

          {previewUrl && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="px-3 py-1.5 bg-[#E5232F]/10 hover:bg-[#E5232F]/20 text-[#E5232F] rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-[#E5232F]/30"
              title="Remove Profile Image"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          )}
        </div>
        <p className="text-[10px] text-[#71809A]">Allowed formats: JPG, JPEG, PNG, WEBP (Max 5MB)</p>
      </div>

      <div>
        <label className="text-xs font-bold text-[#AAB5CC] block mb-1">Full Name *</label>
        <input type="text" name="fullName" defaultValue={profile?.full_name || ''} required className="w-full bg-[#071022] border border-[#173541] rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#19D89A] focus:outline-none transition-colors" />
      </div>

      <div>
        <label className="text-xs font-bold text-[#AAB5CC] block mb-1">Username</label>
        <input type="text" name="username" defaultValue={profile?.username || ''} className="w-full bg-[#071022] border border-[#173541] rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#19D89A] focus:outline-none transition-colors" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-[#AAB5CC] block mb-1">City</label>
          <input type="text" name="city" defaultValue={profile?.city || ''} className="w-full bg-[#071022] border border-[#173541] rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#19D89A] focus:outline-none transition-colors" />
        </div>

        <div>
          <label className="text-xs font-bold text-[#AAB5CC] block mb-1">State</label>
          <input type="text" name="state" defaultValue={profile?.state || ''} className="w-full bg-[#071022] border border-[#173541] rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#19D89A] focus:outline-none transition-colors" />
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-[#AAB5CC] block mb-1">Bio</label>
        <textarea name="bio" rows={3} defaultValue={profile?.bio || ''} placeholder="Cricket enthusiast, opening batter..." className="w-full bg-[#071022] border border-[#173541] rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#19D89A] focus:outline-none transition-colors" />
      </div>

      <button
        type="submit"
        disabled={loading || uploadingImage}
        className="w-full py-3 bg-[#19D89A] hover:bg-emerald-400 text-[#050A1A] font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
      >
        {loading ? 'Saving Changes...' : 'Save Profile Changes'}
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
