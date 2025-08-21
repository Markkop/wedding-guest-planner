import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
      <p className="text-gray-600 mb-4">Sorry, we couldn&apos;t find the page you&apos;re looking for.</p>
      <Link href="/" className="text-indigo-600 hover:text-indigo-800 underline">
        Go back home
      </Link>
    </div>
  );
}