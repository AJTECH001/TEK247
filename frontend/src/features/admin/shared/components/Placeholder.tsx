export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center text-gray-500 mb-4">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">{title} Section</h2>
      <p className="text-gray-500 text-sm max-w-xs">This operational module is currently under active development as part of the platform expansion.</p>
    </div>
  );
}
