// src/components/TypingIndicator.tsx
import React from 'react';
import { Box, Typography, Fade, keyframes } from '@mui/material';
import { styled } from '@mui/material/styles';
import { FiberManualRecord as FiberManualRecordIcon } from '@mui/icons-material';

const bounce = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
`;

const TypingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  background: 'linear-gradient(135deg, rgba(245, 247, 250, 0.9) 0%, rgba(195, 207, 226, 0.9) 100%)',
  backdropFilter: 'blur(10px)',
  borderRadius: '24px',
  maxWidth: 'fit-content',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
}));

const Dot = styled(Box)(({ theme }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  margin: '0 3px',
  position: 'relative',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    animation: `${bounce} 1.4s infinite ease-in-out`,
  },
  
  '&:nth-of-type(1)::before': {
    animationDelay: '-0.32s',
  },
  
  '&:nth-of-type(2)::before': {
    animationDelay: '-0.16s',
  },
  
  '&:nth-of-type(3)::before': {
    animationDelay: '0s',
  },
}));

const UserPulse = styled(Box)(({ theme }) => ({
  width: 4,
  height: 4,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  marginRight: 8,
  animation: `${pulse} 1.5s infinite ease-in-out`,
}));

interface TypingIndicatorProps {
  isTyping: boolean;
  userName?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isTyping, userName }) => {
  if (!isTyping) return null;

  return (
    <Fade in={isTyping} timeout={500}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-start',
          mb: 3,
          px: 1,
          animation: 'slideIn 0.3s ease-out',
          '@keyframes slideIn': {
            from: {
              opacity: 0,
              transform: 'translateX(-20px)',
            },
            to: {
              opacity: 1,
              transform: 'translateX(0)',
            }
          }
        }}
      >
        <TypingContainer>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            {userName && (
              <>
                <UserPulse />
                <FiberManualRecordIcon 
                  sx={{ 
                    fontSize: 8, 
                    color: '#4caf50',
                    filter: 'drop-shadow(0 0 4px rgba(76, 175, 80, 0.5))',
                    mr: 1,
                  }} 
                />
              </>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', mr: userName ? 2 : 0 }}>
            <Dot />
            <Dot />
            <Dot />
          </Box>
          
          {userName && (
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 600,
                color: 'text.primary',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
              }}
            >
              {userName} écrit...
            </Typography>
          )}
        </TypingContainer>
      </Box>
    </Fade>
  );
};

export default TypingIndicator;