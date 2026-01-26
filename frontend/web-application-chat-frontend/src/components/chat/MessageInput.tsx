import React, { useState, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  Paper,
  Popper,
  ClickAwayListener,
  ListItemButton,
  List,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  Image as ImageIcon,
  Code as CodeIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatListBulleted as ListIcon,
} from '@mui/icons-material';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  onTyping?: (isTyping: boolean) => void;
  onFileUpload?: (file: File) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = 'Tapez votre message...',
  onTyping,
  onFileUpload,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [formattingOpen, setFormattingOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  // Gérer le changement de texte
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Notifier que l'utilisateur est en train de taper
    if (onTyping) {
      onTyping(newValue.length > 0);
    }
  };

  // Gérer l'envoi du message
  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend();
      if (onTyping) {
        onTyping(false);
      }
    }
  };

  // Gérer la touche Entrée
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Gérer la sélection d'emoji
//   const handleEmojiClick = (emojiData: EmojiClickData) => {
//     onChange(value + emojiData.emoji);
//     setEmojiOpen(false);
//   };

  // Gérer le téléchargement de fichier
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
    // Réinitialiser l'input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Appliquer un formatage
  const applyFormatting = (format: string) => {
    let formattedText = value;
    
    switch (format) {
      case 'bold':
        formattedText += '**texte**';
        break;
      case 'italic':
        formattedText += '*texte*';
        break;
      case 'code':
        formattedText += '```code```';
        break;
      case 'list':
        formattedText += '\n- élément';
        break;
    }
    
    onChange(formattedText);
    setFormattingOpen(false);
  };

  // Formats disponibles
  const formattingOptions = [
    { id: 'bold', label: 'Gras', icon: <BoldIcon />, description: '**texte**' },
    { id: 'italic', label: 'Italique', icon: <ItalicIcon />, description: '*texte*' },
    { id: 'code', label: 'Code', icon: <CodeIcon />, description: '```code```' },
    { id: 'list', label: 'Liste', icon: <ListIcon />, description: '- élément' },
  ];

  return (
    <Box
      sx={{
        position: 'relative',
        border: 1,
        borderColor: isFocused ? 'primary.main' : 'divider',
        borderRadius: 2,
        backgroundColor: 'background.paper',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.light',
        },
      }}
    >
      {/* Barre d'outils */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 1,
          py: 0.5,
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'grey.50',
        }}
      >
        <Tooltip title="Ajouter un emoji">
          <IconButton
            size="small"
            onClick={() => setEmojiOpen(!emojiOpen)}
            ref={emojiButtonRef}
            disabled={disabled}
          >
            <EmojiIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Formatage">
          <IconButton
            size="small"
            onClick={() => setFormattingOpen(!formattingOpen)}
            disabled={disabled}
          >
            <BoldIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Joindre un fichier">
          <IconButton size="small" onClick={handleFileClick} disabled={disabled}>
            <AttachFileIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Insérer une image">
          <IconButton size="small" disabled={disabled}>
            <ImageIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
      </Box>

      {/* Zone de texte */}
      <TextField
        fullWidth
        multiline
        minRows={1}
        maxRows={6}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        sx={{
          '& .MuiOutlinedInput-root': {
            border: 'none',
            '& fieldset': { border: 'none' },
            '&:hover fieldset': { border: 'none' },
            '&.Mui-focused fieldset': { border: 'none' },
          },
        }}
      />

      {/* Bouton d'envoi */}
      <Box sx={{ position: 'absolute', right: 8, bottom: 8 }}>
        <Tooltip title="Envoyer (Enter)">
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={disabled || !value.trim()}
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              '&.Mui-disabled': {
                backgroundColor: 'grey.300',
              },
            }}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Picker d'emoji */}
      <Popper
        open={emojiOpen}
        anchorEl={emojiButtonRef.current}
        placement="top-start"
        sx={{ zIndex: 1300 }}
      >
        {/* <ClickAwayListener onClickAway={() => setEmojiOpen(false)}>
          <Box>
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              autoFocusSearch={false}
            //   theme="light"
              skinTonesDisabled
            />
          </Box>
        </ClickAwayListener> */}
      </Popper>

      {/* Menu de formatage */}
      <Popper
        open={formattingOpen}
        anchorEl={emojiButtonRef.current}
        placement="top-start"
        sx={{ zIndex: 1300 }}
      >
        <ClickAwayListener onClickAway={() => setFormattingOpen(false)}>
          <Paper elevation={3} sx={{ maxWidth: 300 }}>
            <List dense>
              // Remplacer ListItem avec button par ListItemButton
                {formattingOptions.map((option) => (
                <ListItemButton
                    key={option.id}
                    onClick={() => applyFormatting(option.id)}
                >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                    {option.icon}
                    </ListItemIcon>
                    <ListItemText
                    primary={option.label}
                    secondary={option.description}
                    secondaryTypographyProps={{ variant: 'caption' }}
                    />
                </ListItemButton>
                ))}
            </List>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </Box>
  );
};

export default MessageInput;