import { useContext } from "react";
import { AuthContext } from "../../../AuthContext";
import LogoutContainer from "./Logout.styles";
import { Button } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";

function Logout() {
  const { setToken, setUserId } = useContext(AuthContext);

  const handleLogout = () => {
    // Delete the token and userId from the context and localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("userId");
    setToken(null);
    setUserId(null);
  };

  return (
    <LogoutContainer>
      <Button
        variant="outlined"
        startIcon={<LogoutIcon />}
        onClick={handleLogout}
      >
        Logout
      </Button>
    </LogoutContainer>
  );
}

export default Logout;
