// Packages
import React from "react";
import { io, Socket } from "socket.io-client";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// Components
import { AuthContext } from "../../AuthContext";
import { checkTokenExpiration } from "../../utils";
import GameInvites from "./components/gameinvites/GameInvites";

// Styles
import styles from "./Game.module.css";
import {
  GameActionsContainer,
  GameContainer,
  GameCourtContainer,
  GameSubTitleContainer,
  GameSwitchesContainer,
  GameTitleContainer,
  InstructionsContainer,
} from "./Game.styles";
import {
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import Button from "@mui/material/Button";

// Icons
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { localhost } from "../../api";

interface IGameState {
  ballPosition: { x: number; y: number };
  isMatchmaking: boolean;
  isInMatch: boolean;
  p1: number;
  p2: number;
  isPaused: boolean;
  isReadyToResume: boolean;
  score: { score1: number; score2: number };
  websocket: Socket | null;
  selectedTheme: string;
}

class GameContent extends React.Component<{ navigate: Function }, IGameState> {
  static contextType = AuthContext;
  context!: React.ContextType<typeof AuthContext>;
  playerMaxY: number;
  playerMinY: number;
  live: boolean;
  TimerID: NodeJS.Timer | null;
  gameId: number | null;
  interval: NodeJS.Timeout | null;

  constructor(props: any) {
    super(props);
    this.playerMaxY = 400;
    this.playerMinY = 100;
    this.live = true;
    this.TimerID = null;
    this.gameId = null;
    this.interval = null;

    // State variables
    this.state = {
      ballPosition: { x: 0, y: 0 },
      isMatchmaking: false,
      isInMatch: false,
      p1: 0.5,
      p2: 0.5,
      isPaused: false,
      isReadyToResume: false,
      score: { score1: 0, score2: 0 },
      websocket: null,
      selectedTheme: "grey",
    };
  }
  componentDidMount() {
    this.connectToGameServer();
    this.getGame();

    window.addEventListener("keydown", this.handleKeyDown);
  }

  componentWillUnmount() {
    if (this.state.websocket) {
      this.state.websocket.off("connect");
      this.state.websocket.off("close");
      this.state.websocket.off("error");
      this.state.websocket.off("updateGame");
      this.state.websocket.off("endGame");
      this.state.websocket.off("notifyFriendRequest");
      this.state.websocket.close();

      window.removeEventListener("keydown", this.handleKeyDown);
    }
  }
  connectToGameServer() {
    const { userId } = this.context;

    const websocket = io(`http://${localhost}:3333/game`, {
      query: {
        userId: userId,
      },
    });
    websocket.on("connect", () => {
      console.log("Connected to game server");
    });
    websocket.on("close", () => {
      console.log("Disconnected from game server");
    });
    websocket.on("error", () => {
      console.log("Game WebSocket error:");
    });
    websocket.on("updateGame", (game: any) => {
      this.setState({ isInMatch: true });
      this.gameId = game.id;
      if (game.gameStatus === "over") {
        this.setState({ isInMatch: false });
        this.setState({ isMatchmaking: false });
        this.gameId = null;
        console.log("Game ended after update:", game);
      }
      if (game.gameStatus === "paused") {
        console.log("Game paused after update");
        if (this.state.isPaused === false)
          // if the game was not already paused, reset isReadyToResume
          this.setState({ isReadyToResume: false });
        this.setState({ isPaused: true });
      } else {
        if (this.state.isPaused === true) console.log("isPaused is now false");
        this.setState({ isPaused: false });
        this.setState({ ballPosition: { x: game.ballX, y: game.ballY } });
        this.setState({ p1: game.firstPlayerPaddleY });
        this.setState({ p2: game.secondPlayerPaddleY });
        this.setState({
          score: {
            score1: game.firstPlayerPoints,
            score2: game.secondPlayerPoints,
          },
        });
        console.log("Game updated and playing");
        //TODO: update all necessary state variables with the game data !!!
      }
      // console.log('Game update received:', game);
    });
    websocket.on("endGame", (game: any) => {
      this.setState({ isInMatch: false });
      this.setState({ isMatchmaking: false });
      this.setState({ score: { score1: 0, score2: 0 } });
      this.setState({ isReadyToResume: false });
      this.gameId = null;
      console.log("Game ended:", game);
    });
    websocket.on("notifyFriendRequest", this.notifyFriendRequest);
    this.setState({ websocket: websocket });
  }

  notifyFriendRequest = (senderUsername: string) => {
    toast.info(`${senderUsername} sent you a friend request!`, {
      className: "toast-message",
    });
  };

  handleEnterMatchmaking = async () => {
    const { token, setToken, setUserId } = this.context;

    try {
      this.setState({ isMatchmaking: true });
      const response = await fetch(`http://${localhost}:3333/game/matchmaking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      checkTokenExpiration(response, this.props.navigate, setToken, setUserId);
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || "Something went wrong";
        throw new Error(errorMessage);
      }
      if (response.headers.get("Content-Type")?.includes("application/json")) {
        const data = await response.json();
        console.log(data);
      } else {
        // console.log('Response did not contain JSON');
      }
    } catch (error: any) {
      console.error(error.message);
      this.setState({ isMatchmaking: false });
    }
  };

  handleLeaveMatchmaking = async () => {
    const { token, setToken, setUserId } = this.context;

    try {
      this.setState({ isMatchmaking: false });
      const response = await fetch(`http://${localhost}:3333/game/matchmaking`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      checkTokenExpiration(response, this.props.navigate, setToken, setUserId);
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || "Something went wrong";
        throw new Error(errorMessage);
      }
      if (response.headers.get("Content-Type")?.includes("application/json")) {
        const data = await response.json();
        console.log(data);
      } else {
        // console.log('Response did not contain JSON');
      }
    } catch (error: any) {
      console.error(error.message);
      this.setState({ isMatchmaking: true });
    }
  };

  handleAbandonGame = async () => {
    //TODO: make it a websocket event ? !!!
    const { token, setToken, setUserId } = this.context;
    console.log("Abandoning game");
    try {
      const response = await fetch(
        `http://${localhost}:3333/game/${this.gameId}/abandon`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      checkTokenExpiration(response, this.props.navigate, setToken, setUserId);
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || "Something went wrong";
        throw new Error(errorMessage);
      }
      if (response.headers.get("Content-Type")?.includes("application/json")) {
        const data = await response.json();
        console.log(data);
      } else {
        // console.log('Response did not contain JSON');
      }
    } catch (error: any) {
      console.error(error.message);
    }
  };

  handlePauseGame = () => {
    const { userId } = this.context;
    this.state.websocket?.emit("pauseGame", { gameId: this.gameId, userId });
    console.log("Ask to pause");
  };

  handleResumeGame = () => {
    const { userId } = this.context;
    this.setState({ isReadyToResume: true });
    this.state.websocket?.emit("readyToResume", {
      gameId: this.gameId,
      userId,
    });
    console.log("Ready to resume");
  };

  handleKeyDown = (event: KeyboardEvent) => {
    const { userId } = this.context;
    if (!this.state.isInMatch || this.state.isPaused) return;
    switch (event.key) {
      case "ArrowUp":
        this.state.websocket?.emit("movePaddle", {
          direction: "up",
          userId,
          gameId: this.gameId,
        });
        break;
      case "ArrowDown":
        this.state.websocket?.emit("movePaddle", {
          direction: "down",
          userId,
          gameId: this.gameId,
        });
        break;
      default:
        break;
    }
  };

  async getGame() {
    const { userId, token, setToken, setUserId } = this.context;

    try {
      const response = await fetch(`http://${localhost}:3333/game`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      checkTokenExpiration(response, this.props.navigate, setToken, setUserId);
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || "Something went wrong";
        throw new Error(errorMessage);
      }
      if (response.headers.get("Content-Type")?.includes("application/json")) {
        const data = await response.json();
        if (data) {
          this.setState({ isInMatch: true });
          this.setState({ ballPosition: { x: data.ballX, y: data.ballY } });
          this.setState({ p1: data.firstPlayerPaddleY });
          this.setState({ p2: data.secondPlayerPaddleY });
          this.setState({
            score: {
              score1: data.firstPlayerPoints,
              score2: data.secondPlayerPoints,
            },
          });
          this.setState({ isPaused: data.gameStatus === "paused" });
          if (userId === data.firstPlayerId && data.isReadyFirstPlayer)
            this.setState({ isReadyToResume: true });
          if (userId === data.secondPlayerId && data.isReadySecondPlayer)
            this.setState({ isReadyToResume: true });
          this.gameId = data.id;

          //TODO: update all necessary state variables with the game data !!!
        }
        // console.log(data);
      } else {
        // console.log('Response did not contain JSON');
      }
    } catch (error: any) {
      console.error(error.message);
    }
  }

  render() {
    return (
      <>
        {this.state.isInMatch ? (
          // In match
          <GameContainer>
            <GameTitleContainer>
              <Typography variant="h3">PONG</Typography>
            </GameTitleContainer>
            <GameSubTitleContainer>
              <Typography>
                Match found! -{" "}
                {this.state.isPaused
                  ? "Game Paused : Waiting for players to resume"
                  : "Game Playing"}
              </Typography>
            </GameSubTitleContainer>
            <GameActionsContainer>
              <Button
                variant="contained"
                sx={{ marginRight: "5px" }}
                onClick={this.handleAbandonGame}
              >
                Abandon
              </Button>
              {this.state.isPaused ? (
                this.state.isReadyToResume ? (
                  <Typography>Waiting for other player to resume</Typography>
                ) : (
                  <Button
                    variant="contained"
                    sx={{ marginLeft: "5px" }}
                    onClick={this.handleResumeGame}
                  >
                    Resume
                  </Button>
                )
              ) : (
                <Button
                  variant="contained"
                  sx={{ marginLeft: "5px" }}
                  onClick={this.handlePauseGame}
                >
                  Pause
                </Button>
              )}
            </GameActionsContainer>
            <GameCourtContainer className={styles[this.state.selectedTheme]}>
              <div id="court">
                <p className={styles["score-title"]}>
                  Score {this.state.score.score1} | {this.state.score.score2}
                </p>
                <div
                  className={styles["ball"]}
                  style={{
                    top: `${this.state.ballPosition.y * 100}%`,
                    left: `${this.state.ballPosition.x * 100}%`,
                  }}
                ></div>
                <div
                  className={styles["player1"]}
                  style={{ top: `${this.state.p1 * 100}%` }}
                ></div>
                <div
                  className={styles["player2"]}
                  style={{ top: `${this.state.p2 * 100}%` }}
                ></div>
              </div>
            </GameCourtContainer>
            <GameSwitchesContainer>
              <Typography variant="h6">Theme</Typography>
              <RadioGroup
                aria-labelledby="demo-radio-buttons-group-label"
                value={this.state.selectedTheme}
                onChange={(event) =>
                  this.setState({ selectedTheme: event.target.value })
                }
                name="radio-buttons-group"
              >
                <FormControlLabel
                  value="grey"
                  control={<Radio />}
                  label="Grey"
                />
                <FormControlLabel
                  value="pink"
                  control={<Radio />}
                  label="Pink"
                />
                <FormControlLabel
                  value="blue"
                  control={<Radio />}
                  label="Blue"
                />
              </RadioGroup>
            </GameSwitchesContainer>
            <InstructionsContainer>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginTop: "5px",
                  marginBottom: "5px",
                }}
              >
                <ArrowUpwardIcon
                  sx={{ border: "1px solid white", marginRight: "5px" }}
                />{" "}
                <Typography>go up</Typography>
              </div>

              <div style={{ display: "flex", flexDirection: "row" }}>
                <ArrowDownwardIcon
                  sx={{ border: "1px solid white", marginRight: "5px" }}
                />{" "}
                <Typography>go down</Typography>
              </div>
            </InstructionsContainer>
          </GameContainer>
        ) : (
          // Not in match
          <>
            <GameTitleContainer>
              <Typography variant="h3">PONG</Typography>
            </GameTitleContainer>
            <div className={styles["matchmaking-and-invite-container"]}>
              <div className={styles["margins"]}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={
                    this.state.isMatchmaking
                      ? this.handleLeaveMatchmaking
                      : this.handleEnterMatchmaking
                  }
                >
                  {this.state.isMatchmaking
                    ? "Searching for a match (click to cancel)"
                    : "Start Matchmaking"}
                </Button>
              </div>
              <Divider className={styles["divider"]} />
              <div className={styles["margins"]}>
                <GameInvites socket={this.state.websocket} />
              </div>
            </div>
          </>
        )}
      </>
    );
  }
}

const GameWithRouter = () => {
  const navigate = useNavigate();

  return <GameContent navigate={navigate} />;
};

export default GameWithRouter;
