"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { User, Mail, ChevronDown, Pencil } from "lucide-react";

export default function ProfilePage() {
  const { user, refresh, logout } = useCurrentUser();
  
  const [name, setName] = useState(user.name || "");
  const [genre, setGenre] = useState(user.genre || "");
  const [region, setRegion] = useState(user.region || "");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSave = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, genre, region }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Erreur lors de la mise à jour.");
      } else {
        setSuccessMsg("Profil mis à jour avec succès.");
        await refresh();
      }
    } catch (err) {
      setErrorMsg("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Mon profil" />
      
      <div className="max-w-md mx-auto mt-6 flex flex-col gap-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white shadow flex items-center justify-center text-[#6A4C93]">
              <User size={48} strokeWidth={1.5} />
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#FF7D54] flex items-center justify-center border-[3px] border-[#F7F2EC] text-white">
              <Pencil size={14} />
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="p-6 flex flex-col gap-5 bg-white shadow-sm rounded-2xl">
          {errorMsg && <div className="text-red-500 text-sm font-medium">{errorMsg}</div>}
          {successMsg && <div className="text-green-500 text-sm font-medium">{successMsg}</div>}

          {/* Nom */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-500">Nom et Prénom</label>
            <div className="flex items-center bg-[#F8F9FB] rounded-xl h-12 px-4 gap-3">
              <User size={18} className="text-gray-400" />
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
                className="flex-1 bg-transparent outline-none text-gray-800 font-semibold text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-500">Email</label>
            <div className="flex items-center bg-[#F8F9FB] rounded-xl h-12 px-4 gap-3">
              <Mail size={18} className="text-gray-400" />
              <div className="flex-1 text-gray-400 font-semibold text-sm">
                {user.email || "Placeholder |"}
              </div>
            </div>
          </div>

          {/* Genre */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-500">Genre</label>
            <div className="flex items-center bg-[#F8F9FB] rounded-xl h-12 px-4 gap-3">
              <input 
                type="text" 
                value={genre} 
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Sélectionner votre genre"
                className="flex-1 bg-transparent outline-none text-gray-800 font-semibold text-sm"
              />
              <ChevronDown size={16} className="text-gray-600" />
            </div>
          </div>

          {/* Region */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-500">Région</label>
            <div className="flex items-center bg-[#F8F9FB] rounded-xl h-12 px-4 gap-3">
              <input 
                type="text" 
                value={region} 
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Sélectionner une région"
                className="flex-1 bg-transparent outline-none text-gray-800 font-semibold text-sm"
              />
              <ChevronDown size={16} className="text-gray-600" />
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-2 flex">
            <button 
              onClick={handleSave} 
              disabled={loading}
              className="flex-1 bg-[#6A4C93] hover:bg-[#5b4080] text-white font-bold h-12 rounded-xl transition-colors disabled:opacity-70"
            >
              {loading ? "Chargement..." : "Modifier"}
            </button>
          </div>
        </Card>

        {/* Logout */}
        <button 
          onClick={logout}
          className="flex-1 bg-[#FF3B1D] hover:bg-[#e03419] text-white font-bold h-12 rounded-xl transition-colors mb-8 shadow-sm"
        >
          Se déconnecter
        </button>
      </div>
    </>
  );
}
