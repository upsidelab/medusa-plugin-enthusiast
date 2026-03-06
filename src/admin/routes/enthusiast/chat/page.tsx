import { Navigate, useLocation } from "react-router-dom";
import { defineRouteConfig } from "@medusajs/admin-sdk";

const EnthusiastNewChatPage = () => {
  const location = useLocation();
  return <Navigate to={`/enthusiast/chat/new${location.search}`} replace />;
};

export const config = defineRouteConfig({});

export default EnthusiastNewChatPage;
