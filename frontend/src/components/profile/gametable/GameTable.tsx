// Styles
import styles from "./GameTable.module.css";

// Packages
import { useState, useEffect } from "react";

// Interfaces
import { IGame, ProfileProps } from "../../../interfaces/interfaces";

// Api utils
import { fetchUserGames } from "../../../api.utils";

// Icons
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
} from "@mui/material";



export default function GameTable({ userId }: ProfileProps): JSX.Element {
  const [games, setGames] = useState<IGame[] | null>(null); // Currently logged in user

  // Function to convert datetime string to date string
  const formatDateTime = (datetimeString: string) => {
    const options1: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    };
    const options2: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
    };
    const date = new Date(datetimeString);
    return (
      date.toLocaleDateString(undefined, options1) +
      " - " +
      date.toLocaleTimeString(undefined, options2)
    );
  };

  useEffect(() => {
    fetchUserGames(userId)
      .then((games: IGame[]) => {
        // Sort the games by createdAt in descending order
        const sortedGames = games.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setGames(sortedGames);
        console.log(games);
      })
      .catch((error) => {
        console.error("Error fetching user games data:", error);
      });
  }, [userId]);

  return (
    <>
      {games && games.length !== 0 && (
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table
            className={styles["MuiTableCell-head"]}
            size="small"
            aria-label="a dense table"
          >
            <TableHead className={styles["MuiTableCell-root"]}>
              <TableRow >
                <TableCell align="left"></TableCell>
                <TableCell align="left">player 1</TableCell>
                <TableCell align="left"></TableCell>
                <TableCell align="center">-</TableCell>
                <TableCell align="right"></TableCell>
                <TableCell align="right">player 2</TableCell>
                <TableCell align="right"></TableCell>
                <TableCell align="center">date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {games.map((row) => (
                <TableRow
                  key={row.id}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell align="right">
                    <Avatar
                      alt={row.firstPlayerUsername}
                      src={row.firstPlayerAvatar}
                      sx={{ marginLeft: "auto" }}
                    />
                  </TableCell>
                  <TableCell
                    align="left"
                    sx={{
                      color:
                        row.winnerId === row.firstPlayerId
                          ? "#07bc0c"
                          : "#e74c3c",
                    }}
                  >
                    {row.winnerId === row.firstPlayerId ? (
                      <EmojiEventsIcon
                        fontSize="small"
                        sx={{ verticalAlign: "text-bottom" }}
                      />
                    ) : (
                      <></>
                    )}
                    {row.firstPlayerUsername}
                  </TableCell>
                  <TableCell align="left">{row.firstPlayerPoints}</TableCell>
                  <TableCell align="center">-</TableCell>
                  <TableCell align="right">{row.secondPlayerPoints}</TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color:
                        row.winnerId === row.secondPlayerId
                          ? "#07bc0c"
                          : "#e74c3c",
                    }}
                  >
                    {row.winnerId === row.secondPlayerId ? (
                      <EmojiEventsIcon
                        fontSize="small"
                        sx={{ verticalAlign: "text-bottom" }}
                      />
                    ) : (
                      <></>
                    )}
                    {row.secondPlayerUsername}
                  </TableCell>
                  <TableCell align="right">
                    <Avatar
                      alt={row.secondPlayerUsername}
                      src={row.secondPlayerAvatar}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {formatDateTime(row.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}
