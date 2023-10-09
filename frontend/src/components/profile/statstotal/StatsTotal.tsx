// Packages
import { useState, useEffect } from "react";

// Styles
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import styled from "styled-components";
import { Divider } from "@mui/material";

// Icons
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PercentIcon from "@mui/icons-material/Percent";
import NumbersIcon from "@mui/icons-material/Numbers";

// Interfaces
import { IUser, ProfileProps} from "../../../interfaces/interfaces";
// Api utils
import { fetchUserData } from "../../../api.utils";

const StyledStatsTotal = styled(Box)`
  display: flex;
  justify-content: space-between;
  padding: 16px;
`;

const StyledIconTextContainer = styled(Box)`
  display: flex;
  align-items: center;
  border: none;
  padding: 10px;
  width: 160px;
`;

const Icon = styled(Box)`
  margin-right: 10px;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #009be5;
`;

export const StatsTotal = ({userId}: ProfileProps): JSX.Element => {
  const [user, setUser] = useState<IUser | null>(null); // Currently logged in user

  useEffect(() => {
    fetchUserData(userId)
      .then((userData: IUser) => {
        setUser(userData);
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  }, [userId]);

  return (
    <>
      {user && (
        <StyledStatsTotal>
          <StyledIconTextContainer>
            <Icon>
              <NumbersIcon fontSize="large" />
            </Icon>
            <Box>
              <Typography variant="h6">games</Typography>
              <Typography variant="subtitle1" style={{ color: "#757575" }}>
                {user.numberOfGamesPlayed}
              </Typography>
            </Box>
          </StyledIconTextContainer>
          <Divider orientation="vertical" variant="middle" />
          <StyledIconTextContainer>
            <Icon>
              <EmojiEventsIcon fontSize="large" />
            </Icon>
            <Box>
              <Typography variant="h6">wins</Typography>
              <Typography variant="subtitle1" style={{ color: "#757575" }}>
              {user.numberOfWins}
              </Typography>
            </Box>
          </StyledIconTextContainer>
          <Divider orientation="vertical" variant="middle" />
          <StyledIconTextContainer>
            <Icon>
              <PercentIcon fontSize="large" />
            </Icon>
            <Box>
              <Typography variant="h6">winrate</Typography>
              <Typography variant="subtitle1" style={{ color: "#757575" }}>
              {user.numberOfGamesPlayed? Math.round(user.numberOfWins / user.numberOfGamesPlayed * 100) : '-'}
              </Typography>
            </Box>
          </StyledIconTextContainer>
        </StyledStatsTotal>
      )}
    </>
  );
};
