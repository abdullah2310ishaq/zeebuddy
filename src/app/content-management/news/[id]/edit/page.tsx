'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedLayout } from '@/components/ProtectedLayout';
import { MainLayout } from '@/components/layout/MainLayout';
import { MainContent } from '@/components/layout/MainContent';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { apiFetch, apiUpload } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface MediaItem {
  url: string;
  type: 'image' | 'video';
  publicId?: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

export default function EditNewsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const categoryInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = useCallback(async () => {
    const res = await apiFetch<Category[]>('/categories');
    if (res.success && res.data) {
      setCategories(Array.isArray(res.data) ? res.data : []);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      apiFetch<{ title: string; content: string; media: MediaItem[]; categoryId: { _id: string }; scheduledAt?: string }>(`/admin/content/posts/${id}`),
      fetchCategories(),
    ]).then(([postRes]) => {
      if (postRes.success && postRes.data) {
        const p = postRes.data;
        setTitle(p.title);
        setContent(p.content || '');
        setMedia(p.media || []);
        setCategoryId(
          p.categoryId
            ? typeof p.categoryId === 'object' && p.categoryId !== null && '_id' in p.categoryId
              ? (p.categoryId as { _id: string })._id
              : String(p.categoryId)
            : ''
        );
        setScheduledAt(p.scheduledAt ? new Date(p.scheduledAt).toISOString().slice(0, 16) : '');
      }
      setLoading(false);
    });
  }, [id, fetchCategories]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    setError('');
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'posts');
      formData.append('type', type);
      const res = await apiUpload<{ url: string; publicId: string }>('/upload', formData);
      if (res.success && res.data) {
        setMedia((prev) => [...prev, { url: res.data!.url, type: type as 'image' | 'video', publicId: res.data!.publicId }]);
      } else {
        setError(res.error || 'Upload failed');
        break;
      }
    }
    setUploading(false);
    e.target.value = '';
  };

  const removeMedia = (index: number) => setMedia((prev) => prev.filter((_, i) => i !== index));

  const handleCategoryKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !categoryInput.trim()) return;
    e.preventDefault();
    const name = categoryInput.trim();
    const existing = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      setCategoryId(existing._id);
      setCategoryInput('');
      return;
    }
    const res = await apiFetch<Category>('/categories', { method: 'POST', body: JSON.stringify({ name }) });
    if (res.success && res.data) {
      setCategories((prev) => [...prev, res.data!]);
      setCategoryId(res.data!._id);
      setCategoryInput('');
    } else setError(res.error || 'Failed to create category');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('Title is required'); return; }
    if (!categoryId) { setError('Please select or create a category'); return; }
    setSubmitting(true);
    const res = await apiFetch(`/admin/content/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title: title.trim(), content: content.trim(), media, categoryId, scheduledAt: scheduledAt || undefined }),
    });
    setSubmitting(false);
    if (res.success) {
      window.dispatchEvent(new CustomEvent('post-created'));
      router.push(`/content-management/news/${id}`);
    } else setError(res.error || 'Failed to update');
  };

  if (loading) {
    return (
      <ProtectedLayout>
        <MainLayout>
          <MainContent>
            <div className="flex justify-center py-20">
              <div className="animate-spin w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full" />
            </div>
          </MainContent>
        </MainLayout>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <MainLayout>
        {!isMobile && <Sidebar />}
        {isMobile && <MobileSidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />}
        <MainContent>
          <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-6 lg:p-8 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <Link href={`/content-management/news/${id}`} className="text-gray-600 hover:text-gray-900">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <h1 className="text-2xl font-bold text-black">Edit News</h1>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gray-50">
              <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                {error && <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">{error}</div>}
                <div className="space-y-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="News title" required fullWidth className="bg-white text-black placeholder:text-gray-600 border-2 border-black focus:ring-red-500 focus:border-black" />
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">Content</label>
                    <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your news content..." rows={4} className="w-full rounded-lg border-2 border-black bg-white px-4 py-3 text-sm font-medium text-black placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-black" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">Media</label>
                    <div className="flex flex-wrap gap-3 mb-3">
                      {media.map((m, i) => (
                        <div key={i} className="relative group">
                          {m.type === 'image' ? <img src={m.url} alt="" className="w-24 h-24 object-cover rounded-xl border-2 border-black" /> : <video src={m.url} className="w-24 h-24 object-cover rounded-xl border-2 border-black" muted />}
                          <button type="button" onClick={() => removeMedia(i)} className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white rounded-full text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">×</button>
                        </div>
                      ))}
                    </div>
                    <label className="inline-flex items-center gap-2 px-5 py-3 border-2 border-dashed border-black rounded-xl cursor-pointer hover:border-red-600 hover:bg-red-50 transition-colors text-sm font-medium text-black bg-white">
                      <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange} disabled={uploading} className="sr-only" />
                      {uploading ? 'Uploading...' : '+ Add images or videos'}
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">Category *</label>
                    <div className="flex gap-3 flex-wrap">
                      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="h-11 rounded-lg border-2 border-black bg-white px-4 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-black min-w-[180px]">
                        <option value="">Select category</option>
                        {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                      <input ref={categoryInputRef} type="text" value={categoryInput} onChange={(e) => setCategoryInput(e.target.value)} onKeyDown={handleCategoryKeyDown} placeholder="Or type new and press Enter" className="flex-1 min-w-[200px] h-11 rounded-lg border-2 border-black bg-white px-4 text-sm font-medium text-black placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-black" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">Schedule publish (optional)</label>
                    <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full h-11 rounded-lg border-2 border-black bg-white px-4 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-black" />
                  </div>
                </div>
                <div className="flex gap-4 pt-2">
                  <Button type="button" variant="secondary" onClick={() => router.back()} className="flex-1 h-12 font-semibold">Cancel</Button>
                  <Button type="submit" isLoading={submitting} disabled={uploading} className="flex-1 h-12 font-semibold bg-red-600 hover:bg-red-700">Save changes</Button>
                </div>
              </form>
            </div>
          </div>
        </MainContent>
      </MainLayout>
    </ProtectedLayout>
  );
}
