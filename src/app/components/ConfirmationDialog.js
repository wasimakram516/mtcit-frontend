import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
} from "@mui/material";

const ConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 2,
          padding: 2,
          maxWidth: "500px",
          width: "100%",
          backgroundColor: "#f9fafb",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: "bold",
          fontSize: "1.5rem",
          color: "#333",
          textAlign: "center",
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            textAlign: "center",
            margin: "1rem 0",
          }}
        >
          <DialogContentText
            sx={{
              fontSize: "1rem",
              color: "#555",
              lineHeight: 1.6,
            }}
          >
            {message}
          </DialogContentText>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 2,
          paddingBottom: "1rem",
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          color="primary"
          sx={{
            fontWeight: "bold",
            textTransform: "uppercase",
            padding: "0.5rem 2rem",
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          sx={{
            fontWeight: "bold",
            textTransform: "uppercase",
            padding: "0.5rem 2rem",
          }}
        >
          {confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
