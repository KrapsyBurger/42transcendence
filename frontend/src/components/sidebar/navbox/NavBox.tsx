// Packages
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import Box from "@mui/material/Box";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

// Icons
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import ChatIcon from "@mui/icons-material/Chat";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import GroupIcon from '@mui/icons-material/Group';

const pages = [
  { id: "play", icon: <SportsEsportsIcon />, active: true, path: "/" },
  { id: "chat", icon: <ChatIcon />, path: "/chat" },
  { id: "profile", icon: <AccountBoxIcon />, path: "/profile" },
  { id: "friends", icon: <GroupIcon />, path: "/friends" },
];

const page = {
  py: "2px",
  px: 3,
  color: "rgba(255, 255, 255, 0.7)",
  "&:hover, &:focus": {
    bgcolor: "rgba(255, 255, 255, 0.08)",
  },
};

const NavBox = () => {
  // Get the current location using react-router-dom's useLocation hook
  const location = useLocation();

  // Derive the initial active page from the current location pathname
  const initialActivePage =
    pages.find(({ path }) => location.pathname === path)?.id || "play";

  // State to track the active page
  const [activePage, setActivePage] = useState<string>(initialActivePage);

  // Handler function to set the active page
  const handlePageClick = (id: string) => {
    setActivePage(id);
  };
  return (
    <Box key="Navigate">
      <ListItem sx={{ py: 2, px: 3 }}>
        <ListItemText sx={{ color: "#fff" }}>Navigate</ListItemText>
      </ListItem>
      {pages.map(({ id, icon, path }) => (
        <ListItem disablePadding key={id}>
          <ListItemButton
            selected={activePage === id}
            sx={page}
            component={Link}
            to={path}
            onClick={() => handlePageClick(id)}
          >
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText>{id}</ListItemText>
          </ListItemButton>
        </ListItem>
      ))}
    </Box>
  );
};

export default NavBox;
