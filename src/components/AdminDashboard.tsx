import { BadgeCheck, Check, Loader2, Search, Shield, UserCheck, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { User, VerificationRequest } from "../types";
import { adminReviewVerificationReal, adminUpdateUserReal, loadAdminDashboardReal } from "../lib/supabaseData";
import { formatDate } from "../utils/posts";
import { VerifiedBadge } from "./VerifiedBadge";

type Props = {
  currentUser?: User;
  onClose: () => void;
};

export function AdminDashboard({ currentUser, onClose }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<User | undefined>();
  const [editUsername, setEditUsername] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");

  const isAdmin = Boolean(currentUser?.isAdmin && currentUser.username.toLowerCase() === "anti" && !currentUser.banned);

  const load = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    try {
      setError("");
      const data = await loadAdminDashboardReal();
      setUsers(data.users);
      setVerificationRequests(data.verificationRequests);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      user.username.toLowerCase().includes(query) ||
      user.displayName.toLowerCase().includes(query) ||
      user.id.toLowerCase().includes(query)
    );
  }, [search, users]);

  const openEdit = (user: User) => {
    setEditing(user);
    setEditUsername(user.username);
    setEditDisplayName(user.displayName);
  };

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    try {
      setStatus("");
      setError("");
      const updated = await adminUpdateUserReal(editing.id, {
        username: editUsername,
        displayName: editDisplayName
      });
      setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)));
      setEditing(undefined);
      setStatus("User updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update user.");
    }
  };

  const setVerified = async (user: User, verified: boolean) => {
    try {
      setError("");
      const updated = await adminUpdateUserReal(user.id, { verified });
      setUsers((current) => current.map((candidate) => (candidate.id === updated.id ? updated : candidate)));
      setStatus(verified ? "Verification granted." : "Verification removed.");
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Could not update verification.");
    }
  };

  const setBanned = async (user: User, banned: boolean) => {
    try {
      setError("");
      const updated = await adminUpdateUserReal(user.id, { banned });
      setUsers((current) => current.map((candidate) => (candidate.id === updated.id ? updated : candidate)));
      setStatus(banned ? "User banned." : "User unbanned.");
    } catch (banError) {
      setError(banError instanceof Error ? banError.message : "Could not update ban state.");
    }
  };

  const reviewVerification = async (request: VerificationRequest, nextStatus: "approved" | "rejected") => {
    try {
      setError("");
      const updatedRequest = await adminReviewVerificationReal(request.id, nextStatus);
      setVerificationRequests((current) => current.map((item) => (item.id === updatedRequest.id ? updatedRequest : item)));
      if (nextStatus === "approved") {
        setUsers((current) => current.map((user) => (user.id === request.userId ? { ...user, verified: true } : user)));
      }
      setStatus(nextStatus === "approved" ? "Verification approved." : "Verification rejected.");
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Could not review request.");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-[#f5f5f7] text-slate-950 dark:bg-[#050505] dark:text-white">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#007aff]/10 text-[#007aff]">
            <Shield size={20} />
          </span>
          <div>
            <p className="font-black">Creator Dashboard</p>
            <p className="text-xs text-slate-500">Restricted admin tools</p>
          </div>
        </div>
        <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close dashboard">
          <X size={20} />
        </button>
      </header>

      {!isAdmin ? (
        <main className="grid h-[calc(100dvh-68px)] place-items-center p-6">
          <section className="max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-glass dark:border-white/10 dark:bg-[#111113]">
            <Shield className="mx-auto text-rose-500" size={34} />
            <h1 className="mt-3 text-xl font-black">Access denied</h1>
            <p className="mt-2 text-sm text-slate-500">This dashboard is only available to the verified CONNECT admin account.</p>
          </section>
        </main>
      ) : (
        <main className="thin-scrollbar h-[calc(100dvh-68px)] overflow-y-auto p-4 pb-[max(24px,env(safe-area-inset-bottom))]">
          <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1fr_380px]">
            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-glass dark:border-white/10 dark:bg-[#111113]">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl font-black">Users</h1>
                  <p className="text-sm text-slate-500">{users.length} profiles</p>
                </div>
                <label className="relative block sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 w-full rounded-2xl border border-slate-200 bg-transparent pl-9 pr-3 text-sm outline-none focus:border-[#007aff] dark:border-white/10" placeholder="Search users" />
                </label>
              </div>
              {loading ? <p className="flex items-center gap-2 rounded-2xl bg-slate-100 p-4 text-sm font-semibold dark:bg-white/10"><Loader2 className="animate-spin" size={16} /> Loading users...</p> : null}
              <div className="grid gap-2">
                {filteredUsers.map((user) => (
                  <article key={user.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 dark:border-white/10">
                    <img className="h-11 w-11 rounded-full object-cover" src={user.avatarUrl} alt="" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 truncate text-sm font-bold">{user.displayName}<VerifiedBadge verified={user.verified} size={14} />{user.isAdmin ? <Shield size={13} className="text-[#007aff]" /> : null}</p>
                      <p className="truncate text-xs text-slate-500">@{user.username} · {formatDate(user.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1">
                      <button onClick={() => openEdit(user)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold dark:border-white/10">Edit</button>
                      <button onClick={() => void setVerified(user, !user.verified)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold dark:border-white/10">{user.verified ? "Unverify" : "Verify"}</button>
                      <button onClick={() => void setBanned(user, !user.banned)} className={`rounded-xl px-3 py-2 text-xs font-bold ${user.banned ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>{user.banned ? "Unban" : "Ban"}</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="space-y-4">
              {(status || error) ? (
                <p className={`rounded-2xl p-3 text-sm font-semibold ${error ? "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-200" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200"}`}>
                  {error || status}
                </p>
              ) : null}
              <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-glass dark:border-white/10 dark:bg-[#111113]">
                <h2 className="text-lg font-black">Verification Requests</h2>
                <div className="mt-3 space-y-2">
                  {verificationRequests.map((request) => (
                    <article key={request.id} className="rounded-2xl border border-slate-100 p-3 dark:border-white/10">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">{request.displayName}</p>
                          <p className="text-xs text-slate-500">@{request.username} · {request.status}</p>
                        </div>
                        <BadgeCheck size={18} className={request.status === "approved" ? "text-[#007aff]" : request.status === "rejected" ? "text-rose-500" : "text-amber-500"} />
                      </div>
                      {request.reason ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{request.reason}</p> : null}
                      {request.status === "pending" ? (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button onClick={() => void reviewVerification(request, "approved")} className="flex items-center justify-center gap-1 rounded-xl bg-[#007aff] px-3 py-2 text-xs font-bold text-white"><Check size={14} /> Approve</button>
                          <button onClick={() => void reviewVerification(request, "rejected")} className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold dark:border-white/10"><X size={14} /> Reject</button>
                        </div>
                      ) : null}
                    </article>
                  ))}
                  {!verificationRequests.length ? <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-white/15">No requests yet.</p> : null}
                </div>
              </section>
            </aside>
          </div>
        </main>
      )}

      {editing ? (
        <div className="fixed inset-0 z-[90] grid place-items-end bg-slate-950/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
          <form onSubmit={saveEdit} className="w-full max-w-md rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-950 sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-black">Edit @{editing.username}</p>
              <button type="button" onClick={() => setEditing(undefined)} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10"><X size={18} /></button>
            </div>
            <label className="block text-sm font-bold">Display name</label>
            <input value={editDisplayName} onChange={(event) => setEditDisplayName(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none dark:border-white/10" />
            <label className="mt-4 block text-sm font-bold">Username</label>
            <input value={editUsername} onChange={(event) => setEditUsername(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-transparent px-4 py-3 outline-none dark:border-white/10" />
            <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
              <UserCheck size={16} /> Save changes
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
