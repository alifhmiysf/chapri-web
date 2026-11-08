
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Search } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";

import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../services/firebase/config";

import {
  listenToPrivateChats,
  type Chat,
} from "../../services/chat/chatService";

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

const PrivateChats = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [chats, setChats] = useState<Chat[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;

    const unsubscribe = listenToPrivateChats(
      user.uid,
      (data) => {
        setChats(data);
        setLoading(false);
        setError("");
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const loadProfiles = async () => {
      if (!user || chats.length === 0) return;

      const participantIds = [
        ...new Set(
          chats
            .map((chat) =>
              chat.participants.find((id) => id !== user.uid)
            )
            .filter((id): id is string => Boolean(id))
        ),
      ];

      const results = await Promise.all(
        participantIds.map(async (uid) => {
          try {
            const snapshot = await getDoc(doc(db, "users", uid));

            if (!snapshot.exists()) return null;

            const data = snapshot.data();

            return {
              uid,
              displayName: data.displayName || data.email || "Unknown User",
              email: data.email || "",
              photoURL: data.photoURL || undefined,
            } satisfies UserProfile;
          } catch (err) {
            console.error(`Failed to load profile ${uid}:`, err);
            return null;
          }
        })
      );

      if (cancelled) return;

      const profileMap: Record<string, UserProfile> = {};

      results.forEach((profile) => {
        if (profile) {
          profileMap[profile.uid] = profile;
        }
      });

      setProfiles(profileMap);
    };

    void loadProfiles();

    return () => {
      cancelled = true;
    };
  }, [chats, user]);

  const getOtherParticipant = (chat: Chat) => {
    return chat.participants.find((id) => id !== user?.uid) ?? "";
  };

  const getInitials = (name: string) => {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  };

  const filteredChats = chats.filter((chat) => {
    const uid = getOtherParticipant(chat);
    const profile = profiles[uid];

    const name = profile?.displayName || uid;

    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      (profile?.email || "").toLowerCase().includes(search.toLowerCase())
    );
  });

  
  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* HEADER SKELETON */}
        <header className="flex animate-pulse flex-wrap items-center justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="h-3 w-48 rounded bg-blue-100" />
            <div className="h-9 w-40 rounded-lg bg-slate-200" />
            <div className="h-3 w-64 max-w-full rounded bg-slate-100" />
          </div>

          <div className="w-32 rounded-xl border border-slate-200 bg-white p-4">
            <div className="h-3 w-20 rounded bg-slate-100" />
            <div className="mt-3 h-6 w-8 rounded bg-slate-200" />
          </div>
        </header>

        {/* SEARCH SKELETON */}
        <div className="h-12 animate-pulse rounded-xl border border-slate-200 bg-white">
          <div className="m-4 h-3 w-36 rounded bg-slate-100" />
        </div>

        {/* CONVERSATION LIST SKELETON */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="h-5 w-44 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-3 w-56 max-w-full animate-pulse rounded bg-slate-100" />
          </div>

          <div className="divide-y divide-slate-100">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="flex animate-pulse items-center gap-4 px-5 py-4"
              >
                {/* AVATAR */}
                <div className="h-12 w-12 flex-shrink-0 rounded-full bg-blue-50" />

                {/* USER INFORMATION */}
                <div className="min-w-0 flex-1 space-y-2">
                  <div
                    className={`h-4 rounded bg-slate-200 ${
                      item % 2 === 0 ? "w-32" : "w-40"
                    }`}
                  />

                  <div
                    className={`h-3 rounded bg-slate-100 ${
                      item % 2 === 0 ? "w-3/4" : "w-1/2"
                    }`}
                  />
                </div>

                {/* CHAT ICON PLACEHOLDER */}
                <div className="h-5 w-5 flex-shrink-0 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }


  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* HEADER */}

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-blue-600">
            WORKSPACE / COMMUNICATION
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Messages
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Your private conversations in one place.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-500">Conversations</p>
          <p className="mt-1 text-xl font-bold text-slate-900">
            {chats.length}
          </p>
        </div>
      </header>

      {/* SEARCH */}

      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search conversations..."
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* CONVERSATION LIST */}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Private Conversations
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Select a conversation to open the chat.
          </p>
        </div>

        {filteredChats.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-500">
              <MessageCircle size={26} />
            </div>

            <h3 className="font-semibold text-slate-800">
              {chats.length === 0
                ? "No conversations yet"
                : "No conversations found"}
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              {chats.length === 0
                ? "Start a private conversation with another group member."
                : "Try searching with a different name or email."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredChats.map((chat) => {
              const uid = getOtherParticipant(chat);
              const profile = profiles[uid];
              const name = profile?.displayName || "User";
              const initials = getInitials(name);

              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => navigate(`/chats/${chat.id}`)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
                >
                  <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {profile?.photoURL ? (
                      <img
                        src={profile.photoURL}
                        alt={name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials || "U"
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-slate-900">
                        {name}
                      </h3>
                    </div>

                    <p className="mt-1 truncate text-sm text-slate-500">
                      {chat.lastMessage || "No messages yet"}
                    </p>
                  </div>

                  <MessageCircle
                    size={18}
                    className="flex-shrink-0 text-slate-400"
                  />
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default PrivateChats;
