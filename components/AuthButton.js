"use client";

export default function AuthButton({ user, onSignIn, onSignOut }) {
  if (!user) {
    return (
      <button
        onClick={onSignIn}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-void-600 bg-void-850 px-3 py-2 text-sm font-medium text-starlight-100 transition-colors hover:border-nebula-500/50 hover:bg-void-800"
      >
        <GoogleIcon />
        Sign in with Google
      </button>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url;
  const name = user.user_metadata?.full_name || user.email;

  return (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-7 w-7 rounded-full" referrerPolicy="no-referrer" />
      ) : (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-nebula-600 text-xs font-medium text-white">
          {name?.[0]?.toUpperCase() || "U"}
        </div>
      )}
      <span className="flex-1 truncate text-sm text-starlight-300">{name}</span>
      <button
        onClick={onSignOut}
        className="text-xs text-starlight-500 hover:text-starlight-100"
        title="Sign out"
      >
        Sign out
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.4-6.4C35.6 3 30.1 1 24 1 14.6 1 6.5 6.4 2.6 14.1l7.5 5.8C11.9 14 17.4 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.6c4.3-4 6.8-9.9 6.8-17.3z" />
      <path fill="#FBBC05" d="M10.1 19.9A14.5 14.5 0 0 0 9.3 24c0 1.4.3 2.9.8 4.1l-7.5 5.8A23.9 23.9 0 0 1 0 24c0-3.9.9-7.6 2.6-10.9z" />
      <path fill="#34A853" d="M24 47c6.1 0 11.6-2 15.3-5.6l-7.3-5.6c-2 1.4-4.6 2.2-8 2.2-6.6 0-12.1-4.5-14-10.4l-7.5 5.8C6.5 41.6 14.6 47 24 47z" />
    </svg>
  );
}
