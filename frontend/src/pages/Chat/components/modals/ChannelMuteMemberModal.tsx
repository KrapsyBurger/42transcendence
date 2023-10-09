import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../../../AuthContext";
import Modal from "react-modal";
import styles from "./ChannelModals.module.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { checkTokenExpiration } from "../../../../utils";
import { Socket } from "socket.io-client";
import { IChannel, IUser } from "../../../../interfaces/interfaces";
import { localhost } from "../../../../api";

interface IChannelMuteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  socket: Socket | null;
  currentChannel: IChannel | null;
  mutedUsers: Record<string, NodeJS.Timeout | undefined>;
}

function ChannelMuteMemberModal({
  isOpen,
  onClose,
  socket,
  currentChannel,
  mutedUsers,
}: IChannelMuteMemberModalProps) {
  const [availableUsers, setAvailableUsers] = useState<IUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const { token, setToken, setUserId } = useContext(AuthContext);
  const [muteDuration, setMuteDuration] = useState<number>(0); // In minutes
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && currentChannel) {
      // Get all members available to be muted
      const mutedUserIds = Object.keys(mutedUsers);
      const filteredMembers = currentChannel.members.filter(
        (member) =>
          member.id !== currentChannel.ownerId &&
          !mutedUserIds.includes(member.id.toString())
      );
      setAvailableUsers(filteredMembers);
      setSelectedUser(filteredMembers[0]?.id.toString() || ""); // Select first user by default (if there is one)
    }
  }, [
    isOpen,
    navigate,
    setToken,
    setUserId,
    token,
    currentChannel,
    mutedUsers,
  ]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUser) {
      toast.error("Please select a user to mute in the channel", {
        className: "toast-message",
      });
      return;
    }

    console.log("selectedUser:", selectedUser);

    // Convert muteDuration to milliseconds and add to the current date/time
    const muteExpiration = new Date(
      Date.now() + muteDuration * 60000
    ).toISOString();

    if (currentChannel) {
      // Request to mute user in channel
      fetch(`http://${localhost}:3333/chat/channel/${currentChannel.id}/mutes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: Number(selectedUser), muteExpiration }),
      })
        .then((response) => {
          checkTokenExpiration(response, navigate, setToken, setUserId);
          if (!response.ok) {
            return response.json().then((data) => {
              throw new Error(data.message);
            });
          }
          return response.json();
        })
        .then((data) => {
          toast.success("User muted in channel successfully", {
            className: "toast-message",
          });
          setSelectedUser("");
          onClose();
        })
        .catch((error) => {
          if (error.message !== "Unauthorized") {
            console.error(
              "An error occurred while banning the user from the channel:",
              error
            );
            toast.error(error.message, {
              className: "toast-message",
            });
          }
        });
    }
  };

  const customStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      transform: "translate(-50%, -50%)",
      backgroundColor: "#2C2F33",
      border: "none",
      borderRadius: "5px",
      color: "white",
      width: "400px",
      padding: "20px",
    },
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={customStyles}
      appElement={document.getElementById("root") || undefined}
    >
      <h2>Mute a member in the channel</h2>
      <form
        name="mute_member"
        onSubmit={handleSubmit}
        className={styles["modal-form"]}
      >
        <label htmlFor="channelMember" className={styles["modal-label"]}>
          Member to mute
        </label>
        <select
          id="channelMember"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          required
          className={styles["modal-input"]}
        >
          {availableUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username}
            </option>
          ))}
        </select>
        <label htmlFor="muteDuration" className={styles["modal-label"]}>
          Mute duration (in minutes)
        </label>
        <input
          id="muteDuration"
          type="number"
          min="1"
          step="1"
          value={muteDuration}
          onChange={(e) => setMuteDuration(Number(e.target.value))}
          required
          className={styles["modal-input"]}
        />
        <div className={styles["modal-button-section"]}>
          <button type="submit" className={styles["modal-button"]}>
            Mute
          </button>
          <button
            type="button"
            className={styles["modal-button"]}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ChannelMuteMemberModal;
