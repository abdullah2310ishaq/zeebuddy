'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
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

type ProjectType = 'news' | 'event';

export default function CreateProjectPage() {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const categoryInputRef = useRef<HTMLInputElement>(null);

  const [projectType, setProjectType] = useState<ProjectType>('news');

  // News fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  // Event fields
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventScheduledPublicity, setEventScheduledPublicity] = useState('');
  const [eventMedia, setEventMedia] = useState<MediaItem[]>([]);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = useCallback(async () => {
    const res = await apiFetch<Category[]>('/categories');
    if (res.success && res.data) {
      const list = Array.isArray(res.data) ? res.data : [];
      setCategories(list);
      if (!categoryId && list.length) {
        setCategoryId(list[0]._id);
      }
    }
  }, [categoryId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleMenuToggle = () => setIsMobileSidebarOpen(!isMobileSidebarOpen);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, target: 'news' | 'event' = projectType) => {
    const files = e.target.files;
    if (!files?.length) return;

    const folder = target === 'event' ? 'events' : 'posts';
    setUploading(true);
    setError('');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const type = file.type.startsWith('video/') ? 'video' : 'image';

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('type', type);

      const res = await apiUpload<{ url: string; publicId: string }>('/upload', formData);

      if (res.success && res.data) {
        const item: MediaItem = {
          url: res.data!.url,
          type: type as 'image' | 'video',
          publicId: res.data!.publicId,
        };
        if (target === 'event') {
          setEventMedia((prev) => [...prev, item]);
        } else {
          setMedia((prev) => [...prev, item]);
        }
      } else {
        setError(res.error || 'Upload failed');
        break;
      }
    }

    setUploading(false);
    e.target.value = '';
  };

  const removeMedia = (index: number) => {
    if (projectType === 'event') {
      setEventMedia((prev) => prev.filter((_, i) => i !== index));
    } else {
      setMedia((prev) => prev.filter((_, i) => i !== index));
    }
  };

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

    const res = await apiFetch<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });

    if (res.success && res.data) {
      setCategories((prev) => [...prev, res.data!]);
      setCategoryId(res.data!._id);
      setCategoryInput('');
    } else {
      setError(res.error || 'Failed to create category');
    }
  };

  const handleSubmitNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!categoryId) {
      setError('Please select or create a category');
      return;
    }

    setSubmitting(true);

    const res = await apiFetch('/admin/content/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: title.trim(),
        content: content.trim(),
        media,
        categoryId,
        scheduledAt: scheduledAt || undefined,
      }),
    });

    setSubmitting(false);

    if (res.success) {
      window.dispatchEvent(new CustomEvent('post-created'));
      router.push('/content-management');
    } else {
      setError(res.error || 'Failed to create news');
    }
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!eventTitle.trim()) {
      setError('Event title is required');
      return;
    }
    if (!eventDate) {
      setError('Event date is required');
      return;
    }
    if (!eventTime.trim()) {
      setError('Event time is required');
      return;
    }
    if (!eventLocation.trim()) {
      setError('Event location is required');
      return;
    }
    if (eventMedia.length === 0) {
      setError('At least one image or video is required');
      return;
    }

    setSubmitting(true);

    const dateTime = new Date(`${eventDate}T${eventTime}`);
    if (isNaN(dateTime.getTime())) {
      setError('Invalid date or time');
      setSubmitting(false);
      return;
    }

    const mediaPayload = eventMedia.map((m) => ({ url: m.url, type: m.type, publicId: m.publicId }));
    const payload = {
      title: eventTitle.trim(),
      description: eventDescription.trim(),
      date: eventDate,
      time: eventTime,
      location: eventLocation.trim(),
      media: mediaPayload,
      scheduledAt: eventScheduledPublicity || undefined,
    };

    console.log('[Event:Create] Client sending:', {
      title: payload.title,
      mediaCount: mediaPayload.length,
      media: mediaPayload.map((m) => ({ url: m.url?.slice?.(0, 60), type: m.type })),
    });

    const res = await apiFetch('/admin/content/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setSubmitting(false);

    if (res.success) {
      console.log('[Event:Create] Success, response:', { id: (res.data as { _id?: string })?._id });
      window.dispatchEvent(new CustomEvent('post-created'));
      router.push('/content-management');
    } else {
      console.log('[Event:Create] Failed:', res.error);
      setError(res.error || 'Failed to create event');
    }
  };

  return (
    <ProtectedLayout>
      <MainLayout>
        {!isMobile && <Sidebar />}
        {isMobile && (
          <MobileSidebar
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
          />
        )}

        <MainContent>
          <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-6 lg:p-8 border-b border-gray-300 bg-white">
              <h1 className="text-2xl lg:text-3xl font-bold text-black">
                Create new project
              </h1>
              <button
                onClick={handleMenuToggle}
                className="lg:hidden p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gray-50">
              <form
                onSubmit={projectType === 'news' ? handleSubmitNews : handleSubmitEvent}
                className="max-w-2xl space-y-6"
              >
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <label className="block text-sm font-semibold text-black mb-2">
                    Type <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value as ProjectType)}
                    className="w-full h-11 rounded-lg border-2 border-black bg-white px-4 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-black"
                  >
                    <option value="news">News</option>
                    <option value="event">Event</option>
                  </select>
                </div>

                {projectType === 'news' && (
                  <div className="space-y-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <Input
                      label="Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter news title"
                      required
                      fullWidth
                      className="bg-white text-black placeholder:text-gray-600 border-2 border-black focus:ring-red-500 focus:border-black"
                    />

                    <div>
                      <label className="block text-sm font-semibold text-black mb-2">Content</label>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your news content..."
                        rows={4}
                        className="w-full rounded-lg border-2 border-black bg-white px-4 py-3 text-sm font-medium text-black placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-black mb-2">
                        Media (images & videos)
                      </label>
                      <div className="flex flex-wrap gap-3 mb-3">
                        {media.map((m, i) => (
                          <div key={i} className="relative group">
                            {m.type === 'image' ? (
                              <img src={m.url} alt="" className="w-24 h-24 object-cover rounded-xl border-2 border-gray-200" />
                            ) : (
                              <video src={m.url} className="w-24 h-24 object-cover rounded-xl border-2 border-gray-200" muted />
                            )}
                            <button
                              type="button"
                              onClick={() => removeMedia(i)}
                              className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white rounded-full text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <label className="inline-flex items-center gap-2 px-5 py-3 border-2 border-dashed border-black rounded-xl cursor-pointer hover:border-red-600 hover:bg-red-50 transition-colors text-sm font-medium text-black bg-white">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          onChange={handleFileChange}
                          disabled={uploading}
                          className="sr-only"
                        />
                        {uploading ? 'Uploading...' : '+ Add images or videos'}
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-black mb-2">
                        Category <span className="text-red-600">*</span>
                      </label>
                      <div className="flex gap-3 flex-wrap">
                        <select
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                          className="h-11 rounded-lg border-2 border-black bg-white px-4 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-black min-w-[180px]"
                        >
                          <option value="">Select category</option>
                          {categories.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <input
                          ref={categoryInputRef}
                          type="text"
                          value={categoryInput}
                          onChange={(e) => setCategoryInput(e.target.value)}
                          onKeyDown={handleCategoryKeyDown}
                          placeholder="Or type new category and press Enter"
                          className="flex-1 min-w-[200px] h-11 rounded-lg border-2 border-black bg-white px-4 text-sm font-medium text-black placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-black"
                        />
                      </div>
                      <p className="text-sm text-gray-700 mt-2">
                        Type a new category name and press Enter to add it
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-black mb-2">
                        Schedule publish (optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className="w-full h-11 rounded-lg border-2 border-black bg-white px-4 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-black"
                      />
                    </div>
                  </div>
                )}

                {projectType === 'event' && (
                  <div className="space-y-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <Input
                      label="Event title"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder="Enter event title"
                      required
                      fullWidth
                      className="bg-white text-black placeholder:text-gray-600 border-2 border-black focus:ring-red-500 focus:border-black"
                    />

                    <div>
                      <label className="block text-sm font-semibold text-black mb-2">Description</label>
                      <textarea
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        placeholder="Describe the event..."
                        rows={3}
                        className="w-full rounded-lg border-2 border-black bg-white px-4 py-3 text-sm font-medium text-black placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-black mb-2">
                        Event image <span className="text-red-600">*</span>
                      </label>
                      <div className="flex flex-wrap gap-3 mb-3">
                        {eventMedia.map((m, i) => (
                          <div key={i} className="relative group">
                            {m.type === 'image' ? (
                              <img src={m.url} alt="" className="w-24 h-24 object-cover rounded-xl border-2 border-black" />
                            ) : (
                              <video src={m.url} className="w-24 h-24 object-cover rounded-xl border-2 border-black" muted />
                            )}
                            <button
                              type="button"
                              onClick={() => removeMedia(i)}
                              className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white rounded-full text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <label className="inline-flex items-center gap-2 px-5 py-3 border-2 border-dashed border-black rounded-xl cursor-pointer hover:border-red-600 hover:bg-red-50 transition-colors text-sm font-medium text-black bg-white">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          onChange={(e) => handleFileChange(e, 'event')}
                          disabled={uploading}
                          className="sr-only"
                        />
                        {uploading ? 'Uploading...' : '+ Add image or video'}
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Date"
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        required
                        fullWidth
                        className="bg-white text-black placeholder:text-gray-600 border-2 border-black focus:ring-red-500 focus:border-black"
                      />
                      <Input
                        label="Time"
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        placeholder="e.g. 14:00"
                        required
                        fullWidth
                        className="bg-white text-black placeholder:text-gray-600 border-2 border-black focus:ring-red-500 focus:border-black"
                      />
                    </div>

                    <Input
                      label="Location"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder="Enter event location"
                      required
                      fullWidth
                      className="bg-white text-black placeholder:text-gray-600 border-2 border-black focus:ring-red-500 focus:border-black"
                    />

                    <div>
                      <label className="block text-sm font-semibold text-black mb-2">
                        Schedule event publicity (optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={eventScheduledPublicity}
                        onChange={(e) => setEventScheduledPublicity(e.target.value)}
                        className="w-full h-11 rounded-lg border-2 border-black bg-white px-4 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-black"
                      />
                      <p className="text-sm text-gray-700 mt-2">
                        When to publish/send the event announcement
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.back()}
                    className="flex-1 h-12 font-semibold text-gray-900 border-2 border-gray-300 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={submitting}
                    disabled={uploading || (projectType === 'event' && eventMedia.length === 0)}
                    className="flex-1 h-12 font-semibold bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
                  >
                    {projectType === 'news'
                      ? scheduledAt
                        ? 'Schedule news'
                        : 'Publish news'
                      : 'Create event'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </MainContent>
      </MainLayout>
    </ProtectedLayout>
  );
}
