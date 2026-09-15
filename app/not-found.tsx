import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1>Page not found</h1>
      <p className="mt-4">
        That page does not exist. Try the <Link href="/">home page</Link> or{" "}
        <Link href="/programs">our programs</Link>.
      </p>
    </div>
  );
}
