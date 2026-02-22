interface PreviewSectionProps {
  title?: string;
  body?: string;
}

export function PreviewSection({ title = "", body = "" }: PreviewSectionProps) {
  const hasContent = title.trim() || body.trim();

  return (
    <section
      className="rounded-2xl p-6 lg:p-8"
      style={{ background: "linear-gradient(180deg, #C21C15 0%, #4C50D5 100%)" }}
    >
      <h3 className="text-white font-semibold mb-4">Preview</h3>
      <div className="bg-white/95 rounded-xl p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-[280px]">
          {hasContent ? (
            <div className="space-y-3">
              <div className="font-semibold text-gray-900 text-sm truncate">{title || "Notification title"}</div>
              <p className="text-sm text-gray-600 line-clamp-4">{body || "Notification body..."}</p>
            </div>
          ) : (
            <>
              <div className="w-full h-40 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <div className="text-6xl">✨</div>
              </div>
              <p className="text-center text-sm text-gray-600 mb-4">Compose something first to see the preview</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
