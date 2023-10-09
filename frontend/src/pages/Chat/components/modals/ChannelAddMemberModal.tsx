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

interface IChannelAddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  socket: Socket | null;
  currentChannel: IChannel | null;
}

function ChannelAddMemberModal({
  isOpen,
  onClose,
  socket,
  currentChannel,
}: IChannelAddMemberModalProps) {
  const [availableUsers, setAvailableUsers] = useState<IUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const { token, setToken, setUserId } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && currentChannel) {
      // Fetch all users from server
      fetch(`http://${localhost}:3333/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          checkTokenExpiration(response, navigate, setToken, setUserId);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data: IUser[]) => {
          console.log("Users:");
          console.log(data);
          const usersNotInChannel = data.filter(
            (user) =>
              !currentChannel.members.some((member) => member.id === user.id)
          );
          setAvailableUsers(usersNotInChannel);
          setSelectedUser(usersNotInChannel[0]?.id.toString() || ""); // Select first user by default (if there is one)
        })
        .catch((error) => {
          if (error.message !== "Unauthorized")
            console.error("An error occurred while fetching the users:", error);
        });
    }
  }, [isOpen, navigate, setToken, setUserId, token, currentChannel]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUser) {
      toast.error("Please select a user to add", {
        className: "toast-message",
      });
      return;
    }

    console.log("selectedUser:", selectedUser);

    if (currentChannel) {
      // Request to add user to channel
      fetch(`http://${localhost}:3333/chat/channel/${currentChannel.id}/members`, {
        method: "POST",
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
          toast.success("User added to channel successfully", {
            className: "toast-message",
          });
          setSelectedUser("");
          onClose();
        })
        .catch((error) => {
          if (error.message !== "Unauthorized" && error.message.includes("was banned from channel")) {
            console.error(
              "User was banned and cannot be added to channel",
              error
            );
            toast.error("Cannot add a banned user to channel", {
              className: "toast-message",
            });
          }
          else if (error.message !== "Unauthorized") {
            console.error(
              "An error occurred while adding the user to the channel:",
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
      <h2>Add a member to the channel</h2>
      <form name="add_member" onSubmit={handleSubmit} className={styles["modal-form"]}>
        <select
        name="add_member"
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
            Add
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

export default ChannelAddMemberModal;
