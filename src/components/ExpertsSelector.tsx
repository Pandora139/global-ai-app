"use client";

import { useEffect, useState } from "react";

export type Expert = {
  id: string;
  key: string;
  name: string;
  description: string;
  system_prompt: string;
  tags: string[];
  avatar_url: string;
  is_active: boolean;
};

export default function ExpertsSelector({ onSelect }: { onSelect: (expert: Expert) => void }) {
  const [experts, setExperts] = useState<Expert[]>([]);

  useEffect(() => {
    async function fetchExperts() {
      const res = await fetch("/api/chat/experts");
      const data = await res.json();
      setExperts(data);
    }
    fetchExperts();
  }, []);

  return (
    <div className="flex gap-4 p-4 overflow-x-auto border-b">
      {experts.map((expert) => (
        <button
  key={expert.id}
  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 min-w-[220px] text-left bg-white shadow-sm"
  onClick={() => onSelect(expert)}
>
  <img
    src={expert.avatar_url}
    alt={expert.name}
    className="w-12 h-12 rounded-full border shadow-sm object-cover"
  />
  <div className="flex flex-col">
    <span className="font-semibold text-sm">{expert.name}</span>
    <span className="text-xs text-gray-500">{expert.tags?.join(", ")}</span>
  </div>
</button>

      ))}
    </div>
  );
}
