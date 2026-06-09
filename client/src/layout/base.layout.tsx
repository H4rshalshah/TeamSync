import { Outlet } from "react-router-dom";

const BaseLayout = () => {
  return (
    <div className="flex flex-col w-full h-auto animate-in fade-in duration-500">
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-full mx-auto h-auto animate-in fade-in zoom-in-95 duration-500">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default BaseLayout;
