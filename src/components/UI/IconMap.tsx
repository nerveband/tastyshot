import React from 'react';
import { 
  Sparkles, 
  Drama, 
  Camera, 
  Circle, 
  Sun,
  Edit3,
  Bot,
  Image as ImageIcon,
  Zap,
  Check
} from 'lucide-react';

interface IconMapProps {
  icon: string;
  size?: number;
  color?: string;
}

export const IconMap: React.FC<IconMapProps> = ({ 
  icon, 
  size = 24, 
  color = 'rgb(245, 245, 245)' 
}) => {
  const iconComponents: Record<string, React.ReactNode> = {
    sparkles: <Sparkles size={size} color={color} />,
    drama: <Drama size={size} color={color} />,
    camera: <Camera size={size} color={color} />,
    circle: <Circle size={size} color={color} />,
    sun: <Sun size={size} color={color} />,
    edit: <Edit3 size={size} color={color} />,
    bot: <Bot size={size} color={color} />,
    image: <ImageIcon size={size} color={color} />,
    zap: <Zap size={size} color={color} />,
    check: <Check size={size} color={color} />,
  };

  return <>{iconComponents[icon] || <Circle size={size} color={color} />}</>;
};