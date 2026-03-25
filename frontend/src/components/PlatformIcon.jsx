import React from 'react';
import { 
  Instagram, 
  Youtube, 
  Linkedin, 
  Twitter, 
  Facebook, 
  Globe, 
  Smartphone,
  Video
} from 'lucide-react';

const PLATFORM_MAP = {
  instagram: { Icon: Instagram, className: 'bg-ig' },
  youtube: { Icon: Youtube, className: 'bg-yt' },
  tiktok: { Icon: Video, className: 'bg-tt' },
  twitter: { Icon: Twitter, className: 'bg-tw' },
  facebook: { Icon: Facebook, className: 'bg-fb' },
};

const PlatformIcon = ({ platform = 'other', size = 16 }) => {
  const config = PLATFORM_MAP[platform.toLowerCase()] || { Icon: Globe, className: 'bg-other' };
  const { Icon, className } = config;

  return (
    <div className={`platform-icon-box ${className}`} title={platform}>
      <Icon size={size} />
    </div>
  );
};

export default PlatformIcon;
