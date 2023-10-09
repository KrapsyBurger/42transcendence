import React, { useContext } from "react";
import { AuthContext } from "../../../../AuthContext";
import Modal from "react-modal";
import styles from "./ChannelModals.module.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { checkTokenExpiration } from "../../../../utils";
import { Socket } from "socket.io-client";
import { IChannel } from "../../../../interfaces/interfaces";
import { localhost } from "../../../../api";

interface IChannelLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  socket: Socket | null;
  currentChannel: IChannel | null;
}

function ChannelLeaveModal({
  isOpen,
  onClose,
  socket,
  currentChannel,
}: IChannelLeaveModalProps) {
  const { userId, token, setToken, setUserId } = useContext(AuthContext);
  const navigate = useNavigate();


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (userId && currentChannel) {
      // Request to remove user from channel
      fetch(`http://${localhost}:3333/chat/channel/${currentChannel.id}/members`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: userId}), // kick yourself
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
          toast.success("You left the channel!", {
            className: "toast-message",
          });
          onClose();
        })
        .catch((error) => {
          if (error.message !== "Unauthorized") {
            console.error(
              "An error occurred while leaving the channel:",
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
      <h2>Leave channel?</h2>
      <form name="leave_channel" onSubmit={handleSubmit} className={styles["modal-form"]}>
        <div className={styles["modal-button-section"]}>
          <button type="submit" className={styles["modal-button"]}>
            Leave
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

export default ChannelLeaveModal;
