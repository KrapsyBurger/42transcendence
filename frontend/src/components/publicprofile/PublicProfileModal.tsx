// Styles
import Modal from "react-modal";

// Components
import ProfileContent from "../profile/ProfileContent";

interface PublicProfileProps {
  userId: number | null;
  open: boolean;
  onClose: () => void;
}

const PublicProfile = ({ userId, open, onClose }: PublicProfileProps) => {
  if (!open) {
    return null;
  }

  const customStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      transform: "translate(-50%, -50%)",
      backgroundColor: "#2C2F33",
      border: "none",
      borderRadius: "20px",
      color: "white",
      width: "700px",
      padding: "20px",
    },
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
  };

  return (
    <Modal
      isOpen={open} onRequestClose={onClose}
      style={customStyles}
      appElement={document.getElementById("root") || undefined}
    >
      <ProfileContent userId={userId} />
    </Modal>
  );
};

export default PublicProfile;
