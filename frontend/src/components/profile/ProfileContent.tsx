// Packages
import { useContext } from "react";

// Components
import ProfileInfos from "../../pages/Profile/components/profileinfos/ProfileInfos";
import PublicProfileInfos from "../publicprofile/components/PublicProfileInfos";
import GameTable from "./gametable/GameTable";
import { StatsTotal } from "./statstotal/StatsTotal";

// Interfaces
import { ProfileProps } from "../../interfaces/interfaces";

// Styles
import { Divider } from "@mui/material";
import {
  StatsTotalContainer,
  GameTableContainer,
  ProfileContentContainer,
} from "./Profile.styles";

// Context
import { AuthContext } from "../../AuthContext";

const ProfileContent = ({ userId }: ProfileProps) => {
  const { userId: loggedInUserId } = useContext(AuthContext);
  return (
    <ProfileContentContainer>
      {loggedInUserId === userId ? (
        <ProfileInfos />
      ) : (
        <PublicProfileInfos userId={userId} />
      )}
      <Divider variant="middle" style={{ width: "100%" }} />
      <StatsTotalContainer>
        <StatsTotal userId={userId} />
      </StatsTotalContainer>
      <Divider variant="middle" style={{ width: "100%" }} />
      <GameTableContainer>
        <GameTable userId={userId} />
      </GameTableContainer>
    </ProfileContentContainer>
  );
};

export default ProfileContent;
