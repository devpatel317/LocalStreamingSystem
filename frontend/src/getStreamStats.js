export const getStreamStats = async (peers) => {
  console.log("peers", peers);
  const statsresults = {};

  for (const [socketId, peer] of Object.entries(peers)) {
    const stats = await peer.getStats();

    stats.forEach((report) => {
      if (report.type === "inbound-rtp" && report.kind === "video") {
        statsresults[socketId] = {
          fps: report.framesPerSecond || "N/A",
          packetsLost: report.packetsLost || 0,
          jitter: report.jitter || 0,
          framesDecoded: report.framesDecoded || 0,
        };
      }

      if (report.type === "candidate-pair" && report.state === "succeeded") {
        statsresults[socketId] = {
          ...statsresults[socketId],
          latency: report.currentRoundTripTime
            ? `${(report.currentRoundTripTime * 1000).toFixed(2)} ms`
            : "N/A",
        };
      }
    });
  }

  return statsresults;
};
