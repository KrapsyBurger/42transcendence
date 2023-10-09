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

interface IChannelUnbanMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  socket: Socket | null;
  currentChannel: IChannel | null;
}

function ChannelUnbanMemberModal({
  isOpen,
  onClose,
  socket,
  currentChannel,
}: IChannelUnbanMemberModalProps) {
  const [availableUsers, setAvailableUsers] = useState<IUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const { token, setToken, setUserId } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && currentChannel) {
      // Get all members available to be unbanned
      const bannedMembers = currentChannel.bans.map((ban) => ban.user);
      setAvailableUsers(bannedMembers);
      setSelectedUser(bannedMembers[0]?.id.toString() || ""); // Select first user by default (if there is one)
    }
  }, [isOpen, navigate, setToken, setUserId, token, currentChannel]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUser) {
      toast.error("Please select a user to unban from the channel", {
        className: "toast-message",
      });
      return;
    }

    console.log("selectedUser:", selectedUser);

    if (currentChannel) {
      // Request to ban user from channel
      fetch(`http://${localhost}:3333/chat/channel/${currentChannel.id}/bans`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: Number(selectedUser) }),
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
          toast.success("User unbanned from channel successfully", {
            className: "toast-message",
          });
          setSelectedUser("");
          onClose();
        })
        .catch((error) => {
          if (error.message !== "Unauthorized") {
            console.error(
              "An error occurred while unbanning the user from the channel:",
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
      <h2>Unban a member from the channel</h2>
      <form
        name="unban_member"
        onSubmit={handleSubmit}
        className={styles["modal-form"]}
      >
        <select
          name="unban_member"
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
        <div className={styles["modal-button-section"]}>
          <button type="submit" className={styles["modal-button"]}>
            Unban
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

export default ChannelUnbanMemberModal;
