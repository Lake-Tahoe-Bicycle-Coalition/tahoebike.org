/** A responsive 16:9 YouTube player using the privacy-enhanced (no-cookie) domain. */
export function YouTubeEmbed({ id, title }: { id: string; title: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-asphalt">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full border-0"
      />
    </div>
  );
}
