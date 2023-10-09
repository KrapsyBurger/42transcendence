import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../../../AuthContext";
import Modal from "react-modal";
import styles from "../modals/ChannelModals.module.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { checkTokenExpiration } from "../../../../utils";
import { Socket } from "socket.io-client";
import { IChannel } from "../../../../interfaces/interfaces";
import { localhost } from "../../../../api";

interface IChannelJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  socket: Socket | null;
  currentChannels: IChannel[];
}

function ChannelJoinModal({
  isOpen,
  onClose,
  socket,
  currentChannels,
}: IChannelJoinModalProps) {
  const [availableChannels, setAvailableChannels] = useState<IChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState("");
  const { token, userId, setToken, setUserId } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      // Fetch all public channels from server
      fetch(`http://${localhost}:3333/chat/channels`, {
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
        .then((data) => {
          const channelsNotAlreadyJoined = data.filter(
            (channel: IChannel) =>
              !currentChannels.some(
                (currentChannel) => currentChannel.id === channel.id
              )
          );
          setAvailableChannels(channelsNotAlreadyJoined);
          setSelectedChannel(channelsNotAlreadyJoined[0]?.id || ""); // Select first channel by default (if there is one)
        })
        .catch((error) => {
          if (error.message !== "Unauthorized")
            console.error(
              "An error occurred while fetching the channels:",
              error
            );
        });
    }
  }, [isOpen, navigate, setToken, setUserId, token, currentChannels]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedChannel) {
      toast.error("Please select a channel to join", {
        className: "toast-message",
      });
      return;
    }

    console.log("selectedChannel:", selectedChannel);

    // If the channel has a password, prompt the user to enter it
    const channel = availableChannels.find(
      (channel) => channel.id === Number(selectedChannel)
    );
    let password;
    if (channel?.hasPassword) {
      password = window.prompt("Enter the channel password:");
      if (!password) {
        toast.error("Please enter the channel password", {
          className: "toast-message",
        });
        return;
      }
    }
    // Request to join channel
    fetch(`http://${localhost}:3333/chat/channel/${selectedChannel}/members`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, password }),
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
        toast.success("Channel joined successfully", {
          className: "toast-message",
        });

        setSelectedChannel("");

        onClose();
      })
      .catch((error) => {
        if (error.message !== "Unauthorized") {
          console.error("An error occurred while joining the channel:", error);
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
      appElement={document.getElementById("root") || undefined}
    >
      <h2>Join a channel</h2>
      <form name="join_a_channel" onSubmit={handleSubmit} className={styles["modal-form"]}>
        <select
        name="join_a_channel"
          value={selectedChannel}
          onChange={(e) => setSelectedChannel(e.target.value)}
          required
          className={styles["modal-input"]}
        >
          {availableChannels.map((channel) => (
            <option key={channel.id} value={channel.id}>
              {channel.name}
            </option>
          ))}
        </select>
        <div className={styles["modal-button-section"]}>
          <button type="submit" className={styles["modal-button"]}>
            Join
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

export default ChannelJoinModal;
