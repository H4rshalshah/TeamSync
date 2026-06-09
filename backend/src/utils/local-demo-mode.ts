let localDemoMode = process.env.LOCAL_DEMO_MODE === "true";

export const enableLocalDemoMode = () => {
  localDemoMode = true;
};

export const isLocalDemoMode = () => localDemoMode;
