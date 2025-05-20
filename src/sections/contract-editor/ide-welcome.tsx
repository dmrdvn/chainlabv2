import React from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// ----------------------------------------------------------------------

export default function IdeWelcome() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%", // Fill the available height
        textAlign: "center",
        p: 3, // Add some padding
      }}
    >
      <Typography variant="h3" gutterBottom>
        Welcome to ChainLab IDE
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Start by selecting a contract from the left menu or creating a new one.
      </Typography>
      {/* Add more introductory elements or quick actions here if needed */}
    </Box>
  );
}
