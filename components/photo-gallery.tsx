import Image from "next/image";

export type Photo = {
  /** Path under /public, e.g. /images/2022/05/Lakeview-Valet.jpg */
  src: string;
  alt: string;
};

type Props = {
  photos: Photo[];
  /** Visually hidden heading that names the section for assistive technology. */
  heading?: string;
};

/** A simple responsive grid of photos, cropped to a uniform aspect ratio. */
export function PhotoGallery({ photos, heading = "Photos" }: Props) {
  if (photos.length === 0) return null;

  return (
    <section aria-labelledby="photo-gallery-heading">
      <h2 id="photo-gallery-heading" className="sr-only">
        {heading}
      </h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {photos.map((photo) => (
          <li
            key={photo.src}
            className="relative aspect-[4/3] overflow-hidden rounded-md bg-neutral-100"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="object-cover"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
