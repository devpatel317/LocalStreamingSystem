import StreamDisplay from "./StreamDisplay";
import { CssBaseline, Box } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Appbar from "./components/Appbar";
import { useState } from "react";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1976d2" },
    background: { default: "#f5f5f5" },
  },
});

const App = () => {
  const [roomId, setRoomId] = useState("");
  const [joinTrigger, setJoinTrigger] = useState(0); 

  const handleSearch = (inputValue) => {
    setRoomId(inputValue);
    setJoinTrigger(Date.now()); 
  };

  const handleEndStream = () => {
    setJoinTrigger(0);
    setRoomId("");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{ width: "100%", minHeight: "100vh", bgcolor: "primary.default" }}
      >
        <Appbar onSearch={handleSearch} value={roomId} />
        <StreamDisplay
          roomId={roomId}
          joinTrigger={joinTrigger}
          onEndStream={handleEndStream}
        />
      </Box>
    </ThemeProvider>
  );
};

export default App;
