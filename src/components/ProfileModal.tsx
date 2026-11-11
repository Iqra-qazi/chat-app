import { useState } from "react";
import { Camera, Check, X } from "lucide-react";
import { Avatar } from "./Avatar";
import { chatApi, getApiError } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { useToast } from "../hooks/useToast";
import type { User } from "../types";

interface ProfileModalProps {
  person: User;
  editable?: boolean;
  onClose: () => void;
}

export function ProfileModal({ person, editable = false, onClose }: ProfileModalProps) {
  const [name, setName] = useState(person.name);
  const [saving, setSaving] = useState(false);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { toast } = useToast();

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = name.trim();
    if (!value) {
      toast("Please enter a name.", "error");
      return;
    }
    setSaving(true);
    try {
      const updated = await chatApi.updateProfile({ name: value });
      updateUser(updated);
      toast("Your profile has been updated.", "success");
      onClose();
    } catch (error) {
      toast(getApiError(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <button className="modal-close icon-button" aria-label="Close profile" onClick={onClose}><X size={18} /></button>
        <div className="profile-cover"><span className="cover-sun" /><span className="cover-swoop" /></div>
        <div className="profile-modal-content">
          <div className="profile-avatar-wrap"><Avatar user={person} size="lg" showStatus /></div>
          {editable ? (
            <form onSubmit={(event) => void save(event)}>
              <p className="eyebrow">YOUR PROFILE</p>
              <h2 id="profile-title">Make yourself at home.</h2>
              <label className="form-label">Display name
                <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} required />
              </label>
              <label className="form-label">Email
                <input value={person.email ?? ""} readOnly />
              </label>
              <button className="primary-button profile-save" disabled={saving}>{saving ? "Saving..." : <><Check size={17} /> Save changes</>}</button>
            </form>
          ) : (
            <div className="profile-readonly">
              <p className="eyebrow">A LITTLE ABOUT THEM</p>
              <h2 id="profile-title">{person.name}</h2>
              <p>{person.email ?? "Here for the good conversations."}</p>
              <span className="profile-online"><i className={`presence-dot ${person.status === "online" ? "online" : ""}`} />{person.status === "online" ? "Around right now" : "Not online right now"}</span>
              <button className="secondary-button" onClick={onClose}><Camera size={16} /> Back to your conversation</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
