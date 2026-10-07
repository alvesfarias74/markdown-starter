import { queryOptions } from "@tanstack/react-query";
import { getDashboard } from "./dashboard.functions";

export const dashboardQuery = () => queryOptions({ queryKey: ["dashboard"], queryFn: () => getDashboard() });
