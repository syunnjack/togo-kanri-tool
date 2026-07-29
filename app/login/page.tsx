import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="text-xl font-bold text-slate-900">togo-kanri-tool ログイン</h1>
      <form action={login} className="mt-6 flex flex-col gap-3">
        <input
          type="email"
          name="email"
          placeholder="メールアドレス"
          required
          className="rounded border border-slate-300 px-3 py-2"
        />
        <input
          type="password"
          name="password"
          placeholder="パスワード"
          required
          className="rounded border border-slate-300 px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">ログインに失敗しました。</p>}
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 font-bold text-white">
          ログイン
        </button>
      </form>
    </div>
  );
}
