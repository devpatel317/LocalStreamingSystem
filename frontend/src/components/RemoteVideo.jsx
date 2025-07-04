import { useEffect, useRef } from "react";

const RemoteVideo = ({ stream, muted = false }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      style={{ width: "100%", borderRadius: "8px", marginTop: "8px" }}
    />
  );
};

export default RemoteVideo;
