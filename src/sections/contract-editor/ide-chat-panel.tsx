import React from "react";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import FormControl from "@mui/material/FormControl";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

import { Iconify } from "src/components/iconify"; // Named import

interface IdeChatPanelProps {
  // Gerekirse ileride prop ekleyebiliriz
  onClose?: () => void; // Add onClose prop
}

// Demo mesaj verileri
const demoMessages = [
  { sender: "user", text: "How do I declare a state variable in Solidity?" },
  {
    sender: "ai",
    text: "You declare a state variable like this: `uint public myVariable;`. Remember to specify the visibility (public, private, internal, external).",
  },
  { sender: "user", text: "Thanks!" },
  {
    sender: "ai",
    text: "You're welcome! Do you have any other Solidity questions?",
  },
  { sender: "user", text: "What about event emitting?" },
  {
    sender: "ai",
    text: "Events are declared using the `event` keyword, like `event Transfer(address indexed from, address indexed to, uint256 value);`. You emit them using `emit Transfer(sender, recipient, amount);`.",
  },
  { sender: "user", text: "How can I optimize gas costs for loops?" },
  {
    sender: "ai",
    text: "Minimize storage reads/writes within loops. Load state variables into memory variables before the loop if possible. Also, be mindful of loop bounds.",
  },
  { sender: "user", text: "Can you show an example of using mappings?" },
  {
    sender: "ai",
    text: "Sure! `mapping(address => uint) public balances;` defines a mapping from addresses to unsigned integers. You can assign a value like `balances[msg.sender] = 100;`.",
  },
];

export default function IdeChatPanel({ onClose }: IdeChatPanelProps) {
  const theme = useTheme();
  const [selectedLlm, setSelectedLlm] = React.useState("gemini-2.5-pro"); // Default to Gemini 2.5 Pro
  const [inputText, setInputText] = React.useState("");
  const [chatMode, setChatMode] = React.useState<"assistant" | "support">(
    "assistant",
  ); // State for chat mode

  const handleLlmChange = (event: any) => {
    setSelectedLlm(event.target.value);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(event.target.value);
  };

  const handleSend = () => {
    if (inputText.trim()) {
      console.log("Sending message:", inputText, "with LLM:", selectedLlm);
      // TODO: Add message sending logic and update demoMessages or real state
      setInputText("");
    }
  };

  const handleModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: "assistant" | "support" | null,
  ) => {
    if (newMode !== null) {
      setChatMode(newMode);
    }
  };

  return (
    <Box
      sx={{
        width: 300,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderLeft: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 1,
          py: 2.5,
          height: "40px",
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: "bold", pl: 1, flexGrow: 1 }}
        >
          AI Chat Assistant
        </Typography>
        {/* Close Button */}
        {onClose && (
          <IconButton onClick={onClose} size="small" sx={{ ml: 1 }}>
            <Iconify icon="mdi:close" width={20} />
          </IconButton>
        )}
      </Box>

      {/* Mesaj Alanı */}
      <Box sx={{ flexGrow: 1, overflowY: "auto", p: 2 }}>
        {demoMessages.map((msg, index) => (
          <Paper
            key={index}
            elevation={0}
            sx={{
              p: 1.5,
              mb: 1.5,
              bgcolor:
                msg.sender === "ai"
                  ? theme.palette.action.hover
                  : theme.palette.background.default,
              borderRadius: 1,
              maxWidth: "85%",
              ml: msg.sender === "ai" ? 0 : "auto",
              mr: msg.sender === "user" ? 0 : "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {/* Reduced font size for messages */}
            <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
              {msg.text}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Giriş Alanı */}
      <Box
        sx={{
          px: 2,
          pt: 1.5,
          pb: 1.5,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          bgcolor: theme.palette.background.neutral,
        }}
      >
        {/* Input Row */}
        <Box
          sx={{ display: "flex", alignItems: "center", width: "100%", mb: 1 }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={4}
            variant="outlined"
            size="small"
            placeholder="Ask AI..."
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            sx={{
              mr: 1,
              flexGrow: 1,
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!inputText.trim()}
          >
            <Iconify icon="mdi:send" />
          </IconButton>
        </Box>

        {/* Mode Toggle and LLM Selector Row */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          width="100%"
        >
          <ToggleButtonGroup
            color="primary"
            value={chatMode}
            exclusive
            onChange={handleModeChange}
            aria-label="Chat mode"
            size="small"
            sx={{
              bgcolor: theme.palette.background.paper,
              "& .MuiToggleButton-root": {
                fontSize: "0.50rem",
                py: 0.5,
                px: 1.5,
              },
            }}
          >
            <ToggleButton value="assistant">Assistant</ToggleButton>
            <ToggleButton value="support">Support</ToggleButton>
          </ToggleButtonGroup>

          <FormControl
            variant="standard"
            size="small"
            sx={{ minWidth: 150, alignItems: "center" }}
          >
            <Select
              labelId="llm-select-bottom-label"
              value={selectedLlm}
              onChange={handleLlmChange}
              disableUnderline
              sx={{
                fontSize: "1rem",
                "& .MuiSelect-select": {
                  py: 0.5,
                  px: 1,
                  mr: 1,
                  color: "text.secondary",
                  fontSize: "0.8rem",
                  textAlign: "right",
                },
                "& .MuiSvgIcon-root": {
                  fontSize: "1rem",
                },
              }}
            >
              <MenuItem value="gemini-2.5-pro" sx={{ fontSize: "0.65rem" }}>
                Gemini 2.5 Pro
              </MenuItem>
              <MenuItem value="gpt-4.1" sx={{ fontSize: "0.65rem" }}>
                GPT-4.1
              </MenuItem>
              <MenuItem value="sonnet-3.5-sonnet" sx={{ fontSize: "0.65rem" }}>
                Claude 3.5 Sonnet
              </MenuItem>
              <MenuItem value="sonnet-3.7-sonnet" sx={{ fontSize: "0.65rem" }}>
                Claude 3.7 Sonnet
              </MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>
    </Box>
  );
}
