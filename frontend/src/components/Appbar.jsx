import * as React from "react";
import { styled, alpha } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import InputBase from "@mui/material/InputBase";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import { Button, useScrollTrigger } from "@mui/material";
import { useState, useEffect } from "react";

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(1),
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "#fafafa",
  width: "100%",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    [theme.breakpoints.up("sm")]: {
      width: "12ch",
      "&:focus": {
        width: "20ch",
      },
    },
  },
}));

export default function Appbar({ onSearch, value }) {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const handleSearch = () => {
    onSearch(inputValue);
  };
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ bgcolor: "#009688" }}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="#fafafa"
            aria-label="open drawer"
            sx={{ mr: 2, color: "#fafafa" }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            color="white"
            sx={{ flexGrow: 1, display: { xs: "none", sm: "block" } }}
          >
            Local Streaming Website
          </Typography>
          <Search>
            <SearchIconWrapper>
              <SearchIcon sx={{ color: "#fafafa" }} />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="Enter Room ID"
              inputProps={{ "aria-label": "search" }}
              onChange={(e) => setInputValue(e.target.value)}
              value={inputValue}
            />
          </Search>
          <Button
            variant="contained"
            sx={{ bgcolor: "#fafafa", color: "#009688", mx: 2 }}
            onClick={handleSearch}
          >
            Join
          </Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
