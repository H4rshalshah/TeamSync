import { AudioWaveform } from "lucide-react";
import { Link } from "react-router-dom";

const Logo = (props: { url?: string; noLink?: boolean }) => {
  const { url = "/", noLink = false } = props;
  const content = (
    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
      <AudioWaveform className="size-4" />
    </div>
  );

  if (noLink) return content;

  return (
    <div className="flex items-center justify-center sm:justify-start">
      <Link to={url}>{content}</Link>
    </div>
  );
};

export default Logo;
