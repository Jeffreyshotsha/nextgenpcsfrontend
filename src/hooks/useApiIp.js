import { useState } from "react";

export const useApiIp = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const [ip, setIp] = useState(urlParams.get("ip") || "");

  const updateIP = (newIp) => {
    if (!newIp) return;
    const url = new URL(window.location);
    url.searchParams.set("ip", newIp);
    window.history.pushState({}, "", url);
    setIp(newIp);
  };

  const getApiUrl = () => {
    const API_HOST = ip || "127.0.0.1";
    return `http://${API_HOST}:3000`;
  };

  return { ip, updateIP, getApiUrl };
};
