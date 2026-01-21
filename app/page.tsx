import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-3xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">자산 계산기 모음</h1>
          <p className="mt-2 text-sm text-gray-600">
            원하는 계산기를 선택하세요.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/retire"
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 hover:ring-gray-400"
          >
            <div className="text-lg font-semibold">은퇴 시점 계산</div>
            <div className="mt-1 text-sm text-gray-600">
              목표 자산 도달 시점 예상하기
            </div>
          </Link>

          <Link
            href="/forecast"
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 hover:ring-gray-400"
          >
            <div className="text-lg font-semibold">예상 자산 계산</div>
            <div className="mt-1 text-sm text-gray-600">
              납입 기간 후 자산 예상하기
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
