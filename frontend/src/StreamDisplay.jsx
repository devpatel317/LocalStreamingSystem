import { useState, useRef, useEffect } from "react";
import socket from "./socket";
import { getStreamStats } from "./getStreamStats";
import { Box,Card,CardContent,Typography,IconButton,Snackbar,Alert} from "@mui/material";
import {Mic,MicOff,Videocam,VideocamOff,CallEnd} from "@mui/icons-material";
import RemoteVideo from "./components/RemoteVideo";

const StreamDisplay = ({ roomId, joinTrigger, onEndStream }) => {
  const [currentRoomId, setCurrentRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [streamStats, setStreamStats] = useState({});
  const localVideoRef = useRef();
  const localStreamRef = useRef();
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [error, setError] = useState("");
  const peers = useRef({});

  useEffect(() => {
    if (!joinTrigger) return;

    if (!roomId.trim()) {
      setError("Room ID cannot be empty.");
      return;
    }

    if (joined) {
      setError("Already in a room. Please end the stream first.");
      return;
    }

    setCurrentRoomId(roomId);
    joinRoom(roomId);

    return () => leaveRoom();
  }, [joinTrigger]); 

  useEffect(() => {
    const handleBeforeUnload = () => leaveRoom();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const createPeerConnection = (socketId) => {
    const peer = new RTCPeerConnection();
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", socketId, event.candidate);
      }
    };
    peer.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setRemoteStreams((prev) => {
        if (!prev.find((s) => s.id === socketId)) {
          return [...prev, { stream: remoteStream, id: socketId }];
        }
        return prev;
      });
    };
    localStreamRef.current
      .getTracks()
      .forEach((track) => peer.addTrack(track, localStreamRef.current));
    return peer;
  };

  const joinRoom = async (room) => {
    const localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = localStream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }

    setRemoteStreams([{ stream: localStream, id: socket.id }]);
    setJoined(true);
    socket.emit("join-room", room);

    socket.off("all-users").on("all-users", async (users) => {
      users.forEach(async (userId) => {
        const peer = createPeerConnection(userId);
        peers.current[userId] = peer;
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("offer", userId, offer);
      });
    });

    socket.off("offer").on("offer", async (fromId, offer) => {
      const peer = createPeerConnection(fromId);
      peers.current[fromId] = peer;
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("answer", fromId, answer);
    });

    socket.off("answer").on("answer", async (fromId, answer) => {
      await peers.current[fromId].setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    socket
      .off("ice-candidate")
      .on("ice-candidate", async (fromId, candidate) => {
        await peers.current[fromId].addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      });

    socket.off("user-left").on("user-left", (id) => {
      setRemoteStreams((prev) => prev.filter((s) => s.id !== id));
      if (peers.current[id]) {
        peers.current[id].close();
        delete peers.current[id];
      }
    });
  };

  const leaveRoom = () => {
    if (!joined) return;

    Object.values(peers.current).forEach((peer) => peer.close());
    peers.current = {};

    socket.emit("leave-room", currentRoomId);
    socket.off("all-users");
    socket.off("offer");
    socket.off("answer");
    socket.off("ice-candidate");
    socket.off("user-left");

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    setRemoteStreams([]);
    setStreamStats({});
    setJoined(false);
    setCurrentRoomId("");
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    localStreamRef.current = null;
    onEndStream();
  };

  // Clear error after 3 seconds
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 3000);
    return () => clearTimeout(timer);
  }, [error]);

  const toggleAudio = () => {
    localStreamRef.current
      ?.getAudioTracks()
      .forEach((track) => (track.enabled = !track.enabled));
    setAudioEnabled((prev) => !prev);
  };

  const toggleVideo = () => {
    localStreamRef.current
      ?.getVideoTracks()
      .forEach((track) => (track.enabled = !track.enabled));
    setVideoEnabled((prev) => !prev);
  };

  useEffect(() => {
    if (!joined) return;
    const interval = setInterval(async () => {
      const stats = await getStreamStats(peers.current);
      setStreamStats(stats);
    }, 3000);
    return () => clearInterval(interval);
  }, [joined]);

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: "#f5f5f5",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={() => setError("")}
      >
        <Alert
          onClose={() => setError("")}
          severity="warning"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      {joined && (
        <>
          <Typography variant="h5">Room: {currentRoomId}</Typography>
          <Box display="flex" mt={2}>
            <Box sx={{ width: "55%" }}>
              {remoteStreams
                .filter(({ id }) => id === socket.id)
                .map(({ stream, id }) => (
                  <Card key={id} sx={{ mb: 2, width: "100%" }}>
                    <CardContent>
                      <Typography variant="subtitle1">You</Typography>
                      <RemoteVideo stream={stream} muted={true} />
                    </CardContent>
                  </Card>
                ))}
            </Box>
            <Box
              sx={{
                width: "45%",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {remoteStreams
                .filter(({ id }) => id !== socket.id)
                .map(({ stream, id }) => (
                  <Card key={id} sx={{ width: "80%", mx: "auto" }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontSize: 12 }}>
                        User: {id}
                      </Typography>
                      <RemoteVideo stream={stream} muted={false} />
                    </CardContent>
                  </Card>
                ))}
            </Box>
          </Box>

          <Box
            sx={{
              position: "fixed",
              bottom: 80,
              left: 0,
              width: "100%",
              display: "flex",
              justifyContent: "center",
              p: 1,
            }}
          >
            <IconButton
              onClick={toggleAudio}
              sx={{
                bgcolor: "#ffffff",
                borderRadius: "50%",
                mx: 1,
                "&:hover": { bgcolor: "#eeeeee" },
              }}
            >
              {audioEnabled ? <Mic /> : <MicOff />}
            </IconButton>
            <IconButton
              onClick={toggleVideo}
              sx={{
                bgcolor: "#ffffff",
                borderRadius: "50%",
                mx: 1,
                "&:hover": { bgcolor: "#eeeeee" },
              }}
            >
              {videoEnabled ? <Videocam /> : <VideocamOff />}
            </IconButton>
            <IconButton
              onClick={leaveRoom}
              sx={{
                bgcolor: "#ff1744",
                borderRadius: "50%",
                mx: 1,
                "&:hover": { bgcolor: "#f01440" },
              }}
            >
              <CallEnd />
            </IconButton>
          </Box>

          <Box
            sx={{
              position: "fixed",
              bottom: 0,
              left: 0,
              width: "100%",
              bgcolor: "#e0e0e0",
              p: 1,
              fontSize: "10px",
              overflowY: "auto",
              maxHeight: "20vh",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
              Stream Stats
            </Typography>
            {Object.entries(streamStats).map(([id, stats]) => (
              <Box
                key={id}
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
              >
                <div>Socket ID: {id}</div>
                <div>FPS: {stats.fps}</div>
                <div>Latency: {stats.latency}</div>
                <div>Frames Decoded: {stats.framesDecoded}</div>
                <div>Packets Lost: {stats.packetsLost}</div>
                <div>Jitter: {stats.jitter}</div>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};

export default StreamDisplay;
