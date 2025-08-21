export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
      <p className="text-gray-600 mb-4">Sorry, we couldn't find the page you're looking for.</p>
      <a href="/" className="text-indigo-600 hover:text-indigo-800 underline">
        Go back home
      </a>
    </div>
  );
}