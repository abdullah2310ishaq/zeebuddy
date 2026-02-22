'use client';

import { useState, useEffect } from 'react';
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

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventScheduledPublicity, setEventScheduledPublicity] = useState('');
  const [eventMedia, setEventMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    console.log('[Event:Edit] Loading event for edit:', id);
    apiFetch<{
      title: string;
      description: string;
      date: string;
      time: string;
      location: string;
      media: MediaItem[];
      scheduledAt?: string;
    }>(`/admin/content/events/${id}`).then((res) => {
      if (res.success && res.data) {
        const e = res.data;
        console.log('[Event:Edit] Event loaded:', {
          title: e.title,
          mediaCount: e.media?.length ?? 0,
          media: e.media?.map((m) => ({ url: m.url?.slice?.(0, 50), type: m.type })),
        });
        setEventTitle(e.title);
        setEventDescription(e.description || '');
        setEventDate(e.date ? new Date(e.date).toISOString().split('T')[0] : '');
        setEventTime(e.time || '');
        setEventLocation(e.location || '');
        setEventMedia(e.media || []);
        setEventScheduledPublicity(e.scheduledAt ? new Date(e.scheduledAt).toISOString().slice(0, 16) : '');
      } else {
        console.log('[Event:Edit] Load failed:', res.error);
      }
      setLoading(false);
    });
  }, [id]);

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
      formData.append('folder', 'events');
      formData.append('type', type);
      const res = await apiUpload<{ url: string; publicId: string }>('/upload', formData);
      if (res.success && res.data) {
        setEventMedia((prev) => [...prev, { url: res.data!.url, type: type as 'image' | 'video', publicId: res.data!.publicId }]);
      } else {
        setError(res.error || 'Upload failed');
        break;
      }
    }
    setUploading(false);
    e.target.value = '';
  };

  const removeMedia = (index: number) => setEventMedia((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!eventTitle.trim()) { setError('Event title is required'); return; }
    if (!eventDate) { setError('Event date is required'); return; }
    if (!eventTime.trim()) { setError('Event time is required'); return; }
    if (!eventLocation.trim()) { setError('Event location is required'); return; }
    if (eventMedia.length === 0) { setError('At least one image or video is required'); return; }
    setSubmitting(true);
    const mediaPayload = eventMedia.map((m) => ({ url: m.url, type: m.type, publicId: m.publicId }));

    console.log('[Event:Edit] Client sending:', {
      id,
      mediaCount: mediaPayload.length,
      media: mediaPayload.map((m) => ({ url: m.url?.slice?.(0, 60), type: m.type })),
    });

    const res = await apiFetch(`/admin/content/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        date: eventDate,
        time: eventTime,
        location: eventLocation.trim(),
        media: mediaPayload,
        scheduledAt: eventScheduledPublicity || undefined,
      }),
    });
    setSubmitting(false);
    if (res.success) {
      console.log('[Event:Edit] Success');
      window.dispatchEvent(new CustomEvent('post-created'));
      router.push(`/content-management/events/${id}`);
    } else {
      console.log('[Event:Edit] Failed:', res.error);
      setError(res.error || 'Failed to update');
    }
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
                <Link href={`/content-management/events/${id}`} className="text-gray-600 hover:text-gray-900">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <h1 className="text-2xl font-bold text-black">Edit Event</h1>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gray-50">
              <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
                {error && <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">{error}</div>}
                <div className="space-y-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <Input label="Event title" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Enter event title" required fullWidth className="bg-white text-black placeholder:text-gray-600 border-2 border-black focus:ring-red-500 focus:border-black" />
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">Description</label>
                    <textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} placeholder="Describe the event..." rows={3} className="w-full rounded-lg border-2 border-black bg-white px-4 py-3 text-sm font-medium text-black placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-black" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">Event image <span className="text-red-600">*</span></label>
                    <div className="flex flex-wrap gap-3 mb-3">
                      {eventMedia.map((m, i) => (
                        <div key={i} className="relative group">
                          {m.type === 'image' ? <img src={m.url} alt="" className="w-24 h-24 object-cover rounded-xl border-2 border-black" /> : <video src={m.url} className="w-24 h-24 object-cover rounded-xl border-2 border-black" muted />}
                          <button type="button" onClick={() => removeMedia(i)} className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white rounded-full text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">×</button>
                        </div>
                      ))}
                    </div>
                    <label className="inline-flex items-center gap-2 px-5 py-3 border-2 border-dashed border-black rounded-xl cursor-pointer hover:border-red-600 hover:bg-red-50 transition-colors text-sm font-medium text-black bg-white">
                      <input type="file" accept="image/*,video/*" multiple onChange={handleFileChange} disabled={uploading} className="sr-only" />
                      {uploading ? 'Uploading...' : '+ Add image or video'}
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required fullWidth className="bg-white text-black border-2 border-black focus:ring-red-500 focus:border-black" />
                    <Input label="Time" type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} required fullWidth className="bg-white text-black border-2 border-black focus:ring-red-500 focus:border-black" />
                  </div>
                  <Input label="Location" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Event location" required fullWidth className="bg-white text-black placeholder:text-gray-600 border-2 border-black focus:ring-red-500 focus:border-black" />
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">Schedule event publicity (optional)</label>
                    <input type="datetime-local" value={eventScheduledPublicity} onChange={(e) => setEventScheduledPublicity(e.target.value)} className="w-full h-11 rounded-lg border-2 border-black bg-white px-4 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-black" />
                  </div>
                </div>
                <div className="flex gap-4 pt-2">
                  <Button type="button" variant="secondary" onClick={() => router.back()} className="flex-1 h-12 font-semibold">Cancel</Button>
                  <Button type="submit" isLoading={submitting} disabled={uploading || eventMedia.length === 0} className="flex-1 h-12 font-semibold bg-red-600 hover:bg-red-700">Save changes</Button>
                </div>
              </form>
            </div>
          </div>
        </MainContent>
      </MainLayout>
    </ProtectedLayout>
  );
}
