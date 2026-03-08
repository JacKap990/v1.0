
export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <h2 className="text-4xl font-black text-slate-800 mb-4">הדף לא נמצא</h2>
            <p className="text-slate-600 mb-8">מצטערים, לא הצלחנו למצוא את הדף שחיפשתם.</p>
            <a
                href="/"
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
            >
                חזרה לדף הבית
            </a>
        </div>
    );
}
