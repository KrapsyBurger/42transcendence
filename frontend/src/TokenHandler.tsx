import { useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "./AuthContext";

interface TokenHandlerProps {
  onSignin: (token: string, userId: number) => void;
}

function TokenHandler({ onSignin }: TokenHandlerProps) {
  const { token } = useContext(AuthContext);
  const { URLtoken, URLuserId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const userIdNumber = Number(URLuserId);
    if (!URLtoken || isNaN(userIdNumber)) {
      toast.error("Invalid token or user id", {
        className: "toast-message",
      });
      navigate("/signin");
      return;
    }
    onSignin(URLtoken, userIdNumber);
  }, [URLtoken, URLuserId, navigate, onSignin]);

  useEffect(() => {
    if (token) navigate("/");
  }, [token, navigate]);

  return null;
}

export default TokenHandler;
