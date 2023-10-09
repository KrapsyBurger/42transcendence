import React, { useContext, useState } from "react";
import { AuthContext } from "../../../../AuthContext";
import Modal from "react-modal";
import styles from "../modals/ChannelModals.module.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { checkTokenExpiration } from "../../../../utils";
import { Socket } from "socket.io-client";
import { localhost } from "../../../../api";

interface IChannelCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  socket: Socket | null;
}

function ChannelCreationModal({
  isOpen,
  onClose,
  socket,
}: IChannelCreationModalProps) {
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const { token, userId, setToken, setUserId } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const channelData = {
      name,
      isPrivate,
      password,
      ownerId: userId,
    };

    fetch(`http://${localhost}:3333/chat/channel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(channelData),
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
        toast.success("Channel created successfully", {
          className: "toast-message",
        });

        setName("");
        setIsPrivate(false);
        setPassword("");

        onClose();
      })
      .catch((error) => {
        if (error.message !== "Unauthorized") {
          console.error("An error occurred while creating the channel:", error);
          toast.error(error.message, {
            className: "toast-message",
          });
        }
      });
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
      contentLabel="Channel Creation Modal"
      appElement={document.getElementById("root") || undefined}
    >
      <h2>Create a new channel</h2>
      <form
        name="create_a_channel"
        onSubmit={handleSubmit}
        className={styles["modal-form"]}
      >
        <input
          name="create_a_channel_name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          required
          className={styles["modal-input"]}
        />
        <input
          name="create_a_channel_password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (optional)"
          className={styles["modal-input"]}
        />
        <label className={styles["modal-label"]}>
          <input
            name="create_a_channel_private"
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
          Private
        </label>
        <div className={styles["modal-button-section"]}>
          <button type="submit" className={styles["modal-button"]}>
            Create
          </button>
          <button
            type="button"
            onClick={onClose}
            className={styles["modal-button"]}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ChannelCreationModal;
