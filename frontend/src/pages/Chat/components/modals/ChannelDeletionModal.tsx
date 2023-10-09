import { useContext } from "react";
import { AuthContext } from "../../../../AuthContext";
import Modal from "react-modal";
import styles from "./ChannelModals.module.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import { checkTokenExpiration } from "../../../../utils";
import { Socket } from "socket.io-client";
import { IChannel } from "../../../../interfaces/interfaces";
import { localhost } from "../../../../api";

interface IChannelDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  socket: Socket | null;
  currentChannel: IChannel | null;
}

function ChannelDeletionModal({
  isOpen,
  onClose,
  socket,
  currentChannel,
}: IChannelDeletionModalProps) {
  const { token, setToken, setUserId } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleDeleteChannel = async () => {
    if (currentChannel) {
      fetch(`http://${localhost}:3333/chat/channel/${currentChannel.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
          toast.success("Channel deleted successfully", {
            className: "toast-message",
          });

          onClose();
        })
        .catch((error) => {
          if (error.message !== "Unauthorized")
            console.error(
              "An error occurred while deleting the channel:",
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

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={customStyles}
      contentLabel="Channel Deletion Modal"
      appElement={document.getElementById("root") || undefined}
    >
      <h2>Delete this channel?</h2>
      <div className={styles["modal-button-section"]}>
        <button
          type="button"
          onClick={handleDeleteChannel}
          className={styles["modal-button"]}
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={onClose}
          className={styles["modal-button"]}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}

export default ChannelDeletionModal;
