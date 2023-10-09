// Packages
import { useLocation } from "react-router-dom";

// Components
import { LeftSideBarContainer } from "./SideBar.styles";
import Logout from "./logout/Logout";
import NavBox from "./navbox/NavBox";
import Box from "@mui/material/Box";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { Divider } from "@mui/material";

import LogoutContainer from "./logout/Logout.styles";

const page = {
  py: "2px",
  px: 3,
  color: "rgba(255, 255, 255, 0.7)",
  "&:hover, &:focus": {
    bgcolor: "rgba(255, 255, 255, 0.08)",
  },
};

const SideBar = () => {
  const location = useLocation();
  const activePage = location.pathname;
  return (
    <LeftSideBarContainer>
      <NavBox />
      {activePage === "chat" && (
        <>
          <Box key="Manage Channels">
            <Divider sx={{ mt: 2 }} />
            <ListItem sx={{ py: 2, px: 3 }}>
              <ListItemText sx={{ color: "#fff" }}>
                Manage Channels
              </ListItemText>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton sx={page}>
                <ListItemText>Join channel</ListItemText>
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton sx={page}>
                <ListItemText>Create channel</ListItemText>
              </ListItemButton>
            </ListItem>
          </Box>
          <Box key="Conversations">
            <Divider sx={{ mt: 2 }} />
            <ListItem sx={{ py: 2, px: 3 }}>
              <ListItemText sx={{ color: "#fff" }}>Conversations</ListItemText>
            </ListItem>
          </Box>
        </>
      )}

      <LogoutContainer>
        <Logout />
      </LogoutContainer>
    </LeftSideBarContainer>
  );
};

export default SideBar;
