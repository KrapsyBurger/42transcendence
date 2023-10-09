import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../../AuthContext";
import Modal from "react-modal";
import styles from "./ChannelModals.module.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { checkTokenExpiration } from "../../../../utils";
import { Socket } from "socket.io-client";
import { IChannel } from "../../../../interfaces/interfaces";
import { localhost } from "../../../../api";

interface IChannelUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  socket: Socket | null;
  currentChannel: IChannel | null;
}

function ChannelUpdateModal({
  isOpen,
  onClose,
  socket,
  currentChannel,
}: IChannelUpdateModalProps) {
  const [name, setName] = useState(currentChannel?.name || "");
  const [isPrivate, setIsPrivate] = useState(
    currentChannel?.isPrivate || false
  );
  const [password, setPassword] = useState("");
  const [passwordChanged, setPasswordChanged] = useState(false);
  const { token, userId, setToken, setUserId } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const updatedChannelData = {
      name,
      isPrivate,
      ownerId: userId,
      ...(passwordChanged && { password }), // if passwordChanged is true, add password to the object
    };

    if (currentChannel) {
      fetch(`http://${localhost}:3333/chat/channel/${currentChannel.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedChannelData),
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
          toast.success("Channel updated successfully", {
            className: "toast-message",
          });

          setPassword("");
          setPasswordChanged(false);

          onClose();
        })
        .catch((error) => {
          if (error.message !== "Unauthorized")
            console.error(
              "An error occurred while updating the channel:",
              error
            );
          toast.error(error.message, {
            className: "toast-message",
          });
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


  useEffect(() => {
    if (currentChannel)
      setName(currentChannel.name);
  }, [currentChannel]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={customStyles}
      contentLabel="Channel Update Modal"
      appElement={document.getElementById("root") || undefined}
    >
      <h2>Update channel infos</h2>
      <form
        name="update_channel_infos"
        onSubmit={handleSubmit}
        className={styles["modal-form"]}
      >
        <label htmlFor="channelName" className={styles["modal-label"]}>
          Name
        </label>
        <input
          id="channelName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className={styles["modal-input"]}
        />
        <label htmlFor="channelPassword" className={styles["modal-label"]}>
          Password
        </label>
        <input
          id="channelPassword"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordChanged(true);
          }}
          placeholder="Password (type only if you want to change it)"
          className={styles["modal-input"]}
        />
        <label className={styles["modal-label"]}>
          <input
            id="channelCheckbox"
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
          Private
        </label>
        <div className={styles["modal-button-section"]}>
          <button type="submit" className={styles["modal-button"]}>
            Update
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

export default ChannelUpdateModal;